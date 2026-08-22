"use client";

import { useState, useEffect } from "react";
import { UserPlus, Trash2, ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminsPage() {
  const router = useRouter();
  
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  
  const [deleteAdminId, setDeleteAdminId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    try {
      const res = await fetch('/api/admins');
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          router.push('/settings');
        }
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    
    if (createForm.password !== createForm.confirmPassword) {
      setCreateError("Passwords do not match");
      return;
    }
    
    if (createForm.password.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password
        })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create admin");
      }
      
      setIsCreateModalOpen(false);
      setCreateForm({ name: "", email: "", password: "", confirmPassword: "" });
      fetchAdmins();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAdminId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admins/${deleteAdminId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to delete admin");
      }
      setDeleteAdminId(null);
      fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-7 relative">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/settings" className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-amber-600 mb-1">Super Admin Only</p>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
        </div>
      </div>
      
      <div className="card space-y-6">
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Administrators</h2>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create New Admin
          </button>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {admins.map(admin => (
              <div key={admin.id} className="py-4 flex justify-between items-center group">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    Admin {admin.adminNumber}
                    {admin.role === 'SUPER_ADMIN' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">SUPER ADMIN</span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500">{admin.name} ({admin.email})</p>
                </div>
                {admin.role !== 'SUPER_ADMIN' && (
                  <button 
                    onClick={() => setDeleteAdminId(admin.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Admin"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Admin</h2>
            {createError && (
              <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input 
                  type="text" 
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm({...createForm, name: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username/Email *</label>
                <input 
                  type="email" 
                  required
                  value={createForm.email}
                  onChange={e => setCreateForm({...createForm, email: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={e => setCreateForm({...createForm, password: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={createForm.confirmPassword}
                  onChange={e => setCreateForm({...createForm, confirmPassword: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-primary disabled:opacity-70"
                >
                  {isCreating ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteAdminId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Admin</h2>
            <p className="text-gray-500 mb-6">Are you sure you want to delete Admin {admins.find(a => a.id === deleteAdminId)?.adminNumber}? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteAdminId(null)}
                className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-70"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
