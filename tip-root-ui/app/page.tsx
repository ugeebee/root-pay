'use client';

import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#09090B] text-[#e5e1e4] flex flex-col min-h-screen font-sans overflow-hidden">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-transparent flex justify-between items-center px-12 py-6 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-6">
          <img src="/tipRootLogo.png" alt="Tip Root Logo" width="120" height="120" className="object-contain brightness-0 invert" />
          <div className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#fbabff] to-[#d0bcff] text-5xl tracking-tight">
            Tip Root
          </div>
        </div>

        <div className="flex gap-6 items-center">
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#571bc1]/10 to-[#fbabff]/10 blur-[140px] rounded-full pointer-events-none"></div>

        <div className="max-w-3xl space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#fbabff]/20 bg-[#fbabff]/5 text-xs font-medium text-[#fbabff]">
            Zero-Fee Streamer Support
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbabff] to-[#d0bcff]">
              Tip Root
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-[#9f8b9d] text-lg md:text-xl leading-relaxed">
            The fastest, most secure way to support your favorite creators directly via UPI. No hidden platform fees. No corporate middlemen. Just pure, direct support.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-[#fbabff] to-[#d0bcff] text-[#09090B] font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(251,171,255,0.3)] hover:shadow-[0_0_30px_rgba(251,171,255,0.5)]"
            >
              Join the Platform
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-12 text-sm text-[#9f8b9d] border-t border-[#fbabff]/10 relative z-10 max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>&copy; 2026 Tip Root. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
        </div>
      </footer>
    </div>
  );
}