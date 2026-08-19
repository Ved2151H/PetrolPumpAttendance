"use client";

import { useState, useEffect } from "react";
import { UserX, RefreshCw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  joiningDate: string;
  deletedAt: string | null;
}

export default function TrashPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrashedWorkers();
  }, []);

  const fetchTrashedWorkers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workers/trash');
      if (!res.ok) throw new Error("Failed to fetch trashed workers");
      const data = await res.json();
      if (data.success) {
        setWorkers(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (workerId: string) => {
    if (!confirm("Are you sure you want to restore this worker?")) return;

    setRestoringId(workerId);
    try {
      const res = await fetch(`/api/workers/${workerId}/restore`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error("Failed to restore worker");
      
      const data = await res.json();
      if (data.success) {
        setWorkers(workers.filter(w => w.id !== workerId));
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trash</h1>
          <p className="text-slate-500 mt-1">Manage removed workers</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {workers.length === 0 ? (
        <div className="card text-center py-12">
          <UserX className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Trash is empty</h3>
          <p className="text-slate-500">No workers have been removed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <div key={worker.id} className="card hover:shadow-md transition-shadow">
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

              <button
                onClick={() => handleRestore(worker.id)}
                disabled={restoringId === worker.id}
                className="w-full btn-secondary py-2 text-sm flex justify-center items-center gap-2 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50"
              >
                <RefreshCw className={`w-4 h-4 ${restoringId === worker.id ? 'animate-spin' : ''}`} />
                {restoringId === worker.id ? "Restoring..." : "Restore Worker"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
