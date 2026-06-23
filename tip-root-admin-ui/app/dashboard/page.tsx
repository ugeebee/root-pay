"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Tv, Video, Smartphone, ChevronDown, ChevronUp, Info, Check, QrCode } from "lucide-react";
import QRCode from "react-qr-code";

export default function CommandCenter() {
  const [streamerId, setStreamerId] = useState<string>("........");
  const [overlayToken, setOverlayToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  
  // Interactive UI states for the OBS Widget drawer
  const [isObsDropdownOpen, setIsObsDropdownOpen] = useState<boolean>(false);
  const [isSpcDropdownOpen, setIsSpcDropdownOpen] = useState<boolean>(false);
  const [isWidgetCopied, setIsWidgetCopied] = useState<boolean>(false);

  useEffect(() => {
    // 1. Fetch Secure Streamer Statistics & ID
    fetch("https://streamer.tip-root.in/api/dashboard/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized context handshake");
        const data = await res.text();
        const extractedId = data.split(": ").pop();
        if (extractedId) setStreamerId(extractedId);
      })
      .catch((err) => console.error("Could not fetch secure metric claims:", err));

    // 2. Fetch Secure Overlay Token for the Widget link
    fetch("https://streamer.tip-root.in/api/dashboard/token", { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const tokenData = await res.json();
          setOverlayToken(tokenData.overlay_token);
        }
      })
      .catch((err) => console.error("Could not fetch security token:", err))
      .finally(() => setLoading(false));
  }, []);

  const tipUrl = `https://tip-root.in/tips?streamerid=${streamerId}`;
  
  // The official URL that the streamer will paste into OBS Studio
  const obsWidgetUrl = `https://streamer.tip-root.in/overlay?streamer_id=${streamerId}&token=${overlayToken}`;

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
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
            onClick={() => copyToClipboard(tipUrl, () => {})}
            disabled={loading}
            className="flex items-center gap-2 bg-[#571bc1] hover:bg-[#a200ba] text-white px-4 py-2 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(87,27,193,0.4)] hover:shadow-[0_0_25px_rgba(251,171,255,0.4)] disabled:opacity-50"
          >
            <Copy size={16} />
            Copy Link
          </button>
        </div>
      </div>

      {/* Connectivity Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* YouTube Card */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-md flex items-center justify-between transition-all hover:bg-white/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <Tv size={20} className="text-[#ff0000]" />
            </div>
            <div>
              <h3 className="font-medium text-white">YouTube</h3>
              <p className="text-xs text-[#9f8b9d]">Stream source</p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">Disconnected</span>
        </div>

        {/* OBS Interactive Widget Setup Card */}
        <div className="md:col-span-1 flex flex-col rounded-xl bg-white/5 border border-white/10 backdrop-blur-md transition-all overflow-hidden">
          <div 
            onClick={() => !loading && setIsObsDropdownOpen(!isObsDropdownOpen)}
            className={`p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${isObsDropdownOpen ? 'border-b border-white/10 bg-white/5' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Video size={20} className="text-[#fbabff]" />
              </div>
              <div>
                <h3 className="font-medium text-white">OBS Overlay</h3>
                <p className="text-xs text-[#9f8b9d]">Click to configure widget</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Setup Source</span>
              {isObsDropdownOpen ? <ChevronUp size={16} className="text-[#9f8b9d]" /> : <ChevronDown size={16} className="text-[#9f8b9d]" />}
            </div>
          </div>

          {/* Expandable Setup Drawer */}
          {isObsDropdownOpen && (
            <div className="p-5 bg-black/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-1">
                <label className="text-[11px] font-bold tracking-wider uppercase text-[#9f8b9d] flex items-center gap-1">
                  <Info size={12} className="text-[#fbabff]" /> OBS Browser Source URL
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="password" 
                    value={obsWidgetUrl} 
                    readOnly 
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-[#9f8b9d] select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(obsWidgetUrl, setIsWidgetCopied)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[#fbabff] transition-colors"
                    title="Copy Widget URL"
                  >
                    {isWidgetCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Instructions List */}
              <div className="rounded-lg bg-white/5 border border-white/5 p-3 text-xs text-[#9f8b9d] space-y-2">
                <p className="font-bold text-white text-[11px] uppercase tracking-wide border-b border-white/5 pb-1">Quick Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Open OBS Studio and locate the <span className="text-white font-medium">Sources</span> dock.</li>
                  <li>Click the <span className="text-white font-medium">+</span> icon and choose <span className="text-[#fbabff] font-medium">Browser</span>.</li>
                  <li>Paste your secure URL copied above into the <span className="text-white font-medium">URL</span> box.</li>
                  <li>Set Width to <span className="text-white font-semibold">1920</span> and Height to <span className="text-white font-semibold">1080</span>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Tip Root SPC App Card */}
        <div className="md:col-span-1 flex flex-col rounded-xl bg-white/5 border border-white/10 backdrop-blur-md transition-all overflow-hidden">
          <div 
            onClick={() => !loading && setIsSpcDropdownOpen(!isSpcDropdownOpen)}
            className={`p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${isSpcDropdownOpen ? 'border-b border-white/10 bg-white/5' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Smartphone size={20} className="text-[#c4abff]" />
              </div>
              <div>
                <h3 className="font-medium text-white">Tip Root App</h3>
                <p className="text-xs text-[#9f8b9d]">Mobile controller</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Link Device</span>
              {isSpcDropdownOpen ? <ChevronUp size={16} className="text-[#9f8b9d]" /> : <ChevronDown size={16} className="text-[#9f8b9d]" />}
            </div>
          </div>

        {/* Expandable QR Scanner Drawer (SPC APP) */}
          {isSpcDropdownOpen && (
            <div className="p-6 bg-black/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#c4abff]/10 flex items-center justify-center mb-1">
                <QrCode size={20} className="text-[#c4abff]" />
              </div>
              <h4 className="font-bold text-white">Link your Smartphone</h4>
              <p className="text-xs text-[#9f8b9d] max-w-[200px]">
                Open the Tip Root app on your phone and scan this code to connect.
              </p>
              
              {/* QR Code Container (White background is required so cameras can easily read the contrast) */}
              <div className="bg-white p-3 rounded-xl shadow-[0_0_20px_rgba(196,171,255,0.2)] mt-2">
                {overlayToken ? (
                  <QRCode 
                    value={overlayToken} 
                    size={140} 
                    level="Q" 
                    className="rounded-md"
                  />
                ) : (
                  <div className="w-[140px] h-[140px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-gray-300" />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}