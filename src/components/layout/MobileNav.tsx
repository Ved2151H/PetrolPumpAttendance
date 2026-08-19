"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Menu,
  FileText
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  
  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { name: "Workers", href: "/workers", icon: Users },
    { name: "Notes", href: "/settings/notes", icon: FileText },
    { name: "More", href: "/settings", icon: Menu },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 pb-safe z-50 shadow-[0_-8px_24px_-18px_rgba(15,23,42,.45)]">
      <nav className="flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (pathname.startsWith(link.href + "/") && link.href !== "/settings");
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? "text-[#263b73] font-bold" : "text-slate-500 hover:text-[#263b73] font-medium"
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
