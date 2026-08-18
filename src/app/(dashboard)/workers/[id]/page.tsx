"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Calendar, Activity } from "lucide-react";
import Link from "next/link";

export default function WorkerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const res = await fetch(`/api/workers/${params.id}`);
        if (!res.ok) {
          if (res.status === 401) router.push('/login');
          throw new Error('Failed to fetch worker');
        }
        const data = (await res.json()).data;
        setWorker(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) {
      fetchWorker();
    }
  }, [params.id]);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading worker profile...</div>;
  }

  if (!worker) {
    return <div className="text-center py-12 text-gray-500">Worker not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/workers" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Worker Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-3xl mb-4">
            {worker.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{worker.name}</h2>
          <p className="text-gray-500 mb-4">{worker.phone || "No phone number"}</p>
          {worker.deletedAt && (
            <span className="px-3 py-1 rounded-full text-xs font-medium mb-6 bg-gray-100 text-gray-600">
              Removed on: {new Date(worker.deletedAt).toLocaleDateString()}
            </span>
          )}

          <div className="w-full text-left space-y-4 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 font-medium">JOINING DATE</p>
              <p className="font-medium text-gray-900">{new Date(worker.joiningDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Stats & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Total Days</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{worker.stats.totalRecordedDays}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-500">Present</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{worker.stats.presentDays}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-500">Absent</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{worker.stats.absentDays}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-500">Attendance</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{worker.stats.attendancePercentage}%</p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance History</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {worker.attendances.length === 0 ? (
                <div className="text-center py-6 text-gray-500">No attendance records found.</div>
              ) : (
                worker.attendances.map((record: any) => (
                  <div key={record.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <span className="font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
