"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Settings,
  Trash2,
  FileText,
  Building2
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  
  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { name: "Workers", href: "/workers", icon: Users },
    { name: "Notes", href: "/settings/notes", icon: FileText }, 
    { name: "Trash", href: "/trash", icon: Trash2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="hidden md:flex flex-col w-72 bg-[#17233f] text-white min-h-screen fixed left-0 top-0 shadow-[12px_0_32px_-24px_rgba(15,23,42,.65)]">
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-[#17233f] shadow-lg shadow-black/10">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight leading-tight">Namrata Construction</h1>
            <p className="text-[10px] tracking-[.18em] uppercase text-blue-100/65 mt-1">Private Limited</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-7 px-4 space-y-1.5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-100/45">Workspace</p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (pathname.startsWith(link.href + "/") && link.href !== "/settings");
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                isActive 
                  ? "bg-white/12 text-white font-semibold shadow-sm ring-1 ring-white/10"
                  : "text-blue-100/70 hover:bg-white/8 hover:text-white font-medium"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mx-5 mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-xs font-semibold text-white/90">Attendance workspace</p>
        <p className="mt-1 text-[11px] leading-relaxed text-blue-100/55">Manage your team with confidence.</p>
      </div>
    </div>
  );
}
