"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Droplet, ArrowRight, Loader2 } from "lucide-react";

export default function FirmSelector() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const selectFirm = async (firmId: string) => {
    setLoading(firmId);
    try {
      const res = await fetch("/api/firm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmId }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        alert("Failed to select firm");
        setLoading(null);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
      setLoading(null);
    }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <button
        onClick={() => selectFirm("narmata")}
        disabled={loading !== null}
        className="group relative flex flex-col text-left bg-slate-50 hover:bg-[#17233f] border-2 border-slate-200 hover:border-[#17233f] rounded-2xl p-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="w-14 h-14 bg-amber-400 text-[#17233f] rounded-xl flex items-center justify-center mb-6 shadow-md transition-transform group-hover:scale-110">
          {loading === "narmata" ? <Loader2 className="w-7 h-7 animate-spin" /> : <Building2 className="w-7 h-7" />}
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 group-hover:text-white transition-colors mb-2">Namrata Construction Private Limited</h2>
        <p className="text-sm text-slate-500 group-hover:text-blue-100/70 transition-colors">Manage construction workers and site attendance.</p>
        
        <div className="mt-8 flex items-center text-amber-600 group-hover:text-amber-400 font-semibold text-sm">
          <span>Enter Workspace</span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
 
      <button
        onClick={() => selectFirm("patil")}
        disabled={loading !== null}
        className="group relative flex flex-col text-left bg-slate-50 hover:bg-[#17233f] border-2 border-slate-200 hover:border-[#17233f] rounded-2xl p-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff8237]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="w-14 h-14 bg-[#ff8237] text-white rounded-xl flex items-center justify-center mb-6 shadow-md transition-transform group-hover:scale-110">
          {loading === "patil" ? <Loader2 className="w-7 h-7 animate-spin" /> : <Droplet className="w-7 h-7" />}
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 group-hover:text-white transition-colors mb-2">Patil Petroleum Private Limited</h2>
        <p className="text-sm text-slate-500 group-hover:text-orange-100/70 transition-colors">Manage petrol pump staff and operations.</p>
        
        <div className="mt-8 flex items-center text-[#ff8237] group-hover:text-[#ffa066] font-semibold text-sm">
          <span>Enter Workspace</span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  );
}
