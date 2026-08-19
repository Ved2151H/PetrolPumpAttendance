import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 md:ml-72 pb-16 md:pb-0">
        <div className="md:hidden bg-gradient-to-br from-[#21386f] via-[#304f94] to-[#536eb0] px-4 py-5 border-b border-white/10 sticky top-0 z-40 shadow-lg shadow-indigo-950/20">
          <p className="text-lg leading-tight tracking-[-.025em] font-extrabold text-white">Namrata Construction Private Limited</p>
        </div>
        <main className="relative p-4 pt-6 md:p-9 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
