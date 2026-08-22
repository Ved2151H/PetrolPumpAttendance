import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { redirect } from "next/navigation";
import { getFirmId } from "@/lib/firm";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const firmId = await getFirmId();
  if (!firmId) {
    redirect("/");
  }

  let firmName = "Workspace";
  if (firmId) {
    const firm = await prisma.firm.findUnique({ where: { id: firmId } });
    if (firm) {
      firmName = firm.name;
      if (!firmName.endsWith("Private Limited")) {
        firmName += " Private Limited";
      }
    }
  }

  return (
    <div className={`dashboard-shell min-h-screen flex firm-${firmId}`}>
      <Sidebar />
      <div className="flex-1 min-w-0 md:ml-72 pb-16 md:pb-0">
        <Link 
          href="/"
          className={`md:hidden block px-5 py-7 border-b border-white/10 relative shadow-lg active:opacity-95 transition-all ${
            firmId === 'patil' 
              ? "bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 shadow-orange-950/20" 
              : "bg-gradient-to-br from-[#21386f] via-[#304f94] to-[#536eb0] shadow-indigo-950/20"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg leading-tight tracking-[-.025em] font-extrabold text-white">{firmName}</p>
              <p className="text-[10px] uppercase text-white/60 tracking-wider mt-1 font-semibold">Tap to Change Workspace</p>
            </div>
          </div>
        </Link>
        <main className="relative p-4 pt-6 md:p-9 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
