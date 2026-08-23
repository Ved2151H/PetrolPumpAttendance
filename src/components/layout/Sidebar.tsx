"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Settings,
  Trash2,
  FileText,
  Building2,
  Droplet,
  Receipt
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [firmName, setFirmName] = useState("Loading...");
  const [firmId, setFirmId] = useState("");
  
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
         if (d.data?.currentFirmName) {
            setFirmName(d.data.currentFirmName);
            setFirmId(d.data.currentFirmId);
         } else {
            setFirmName("Select Workspace");
         }
      })
      .catch(() => setFirmName("Workspace"));
  }, []);
  
  const isPatil = firmId === 'patil';

  const links = isPatil ? [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: "bg-indigo-500/25 ring-indigo-300/25" },
    { name: "Attendance", href: "/attendance", icon: ClipboardCheck, active: "bg-sky-500/25 ring-sky-300/25" },
    { name: "Workers", href: "/workers", icon: Users, active: "bg-emerald-500/25 ring-emerald-300/25" },
    { name: "Notes", href: "/settings/notes", icon: FileText, active: "bg-violet-500/25 ring-violet-300/25" }, 
    { name: "Trash", href: "/trash", icon: Trash2, active: "bg-rose-500/25 ring-rose-300/25" },
    { name: "Settings", href: "/settings", icon: Settings, active: "bg-amber-500/25 ring-amber-300/25" },
  ] : [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: "bg-indigo-500/25 ring-indigo-300/25" },
    { name: "Attendance", href: "/attendance", icon: ClipboardCheck, active: "bg-sky-500/25 ring-sky-300/25" },
    { name: "Workers", href: "/workers", icon: Users, active: "bg-emerald-500/25 ring-emerald-300/25" },
    { name: "Invoice", href: "/invoices", icon: Receipt, active: "bg-violet-500/25 ring-violet-300/25" }, 
    { name: "Trash", href: "/trash", icon: Trash2, active: "bg-rose-500/25 ring-rose-300/25" },
    { name: "Settings", href: "/settings", icon: Settings, active: "bg-amber-500/25 ring-amber-300/25" },
  ];

  return (
    <div className={`hidden md:flex flex-col w-72 text-white min-h-screen fixed left-0 top-0 shadow-[12px_0_32px_-24px_rgba(15,23,42,.65)] transition-all duration-300 ${
      isPatil 
        ? "bg-gradient-to-br from-[#ff8237] via-[#ff934f] to-[#ffaa72]" 
        : "bg-[#17233f]"
    }`}>
      <Link href="/" className="px-6 py-8 border-b border-white/10 hover:bg-white/5 transition-colors block">
        <div className="flex items-start gap-3.5">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-lg shadow-black/10 ${isPatil ? 'bg-white text-[#ff8237]' : 'bg-amber-400 text-[#17233f]'}`}>
            {isPatil ? <Droplet className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-[-.04em] leading-[1.05]">{firmName}</h1>
            <p className={`text-[10px] uppercase tracking-wider mt-1 transition-colors ${
              isPatil ? "text-white/60 hover:text-white" : "text-blue-200/50 hover:text-blue-200"
            }`}>Change Firm</p>
          </div>
        </div>
      </Link>
      
      <nav className="flex-1 py-7 px-4 space-y-1.5">
        <p className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] ${
          isPatil ? "text-white/50" : "text-blue-100/45"
        }`}>Workspace</p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (pathname.startsWith(link.href + "/") && link.href !== "/settings");
          const activeClass = isPatil ? "bg-white/20 ring-white/20" : link.active;
          const inactiveClass = isPatil 
            ? "text-white/70 hover:bg-white/10 hover:text-white font-medium" 
            : "text-blue-100/70 hover:bg-white/8 hover:text-white font-medium";

          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                isActive 
                  ? `${activeClass} text-white font-semibold shadow-sm ring-1`
                  : inactiveClass
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mx-5 mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <p className={`mt-1 text-[11px] leading-relaxed ${
          isPatil ? "text-white/75" : "text-blue-100/55"
        }`}>Manage your team with confidence.</p>
      </div>
    </div>
  );
}
