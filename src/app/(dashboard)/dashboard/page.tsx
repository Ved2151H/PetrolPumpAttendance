"use client";

import { Users, UserCheck, UserX, Activity } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = (await res.json()).data;
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const [todayAttendanceList, setTodayAttendanceList] = useState<any[]>([]);

  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        const today = new Date().toISOString();
        const res = await fetch(`/api/attendance?date=${encodeURIComponent(today)}`);
        if (res.ok) {
          const json = await res.json();
          const data = json.data;
          // Transform response into the UI shape
          const list = data.map((record: any) => ({
            name: record.worker?.name || 'Unknown',
            status: record.status
          }));
          setTodayAttendanceList(list);
        }
      } catch (err) {
        console.error('Failed to load today attendance:', err);
      }
    };
    fetchTodayAttendance();
  }, []);

  const statCards = [
    { title: "Total Workers", value: stats.totalWorkers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Present Today", value: stats.presentToday, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { title: "Absent Today", value: stats.absentToday, icon: UserX, color: "text-red-600", bg: "bg-red-50" },
    { title: "Attendance Rate", value: `${stats.attendanceRate}%`, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good Morning, Admin</h1>
        <p className="text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-5 flex flex-col items-start gap-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1"></div>
              ) : (
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Today's Attendance List */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Today's Attendance</h3>
            <button className="text-sm text-green-700 font-medium hover:text-green-800">View All</button>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
              ))
            ) : todayAttendanceList.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No attendance records for today yet.</div>
            ) : (
              <>
                {todayAttendanceList.map((worker, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                        {worker.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{worker.name}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      worker.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {worker.status}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {isLoading ? (
              <div className="h-32 bg-gray-50 rounded animate-pulse"></div>
            ) : (
              <>
                <div className="relative flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full bg-green-500 border-4 border-white shrink-0 z-10"></div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-900 font-medium">Attendance saved for today</p>
                    <span className="text-xs text-gray-500">10 mins ago</span>
                  </div>
                </div>
                <div className="relative flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full bg-gray-300 border-4 border-white shrink-0 z-10"></div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-900 font-medium">Rahul Sharma marked absent</p>
                    <span className="text-xs text-gray-500">15 mins ago</span>
                  </div>
                </div>
                <div className="relative flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-white shrink-0 z-10"></div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-900 font-medium">New worker added</p>
                    <span className="text-xs text-gray-500">Yesterday</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
