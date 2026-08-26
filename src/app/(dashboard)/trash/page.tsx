"use client";

import { useState, useEffect } from "react";
import { UserX, RefreshCw, AlertCircle, FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  joiningDate: string;
  deletedAt: string | null;
}

interface Note {
  id: string;
  title: string;
  noteDate: string;
  deletedAt: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  date: string;
  deletedAt: string | null;
}

export default function TrashPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"workers" | "notes" | "invoices">("workers");
  const [firmId, setFirmId] = useState("");
  
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setFirmId(d.data.currentFirmId);
        }
      })
      .catch(console.error);
  }, []);

  async function fetchTrash() {
    try {
      setLoading(true);
      setError("");
      if (activeTab === "workers") {
        const res = await fetch('/api/workers/trash');
        if (!res.ok) throw new Error("Failed to fetch trashed workers");
        const data = await res.json();
        if (data.success) {
          setWorkers(data.data);
        }
      } else if (activeTab === "notes") {
        const res = await fetch('/api/notes/trash');
        if (!res.ok) throw new Error("Failed to fetch trashed notes");
        const data = await res.json();
        if (data.success) {
          setNotes(data.data);
        }
      } else {
        const res = await fetch('/api/invoices/trash');
        if (!res.ok) throw new Error("Failed to fetch trashed invoices");
        const data = await res.json();
        if (data.success) {
          setInvoices(data.data);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrash();
  }, [activeTab]);

  const handleRestoreInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to restore this invoice?")) return;
    setActionId(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/restore`, { method: 'PATCH' });
      if (!res.ok) throw new Error("Failed to restore invoice");
      const data = await res.json();
      if (data.success) {
        setInvoices(invoices.filter(i => i.id !== invoiceId));
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handlePermanentDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to permanently delete this invoice? This action cannot be undone.")) return;
    setActionId(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/permanent`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to permanently delete invoice");
      const data = await res.json();
      if (data.success) {
        setInvoices(invoices.filter(i => i.id !== invoiceId));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleRestoreWorker = async (workerId: string) => {
    if (!confirm("Are you sure you want to restore this worker?")) return;
    setActionId(workerId);
    try {
      const res = await fetch(`/api/workers/${workerId}/restore`, { method: 'PATCH' });
      if (!res.ok) throw new Error("Failed to restore worker");
      const data = await res.json();
      if (data.success) {
        setWorkers(workers.filter(w => w.id !== workerId));
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handlePermanentDeleteWorker = async (workerId: string) => {
    if (!confirm("Are you sure you want to permanently delete this worker? This will hide them from Trash but won't affect their historical attendance or reports.")) return;
    setActionId(workerId);
    try {
      const res = await fetch(`/api/workers/${workerId}/permanent-delete`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to permanently delete worker");
      const data = await res.json();
      if (data.success) {
        setWorkers(workers.filter(w => w.id !== workerId));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleRestoreNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to restore this note?")) return;
    setActionId(noteId);
    try {
      const res = await fetch(`/api/notes/${noteId}/restore`, { method: 'PATCH' });
      if (!res.ok) throw new Error("Failed to restore note");
      const data = await res.json();
      if (data.success) {
        setNotes(notes.filter(n => n.id !== noteId));
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handlePermanentDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to permanently delete this note? This action cannot be undone.")) return;
    setActionId(noteId);
    try {
      const res = await fetch(`/api/notes/${noteId}/permanent`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete note");
      const data = await res.json();
      if (data.success) {
        setNotes(notes.filter(n => n.id !== noteId));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-amber-600 mb-2">Trash archive</p>
          <h1 className="text-3xl font-bold text-slate-900">Trash</h1>
          <p className="text-slate-500 mt-1">Manage removed items</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto self-start">
          <button
            onClick={() => setActiveTab("workers")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "workers" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Workers
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "notes" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "invoices" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Invoices
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
        </div>
      ) : activeTab === "workers" ? (
        workers.length === 0 ? (
          <div className="card text-center py-12">
            <UserX className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Trash is empty</h3>
            <p className="text-slate-500">No workers have been removed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
              <div key={worker.id} className="card border-slate-200 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{worker.name}</h3>
                        <p className="text-sm text-slate-500">{worker.phone || "No phone"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Joined:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(worker.joiningDate).toLocaleDateString()}
                      </span>
                    </div>
                    {worker.deletedAt && (
                      <div className="flex justify-between">
                        <span>Removed:</span>
                        <span className="font-medium text-red-600">
                          {new Date(worker.deletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button
                    onClick={() => handleRestoreWorker(worker.id)}
                    disabled={actionId === worker.id}
                    className="w-full sm:flex-1 btn-secondary py-2 text-sm flex justify-center items-center gap-2 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionId === worker.id ? 'animate-spin' : ''}`} />
                    {actionId === worker.id ? "Restoring..." : "Restore"}
                  </button>
                  <button
                    onClick={() => handlePermanentDeleteWorker(worker.id)}
                    disabled={actionId === worker.id}
                    className="w-full sm:flex-1 btn-secondary py-2 text-sm flex justify-center items-center gap-2 hover:text-red-700 hover:border-red-200 hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === "notes" ? (
        notes.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No trashed notes</h3>
            <p className="text-slate-500">Deleted notes will appear here for 15 days.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div key={note.id} className="card border-slate-200 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-1 mb-2">{note.title}</h3>
                  <div className="space-y-2 mb-4 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Note Date:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(note.noteDate).toLocaleDateString()}
                      </span>
                    </div>
                    {note.deletedAt && (
                      <div className="flex justify-between">
                        <span>Deleted On:</span>
                        <span className="font-medium text-red-600">
                          {new Date(note.deletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleRestoreNote(note.id)}
                    disabled={actionId === note.id}
                    className="flex-1 btn-secondary py-2 text-sm flex justify-center items-center gap-2 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionId === note.id ? 'animate-spin' : ''}`} />
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDeleteNote(note.id)}
                    disabled={actionId === note.id}
                    className="flex-1 btn-secondary py-2 text-sm flex justify-center items-center gap-2 hover:text-red-700 hover:border-red-200 hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        invoices.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No trashed invoices</h3>
            <p className="text-slate-500">Deleted invoices will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="card border-slate-200 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-1 mb-2">{invoice.invoiceNumber}</h3>
                  <div className="space-y-2 mb-4 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-medium text-slate-900">{invoice.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-medium text-slate-900">₹{invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Invoice Date:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(invoice.date).toLocaleDateString()}
                      </span>
                    </div>
                    {invoice.deletedAt && (
                      <div className="flex justify-between">
                        <span>Deleted On:</span>
                        <span className="font-medium text-red-600">
                          {new Date(invoice.deletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleRestoreInvoice(invoice.id)}
                    disabled={actionId === invoice.id}
                    className="flex-1 btn-secondary py-2 text-sm flex justify-center items-center gap-2 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionId === invoice.id ? 'animate-spin' : ''}`} />
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDeleteInvoice(invoice.id)}
                    disabled={actionId === invoice.id}
                    className="flex-1 btn-secondary py-2 text-sm flex justify-center items-center gap-2 hover:text-red-700 hover:border-red-200 hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
