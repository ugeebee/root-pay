"use client";

import { useEffect, useState } from "react";
import { Copy, TrendingUp, IndianRupee, Trophy, Loader2 } from "lucide-react";

export default function CommandCenter() {
  const [streamerId, setStreamerId] = useState<string>("........");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Interrogate secure endpoint to pull verification context
    fetch("https://adminroot.ugbhartariya.com/api/dashboard/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized context handshake");
        const data = await res.text();
        // Extract the 8-digit ID from response: "Authenticated secure statistics payload for Streamer: XXXXXXXX"
        const extractedId = data.split(": ").pop();
        if (extractedId) setStreamerId(extractedId);
      })
      .catch((err) => console.error("Could not fetch secure metric claims:", err))
      .finally(() => setLoading(false));
  }, []);

  const tipUrl = `https://root.ugbhartariya.com/tip/${streamerId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tipUrl);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Command Center</h1>
          <p className="text-[#9f8b9d]">Welcome back. Here is your stream's financial overview.</p>
        </div>
        {loading && <Loader2 className="animate-spin text-[#fbabff]" size={24} />}
      </header>

      {/* Tipping URL Card */}
      <div className="relative group rounded-xl bg-white/5 border border-white/10 p-6 backdrop-blur-md overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#fbabff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-[#fbabff] mb-1">Your Public Tipping Link</p>
            <p className="text-lg font-mono text-white/90">{tipUrl}</p>
          </div>
          <button 
            onClick={copyToClipboard}
            disabled={loading}
            className="flex items-center gap-2 bg-[#571bc1] hover:bg-[#a200ba] text-white px-4 py-2 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(87,27,193,0.4)] hover:shadow-[0_0_25px_rgba(251,171,255,0.4)] disabled:opacity-50"
          >
            <Copy size={16} />
            Copy Link
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 text-[#9f8b9d] mb-4">
            <TrendingUp size={20} className="text-[#dec747]" />
            <h3 className="font-medium">Today's Revenue</h3>
          </div>
          <p className="text-4xl font-bold text-white">₹4,500</p>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 text-[#9f8b9d] mb-4">
            <IndianRupee size={20} className="text-[#fbabff]" />
            <h3 className="font-medium">Total Tips</h3>
          </div>
          <p className="text-4xl font-bold text-white">24</p>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 text-[#9f8b9d] mb-4">
            <Trophy size={20} className="text-[#c4abff]" />
            <h3 className="font-medium">Largest Tip</h3>
          </div>
          <p className="text-4xl font-bold text-white">₹2,000</p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        </div>
        <div className="divide-y divide-white/5">
          <div className="p-6 hover:bg-white/[0.02] transition-colors flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#36003e] flex items-center justify-center border border-[#fbabff]/30 text-[#fbabff] font-bold">
                A
              </div>
              <div>
                <p className="text-white font-medium">Aryaman sent <span className="text-[#fbabff]">₹500</span></p>
                <p className="text-[#9f8b9d] text-sm mt-1 italic">"First time watching, really vibes with the stream!"</p>
              </div>
            </div>
            <span className="text-xs text-[#9f8b9d]">2 mins ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}