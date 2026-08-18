"use client";

import { useState, useEffect } from "react";
import { format, subDays, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

type Worker = { id: string; name: string; status: 'ACTIVE' | 'INACTIVE' };
type AttendanceRecord = { workerId: string; status: 'PRESENT' | 'ABSENT' };

export default function AttendancePage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      // Fetch active workers
      const workersRes = await fetch('/api/workers');
      if (!workersRes.ok) {
        if (workersRes.status === 401) router.push('/login');
        throw new Error('Failed to fetch workers');
      }
      const workersJson = await workersRes.json();
      const workersData: Worker[] = workersJson.data;
      setWorkers(workersData);

      // Fetch attendance for selected date
      const dateStr = currentDate.toISOString();
      const attRes = await fetch(`/api/attendance?date=${encodeURIComponent(dateStr)}`);
      if (!attRes.ok) throw new Error('Failed to fetch attendance');
      const attJson = await attRes.json();
      const attData = attJson.data;

      const newAtt: Record<string, 'PRESENT' | 'ABSENT'> = {};
      attData.forEach((record: any) => {
        newAtt[record.workerId] = record.status;
      });
      setAttendance(newAtt);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = (workerId: string, status: 'PRESENT' | 'ABSENT') => {
    setAttendance(prev => ({ ...prev, [workerId]: status }));
  };

  const markAllPresent = () => {
    const newAtt: Record<string, 'PRESENT' | 'ABSENT'> = {};
    workers.forEach(w => {
      newAtt[w.id] = "PRESENT";
    });
    setAttendance(newAtt);
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const records = Object.entries(attendance).map(([workerId, status]) => ({ workerId, status }));
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentDate.toISOString(),
          records
        })
      });

      if (!res.ok) throw new Error('Failed to save attendance');
      
      setMessage({ type: 'success', text: 'Attendance saved successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm relative">
          <label htmlFor="attendance-date" className="text-sm font-medium text-gray-500">Attendance Date</label>
          <input 
            id="attendance-date"
            type="date" 
            value={format(currentDate, "yyyy-MM-dd")}
            onChange={(e) => {
              if (e.target.value) {
                const selected = new Date(e.target.value);
                // Prevent future dates
                if (selected <= new Date()) {
                  setCurrentDate(selected);
                } else {
                  alert("Cannot select future dates.");
                }
              }
            }}
            max={format(new Date(), "yyyy-MM-dd")}
            className="font-medium text-gray-900 bg-transparent border-none focus:ring-0 outline-none cursor-pointer"
          />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Active Workers</h2>
          <button 
            onClick={markAllPresent}
            disabled={isLoading || workers.length === 0}
            className="text-sm px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            Mark All Present
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading workers...</div>
          ) : workers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No active workers found.</div>
          ) : (
            workers.map(worker => (
              <div key={worker.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-green-100 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg">
                    {worker.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{worker.name}</h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleStatus(worker.id, "PRESENT")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all ${
                      attendance[worker.id] === "PRESENT" 
                        ? "bg-green-600 border-green-600 text-white" 
                        : "bg-white border-gray-200 text-gray-500 hover:border-green-600 hover:text-green-600"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Present</span>
                  </button>
                  <button 
                    onClick={() => toggleStatus(worker.id, "ABSENT")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all ${
                      attendance[worker.id] === "ABSENT" 
                        ? "bg-red-500 border-red-500 text-white" 
                        : "bg-white border-gray-200 text-gray-500 hover:border-red-500 hover:text-red-500"
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Absent</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-8 flex justify-end pt-6 border-t border-gray-50">
          <button 
            onClick={saveAttendance}
            disabled={isSaving || isLoading || workers.length === 0}
            className="btn-primary w-full md:w-auto disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
