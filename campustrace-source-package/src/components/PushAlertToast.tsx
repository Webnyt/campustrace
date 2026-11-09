import React, { useEffect, useState } from 'react';
import { Bell, ArrowRight, X, Sparkles, MapPin } from 'lucide-react';
import { LostFoundItem } from '../types';

interface PushAlertToastProps {
  item: LostFoundItem;
  matchReason: string;
  onViewItem: (item: LostFoundItem) => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const PushAlertToast: React.FC<PushAlertToastProps> = ({
  item,
  matchReason,
  onViewItem,
  onDismiss,
  autoDismissMs = 8500,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [autoDismissMs, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-indigo-500/40 backdrop-blur-xl p-4 overflow-hidden animate-in slide-in-from-top-4 duration-300 transition-all select-none"
    >
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block animate-ping absolute -top-0.5 -right-0.5" />
            <div className="w-7 h-7 rounded-lg bg-indigo-600/80 flex items-center justify-center text-white">
              <Bell className="w-3.5 h-3.5 animate-bounce" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-white tracking-tight">
                Live Campus Alert Match!
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase">
                Real-Time
              </span>
            </div>
            <p className="text-[10px] text-indigo-200/90 truncate max-w-[200px] sm:max-w-[240px]">
              {matchReason}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="py-2.5 flex items-center space-x-3">
        {item.image_path ? (
          <img
            src={item.image_path}
            alt={item.item_name}
            className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-xs">
            {item.category_name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white truncate leading-tight">
            {item.item_name}
          </h4>
          <p className="text-[11px] text-slate-300 truncate mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{item.location_found}</span>
          </p>
          {item.dropoff_location && (
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              Drop-off: {item.dropoff_location}
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400">
          Posted just now
        </span>
        <button
          onClick={() => {
            onDismiss();
            onViewItem(item);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5 cursor-pointer group"
        >
          <span>View Details &amp; Claim</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
