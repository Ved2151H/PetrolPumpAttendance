import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Building2, Droplet } from "lucide-react";
import FirmSelector from "@/components/FirmSelector";

export default async function Home() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 bg-[#17233f]">
      <div className="absolute inset-0 opacity-90" style={{ background: "radial-gradient(circle at 82% 10%, rgba(229,174,77,.32), transparent 24rem), radial-gradient(circle at 0% 100%, rgba(58,91,161,.55), transparent 30rem)" }} />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-black/25 border border-white/30 p-8 sm:p-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Select Workspace</h1>
          <p className="text-slate-500 text-lg">Choose the firm you want to manage today.</p>
        </div>

        <FirmSelector />
      </div>
    </div>
  );
}
