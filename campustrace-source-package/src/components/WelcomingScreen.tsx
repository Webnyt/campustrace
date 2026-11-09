import React, { useState, useEffect, useRef } from 'react';
import { Package, MapPin, Bell, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface WelcomingScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const WelcomingScreen: React.FC<WelcomingScreenProps> = ({
  onComplete,
  durationMs = 5000,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(durationMs / 1000));
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef(false);

  const handleFinish = () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 700); // Allow smooth 700ms opacity & scale fade-out
  };

  useEffect(() => {
    startTimeRef.current = performance.now();

    const updateProgress = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const currentProgress = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(currentProgress);

      const remainingSec = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setSecondsRemaining(remainingSec);

      if (elapsed >= durationMs) {
        handleFinish();
      } else {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [durationMs]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between items-center text-white bg-slate-950 transition-all duration-700 ease-in-out ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 30%, rgba(79, 70, 229, 0.22) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(67, 56, 202, 0.15) 0%, transparent 50%),
          linear-gradient(to bottom, #020617, #0f172a, #020617)
        `,
      }}
    >
      {/* Top subtle branding strip */}
      <div className="w-full max-w-5xl px-6 pt-8 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-semibold text-slate-300 tracking-wider uppercase text-[11px]">
            Campus Hub Portal
          </span>
        </div>
        <button
          onClick={handleFinish}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium cursor-pointer"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Welcoming Centerpiece */}
      <div className="w-full max-w-xl px-6 py-8 flex flex-col items-center text-center">
        {/* Animated Brand Logo Container */}
        <div className="relative mb-8 group">
          {/* Subtle Ambient Glowing Ring */}
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000 animate-pulse" />

          {/* Logo Mark */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white rounded-3xl shadow-2xl flex items-center justify-center ring-4 ring-white/10 border border-indigo-400/30">
            <Package className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.8] drop-shadow-md transform transition-transform duration-500 hover:scale-105" />
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
          Campus<span className="text-indigo-400">Trace</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-indigo-200/90 font-medium max-w-md mx-auto mb-6">
          University Central Lost &amp; Found Network
        </p>

        {/* Welcome message */}
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed mb-8">
          Welcome to the official campus lost and found portal. Reconnect with lost textbooks, keys, electronics, and student IDs across campus complexes in real-time.
        </p>

        {/* Feature Highlights (Clean Unboxed Layout conforming to zero-pill rules) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8 text-left">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 shrink-0 border border-indigo-800/40">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Real-Time Sync</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cloud Firestore tracking for instant arrivals</p>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 shrink-0 border border-emerald-800/40">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Map Grounded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Google Maps pins for lecture halls &amp; libraries</p>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 shrink-0 border border-indigo-800/40">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Smart Alerts</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Email and closed-tab Web Push notifications</p>
            </div>
          </div>
        </div>

        {/* Direct Action Button */}
        <button
          onClick={handleFinish}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer active:translate-y-0"
        >
          <span>Enter CampusTrace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Progress Bar & Countdown Indicator */}
      <div className="w-full max-w-xl px-6 pb-8">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Loading campus inventory...</span>
          </span>
          <span className="tabular-nums font-medium text-indigo-300">
            Opening in {secondsRemaining}s
          </span>
        </div>

        {/* 5-second animated progress bar */}
        <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
