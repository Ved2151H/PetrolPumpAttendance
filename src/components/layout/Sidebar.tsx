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
  FileText
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
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 min-h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-50">
        <h1 className="text-xl font-bold text-indigo-700 tracking-tight">Namrata construction Private limited</h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (pathname.startsWith(link.href + "/") && link.href !== "/settings");
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "bg-indigo-50 text-indigo-700 font-bold" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-indigo-700 font-medium"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            S
          </div>
          <div className="text-sm font-medium">Shubham sir</div>
        </div>
      </div>
    </div>
  );
}
