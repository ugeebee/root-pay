'use client';

import { useState, useEffect } from 'react';
import { Camera, Eye, EyeOff, Copy, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRotating, setIsRotating] = useState(false);

    // Form States
    const [displayName, setDisplayName] = useState('');
    const [upiId, setUpiId] = useState('');
    const [supportTitle, setSupportTitle] = useState('');
    const [supportTotal, setSupportTotal] = useState<number | string>('');
    const [supportCompleted, setSupportCompleted] = useState<number | string>('');

    // Token States
    const [overlayToken, setOverlayToken] = useState('••••••••••••••••');
    const [showToken, setShowToken] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Fetch Initial Data on Mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch Profile Data
                const settingsRes = await fetch('https://streamer.tip-root.in/api/dashboard/settings', {
                    credentials: 'include'
                });
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    setDisplayName(data.display_name);
                    setUpiId(data.upi_id);
                    setSupportTitle(data.support_title);
                    setSupportTotal(data.support_total);
                    setSupportCompleted(data.support_completed);
                }

                // Fetch Secure Token
                const tokenRes = await fetch('https://streamer.tip-root.in/api/dashboard/token', {
                    credentials: 'include'
                });
                if (tokenRes.ok) {
                    const tokenData = await tokenRes.json();
                    setOverlayToken(tokenData.overlay_token);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('https://streamer.tip-root.in/api/dashboard/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    display_name: displayName,
                    upi_id: upiId,
                    support_title: supportTitle,
                    support_total: Number(supportTotal),
                    support_completed: Number(supportCompleted)
                })
            });
            if (!res.ok) throw new Error("Failed to save");
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRotateToken = async () => {
        if (!confirm("Are you sure? This will break your existing OBS browser sources immediately.")) return;

        setIsRotating(true);
        try {
            const res = await fetch('https://streamer.tip-root.in/api/dashboard/token/rotate', {
                method: 'POST',
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setOverlayToken(data.overlay_token);
                alert("Token rotated successfully! Please update OBS.");
            }
        } catch (error) {
            console.error("Error rotating token:", error);
            alert("Failed to rotate token.");
        } finally {
            setIsRotating(false);
        }
    };

    const handleCopyToken = () => {
        navigator.clipboard.writeText(overlayToken);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-[#fbabff] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-[#9f8b9d]">
                    Configure your profile, payment gateways, and security integrations for your live stream.
                </p>
            </header>

            {/* Card 1: Profile & Goals */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#fbabff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="mb-8 relative z-10">
                    <h2 className="text-xl font-bold text-white">Profile & Goals</h2>
                    <p className="text-sm text-[#9f8b9d] mt-1">Update your public appearance and financial targets.</p>
                </div>

                <div className="space-y-8 relative z-10">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                        <div className="relative group/avatar cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#fbabff] to-[#571bc1] flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_20px_rgba(87,27,193,0.3)]">
                                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-white mb-1">Your Avatar</p>
                            <p className="text-sm text-[#9f8b9d] mb-3">JPG, GIF or PNG. Max size 2MB.</p>
                            <button className="px-4 py-2 border border-white/10 rounded-lg text-sm font-semibold hover:bg-white/5 text-white transition-colors">
                                Change Photo
                            </button>
                        </div>
                    </div>

                    {/* Identity Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold tracking-wider uppercase text-[#9f8b9d]">Web Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g. ProStreamer99"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#fbabff]/50 focus:ring-1 focus:ring-[#fbabff]/50 transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold tracking-wider uppercase text-[#9f8b9d]">UPI ID</label>
                            <input
                                type="text"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="yourname@upi"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#fbabff]/50 focus:ring-1 focus:ring-[#fbabff]/50 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Goal Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold tracking-wider uppercase text-[#9f8b9d]">Goal Title</label>
                            <input
                                type="text"
                                value={supportTitle}
                                onChange={(e) => setSupportTitle(e.target.value)}
                                placeholder="New PC Build"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#fbabff]/50 focus:ring-1 focus:ring-[#fbabff]/50 transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold tracking-wider uppercase text-[#9f8b9d]">Goal Target (₹)</label>
                            <input
                                type="number"
                                value={supportTotal}
                                onChange={(e) => setSupportTotal(e.target.value)}
                                placeholder="50000"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#fbabff]/50 focus:ring-1 focus:ring-[#fbabff]/50 transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold tracking-wider uppercase text-[#9f8b9d]">Amount Raised (₹)</label>
                            <input
                                type="number"
                                value={supportCompleted}
                                onChange={(e) => setSupportCompleted(e.target.value)}
                                placeholder="0"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#fbabff]/50 focus:ring-1 focus:ring-[#fbabff]/50 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSaveSettings}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-[#fbabff] to-[#571bc1] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(87,27,193,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </section>

            {/* Card 2: Security & Integrations */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md relative group overflow-hidden">
                <div className="mb-8 relative z-10">
                    <h2 className="text-xl font-bold text-white">Security & Integrations</h2>
                    <p className="text-sm text-[#9f8b9d] mt-1">Manage your API tokens and third-party streaming connections.</p>
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                    {/* Token Field */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold tracking-wider uppercase text-[#9f8b9d]">Overlay Token</label>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <input
                                    type={showToken ? "text" : "password"}
                                    value={overlayToken}
                                    readOnly
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[#9f8b9d] cursor-not-allowed font-mono selection:bg-[#fbabff]/30"
                                />
                                <button
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9f8b9d] hover:text-white transition-colors"
                                >
                                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <button
                                onClick={handleCopyToken}
                                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95 group text-[#9f8b9d] flex items-center justify-center min-w-[56px]"
                            >
                                {isCopied ? <span className="text-[#fbabff] text-sm font-bold">Copied</span> : <Copy size={20} className="group-hover:text-[#fbabff] transition-colors" />}
                            </button>
                        </div>
                        <p className="text-xs text-[#9f8b9d]/80 mt-1">
                            Never share this token with anyone. It gives full access to your stream overlay widgets.
                        </p>
                    </div>

                    {/* Destructive Action */}
                    <div className="pt-6 mt-2 flex items-center justify-between border-t border-white/5">
                        <div>
                            <p className="font-semibold text-red-400 mb-1">Danger Zone</p>
                            <p className="text-sm text-[#9f8b9d]">Rotating your token will break existing OBS sources until updated.</p>
                        </div>
                        <button
                            onClick={handleRotateToken}
                            disabled={isRotating}
                            className="px-6 py-3 border border-red-500/30 text-red-400 rounded-xl font-bold hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isRotating && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isRotating ? "Rotating..." : "Rotate Token"}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}