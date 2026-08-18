"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Settings,
  Trash2
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  
  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { name: "Workers", href: "/workers", icon: Users },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Trash", href: "/trash", icon: Trash2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-gray-50">
        <h1 className="text-xl font-bold text-green-700 tracking-tight">Petrol Pump Admin</h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "bg-green-50 text-green-700 font-bold" 
                  : "text-gray-600 hover:bg-green-50 hover:text-green-700 font-medium"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            S
          </div>
          <div className="text-sm font-medium">Shubham sir</div>
        </div>
      </div>
    </div>
  );
}
