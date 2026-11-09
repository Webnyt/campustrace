import React, { useState } from 'react';
import { LostFoundItem } from '../types';
import {
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  User,
  Shield,
  ExternalLink,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface ItemCardProps {
  item: LostFoundItem;
  onClaimClick: (item: LostFoundItem) => void;
  onViewDetails: (item: LostFoundItem) => void;
  onPrintNotice: (item: LostFoundItem) => void;
  onUnclaim?: (itemId: number | string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onClaimClick,
  onViewDetails,
  onPrintNotice,
  onUnclaim,
}) => {

  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.finder_contact);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRelativeTime = (isoDate: string) => {
    try {
      const now = Date.now();
      const past = new Date(isoDate).getTime();
      const diffMs = now - past;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      if (hours < 1) return 'Just now';
      if (hours === 1) return '1 hour ago';
      if (hours < 24) return `${hours} hours ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    } catch {
      return 'Recently';
    }
  };

  const isClaimed = item.item_status === 'Claimed';

  return (
    <div
      className={`item-card bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        isClaimed
          ? 'border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Top Image area */}
        {item.image_path && !imageError ? (
          <div
            onClick={() => onViewDetails(item)}
            className="relative h-48 w-full bg-slate-100 overflow-hidden cursor-pointer group"
          >
            <img
              src={item.image_path}
              alt={item.item_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white/95 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quick View</span>
              </span>
            </div>

            {/* Type badge overlay */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md shadow-xs ${
                  item.item_type === 'lost'
                    ? 'bg-rose-500/90 text-white'
                    : 'bg-indigo-600/90 text-white'
                }`}
              >
                {item.item_type === 'lost' ? 'Lost Report' : 'Found Item'}
              </span>
            </div>

            {/* Status overlay */}
            <div className="absolute top-3 right-3">
              <span
                id={`status-badge-${item.item_id}`}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md shadow-xs flex items-center space-x-1 ${
                  isClaimed
                    ? 'bg-emerald-600/95 text-white'
                    : 'bg-amber-500/95 text-white'
                }`}
              >
                {isClaimed ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Returned</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span>Unclaimed</span>
                  </>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 pt-5 pb-0 flex justify-between items-center">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                item.item_type === 'lost'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {item.item_type === 'lost' ? 'Lost Report' : 'Found Item'}
            </span>

            <span
              id={`status-badge-${item.item_id}`}
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                isClaimed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isClaimed ? 'Claimed' : 'Unclaimed'}
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md uppercase tracking-wide bg-slate-100 text-slate-700">
              {item.category_name}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 mr-0.5" />
              <span>{formatRelativeTime(item.date_posted)}</span>
            </span>
          </div>

          <h4
            onClick={() => onViewDetails(item)}
            className="font-bold text-slate-900 text-base sm:text-lg mb-1 leading-snug hover:text-indigo-600 cursor-pointer transition-colors"
          >
            {item.item_name}
          </h4>

          {/* Location Found */}
          <p className="text-xs text-slate-600 mb-2 flex items-start space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <span className="leading-snug">
              Found at: <strong className="text-slate-800 font-semibold">{item.location_found}</strong>
            </span>
          </p>

          {/* Safe Dropoff Spot */}
          {item.dropoff_location && (
            <div className="text-[11px] text-slate-500 mb-3 flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">
                Held at: <span className="text-slate-700 font-medium">{item.dropoff_location}</span>
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/80 mb-3 leading-relaxed line-clamp-3">
            {item.description}
          </p>

          {/* Claim info if returned */}
          {isClaimed && item.claimed_by && (
            <div className="mb-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Returned to Owner: {item.claimed_by}</span>
                {item.claim_notes && (
                  <span className="text-emerald-700 block italic mt-0.5">{item.claim_notes}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Finder Contact & Actions */}
      <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              {item.item_type === 'lost' ? 'Owner Contact' : 'Finder Contact'}
            </span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <a
                href={`tel:${item.finder_contact}`}
                className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1"
                title="Click to call"
              >
                <Phone className="w-3 h-3 mr-0.5" />
                <span>{item.finder_contact}</span>
              </a>
              <button
                onClick={handleCopyPhone}
                title="Copy phone number"
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Flyer notice button */}
          <button
            onClick={() => onPrintNotice(item)}
            title="Generate Printable Campus Bulletin Flyer"
            className="text-[11px] text-slate-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition flex items-center space-x-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flyer</span>
          </button>
        </div>

        {/* Claim / Action Row */}
        <div className="flex items-center space-x-2">
          {!isClaimed ? (
            <button
              onClick={() => onClaimClick(item)}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm py-2 px-3 rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark Claimed</span>
            </button>
          ) : (
            <div className="w-full flex items-center justify-between bg-emerald-100/60 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold">
              <span className="flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Safely Returned</span>
              </span>
              {onUnclaim && (
                <button
                  onClick={() => onUnclaim(item.item_id)}
                  title="Reopen item as unclaimed"
                  className="text-[10px] text-emerald-700 hover:text-emerald-950 underline font-normal cursor-pointer"
                >
                  Reopen
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => onViewDetails(item)}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium py-2 px-2.5 rounded-xl transition cursor-pointer"
            title="View Details"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
