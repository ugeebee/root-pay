'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ClaimAccountPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('https://adminroot.ugbhartariya.com/api/auth/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Extremely important so it sends the pending cookie
                body: JSON.stringify({ master_password: password }),
            });

            if (res.ok) {
                // Master password was correct, account is created, JWTs are in cookies!
                window.location.href = 'https://adminroot.ugbhartariya.com/dashboard';
            } else {
                const text = await res.text();
                setError(text || 'Incorrect master password');
            }
        } catch (err) {
            setError('Network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#09090B] text-[#e5e1e4] flex flex-col min-h-screen font-sans overflow-hidden">
            <header className="fixed top-0 left-0 w-full z-50 bg-transparent flex justify-between items-center px-12 py-6 max-w-[1280px] mx-auto">
                <div className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#fbabff] to-[#d0bcff] text-2xl">
                    Tip Root
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center px-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fbabff]/20 blur-[120px] rounded-full pointer-events-none opacity-40"></div>

                <div className="backdrop-blur-xl border border-white/10 bg-white/5 w-full max-w-[400px] p-12 rounded-xl z-10 shadow-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold mb-2">Claim Your Account</h1>
                        <p className="text-[#9f8b9d] text-sm">
                            Your Discord was verified! Enter the invite-only master password to finalize setup.
                        </p>
                    </div>

                    <form onSubmit={handleClaim} className="space-y-6">
                        <div>
                            <input
                                type="password"
                                placeholder="Enter Master Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl bg-[#09090B]/60 border border-[#fbabff]/20 text-white placeholder:text-[#9f8b9d]/50 focus:outline-none focus:border-[#fbabff]/60 focus:ring-1 focus:ring-[#fbabff]/60 transition-all shadow-inner"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-lg text-white font-bold bg-gradient-to-br from-[#fbabff] to-[#571bc1] hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_30px_rgba(251,171,255,0.3)] transition-all duration-150 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? 'Verifying...' : 'Unlock Account'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}