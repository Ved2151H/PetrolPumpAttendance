import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 md:ml-72 pb-16 md:pb-0">
        <div className="md:hidden bg-white/95 backdrop-blur-xl p-4 border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
          <p className="text-[10px] uppercase tracking-[.15em] font-bold text-amber-600">Namrata Construction</p>
          <h1 className="text-lg font-bold text-[#263b73] tracking-tight">Attendance workspace</h1>
        </div>
        <main className="p-4 pt-6 md:p-9 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
