import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <div className="bg-[#09090B] text-[#e5e1e4] flex flex-col min-h-screen font-sans overflow-hidden selection:bg-[#fbabff]/30">
      {/* Header */}
      <header className="w-full z-50 bg-transparent flex justify-between items-center px-6 md:px-12 py-6 max-w-[1280px] mx-auto">
        <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <img src="/tipRootLogo.png" alt="Tip Root Logo" width="60" height="60" className="object-contain brightness-0 invert" />
          <div className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#fbabff] to-[#d0bcff] text-2xl md:text-3xl tracking-tight hidden sm:block">
            Tip Root
          </div>
        </Link>
        <Link href="/" className="text-[#9f8b9d] hover:text-white transition-colors font-medium">
          &larr; Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Glow Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[400px] bg-gradient-to-r from-[#571bc1]/10 to-[#fbabff]/10 blur-[140px] rounded-full pointer-events-none"></div>

        <article className="max-w-none relative backdrop-blur-xl bg-[#fbabff]/[0.02] p-8 md:p-12 rounded-3xl border border-[#fbabff]/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fbabff] to-[#d0bcff] mb-4">
            Disclaimer
          </h1>

          <p className="text-sm text-[#9f8b9d] mb-10">Last updated June 16, 2026</p>

          <section className="space-y-8 text-[#e5e1e4]/90 leading-relaxed text-base md:text-lg">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-8">WEBSITE DISCLAIMER</h2>
              <p className="mb-4">
                The information provided by Utkarsh Gopal Bhartariya (&apos;we&apos;, &apos;us&apos;, or &apos;our&apos;) on <a href="https://tip-root.in" className="text-[#fbabff] hover:underline">https://tip-root.in</a> (the &apos;Site&apos;) and our mobile application is for general informational purposes only. All information on the Site and our mobile application is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site or our mobile application. UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SITE OR OUR MOBILE APPLICATION OR RELIANCE ON ANY INFORMATION PROVIDED ON THE SITE AND OUR MOBILE APPLICATION. YOUR USE OF THE SITE AND OUR MOBILE APPLICATION AND YOUR RELIANCE ON ANY INFORMATION ON THE SITE AND OUR MOBILE APPLICATION IS SOLELY AT YOUR OWN RISK.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">EXTERNAL LINKS DISCLAIMER</h2>
              <p className="mb-4">
                The Site and our mobile application may contain (or you may be sent through the Site or our mobile application) links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us. WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR THE ACCURACY OR RELIABILITY OF ANY INFORMATION OFFERED BY THIRD-PARTY WEBSITES LINKED THROUGH THE SITE OR ANY WEBSITE OR FEATURE LINKED IN ANY BANNER OR OTHER ADVERTISING. WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES.
              </p>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 md:px-12 text-sm text-[#9f8b9d] border-t border-[#fbabff]/10 relative z-10 max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
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
