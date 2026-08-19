"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Menu,
  BarChart3
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  
  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { name: "Workers", href: "/workers", icon: Users },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "More", href: "/settings", icon: Menu },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50">
      <nav className="flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? "text-indigo-700 font-bold" : "text-slate-500 hover:text-indigo-700 font-medium"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px]">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
