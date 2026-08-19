"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type Worker = { id: string; name: string; status: 'ACTIVE' | 'INACTIVE'; joiningDate: string };
type AttStatus = 'PRESENT' | 'ABSENT';
type AttRecord = { status: AttStatus; timeIn: string | null; timeOut: string | null };

export default function AttendancePage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttRecord>>({});
  const [originalAttendance, setOriginalAttendance] = useState<Record<string, AttRecord>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  const isReadOnly = currentDate < sevenDaysAgo;

  useEffect(() => {
    setIsEditing(false);
    fetchData();
  }, [currentDate]);

  async function fetchData() {
    setIsLoading(true);
    setMessage(null);
    try {
      const workersRes = await fetch('/api/workers');
      if (!workersRes.ok) {
        if (workersRes.status === 401) router.push('/login');
        throw new Error('Failed to fetch workers');
      }
      const workersJson = await workersRes.json();
      const workersData: Worker[] = workersJson.data;
      
      const validWorkers = workersData.filter(w => new Date(w.joiningDate) <= new Date(currentDate.setHours(23,59,59,999)));
      setWorkers(validWorkers);

      const dateStr = currentDate.toISOString();
      const attRes = await fetch(`/api/attendance?date=${encodeURIComponent(dateStr)}`);
      if (!attRes.ok) throw new Error('Failed to fetch attendance');
      const attJson = await attRes.json();
      const attData = attJson.data;

      const newAtt: Record<string, AttRecord> = {};
      attData.forEach((record: any) => {
        newAtt[record.workerId] = {
          status: record.status,
          timeIn: record.timeIn || null,
          timeOut: record.timeOut || null
        };
      });
      
      validWorkers.forEach(w => {
        if (!newAtt[w.id]) {
          newAtt[w.id] = { status: 'ABSENT', timeIn: null, timeOut: null };
        }
      });

      setAttendance(newAtt);
      setOriginalAttendance(JSON.parse(JSON.stringify(newAtt)));
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = (workerId: string, status: AttStatus) => {
    setAttendance(prev => {
      const current = prev[workerId] || { timeIn: null, timeOut: null };
      if (status === 'ABSENT') {
        return { ...prev, [workerId]: { status, timeIn: null, timeOut: null } };
      }
      return { ...prev, [workerId]: { status, timeIn: current.timeIn, timeOut: current.timeOut } };
    });
  };

  const updateTime = (workerId: string, field: 'timeIn' | 'timeOut', value: string) => {
    setAttendance(prev => {
      const current = prev[workerId] || { status: 'ABSENT', timeIn: null, timeOut: null };
      return { ...prev, [workerId]: { ...current, [field]: value || null } };
    });
  };

  const markAllPresent = () => {
    const newAtt: Record<string, AttRecord> = {};
    workers.forEach(w => {
      newAtt[w.id] = { 
        status: "PRESENT", 
        timeIn: attendance[w.id]?.timeIn || null, 
        timeOut: attendance[w.id]?.timeOut || null 
      };
    });
    setAttendance(newAtt);
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const records = Object.entries(attendance).map(([workerId, data]) => ({
        workerId,
        status: data.status,
        timeIn: data.status === 'PRESENT' ? data.timeIn : null,
        timeOut: data.status === 'PRESENT' ? data.timeOut : null
      }));
      
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentDate.toISOString(),
          records
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save attendance');
      
      setOriginalAttendance(JSON.parse(JSON.stringify(attendance)));
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Attendance saved successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDisplayTime = (time24: string | null) => {
    if (!time24) return '-';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-amber-600 mb-2">Daily register</p><h1 className="text-3xl font-bold text-slate-900">Attendance</h1></div>
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm relative">
          <label htmlFor="attendance-date" className="text-xs font-bold uppercase tracking-wide text-slate-500">Date</label>
          <input 
            id="attendance-date"
            type="date" 
            value={format(currentDate, "yyyy-MM-dd")}
            onChange={(e) => {
              if (e.target.value) {
                const selected = new Date(e.target.value);
                if (selected <= new Date()) {
                  setCurrentDate(selected);
                } else {
                  alert("Cannot select future dates.");
                }
              }
            }}
            max={format(new Date(), "yyyy-MM-dd")}
            className="font-medium text-slate-900 bg-transparent border-none focus:ring-0 outline-none cursor-pointer"
          />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {isReadOnly && !message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 flex items-center gap-2">
          This attendance record is older than 7 days and is view-only.
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Active Workers</h2>
            {isEditing && (
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-md">
                Edit Mode
              </span>
            )}
          </div>
          {!isReadOnly && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
                className="text-sm px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Edit
            </button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setAttendance(JSON.parse(JSON.stringify(originalAttendance)));
                  setIsEditing(false);
                  setMessage(null);
                }}
                disabled={isLoading}
                className="text-sm px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={markAllPresent}
                disabled={isLoading || workers.length === 0}
                className="text-sm px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                Mark All Present
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 text-sm">Loading workers...</div>
          ) : workers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No active workers found for this date.</div>
          ) : (
            workers.map(worker => {
              const rec = attendance[worker.id] || { status: 'ABSENT', timeIn: null, timeOut: null };
              return (
                <div key={worker.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{worker.name}</h3>
                      {(!isEditing || rec.status !== 'PRESENT') && rec.status === 'PRESENT' && (
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          In: {formatDisplayTime(rec.timeIn)} &nbsp;&bull;&nbsp; Out: {formatDisplayTime(rec.timeOut)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Time Inputs (Only visible when editing and PRESENT) */}
                    {isEditing && rec.status === 'PRESENT' && (
                      <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                        <div className="flex flex-col">
                          <label className="text-[10px] uppercase font-bold text-slate-500 pl-1">Time In</label>
                          <input 
                            type="time" 
                            value={rec.timeIn || ''}
                            onChange={(e) => updateTime(worker.id, 'timeIn', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg text-sm px-2 py-1 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[10px] uppercase font-bold text-slate-500 pl-1">Time Out</label>
                          <input 
                            type="time" 
                            value={rec.timeOut || ''}
                            onChange={(e) => updateTime(worker.id, 'timeOut', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg text-sm px-2 py-1 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Status Buttons */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => toggleStatus(worker.id, "PRESENT")}
                        disabled={isReadOnly || !isEditing}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all ${
                          rec.status === "PRESENT" 
                            ? "bg-green-600 border-green-600 text-white shadow-sm" 
                            : `bg-white border-slate-200 text-slate-500 ${(!isReadOnly && isEditing) ? 'hover:border-green-600 hover:text-green-600 hover:bg-green-50' : ''}`
                        } ${(isReadOnly || !isEditing) && rec.status !== "PRESENT" ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
                        ${isReadOnly || !isEditing ? 'cursor-default' : ''}`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Present</span>
                      </button>
                      <button 
                        onClick={() => toggleStatus(worker.id, "ABSENT")}
                        disabled={isReadOnly || !isEditing}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all ${
                          rec.status === "ABSENT" 
                            ? "bg-red-500 border-red-500 text-white shadow-sm" 
                            : `bg-white border-slate-200 text-slate-500 ${(!isReadOnly && isEditing) ? 'hover:border-red-500 hover:text-red-500 hover:bg-red-50' : ''}`
                        } ${(isReadOnly || !isEditing) && rec.status !== "ABSENT" ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
                        ${isReadOnly || !isEditing ? 'cursor-default' : ''}`}
                      >
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">Absent</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {!isReadOnly && isEditing && (
          <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-slate-50">
            <button 
              onClick={() => {
                setAttendance(JSON.parse(JSON.stringify(originalAttendance)));
                setIsEditing(false);
                setMessage(null);
              }}
              disabled={isSaving || isLoading}
              className="px-6 py-2 rounded-xl font-medium border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-70"
            >
              Cancel
            </button>
            <button 
              onClick={saveAttendance}
              disabled={isSaving || isLoading || workers.length === 0}
              className="btn-primary w-full md:w-auto disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
