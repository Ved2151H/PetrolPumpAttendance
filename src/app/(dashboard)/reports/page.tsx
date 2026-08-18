"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { subDays } from "date-fns";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("Daily");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      let startD = new Date();
      let endD = new Date();

      if (dateRange === "Weekly") {
        startD = subDays(endD, 7);
      } else if (dateRange === "Monthly") {
        startD = subDays(endD, 30);
      }
      
      const startIso = startD.toISOString();
      const endIso = endD.toISOString();

      const response = await fetch(`/api/reports?startDate=${encodeURIComponent(startIso)}&endDate=${encodeURIComponent(endIso)}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Attendance_Report_${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error(error);
      alert("Failed to download report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      <div className="card max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Export Attendance</h2>
            <p className="text-sm text-gray-500">Download Excel reports for any date range</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date Range</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Daily", "Weekly", "Monthly", "Custom"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
                    dateRange === range 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? "Generating Report..." : `Download ${dateRange} Report`}
          </button>
        </div>
      </div>
    </div>
  );
}
