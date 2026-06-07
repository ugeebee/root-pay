'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { HeartHandshake } from 'lucide-react';

interface TipAlert {
  client_key: string;
  name: string;
  amount: number;
  message: string;
}

function OverlayEngine() {
  const searchParams = useSearchParams();
  const streamerId = searchParams.get('streamer_id');

  const [queue, setQueue] = useState<TipAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<TipAlert | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 1. Connect to the Go OBS Engine
  useEffect(() => {
    if (!streamerId) return;

    // Connect to Port 8083 (The OBS Engine)
    const eventSource = new EventSource(`/api/overlay/stream?streamer_id=${streamerId}`);

    eventSource.onmessage = (event) => {
      try {
        const newTip = JSON.parse(event.data);
        // Add incoming tips to the queue
        setQueue((prev) => [...prev, newTip]);
      } catch (err) {
        console.error('Failed to parse overlay event:', err);
      }
    };

    return () => eventSource.close();
  }, [streamerId]);

  // 2. The Queue Manager (Plays animations sequentially)
  useEffect(() => {
    if (queue.length > 0 && !currentAlert) {
      // Pull the first tip from the queue
      const nextTip = queue[0];
      setCurrentAlert(nextTip);
      setIsVisible(true);

      // Remove it from the queue
      setQueue((prev) => prev.slice(1));

      // Hide the alert after 5 seconds, wait 1 second, then process the next
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentAlert(null);
        }, 1000); // 1s cooldown between alerts
      }, 5000); // 5s display time
    }
  }, [queue, currentAlert]);

  if (!streamerId) {
    return <div className="text-white p-4 font-mono">⚠️ Missing streamer_id parameter</div>;
  }

  return (
    // The background must be completely transparent for OBS
    <div className="w-screen h-screen overflow-hidden flex items-center justify-center bg-transparent font-sans">
      
      {/* The Alert Box */}
      <div 
        className={`
          flex flex-col items-center justify-center text-center max-w-xl
          transition-all duration-700 ease-in-out transform
          ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}
        `}
      >
        {currentAlert && (
          <>
            {/* Pulsing Icon */}
            <div className="w-24 h-24 bg-gradient-to-tr from-[#6D28D9] to-[#9333EA] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(109,40,217,0.6)] mb-6 animate-pulse">
              <HeartHandshake size={48} className="text-white" />
            </div>

            {/* Title */}
            <h1 className="text-5xl font-extrabold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-2 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {currentAlert.name}
              </span> 
              {' '}tipped ₹{currentAlert.amount}!
            </h1>

            {/* Message */}
            {currentAlert.message && (
              <div className="mt-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
                <p className="text-2xl text-gray-100 font-medium leading-relaxed drop-shadow-md">
                  "{currentAlert.message}"
                </p>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

export default function OverlayPage() {
  return (
    <Suspense fallback={<div className="bg-transparent w-screen h-screen"></div>}>
      <OverlayEngine />
    </Suspense>
  );
}