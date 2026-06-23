'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeartHandshake, User, Zap, CircleUserRound, MonitorOff, LifeBuoy } from 'lucide-react';

interface StreamerData {
  streamerID: string;
  streamer_tag: string;
  support: {
    title: string;
    total: number;
    completed: number;
  };
  live_link: string;
  min_tip_amount: number;
}

function TipsEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const streamerIDParam = searchParams.get('streamerid');

  const [streamerData, setStreamerData] = useState<StreamerData | null>(null);
  const [isLoadingStreamer, setIsLoadingStreamer] = useState(true);
  const [serverError, setServerError] = useState(false);

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [idempotencyKey, setIdempotencyKey] = useState('');
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  const presetAmounts = [50, 100, 250, 500, 1000];
  const BACKEND_URL = '/api';

    useEffect(() => {
    async function fetchStreamerData() {
      if (!streamerIDParam) {
        setIsLoadingStreamer(false);
        setError("No streamer ID provided in URL.");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/streamer?streamerID=${streamerIDParam}`);
        if (!res.ok) throw new Error("Failed to fetch streamer data.");

        const data = await res.json();
        setStreamerData(data);
      } catch (err) {
        console.error(err);
        setServerError(true);
      } finally {
        setIsLoadingStreamer(false);
      }
    }

    fetchStreamerData();
  }, [streamerIDParam]);

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleInitializePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = selectedAmount || parseFloat(customAmount);

    if (!name || !finalAmount) {
      setError('Name and Amount are required.');
      return;
    }

    const minimumAllowed = streamerData?.min_tip_amount || 40;
    if (finalAmount < minimumAllowed) {
      setError(`The minimum support amount is ₹${minimumAllowed}.`);
      return;
    }

    if (!streamerData?.streamerID || !idempotencyKey) {
      setError('Streamer data is missing or session is initializing. Please wait.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamer_id: streamerData.streamerID,
          request_id: idempotencyKey, // Send the Idempotency Key
          name,
          message,
          amount: finalAmount,
        }),
      });

      if (!res.ok) throw new Error(await res.text() || 'Failed to initialize gateway.');

      const data = await res.json();

      // Extract BOTH keys from the backend response
      const secureServerKey = data.client_key;
      const supportKey = data.support_key; 

      if (data.is_paid) {
        setError('This session is stale. Please try again.');
        return;
      }

      sessionStorage.setItem('rootpay_gateway', JSON.stringify({
        upiDeeplink: data.upi_deeplink,
      }));

      try {
        const newTip = {
          clientKey: secureServerKey, 
          supportKey: supportKey, // Save Support Key to local history
          message: message || 'No message provided',
          date: new Date().toISOString()
        };

        const existingHistory = JSON.parse(localStorage.getItem('rootpay_history') || '[]');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const filteredHistory = existingHistory.filter((t: any) => new Date(t.date) > thirtyDaysAgo);

        localStorage.setItem('rootpay_history', JSON.stringify([newTip, ...filteredHistory]));
      } catch (storageError) {
        console.error("Failed to save transaction history locally", storageError);
      }

      // Route to checkout passing BOTH keys in the URL
      router.push(`/checkout?client_key=${secureServerKey}&support_key=${supportKey}`);

    } catch (err: any) {
      setError(err.message || 'Could not connect to Go backend.');
      setLoading(false);
    }
  };

  const isLive = streamerData?.live_link && streamerData.live_link.trim() !== '';

  if (serverError) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="text-xl font-bold text-red-600">unexpected error occured</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-gray-900">
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold tracking-tight text-[#6D28D9]">
            {isLoadingStreamer ? 'Loading...' : streamerData?.streamer_tag || 'Unknown Streamer'}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/support" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <LifeBuoy size={18} /> Support
          </Link>

          <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400">
            <CircleUserRound size={20} />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Support Stats Box */}
          <div className="bg-white/60 rounded-2xl p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center h-[280px]">
            <div className="p-3 bg-gray-100 text-[#6D28D9] rounded-xl mb-4">
              <HeartHandshake size={28} />
            </div>

            {streamerData?.support ? (
              <div className="w-full">
                <h2 className="text-lg font-bold text-gray-800 mb-6">{streamerData.support.title}</h2>
                <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                  <span>₹{streamerData.support.completed} raised</span>
                  <span>₹{streamerData.support.total} goal</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#6D28D9] to-[#fbabff] h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (streamerData.support.completed / streamerData.support.total) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Support the Stream</h2>
                <p className="text-sm text-gray-500">Live goals will be displayed here.</p>
              </>
            )}
          </div>

          {/* Stream Overlay Box */}
          <div className="bg-[#0A0A0A] rounded-2xl overflow-hidden shadow-md relative group h-[240px] flex items-center justify-center border border-gray-900">
            {isLive ? (
              <>
                <iframe
                  src={streamerData.live_link}
                  height="100%"
                  width="100%"
                  allowFullScreen
                  className="absolute inset-0 z-0"
                ></iframe>
                <div className="absolute bottom-4 left-4 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5 z-10">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>LIVE
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-[#6D28D9]/10 to-transparent z-0"></div>
                <div className="flex flex-col items-center justify-center text-gray-600 z-10 space-y-3">
                  <MonitorOff size={32} className="opacity-40" />
                  <span className="text-xs font-bold tracking-widest uppercase opacity-60">Waiting for live...</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.1)] min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Send a Tip</h2>
              <div className="bg-purple-50 text-[#6D28D9] text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-100">Secure Transaction</div>
            </div>

            {error && <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{error}</div>}

            <form onSubmit={handleInitializePayment} className="space-y-6 flex-grow">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <div className="relative">
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <User className="absolute right-4 top-3 text-gray-400" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Amount</label>
                <div className="grid grid-cols-5 gap-3 mb-3">
                  {presetAmounts.map((amt) => (
                    <button key={amt} type="button" onClick={() => handlePresetClick(amt)} className={`py-2 border rounded-xl text-sm font-semibold transition-all ${selectedAmount === amt ? 'border-[#6D28D9] bg-purple-50 text-[#6D28D9]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>₹{amt}</button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 text-sm font-medium">₹</span>
                  <input type="number" placeholder="Custom Amount" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Message (Optional)</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Write something supportive..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
              </div>

              <button type="submit" disabled={loading || isLoadingStreamer} className="w-full mt-auto bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-200 disabled:opacity-70">
                {loading ? 'Initializing Engine...' : 'Initialize Payment'} <Zap size={18} fill="currentColor" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TipsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D28D9]"></div></div>}>
      <TipsEngine />
    </Suspense>
  );
}