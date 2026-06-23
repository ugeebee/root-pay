'use client';

import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#09090B] text-[#e5e1e4] flex flex-col min-h-screen font-sans overflow-hidden">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-transparent flex justify-between items-center px-12 py-6 max-w-[1280px] mx-auto">
        <div className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#fbabff] to-[#d0bcff] text-2xl tracking-tight">
          Tip Root
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative">
        {/* Ambient Blurred Background Backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#571bc1]/10 to-[#fbabff]/10 blur-[140px] rounded-full pointer-events-none"></div>

        <div className="max-w-3xl space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Take Full Control of Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbabff] to-[#d0bcff]">
              Stream Revenue
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-[#9f8b9d] text-lg md:text-xl leading-relaxed">
            A self-hosted, privacy-first tipping platform built for streamers. Zero platform fee deductions. Real-time OBS overlays. Powered by your own engine.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-white font-bold bg-gradient-to-r from-[#fbabff] to-[#571bc1] hover:scale-[1.03] active:scale-98 hover:shadow-[0_0_35px_rgba(251,171,255,0.4)] transition-all duration-200 shadow-lg text-lg"
            >
              Sign Up via Discord
            </Link>
            <a
              href="#"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all text-lg"
            >
              Documentation
            </a>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full bg-transparent flex flex-col md:flex-row justify-between items-center px-12 py-8 max-w-[1280px] mx-auto text-sm text-[#9f8b9d]">
        <div>© 2026 Tip Root. All rights reserved.</div>
        <div className="flex gap-6 mt-4 md:mt-0 flex-wrap justify-center md:justify-end">
          <a href="https://tip-root.in/contact" className="hover:text-white transition-colors">Contact Us</a>
          <a href="https://tip-root.in/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="https://tip-root.in/terms" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="https://tip-root.in/disclaimer" className="hover:text-white transition-colors">Disclaimer</a>
        </div>
      </footer>
    </div>
  );
}