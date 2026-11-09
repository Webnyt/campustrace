import React, { useEffect, useRef, useState } from 'react';
import { Package } from 'lucide-react';

interface WelcomingScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const WelcomingScreen: React.FC<WelcomingScreenProps> = ({
  onComplete,
  durationMs = 1800,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      setIsFadingOut(true);
    }, durationMs);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, durationMs + 450);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#312e81] text-white transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-label="CampusTrace"
    >
      <div className="flex flex-col items-center px-6 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-indigo-700 shadow-2xl">
          <Package className="h-10 w-10" strokeWidth={2.25} />
        </div>
        <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">CampusTrace</p>
        <p className="mt-2 text-sm font-medium text-indigo-100">Campus lost and found</p>
      </div>
    </div>
  );
};
