"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { subDays } from "date-fns";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("Daily");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const handleDownload = async () => {
    setValidationError("");
    setIsGenerating(true);
    
    try {
      let startD = new Date();
      let endD = new Date();

      if (dateRange === "Weekly") {
        startD = subDays(endD, 7);
      } else if (dateRange === "Monthly") {
        startD = subDays(endD, 30);
      } else if (dateRange === "Custom") {
        if (!customStart || !customEnd) {
          setValidationError("Both From Date and To Date are required.");
          setIsGenerating(false);
          return;
        }
        
        startD = new Date(customStart);
        endD = new Date(customEnd);
        
        if (startD > endD) {
          setValidationError("From Date cannot be after To Date.");
          setIsGenerating(false);
          return;
        }
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
      
      if (dateRange === "Custom") {
        setIsCustomModalOpen(false);
      }
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
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      </div>

      <div className="card max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Export Attendance</h2>
            <p className="text-sm text-slate-500">Download Excel reports for any date range</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Date Range</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Daily", "Weekly", "Monthly", "Custom"].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    if (range === "Custom") {
                      setIsCustomModalOpen(true);
                      setValidationError("");
                    }
                  }}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
                    dateRange === range && !isCustomModalOpen
                      ? "bg-teal-50 border-teal-200 text-teal-700" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {dateRange !== "Custom" && (
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full btn-primary !bg-teal-600 hover:!bg-teal-700 flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-teal-200"
            >
              <Download className="w-5 h-5" />
              {isGenerating ? "Generating Report..." : `Download ${dateRange} Report`}
            </button>
          )}
        </div>
      </div>

      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Custom Date Range</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {validationError && (
                <div className="p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700">
                  {validationError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsCustomModalOpen(false);
                  setDateRange("Daily"); // Revert if cancelled
                }}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 bg-white hover:bg-slate-100 transition-colors disabled:opacity-70"
              >
                Cancel
              </button>
              <button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
              >
                {isGenerating && <Download className="w-4 h-4 animate-bounce" />}
                {isGenerating ? "Generating..." : "Generate Excel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
