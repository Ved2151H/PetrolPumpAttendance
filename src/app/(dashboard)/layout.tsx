import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { redirect } from "next/navigation";
import { getFirmId } from "@/lib/firm";
import prisma from "@/lib/prisma";

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
        <div className={`md:hidden px-4 py-5 border-b border-white/10 sticky top-0 z-40 shadow-lg ${
          firmId === 'patil' 
            ? "bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 shadow-orange-950/20" 
            : "bg-gradient-to-br from-[#21386f] via-[#304f94] to-[#536eb0] shadow-indigo-950/20"
        }`}>
          <p className="text-lg leading-tight tracking-[-.025em] font-extrabold text-white">{firmName}</p>
        </div>
        <main className="relative p-4 pt-6 md:p-9 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
