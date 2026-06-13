'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface TipAlert {
  client_key: string;
  name: string;
  amount: number;
  message: string;
}

const BASE_RETRY_MS = 1_000;   // 1 s initial backoff
const MAX_RETRY_MS  = 30_000;  // 30 s cap
const DISPLAY_MS    = 5_000;   // alert on-screen duration
const EXIT_MS       = 700;     // fade-out duration (must match CSS transition)

function OverlayEngine() {
  const searchParams  = useSearchParams();
  const token         = searchParams.get('token');
  const streamerID    = searchParams.get('streamer_id');

  const [queue, setQueue]           = useState<TipAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<TipAlert | null>(null);
  const [isVisible, setIsVisible]   = useState(false);

  // Tracks retry delay across reconnect attempts without triggering renders.
  const retryDelayRef  = useRef(BASE_RETRY_MS);
  // Lets the cleanup function cancel a scheduled retry when the component unmounts.
  const retryTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── 1. SSE connection with exponential-backoff reconnect ───────────────────
  const connectToStream = useCallback(() => {
    if (!token || !streamerID) return;

    const abortController = new AbortController();

    const run = async () => {
      try {
        const response = await fetch(
          `https://api.ugbhartariya.com/api/overlay/stream?streamer_id=${streamerID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          // 401 / 403: credentials are wrong — don't retry, it won't help.
          if (response.status === 401 || response.status === 403) {
            console.error('[Overlay] Auth failed, will not retry.');
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        // Connected successfully — reset backoff.
        retryDelayRef.current = BASE_RETRY_MS;

        const reader  = response.body?.getReader();
        const decoder = new TextDecoder();
        let   buffer  = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const messages = buffer.split('\n\n');
            buffer = messages.pop() ?? '';

            for (const msg of messages) {
              if (msg.startsWith('data: ')) {
                try {
                  const newTip: TipAlert = JSON.parse(msg.substring(6));
                  setQueue((prev) => [...prev, newTip]);
                } catch {
                  // Malformed JSON — skip silently.
                }
              }
              // Heartbeat lines (": heartbeat") are ignored automatically.
            }
          }
        }

        // Stream ended cleanly (server closed). Fall through to retry.
        console.warn('[Overlay] Stream ended, scheduling reconnect…');

      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Intentional teardown — no retry.
          return;
        }
        console.error('[Overlay] Stream error:', err);
      }

      // ── Schedule retry with exponential backoff ──────────────────────────
      const delay = retryDelayRef.current;
      console.info(`[Overlay] Reconnecting in ${delay}ms…`);
      retryTimerRef.current = setTimeout(() => {
        // Double the delay, but cap at MAX_RETRY_MS.
        retryDelayRef.current = Math.min(delay * 2, MAX_RETRY_MS);
        run(); // re-enter the same async function (new fetch, same AbortController)
      }, delay);
    };

    run();

    // Cleanup: abort the in-flight fetch and cancel any pending retry.
    return () => {
      abortController.abort();
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [token, streamerID]);

  useEffect(() => {
    const cleanup = connectToStream();
    return () => cleanup?.();
  }, [connectToStream]);

  // ─── 2. Sequential queue manager ────────────────────────────────────────────
  useEffect(() => {
    if (queue.length === 0 || currentAlert) return;

    const [nextTip, ...rest] = queue;
    setQueue(rest);
    setCurrentAlert(nextTip);
    setIsVisible(true);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      const clearTimer = setTimeout(() => setCurrentAlert(null), EXIT_MS);
      return () => clearTimeout(clearTimer);
    }, DISPLAY_MS);

    return () => clearTimeout(hideTimer);
  }, [queue, currentAlert]);

  if (!token || !streamerID) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent">
        <p className="text-white text-xl opacity-50">Missing Parameters</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-transparent">
      <div
        style={{ transition: `opacity ${EXIT_MS}ms ease` }}
        className={isVisible ? 'opacity-100' : 'opacity-0'}
      >
        {currentAlert && (
          <div className="text-center">
            <h1 className="text-5xl text-white font-bold drop-shadow-lg">
              {currentAlert.name} tipped ₹{currentAlert.amount}!
            </h1>
            {currentAlert.message && (
              <p className="text-2xl text-gray-100 mt-4 drop-shadow">
                &ldquo;{currentAlert.message}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OverlayPage() {
  return (
    <Suspense>
      <OverlayEngine />
    </Suspense>
  );
}