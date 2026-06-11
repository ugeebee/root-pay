'use client';

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      "name": formData.get("name"),
      "phone_number": formData.get("phone"),
      "email address": formData.get("email"),
      "streaming channel link": formData.get("channel"),
      "Your message": formData.get("message"),
      "time_created": new Date().toISOString()
    };

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setIsSubmitted(true);
      form.reset();
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#09090B] text-[#e5e1e4] flex flex-col min-h-screen font-sans overflow-hidden">
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 py-12">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-r from-[#571bc1]/20 to-[#fbabff]/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-lg w-full space-y-8 bg-[#fbabff]/[0.03] border border-[#fbabff]/10 p-6 md:p-10 rounded-3xl backdrop-blur-xl relative shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Contact Us</h1>
            <p className="text-[#9f8b9d] text-lg">Would like us to set it up for you? Fill your details and we will contact you.</p>
          </div>

          <div className="flex flex-col gap-3 py-5 border-y border-[#fbabff]/10">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
              <span className="text-[#9f8b9d]">General Support:</span>
              <a href="mailto:support@tip-root.in" className="text-[#fbabff] hover:text-white font-medium transition-colors">support@tip-root.in</a>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
              <span className="text-[#9f8b9d]">Setup Assistance:</span>
              <a href="mailto:setup@tip-root.in" className="text-[#fbabff] hover:text-white font-medium transition-colors">setup@tip-root.in</a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[#d0bcff] ml-1">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#09090B]/60 border border-[#fbabff]/20 text-white placeholder:text-[#9f8b9d]/50 focus:outline-none focus:border-[#fbabff]/60 focus:ring-1 focus:ring-[#fbabff]/60 transition-all shadow-inner"
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#d0bcff] ml-1">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#09090B]/60 border border-[#fbabff]/20 text-white placeholder:text-[#9f8b9d]/50 focus:outline-none focus:border-[#fbabff]/60 focus:ring-1 focus:ring-[#fbabff]/60 transition-all shadow-inner"
                placeholder="hello@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-[#d0bcff] ml-1">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#09090B]/60 border border-[#fbabff]/20 text-white placeholder:text-[#9f8b9d]/50 focus:outline-none focus:border-[#fbabff]/60 focus:ring-1 focus:ring-[#fbabff]/60 transition-all shadow-inner"
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="channel" className="text-sm font-medium text-[#d0bcff] ml-1">Social Media links</label>
              <input
                type="text"
                id="channel"
                name="channel"
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#09090B]/60 border border-[#fbabff]/20 text-white placeholder:text-[#9f8b9d]/50 focus:outline-none focus:border-[#fbabff]/60 focus:ring-1 focus:ring-[#fbabff]/60 transition-all shadow-inner"
                placeholder="Youtube: , Twitch: , Instagram: ..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-[#d0bcff] ml-1">Your Message</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#09090B]/60 border border-[#fbabff]/20 text-white placeholder:text-[#9f8b9d]/50 focus:outline-none focus:border-[#fbabff]/60 focus:ring-1 focus:ring-[#fbabff]/60 transition-all shadow-inner resize-none"
                placeholder="How can we help you today?"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 mt-2 rounded-2xl text-white font-bold bg-gradient-to-r from-[#fbabff] to-[#571bc1] hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(251,171,255,0.4)] transition-all duration-300 shadow-lg text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                "Sending..."
              ) : isSubmitted ? (
                <>
                  <svg className="w-6 h-6 animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Message Sent!
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 md:px-12 text-sm text-[#9f8b9d] border-t border-[#fbabff]/10 relative z-10 max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
        <p>&copy; 2026 Tip Root. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of Condition</Link>
        </div>
      </footer>
    </div>
  );
}
