import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 min-w-0 md:ml-64 pb-16 md:pb-0">
        <div className="md:hidden bg-white p-4 border-b border-slate-100 sticky top-0 z-40 shadow-sm">
          <h1 className="text-lg font-bold text-indigo-700 tracking-tight">Namrata construction Private limited</h1>
        </div>
        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
