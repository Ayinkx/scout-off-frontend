'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { locales } from '@/lib/locales';

type DetectedCode = { rawValue?: string };
type Detector = { detect: (source: HTMLVideoElement) => Promise<DetectedCode[]> };
type DetectorConstructor = new (options?: { formats?: string[] }) => Detector;

function getBarcodeDetector(): DetectorConstructor | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector ?? null;
}

function getPlayerPath(rawValue: string): string | null {
  try {
    const target = new URL(rawValue);
    if (target.origin !== window.location.origin) return null;
    const match = target.pathname.match(/^\/([^/]+)\/player\/([A-Za-z0-9_-]+)\/?$/);
    if (!match || !locales.includes(match[1])) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

export default function PlayerQRScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let frame = 0;

    async function start() {
      const DetectorClass = getBarcodeDetector();
      if (!DetectorClass) {
        setUnsupported(true);
        setMessage('QR scanning is not supported by this browser. Open the player profile link directly or use a browser with Barcode Detection support.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setUnsupported(true);
        setMessage('This browser cannot access a camera. Try a secure HTTPS connection or open the profile link directly.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        const detector = new DetectorClass({ formats: ['qr_code'] });

        const scan = async () => {
          if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
            if (!cancelled) frame = requestAnimationFrame(scan);
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            const rawValue = codes.find((code) => code.rawValue)?.rawValue;
            if (rawValue) {
              const path = getPlayerPath(rawValue);
              if (path) {
                cancelled = true;
                stream?.getTracks().forEach((track) => track.stop());
                setOpen(false);
                router.push(path);
                return;
              }
              setMessage('That QR code is not a valid ScoutOff player profile link. Try another code.');
            }
          } catch {
            // A frame can fail to decode while the camera is moving; continue scanning.
          }
          if (!cancelled) frame = requestAnimationFrame(scan);
        };
        frame = requestAnimationFrame(scan);
      } catch (error) {
        const denied = error instanceof DOMException && error.name === 'NotAllowedError';
        setMessage(denied
          ? 'Camera access was denied. Allow camera access in your browser settings and try again.'
          : 'Could not start the camera. Check that another app is not using it, then try again.');
      }
    }

    setMessage('');
    setUnsupported(false);
    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg border border-brand-green px-4 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-green hover:text-black"
      >
        Scan player QR
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-qr-title"
            className="w-full max-w-lg rounded-xl border border-gray-700 bg-brand-card p-5 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="player-qr-title" className="text-lg font-semibold">Scan player QR code</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close scanner" className="rounded px-2 py-1 text-gray-300 hover:text-white">✕</button>
            </div>
            <video ref={videoRef} muted playsInline className={unsupported ? 'hidden' : 'w-full rounded-lg bg-black'} />
            {message && <p role="status" className="mt-3 text-sm text-amber-300">{message}</p>}
            {!message && <p className="mt-3 text-sm text-gray-400">Point your camera at a ScoutOff player-profile QR code. Only same-site player links are opened.</p>}
            <button type="button" onClick={() => setOpen(false)} className="mt-4 w-full rounded-lg border border-gray-600 px-4 py-2 text-sm hover:border-gray-400">Close</button>
          </section>
        </div>
      )}
    </>
  );
}
