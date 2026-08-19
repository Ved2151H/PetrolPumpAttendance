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
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, accent: "bg-indigo-600 shadow-indigo-200" },
    { name: "Attendance", href: "/attendance", icon: ClipboardCheck, accent: "bg-sky-600 shadow-sky-200" },
    { name: "Workers", href: "/workers", icon: Users, accent: "bg-emerald-600 shadow-emerald-200" },
    { name: "Notes", href: "/settings/notes", icon: FileText, accent: "bg-violet-600 shadow-violet-200" },
    { name: "More", href: "/settings", icon: Menu, accent: "bg-amber-500 shadow-amber-200" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#17233f]/95 backdrop-blur-xl border-t border-white/10 pb-safe z-50 shadow-[0_-10px_28px_-15px_rgba(15,23,42,.7)]">
      <nav className="flex justify-around items-center h-[4.6rem] px-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (pathname.startsWith(link.href + "/") && link.href !== "/settings");
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`group flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive ? "text-white font-bold" : "text-blue-100/55 hover:text-white font-medium"
              }`}
            >
              <span className={`grid h-8 w-8 place-items-center rounded-xl transition-all ${isActive ? `${link.accent} text-white shadow-md -translate-y-0.5` : "group-hover:bg-white/10"}`}>
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[10px] leading-none">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
