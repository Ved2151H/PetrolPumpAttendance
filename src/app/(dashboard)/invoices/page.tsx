"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  X, 
  FileText, 
  Download, 
  Share2, 
  Calendar, 
  Phone, 
  MapPin, 
  Mail,
  User, 
  ArrowLeft,
  Receipt,
  Printer
} from "lucide-react";
import { useRouter } from "next/navigation";

interface InvoiceItem {
  id?: string;
  materialName: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  date: string;
  subtotal: number;
  totalAmount: number;
  items: InvoiceItem[];
  firm?: {
    companyAddress?: string | null;
    companyEmail?: string | null;
    supportContact?: string | null;
  } | null;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Modals / Details state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [shareInvoice, setShareInvoice] = useState<Invoice | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { materialName: "", quantity: 1, unit: "Brass", price: 0, total: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Refs for PDF/PNG generation
  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  // 1. Verify User and Tenant
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.success) {
          setFirmId(data.data.currentFirmId);
          setIsAdmin(data.data.role === "ADMIN" || data.data.role === "SUPER_ADMIN");
          
          // Strict Tenant Isolation check: redirect immediately if not Narmata
          if (data.data.currentFirmId !== "narmata") {
            router.push("/dashboard");
            return;
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setIsAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // 2. Load Invoices
  useEffect(() => {
    if (firmId === "narmata") {
      fetchInvoices();
    }
  }, [firmId]);

  async function fetchInvoices() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // 3. Form Handlers
  const handleAddItem = () => {
    setItems([...items, { materialName: "", quantity: 1, unit: "Brass", price: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === "quantity" || field === "price") {
      const numericVal = parseFloat(value) || 0;
      (item as any)[field] = numericVal;
      // Precision calculation to prevent JS floating point errors
      item.total = Math.round(item.quantity * item.price * 100) / 100;
    } else {
      (item as any)[field] = value;
    }
    setItems(newItems);
  };

  // Safe decimal calculations
  const calculateTotals = () => {
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const roundedSubtotal = Math.round(subtotal * 100) / 100;
    return {
      subtotal: roundedSubtotal,
      totalAmount: roundedSubtotal
    };
  };

  const { subtotal, totalAmount } = calculateTotals();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!customerName.trim()) {
      setErrorMsg("Customer name is required.");
      return;
    }

    const invalidItem = items.some(item => !item.materialName.trim() || item.quantity <= 0 || item.price <= 0);
    if (invalidItem) {
      setErrorMsg("All items must have a name, quantity greater than 0, and rate greater than 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          items
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create invoice");
      }

      // Reset form and reload
      setIsCreateOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setItems([{ materialName: "", quantity: 1, unit: "Brass", price: 0, total: 0 }]);
      fetchInvoices();
      
      // Auto open the newly created invoice details
      setSelectedInvoice(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Export & Sharing implementation
  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!invoicePreviewRef.current) return null;
    const html2canvas = (await import("html2canvas-pro")).default;
    
    // Temporarily apply full-screen scaling and style for clean captures
    const originalStyle = invoicePreviewRef.current.style.cssText;
    invoicePreviewRef.current.style.cssText = "width: 800px; padding: 40px; background: white; color: black; font-family: sans-serif; position: relative; max-height: none; overflow: visible;";
    
    try {
      const canvas = await html2canvas(invoicePreviewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: invoicePreviewRef.current.scrollHeight
      });
      invoicePreviewRef.current.style.cssText = originalStyle;
      return canvas;
    } catch (err) {
      invoicePreviewRef.current.style.cssText = originalStyle;
      console.error("Canvas generation failed:", err);
      return null;
    }
  };

  const handleExportPNG = async (invoice: Invoice, downloadOnly = true): Promise<File | null> => {
    const canvas = await generateCanvas();
    if (!canvas) return null;

    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], `Invoice_${invoice.invoiceNumber}.png`, { type: "image/png" });
        
        if (downloadOnly) {
          if (isMobile) {
            const pngUrl = canvas.toDataURL("image/png");
            window.open(pngUrl, "_blank");
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Invoice_${invoice.invoiceNumber}.png`;
            link.click();
            
            // Fallback: open in new window/tab for WebViews
            window.open(url, "_blank");
          }
        }
        resolve(file);
      }, "image/png");
    });
  };

  const handleExportPDF = async (invoice: Invoice, downloadOnly = true): Promise<File | null> => {
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && downloadOnly) {
      window.print();
      return null;
    }

    const canvas = await generateCanvas();
    if (!canvas) return null;

    const { jsPDF } = await import("jspdf");
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    
    const imgWidth = 210; // A4 size page width
    const pageHeight = 297; // A4 size page height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const pdfBlob = pdf.output("blob");
    const file = new File([pdfBlob], `Invoice_${invoice.invoiceNumber}.pdf`, { type: "application/pdf" });

    if (downloadOnly) {
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
      // Fallback: open in new window/tab for WebViews
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, "_blank");
    }

    return file;
  };

  const getPrefilledShareText = (invoice: Invoice) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/invoices/share/${invoice.id}`;
    const lines = [
      `*NAMRATA CONSTRUCTION*`,
      `*Invoice:* ${invoice.invoiceNumber}`,
      `*Date:* ${new Date(invoice.date).toLocaleDateString("en-IN")}`,
      `*Customer:* ${invoice.customerName}`,
      `*Total Amount:* ₹${invoice.totalAmount}`,
      ``,
      `*View or Download PDF/PNG:*`,
      shareUrl,
      ``,
      `Thank you for your business!`
    ];
    return encodeURIComponent(lines.join("\n"));
  };

  const handleWhatsAppShare = (invoice: Invoice) => {
    const text = getPrefilledShareText(invoice);
    const phone = invoice.customerPhone ? invoice.customerPhone.replace(/\D/g, '') : '';
    const formattedPhone = (phone.length === 10) ? `91${phone}` : phone;
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${text}`, '_blank');
  };

  const handleSMSShare = (invoice: Invoice) => {
    const text = getPrefilledShareText(invoice);
    const phone = invoice.customerPhone || '';
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    try {
      window.location.href = `sms:${phone}${separator}body=${text}`;
    } catch (err) {
      console.error("SMS sharing failed:", err);
      alert("Unable to open SMS application directly. Please try WhatsApp.");
    }
  };

  const handleSystemShare = async (invoice: Invoice) => {
    try {
      const pngFile = await handleExportPNG(invoice, false);
      const pdfFile = await handleExportPDF(invoice, false);
      const filesArray = [];
      if (pdfFile) filesArray.push(pdfFile);

      const shareText = `Invoice ${invoice.invoiceNumber} for ${invoice.customerName} - Total: ₹${invoice.totalAmount}`;
      const shareData: ShareData = {
        title: `Invoice ${invoice.invoiceNumber}`,
        text: shareText,
      };

      if (filesArray.length > 0 && navigator.canShare && navigator.canShare({ files: filesArray })) {
        shareData.files = filesArray;
      }

      await navigator.share(shareData);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("System share failed:", err);
        alert("Failed to open system sharing sheet. Please use direct WhatsApp/SMS text sharing instead.");
      }
    }
  };

  const handleShare = (invoice: Invoice) => {
    setShareInvoice(invoice);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice? It will be moved to the Trash archive.")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setInvoices(invoices.filter(i => i.id !== id));
      } else {
        alert(data.error?.message || "Failed to delete invoice");
      }
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      alert("Failed to delete invoice");
    }
  };

  // 5. Filtering logic
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.customerPhone && invoice.customerPhone.includes(searchQuery));
    
    let matchesDate = true;
    if (dateFilter) {
      const invoiceDate = new Date(invoice.date).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      matchesDate = invoiceDate === filterDate;
    }

    return matchesSearch && matchesDate;
  });

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (firmId !== "narmata") {
    return null; // Tenant protection in checkAuth handles redirection
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 pb-4 sm:space-y-8">
      {/* 6. Header */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-violet-50/70 px-5 py-6 shadow-[0_18px_45px_-35px_rgba(30,48,93,0.55)] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-violet-600">Finance Workspace</p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-[2rem]">Invoice Management</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Create, review, export and share invoices for Narmata Construction customers.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary gap-2 w-full sm:w-auto shrink-0 cursor-pointer shadow-violet-950/20"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
        </div>
      </header>

      {/* 7. Search & Filtering section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field !pl-11"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Calendar className="h-4.5 w-4.5 text-slate-500" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field w-auto min-w-[150px]"
          />
          {dateFilter && (
            <button 
              onClick={() => setDateFilter("")}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 8. Invoice History List */}
      <div className="card relative overflow-hidden p-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Invoice History</h2>
          <span className="text-xs font-semibold text-slate-500">{filteredInvoices.length} invoices found</span>
        </div>
        
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-violet-600 border-t-transparent" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <Receipt className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">No invoices recorded</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">Add your first invoice to Narmata Construction database using the create button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs">
                  <th className="p-4 font-bold uppercase tracking-wider">Invoice #</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Customer</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Date</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Total Amount</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-bold text-violet-700">{invoice.invoiceNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm">{invoice.customerName}</div>
                      {invoice.customerPhone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {invoice.customerPhone}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(invoice.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-900">₹{parseFloat(invoice.totalAmount.toString()).toFixed(2)}</td>
                    <td className="p-4 text-right flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-2 border border-slate-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 text-slate-600 hover:text-violet-700 transition-colors cursor-pointer"
                        title="View & Export"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShare(invoice)}
                        className="p-2 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="p-2 border border-slate-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 9. Create Invoice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white p-4 sm:p-7 shadow-2xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl border border-white/70 flex flex-col rounded-none">
            <div className="mb-6 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Receipt className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Create New Invoice</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Generate a custom invoice with line items</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-slate-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 shrink-0">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto space-y-6 pr-1 pb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Customer Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter name"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer Phone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer Address</label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter address"
                    rows={2}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Material Items</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="space-y-3.5">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Material Name *</label>
                      <input
                        type="text"
                        required
                        value={item.materialName}
                        onChange={(e) => handleItemChange(index, "materialName", e.target.value)}
                        placeholder="e.g. River Sand"
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div className="w-full sm:w-20">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Qty *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        min="0.01"
                        value={item.quantity || ""}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Unit *</label>
                      <input
                        type="text"
                        required
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div className="w-full sm:w-28">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Rate *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        min="0.01"
                        value={item.price || ""}
                        onChange={(e) => handleItemChange(index, "price", e.target.value)}
                        placeholder="₹"
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total</label>
                      <div className="h-10 flex items-center px-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-sm shadow-inner">
                        ₹{item.total.toFixed(2)}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-end justify-end mt-1 sm:mt-5">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-40"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Card */}
              <div className="flex flex-col items-end gap-2 bg-slate-50 border border-slate-100 p-5 rounded-2xl shrink-0">
                <div className="flex justify-between w-full max-w-xs text-sm text-slate-500 font-semibold">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-base text-slate-900 font-bold border-t border-slate-200 pt-2.5 mt-1.5">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-70 justify-center text-center font-bold"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                >
                  {isSubmitting ? "Generating..." : "Generate & Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Invoice Preview / Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white p-4 sm:p-7 shadow-2xl h-full sm:h-auto sm:max-h-[95vh] sm:rounded-3xl border border-white/70 flex flex-col rounded-none">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Invoice Details</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Preview and export invoice options</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-slate-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 mb-5 shrink-0">
              <button
                onClick={() => handleShare(selectedInvoice)}
                className="flex flex-1 items-center justify-center gap-2 py-2.5 px-3 bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {/* Printable Invoice Container */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-slate-50/50 p-4 scrollbar-thin">
              {/* Print styles */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-invoice-area, #printable-invoice-area * {
                    visibility: visible !important;
                  }
                  #printable-invoice-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                  }
                }
              `}} />
              <div 
                ref={invoicePreviewRef} 
                id="printable-invoice-area"
                className="bg-white p-6 shadow-sm border border-slate-100 rounded-xl"
              >
                {/* Invoice Header */}
                <div className="flex flex-col justify-between gap-4 border-b-2 border-slate-100 pb-5 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">NAMRATA CONSTRUCTION PRIVATE LIMITED</h2>
                    <div className="text-[11px] text-slate-500 mt-2.5 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> 
                        {selectedInvoice.firm?.companyAddress || ""}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> 
                        {selectedInvoice.firm?.companyEmail || ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="inline-block bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-1 text-xs font-bold text-violet-700 mb-2">INVOICE</span>
                    <h4 className="text-lg font-black text-slate-800">{selectedInvoice.invoiceNumber}</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 sm:justify-end">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                      {new Date(selectedInvoice.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Customer Details Block */}
                <div className="my-6 p-4 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col gap-4 sm:flex-row sm:justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Invoice To</span>
                    <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> {selectedInvoice.customerName}</div>
                    {selectedInvoice.customerPhone && (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedInvoice.customerPhone}</div>
                    )}
                  </div>
                  {selectedInvoice.customerAddress && (
                    <div className="max-w-xs">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Customer Address</span>
                      <p className="text-xs text-slate-500 leading-relaxed">{selectedInvoice.customerAddress}</p>
                    </div>
                  )}
                </div>

                {/* Material Table */}
                <div className="overflow-x-auto my-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                        <th className="p-3">Material Description</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="text-slate-700">
                          <td className="p-3 font-bold text-slate-900">{item.materialName}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3">{item.unit}</td>
                          <td className="p-3 text-right">₹{parseFloat(item.price.toString()).toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-slate-900">₹{parseFloat(item.total.toString()).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Box */}
                <div className="flex flex-col items-end border-t border-slate-100 pt-4 mt-6">
                  <div className="flex justify-between w-full max-w-[280px] text-xs text-slate-500 font-bold py-1">
                    <span>Subtotal:</span>
                    <span>₹{parseFloat(selectedInvoice.subtotal.toString()).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[280px] text-sm text-slate-900 font-extrabold border-t-2 border-slate-900/10 pt-2.5 mt-1">
                    <span>Total Amount:</span>
                    <span>₹{parseFloat(selectedInvoice.totalAmount.toString()).toFixed(2)}</span>
                  </div>
                </div>

                {/* Signature footer */}
                <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-100 text-[10px] text-slate-400">
                  <div>
                    <p className="font-semibold text-slate-500">Thank you for your business!</p>
                    <p className="mt-1">For any queries, contact {selectedInvoice.firm?.supportContact || ""}</p>
                  </div>
                  <div className="text-center w-36">
                    <div className="h-8 border-b border-slate-200" />
                    <p className="mt-1.5 font-bold uppercase tracking-wider text-slate-500">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 shrink-0">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-full py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Options Modal */}
      {shareInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-5 shadow-2xl flex flex-col sm:p-7">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Share2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Share Invoice</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Choose sharing method for {shareInvoice.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShareInvoice(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-slate-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <button
                onClick={() => {
                  handleWhatsAppShare(shareInvoice);
                  setShareInvoice(null);
                }}
                className="group flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/60 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 group-hover:text-emerald-700 group-hover:bg-emerald-50"><Phone className="h-4.5 w-4.5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800">Share via WhatsApp</span>
                  <span className="mt-0.5 block text-xs text-slate-500">Send prefilled invoice summary directly</span>
                </span>
              </button>

              <button
                onClick={() => {
                  handleSMSShare(shareInvoice);
                  setShareInvoice(null);
                }}
                className="group flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-all hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 group-hover:text-blue-700 group-hover:bg-blue-50"><FileText className="h-4.5 w-4.5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800">Share via SMS</span>
                  <span className="mt-0.5 block text-xs text-slate-500">Send invoice details via messaging app</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
