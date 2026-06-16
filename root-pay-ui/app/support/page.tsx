'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LifeBuoy, Hash, MessageSquare, CheckCircle2, ArrowLeft, Clock, AlertCircle } from 'lucide-react';

interface Transaction {
  clientKey: string;
  supportKey?: string;
  message: string;
  date: string;
}

function SupportEngine() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supportKeyParam = searchParams.get('support_key');

  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form State
  const [upiId, setUpiId] = useState('');
  const [issue, setIssue] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');

  // Load history from local storage only on the client side to avoid hydration errors
  useEffect(() => {
    const localData = localStorage.getItem('rootpay_history');
    if (localData) {
      try {
        setHistory(JSON.parse(localData));
      } catch (e) {
        console.error("Failed to parse local history");
      }
    }
    setIsLoaded(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportKeyParam || !issue || !upiId) {
      setErrorMsg('UPI ID and Issue description are required.');
      setStatus('ERROR');
      return;
    }

    setStatus('LOADING');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ support_key: supportKeyParam, upi_id: upiId, issue }),
      });

      if (!res.ok) throw new Error('Failed to send support ticket. Please try again.');
      
      setStatus('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred.');
      setStatus('ERROR');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-gray-900 pb-20">
      {/* Basic Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <ArrowLeft size={20} className="text-gray-500" />
          <div className="text-xl font-bold tracking-tight text-[#6D28D9]">Tip Root</div>
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] relative">
          
          {/* STATE 1: THE HISTORY LEDGER */}
          {!supportKeyParam && isLoaded && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                <div className="w-12 h-12 bg-purple-50 text-[#6D28D9] rounded-xl flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Your Recent Transactions</h1>
                  <p className="text-gray-500 text-sm mt-1">Select a transaction from the last 30 days to report an issue.</p>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <AlertCircle size={32} className="text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">No transactions found on this device.</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-sm">History is stored locally in your browser. Make sure you are using the same device and browser you used to make the payment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Date & Time</th>
                        <th className="px-6 py-4 font-semibold">Transaction ID</th>
                        <th className="px-6 py-4 font-semibold w-full">Message Sent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.map((tx, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => router.push(`/support?support_key=${tx.supportKey}`)}
                          className="hover:bg-purple-50 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 text-gray-600">{formatDate(tx.date)}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-800 group-hover:text-[#6D28D9] transition-colors">
                            {tx.supportKey}...
                          </td>
                          <td className="px-6 py-4 text-gray-500 truncate max-w-[300px]">
                            {tx.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: THE SUPPORT TICKET FORM */}
          {supportKeyParam && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => router.push('/support')} 
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
              >
                <ArrowLeft size={16} /> Back to History
              </button>

              <div className="flex flex-col items-center mb-8 text-center">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                  <LifeBuoy size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
                <p className="text-gray-500 mt-2 text-sm max-w-md">
                  Provide your UPI ID so our moderators can process manual refunds if necessary.
                </p>
              </div>

              {status === 'SUCCESS' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <CheckCircle2 size={56} className="text-emerald-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ticket Submitted Successfully</h3>
                  <p className="text-gray-600 mb-6 max-w-sm">Our moderation team has received your ticket and will investigate the transaction shortly.</p>
                  <Link href="/" className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-colors shadow-sm">
                    Return to Stream
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                  {status === 'ERROR' && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
                      <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                      <p>{errorMsg}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={supportKeyParam} 
                        disabled 
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-gray-500 font-mono cursor-not-allowed" 
                      />
                      <Hash className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your UPI ID (For Refunds)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={upiId} 
                        onChange={(e) => setUpiId(e.target.value)} 
                        placeholder="e.g. username@okhdfcbank" 
                        required
                        className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent transition-shadow" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Describe the Issue</label>
                    <div className="relative">
                      <textarea 
                        value={issue} 
                        onChange={(e) => setIssue(e.target.value)} 
                        rows={4} 
                        required
                        placeholder="e.g. The money left my account but the alert didn't show on stream..." 
                        className="w-full bg-white border border-gray-300 rounded-xl py-3.5 pl-11 pr-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent transition-shadow" 
                      />
                      <MessageSquare className="absolute left-4 top-4 text-gray-400" size={18} />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={status === 'LOADING'} 
                    className="w-full bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-semibold py-4 rounded-xl transition-all shadow-md shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {status === 'LOADING' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : 'Submit Support Ticket'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Next.js requires useSearchParams to be wrapped in a Suspense boundary for static generation
export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-[#6D28D9] rounded-full animate-spin"></div>
      </div>
    }>
      <SupportEngine />
    </Suspense>
  );
}