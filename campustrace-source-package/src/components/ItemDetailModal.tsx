import React, { useState, useEffect } from 'react';
import { LostFoundItem, MapsGroundingData } from '../types';
import { fetchCampusMapsGrounding } from '../services/mapsService';
import {
  X,
  MapPin,
  Phone,
  Shield,
  CheckCircle2,
  Clock,
  User,
  Share2,
  Printer,
  Copy,
  Check,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
  Compass,
  Sparkles,
  Loader2,
  Mail,
} from 'lucide-react';

interface ItemDetailModalProps {
  item: LostFoundItem | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimClick: (item: LostFoundItem) => void;
  onPrintNotice: (item: LostFoundItem) => void;
  onEmailAlertItem?: (item: LostFoundItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onClaimClick,
  onPrintNotice,
  onEmailAlertItem,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [mapsData, setMapsData] = useState<MapsGroundingData | null>(null);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setImgError(false);
      setMapsError(null);
      if (item.map_grounding) {
        setMapsData(item.map_grounding);
      } else {
        setMapsData(null);
      }
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const isClaimed = item.item_status === 'Claimed';

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(item.finder_contact);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `CampusTrace Item #${item.item_id}: ${item.item_name} found at ${item.location_found}. Contact: ${item.finder_contact}`
      );
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    }
  };

  const handleGroundLocation = async () => {
    setMapsLoading(true);
    setMapsError(null);
    try {
      const data = await fetchCampusMapsGrounding(item.location_found, item.item_name);
      if (data) {
        setMapsData(data);
      } else {
        setMapsError('Could not retrieve Google Maps data for this location.');
      }
    } catch {
      setMapsError('Error retrieving Google Maps grounding.');
    } finally {
      setMapsLoading(false);
    }
  };

  const cleanPhone = item.finder_contact.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 my-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                item.item_type === 'lost'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {item.item_type === 'lost' ? 'Lost Report' : 'Found Item'}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 ${
                isClaimed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isClaimed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" />
                  <span>Returned to Owner</span>
                </>
              ) : (
                <span>Unclaimed</span>
              )}
            </span>
            <span className="text-xs text-slate-400 font-mono">#{item.item_id}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              title="Copy share details"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              {shareFeedback ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                onClose();
                onPrintNotice(item);
              }}
              title="Print Campus Notice Flyer"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            {onEmailAlertItem && (
              <button
                onClick={() => {
                  onEmailAlertItem(item);
                }}
                title="Send / Subscribe Email Alert for this Item"
                className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-grow">
          {/* Main Photo if available */}
          {item.image_path && !imgError && (
            <div className="w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-h-72 flex items-center justify-center">
              <img
                src={item.image_path}
                alt={item.item_name}
                className="w-full h-full object-contain bg-slate-900/5 max-h-72"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold text-indigo-700 uppercase tracking-wide">
                {item.category_name}
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 mr-1" />
                <span>Posted {new Date(item.date_posted).toLocaleDateString()}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {item.item_name}
            </h2>
          </div>

          {/* Location & Dropoff details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center space-x-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Found Location</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-800">
                {item.location_found}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center space-x-1 mb-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Current Handover Point</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-800">
                {item.dropoff_location || 'Held with Finder'}
              </div>
            </div>
          </div>

          {/* Google Maps Grounding Card */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs uppercase tracking-wide">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Google Maps Campus Grounding</span>
              </div>
              <button
                onClick={handleGroundLocation}
                disabled={mapsLoading}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 hover:bg-indigo-200/80 px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {mapsLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Grounding...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>{mapsData ? 'Refresh Maps Info' : 'Verify on Google Maps'}</span>
                  </>
                )}
              </button>
            </div>

            {mapsLoading && (
              <div className="py-4 text-center text-xs text-indigo-700 flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Querying Google Maps &amp; verifying campus landmarks with gemini-3.8-flash...</span>
              </div>
            )}

            {mapsError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {mapsError}
              </p>
            )}

            {mapsData ? (
              <div className="space-y-3 text-xs">
                <div className="text-slate-700 bg-white/90 p-3.5 rounded-xl border border-indigo-100/80 leading-relaxed whitespace-pre-line">
                  {mapsData.summary}
                </div>

                {/* Grounding Links required by Google Maps Grounding rules */}
                {mapsData.links && mapsData.links.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>Verified Google Maps Places &amp; Navigation:</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mapsData.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-medium transition shadow-2xs group text-xs"
                        >
                          <span>{link.title}</span>
                          <ExternalLink className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !mapsLoading && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click &ldquo;Verify on Google Maps&rdquo; to retrieve official campus building coordinates, safe handover desks, and direct Google Maps navigation links.
                </p>
              )
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description &amp; Condition
            </h4>
            <div className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
              {item.description}
            </div>
          </div>

          {/* Claim Record if already returned */}
          {isClaimed && item.claimed_by && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Claim Record</span>
              </div>
              <p>
                Item was verified and handed over to: <strong>{item.claimed_by}</strong>
              </p>
              {item.claimed_date && (
                <p className="text-emerald-700 text-[11px]">
                  Date: {new Date(item.claimed_date).toLocaleString()}
                </p>
              )}
              {item.claim_notes && (
                <p className="text-emerald-700 italic text-[11px] bg-white/60 p-2 rounded-xl">
                  {item.claim_notes}
                </p>
              )}
            </div>
          )}

          {/* Safety Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Campus Safety Tip:</strong> Always meet in public campus zones (such as Library Information Desks, Cafeteria cashier, or Campus Security Dispatch) when retrieving belongings, and verify student ID or ownership details.
            </p>
          </div>
        </div>

        {/* Modal Bottom Contact & Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {item.finder_name || 'Campus Finder'}
              </span>
              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${item.finder_contact}`}
                  className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline text-sm"
                >
                  {item.finder_contact}
                </a>
                <button
                  onClick={handleCopyPhone}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                  title="Copy contact"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-3 rounded-xl transition flex items-center space-x-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={`tel:${item.finder_contact}`}
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs py-2.5 px-3 rounded-xl transition flex items-center space-x-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Call</span>
            </a>

            {!isClaimed && (
              <button
                onClick={() => {
                  onClose();
                  onClaimClick(item);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Claim Item</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
