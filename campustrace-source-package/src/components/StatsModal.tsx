import React from 'react';
import { StatsData } from '../types';
import { X, BarChart3, CheckCircle2, AlertCircle, MapPin, TrendingUp, Sparkles } from 'lucide-react';

interface StatsModalProps {
  stats: StatsData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, isOpen, onClose }) => {
  if (!isOpen || !stats) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Campus Recovery Insights</h3>
              <p className="text-xs text-slate-500">Live statistics across university locations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Top key metric cards */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Items</span>
              <span className="text-xl font-black text-slate-900">{stats.total}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Unclaimed</span>
              <span className="text-xl font-black text-amber-900">{stats.unclaimed}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Returned</span>
              <span className="text-xl font-black text-emerald-900">{stats.claimed}</span>
            </div>
          </div>

          {/* Recovery Rate Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-indigo-200 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Campus Recovery Rate</span>
              </span>
              <span className="text-lg font-black text-white">{stats.recoveryRate}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-indigo-950/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, stats.recoveryRate))}%` }}
              ></div>
            </div>
          </div>

          {/* Top Campus Recovery Locations */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Campus Hotspots (Most Reports)</span>
            </h4>
            <div className="space-y-1.5">
              {stats.topLocations.map(([loc, count], idx) => (
                <div
                  key={loc}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"
                >
                  <span className="font-medium text-slate-800 flex items-center space-x-2">
                    <span className="w-4 text-center text-slate-400 font-bold">{idx + 1}.</span>
                    <span>{loc}</span>
                  </span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-5 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            Close Insights
          </button>
        </div>
      </div>
    </div>
  );
};
