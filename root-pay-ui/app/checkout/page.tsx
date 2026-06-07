'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

function CheckoutGateway() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientKey = searchParams.get('client_key');

  const [paymentData, setPaymentData] = useState<{ upiDeeplink: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'ERROR'>('PENDING');

  // 1. UPDATED PORT: Pointing to 8082 where your SSE microservice is running
  const BACKEND_URL = 'http://localhost:8082/api';

  useEffect(() => {
    if (!clientKey) {
      setPaymentStatus('ERROR');
      return;
    }

    const sessionData = sessionStorage.getItem('rootpay_gateway');
    if (!sessionData) {
      setPaymentStatus('ERROR');
      return;
    }

    const parsedData = JSON.parse(sessionData);
    setPaymentData(parsedData);
  }, [clientKey]);

  useEffect(() => {
    if (!paymentData || paymentStatus !== 'PENDING' || !clientKey) return;

    console.log(`📡 Opening SSE channel for client_key: ${clientKey}`);
    
    // 2. CONNECTION URL
    // This resolves to http://localhost:8082/api/tips/stream?client_key=...
    // If your backend still has the "v1" prefix, change this to: `${BACKEND_URL}/v1/tips/stream?client_key=${clientKey}`
    const eventSource = new EventSource(`${BACKEND_URL}/tips/stream?client_key=${clientKey}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'PAID') {
          setPaymentStatus('PAID');
          sessionStorage.removeItem('rootpay_gateway'); 
          eventSource.close(); 
        }
      } catch (err) {
        console.error('SSE parsing error:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection failed:', err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [paymentData, paymentStatus, clientKey]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] font-sans text-gray-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.1)] text-center min-h-[400px] flex flex-col items-center justify-center relative">
        
        {paymentStatus !== 'PAID' && (
          <button 
            onClick={() => router.back()} 
            className="absolute top-6 left-6 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {paymentStatus === 'PENDING' && paymentData && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
            <h2 className="text-xl font-bold mb-6">Scan to Pay</h2>
            <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm mb-6">
              <QRCodeSVG value={paymentData.upiDeeplink} size={220} level="M" />
            </div>
            
            <a href={paymentData.upiDeeplink} className="w-full bg-black text-white font-semibold py-3.5 rounded-xl flex items-center justify-center mb-6 hover:bg-gray-800 transition-colors md:hidden">
              Pay via UPI App
            </a>

            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-2 h-2 rounded-full bg-[#6D28D9] animate-ping"></div>
              <span className="text-sm font-medium">Waiting for ledger verification...</span>
            </div>
            <p className="text-xs text-gray-400 mt-4 break-all">ID: {clientKey}</p>
          </div>
        )}

        {paymentStatus === 'PAID' && (
          <div className="w-full flex flex-col items-center text-center animate-in zoom-in duration-300">
            <CheckCircle2 size={72} className="text-emerald-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Verified</h3>
            <p className="text-gray-500 mb-8">Your tip is securely routed to the stream overlay.</p>
            <button onClick={() => router.push('/')} className="w-full bg-gray-100 text-gray-900 font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
              Send Another Tip
            </button>
          </div>
        )}

        {paymentStatus === 'ERROR' && (
          <div className="w-full flex flex-col items-center text-center animate-in fade-in duration-300">
            <AlertCircle size={64} className="text-red-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Invalid Session</h3>
            <p className="text-gray-500 px-4">We could not load this payment gateway. The session may have expired or the key is invalid.</p>
            <button onClick={() => router.push('/')} className="mt-8 px-6 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D28D9]"></div></div>}>
      <CheckoutGateway />
    </Suspense>
  );
}