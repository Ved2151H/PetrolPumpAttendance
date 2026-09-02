"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { FileText, Loader2, ArrowLeft, Download, MapPin, Mail } from "lucide-react";

interface InvoiceItem {
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
  firmId: string;
  firm?: {
    name?: string | null;
    companyAddress?: string | null;
    companyEmail?: string | null;
    supportContact?: string | null;
  } | null;
}

export default function PublicInvoicePage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/invoices/share/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setInvoice(data.data);
        } else {
          setError(data.error?.message || "Invoice not found");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load invoice");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!invoicePreviewRef.current) return null;
    const html2canvas = (await import("html2canvas-pro")).default;
    const originalStyle = invoicePreviewRef.current.style.cssText;
    invoicePreviewRef.current.style.cssText = "width: 800px; padding: 40px; background: white; color: black; font-family: sans-serif;";
    
    try {
      const canvas = await html2canvas(invoicePreviewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      invoicePreviewRef.current.style.cssText = originalStyle;
      return canvas;
    } catch (err) {
      invoicePreviewRef.current.style.cssText = originalStyle;
      console.error("Canvas generation failed:", err);
      return null;
    }
  };

  const handleExportPDF = async () => {
    if (!invoice) return;

    // Mobile: open native system print which allows direct "Save as PDF"
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.print();
      return;
    }

    const canvas = await generateCanvas();
    if (!canvas) return;

    const { jsPDF } = await import("jspdf");
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    
    const imgWidth = 210;
    const pageHeight = 297;
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
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    // Save locally
    pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm text-center border border-slate-100">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Unable to load invoice</h2>
          <p className="text-sm text-slate-500 mt-1">{error || "The link may be invalid or expired."}</p>
        </div>
      </div>
    );
  }

  // Normalize firm name for display (handles legacy "Narmata" typo in database)
  const getDisplayFirmName = (name?: string | null): string => {
    if (!name) return "";
    let display = name;
    if (display.includes("Narmata")) display = display.replace("Narmata", "Namrata");
    if (!display.endsWith("Private Limited")) display += " Private Limited";
    return display;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}} />

      {/* Main Preview Container */}
      <div className="max-w-3xl mx-auto px-4 print-container">
        <div className="flex justify-end mb-4 no-print">
          <button
            onClick={handleExportPDF}
            className={`flex items-center gap-1.5 py-2 px-4 ${invoice.firmId === 'patil' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-violet-600 hover:bg-violet-700'} text-xs font-bold text-white rounded-xl shadow-md transition-colors cursor-pointer`}
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-7 print-container">
          <div ref={invoicePreviewRef} className="bg-white p-2">
            {/* Invoice Header */}
            <div className="flex flex-col justify-between gap-4 border-b-2 border-slate-100 pb-5 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{getDisplayFirmName(invoice.firm?.name)}</h2>
                <div className="text-xs text-slate-400 font-semibold mt-2.5 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {invoice.firm?.companyAddress || ""}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {invoice.firm?.companyEmail || ""}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className={`inline-block px-3 py-1 text-xs font-extrabold rounded-lg tracking-wide uppercase mb-2 ${invoice.firmId === 'patil' ? 'bg-orange-50 text-orange-700' : 'bg-violet-50 text-violet-700'}`}>INVOICE</span>
                <p className="text-sm font-extrabold text-slate-900"># {invoice.invoiceNumber}</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">Date: {new Date(invoice.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Billing Details */}
            <div className="grid gap-6 py-6 border-b border-slate-100 sm:grid-cols-2 text-xs">
              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To:</h4>
                <p className="text-sm font-extrabold text-slate-800">{invoice.customerName}</p>
                {invoice.customerPhone && <p className="text-slate-500 font-semibold mt-1">Phone: {invoice.customerPhone}</p>}
                {invoice.customerAddress && <p className="text-slate-500 font-semibold mt-0.5">Address: {invoice.customerAddress}</p>}
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Material Description</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="p-3 font-bold text-slate-900">{item.materialName}</td>
                      <td className="p-3 text-right">{(item.quantity === 0 || (item.quantity as any) === "N/A") ? "N/A" : item.quantity}</td>
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
                <span>₹{parseFloat(invoice.subtotal.toString()).toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full max-w-[280px] text-sm text-slate-900 font-extrabold border-t-2 border-slate-900/10 pt-2.5 mt-1">
                <span>Total Amount:</span>
                <span>₹{parseFloat(invoice.totalAmount.toString()).toFixed(2)}</span>
              </div>
            </div>

            {/* Signature footer */}
            <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-100 text-[10px] text-slate-400">
              <div>
                <p className="font-semibold text-slate-500">Thank you for your business!</p>
                <p className="mt-1">For any queries, contact {invoice.firm?.supportContact || ""}</p>
              </div>
              <div className="text-center w-36">
                <div className="h-8 border-b border-slate-200" />
                <p className="mt-1.5 font-bold uppercase tracking-wider text-slate-500">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
