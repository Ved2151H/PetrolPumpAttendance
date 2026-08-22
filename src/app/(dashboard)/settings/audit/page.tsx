"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Activity, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export default function AuditPage() {
  const router = useRouter();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch('/api/audit?limit=200');
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          router.push('/settings');
        }
        return;
      }
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      (log.adminName && log.adminName.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.entityType && log.entityType.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-7 relative">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/settings" className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-amber-600 mb-1">Super Admin Only</p>
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
        </div>
      </div>
      
      <div className="card space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">System Audit Trail</h2>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Admin</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Details</th>
                  <th className="pb-3 font-semibold">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900 whitespace-nowrap">
                      Admin {log.adminNumber}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold whitespace-nowrap">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                      {log.entityType || '-'}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No activity logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
