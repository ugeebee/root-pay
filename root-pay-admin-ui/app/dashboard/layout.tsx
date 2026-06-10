'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, MonitorPlay, Table2, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('https://adminroot.ugbhartariya.com/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/login');
      }
    } catch (err) {
      console.error("Logout execution failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#e5e1e4] flex font-sans selection:bg-[#fbabff]/30">
      <aside className="w-64 fixed h-full border-r border-white/10 bg-[#131315]/80 backdrop-blur-xl flex flex-col z-20">
        <div className="p-6">
          <div className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#fbabff] to-[#d0bcff] text-2xl tracking-tight">
            Root-Pay
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#fbabff] bg-white/5 rounded-lg border border-white/5 font-medium transition-colors">
            <LayoutDashboard size={20} />
            Command Center
          </Link>
          <Link href="/dashboard/overlay" className="flex items-center gap-3 px-4 py-3 text-[#9f8b9d] hover:text-[#fbabff] hover:bg-white/5 rounded-lg font-medium transition-colors">
            <MonitorPlay size={20} />
            OBS Alerts
          </Link>
          <Link href="/dashboard/ledger" className="flex items-center gap-3 px-4 py-3 text-[#9f8b9d] hover:text-[#fbabff] hover:bg-white/5 rounded-lg font-medium transition-colors">
            <Table2 size={20} />
            Ledger
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-[#9f8b9d] hover:text-[#fbabff] hover:bg-white/5 rounded-lg font-medium transition-colors">
            <Settings size={20} />
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fbabff] to-[#571bc1] flex items-center justify-center font-bold text-white shadow-lg">
              U
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Streamer</p>
              <p className="text-xs text-[#9f8b9d] truncate">Verified Partner</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-[#9f8b9d] hover:text-[#ffb4ab] transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8 relative overflow-hidden min-h-screen">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#571bc1]/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#fbabff]/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}