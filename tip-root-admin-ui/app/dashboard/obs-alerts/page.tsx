'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Activity, IndianRupee } from 'lucide-react';

// Define the tip structure based on your Go models
interface TipEvent {
    client_key: string;
    streamer_id: string;
    name: string;
    amount: number;
    message: string;
    is_nsfw: boolean;
    timestamp: string;
}

export default function ObsAlertsPage() {
    const [tips, setTips] = useState<TipEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to the dashbUpdates microservice SSE stream
        const eventSource = new EventSource('https://streamer.tip-root.in/api/dashboard/updates/stream', {
            withCredentials: true
        });

        eventSource.onopen = () => setIsConnected(true);

        eventSource.onerror = () => {
            console.error("SSE Connection lost. Reconnecting...");
            setIsConnected(false);
        };

        eventSource.onmessage = (event) => {
            const newTip: TipEvent = JSON.parse(event.data);
            // Add new tips to the TOP of the feed
            setTips((prevTips) => [newTip, ...prevTips]);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const handleApprove = async (clientKey: string) => {
        try {
            const res = await fetch('https://streamer.tip-root.in/api/dashboard/tips/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ client_key: clientKey })
            });

            if (res.ok) {
                // Update the UI to show it's no longer NSFW
                setTips((prev) => prev.map(tip =>
                    tip.client_key === clientKey ? { ...tip, is_nsfw: false } : tip
                ));
            }
        } catch (error) {
            console.error("Failed to approve tip:", error);
        }
    };

    const handleDismiss = (clientKey: string) => {
        // Simply remove it from the dashboard view
        setTips((prev) => prev.filter(t => t.client_key !== clientKey));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
            {/* Page Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">OBS Alerts & Activity</h1>
                    <p className="text-[#9f8b9d]">
                        Monitor your live stream tips. Flagged messages require manual approval before appearing on stream.
                    </p>
                </div>
                {/* Live Status Indicator */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                    <span className="relative flex h-3 w-3">
                        {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-sm font-semibold text-white">
                        {isConnected ? 'Stream Connected' : 'Reconnecting...'}
                    </span>
                </div>
            </header>

            {/* Main Feed Card */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#fbabff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                {tips.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20 text-center relative z-10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                            <Activity className="text-[#9f8b9d] w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Listening for Tips...</h3>
                        <p className="text-[#9f8b9d] max-w-sm">
                            When viewers send support, it will appear here instantly.
                        </p>
                    </div>
                ) : (
                    // Scrollable Feed
                    <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 relative z-10 custom-scrollbar">
                        {tips.map((tip) => (
                            <div
                                key={tip.client_key}
                                className={`rounded-xl p-5 border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${tip.is_nsfw
                                        ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                        : 'bg-black/20 border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {/* Left Side: Tip Info */}
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-lg ${tip.is_nsfw ? 'bg-red-500/20 text-red-400' : 'bg-gradient-to-br from-[#fbabff] to-[#571bc1] text-white shadow-[0_0_10px_rgba(87,27,193,0.3)]'
                                        }`}>
                                        {tip.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-white font-bold text-lg">{tip.name}</h4>
                                            <span className="text-[#fbabff] font-bold flex items-center bg-[#fbabff]/10 px-2 py-0.5 rounded text-sm">
                                                <IndianRupee size={14} className="mr-0.5" /> {tip.amount}
                                            </span>
                                            {tip.is_nsfw && (
                                                <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded uppercase tracking-wider ml-2">
                                                    <ShieldAlert size={12} /> Flagged
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[#9f8b9d] text-sm break-words max-w-2xl">
                                            "{tip.message}"
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side: Actions (Only show if NSFW) */}
                                {tip.is_nsfw && (
                                    <div className="flex items-center gap-3 shrink-0">
                                        <button
                                            onClick={() => handleApprove(tip.client_key)}
                                            className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-4 py-2.5 rounded-lg transition-colors font-semibold text-sm border border-emerald-500/20"
                                        >
                                            <CheckCircle size={16} /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleDismiss(tip.client_key)}
                                            className="flex items-center gap-2 bg-white/5 text-[#9f8b9d] hover:bg-white/10 hover:text-white px-4 py-2.5 rounded-lg transition-colors font-semibold text-sm border border-white/5"
                                        >
                                            <XCircle size={16} /> Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}