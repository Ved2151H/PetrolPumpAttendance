"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Edit2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Worker = {
  id: string;
  name: string;
  phone: string | null;
  joiningDate: string;
};

export default function WorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [removingWorker, setRemovingWorker] = useState<Worker | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', phone: '', joiningDate: new Date().toISOString().split('T')[0] });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/workers');
      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        throw new Error('Failed to fetch workers');
      }
      const data = (await res.json()).data;
      setWorkers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorkers = workers.filter(w => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Unable to add worker. Please try again.");
      
      await fetchWorkers();
      setIsAddModalOpen(false);
      setFormData({ name: '', phone: '', joiningDate: new Date().toISOString().split('T')[0] });
      showSuccess("Worker added successfully.");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/workers/${editingWorker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Unable to update worker. Please try again.");
      
      await fetchWorkers();
      setEditingWorker(null);
      showSuccess("Worker details updated successfully.");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWorker = async () => {
    if (!removingWorker) return;
    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/workers/${removingWorker.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("Unable to remove worker. Please try again.");
      
      await fetchWorkers();
      setRemovingWorker(null);
      showSuccess("Worker removed successfully.");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (worker: Worker, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone || '',
      joiningDate: new Date(worker.joiningDate).toISOString().split('T')[0]
    });
  };

  const openRemoveModal = (worker: Worker, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemovingWorker(worker);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
        <button 
          onClick={() => {
            setFormData({ name: '', phone: '', joiningDate: new Date().toISOString().split('T')[0] });
            setIsAddModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Worker
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl text-sm font-medium bg-green-50 text-green-700">
          {successMessage}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workers..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all text-sm text-gray-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="font-medium p-4 pl-6">Worker Name</th>
                <th className="font-medium p-4">Phone Number</th>
                <th className="font-medium p-4">Joining Date</th>
                <th className="font-medium p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Loading workers...</td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No workers found.</td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr 
                    key={worker.id} 
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/workers/${worker.id}`)}
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                          {worker.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{worker.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{worker.phone || '-'}</td>
                    <td className="p-4 text-gray-500 text-sm">{new Date(worker.joiningDate).toLocaleDateString()}</td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => openEditModal(worker, e)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Worker"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => openRemoveModal(worker, e)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Worker"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Worker Modal */}
      {(isAddModalOpen || editingWorker) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingWorker ? 'Edit Worker' : 'Add Worker'}</h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingWorker(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={editingWorker ? handleEditWorker : handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="input-field w-full"
                  placeholder="Rahul Sharma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="input-field w-full"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
                <input 
                  type="date" 
                  required
                  value={formData.joiningDate}
                  onChange={e => setFormData({...formData, joiningDate: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingWorker(null);
                  }}
                  className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-70"
                >
                  {isSubmitting ? 'Saving...' : editingWorker ? 'Save Changes' : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Worker Confirmation Modal */}
      {removingWorker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Remove {removingWorker.name}?</h2>
            <p className="text-gray-500 mb-6">
              Removing this worker will remove them from the current worker list, but their attendance history will be preserved.
            </p>
            
            {formError && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {formError}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setRemovingWorker(null)}
                className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRemoveWorker}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
              >
                {isSubmitting ? 'Removing...' : 'Remove Worker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
