'use client';

import { useState, useEffect } from 'react';
import { Download, IndianRupee, FileText, Loader2 } from 'lucide-react';

interface LedgerEntry {
    client_key: string;
    name: string;
    amount: number;
    message: string;
    created_at: string;
}

export default function LedgerPage() {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await fetch('https://streamer.tip-root.in/api/dashboard/ledger', {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    setEntries(data);
                }
            } catch (error) {
                console.error("Failed to fetch ledger:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLedger();
    }, []);

    // Calculate the total revenue for the current month
    const currentMonthTotal = entries.reduce((sum, tip) => sum + tip.amount, 0);
    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-[#fbabff] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Financial Ledger</h1>
                    <p className="text-[#9f8b9d]">
                        Review your transaction history and total earnings for {currentMonthName}.
                    </p>
                </div>

                {/* Stats & Export */}
                <div className="flex items-center gap-4">
                    <div className="bg-[#fbabff]/10 border border-[#fbabff]/20 px-6 py-3 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(251,171,255,0.1)]">
                        <IndianRupee className="text-[#fbabff]" size={20} />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#fbabff]/80">This Month</p>
                            <p className="text-xl font-bold text-white">₹{currentMonthTotal.toLocaleString()}</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-4 rounded-xl transition-colors font-semibold">
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </header>

            {/* Ledger Table Container */}
            <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-[#fbabff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center relative z-10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                            <FileText className="text-[#9f8b9d] w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No tips this month yet.</h3>
                        <p className="text-[#9f8b9d]">When viewers support your stream, the transactions will appear here.</p>
                    </div>
                ) : (
                    <div className="relative z-10">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-black/40 text-xs font-bold tracking-wider uppercase text-[#9f8b9d]">
                            <div className="col-span-3">Date</div>
                            <div className="col-span-2">Supporter</div>
                            <div className="col-span-5">Message</div>
                            <div className="col-span-2 text-right">Amount (₹)</div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                            {entries.map((entry, index) => (
                                <div
                                    key={entry.client_key}
                                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-white/5 ${index !== entries.length - 1 ? 'border-b border-white/5' : ''
                                        }`}
                                >
                                    <div className="col-span-3 text-sm text-[#9f8b9d] whitespace-nowrap">
                                        {entry.created_at}
                                    </div>
                                    <div className="col-span-2 font-semibold text-white truncate">
                                        {entry.name}
                                    </div>
                                    <div className="col-span-5 text-sm text-[#9f8b9d] truncate">
                                        {entry.message || <span className="italic opacity-50">No message provided</span>}
                                    </div>
                                    <div className="col-span-2 text-right font-bold text-[#fbabff]">
                                        ₹{entry.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}