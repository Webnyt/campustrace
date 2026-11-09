import React, { useEffect, useState } from 'react';
import { LostFoundItem } from '../types';
import { X, Printer, Phone, MapPin, Calendar, Shield, Lock } from 'lucide-react';

interface PrintNoticeModalProps {
  item: LostFoundItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintNoticeModal: React.FC<PrintNoticeModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [maskContact, setMaskContact] = useState(true);

  // Close modal reliably when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleAfterPrint = () => onClose();
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('afterprint', handleAfterPrint);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const isLost = item.item_type === 'lost';
  const displayedContact = maskContact
    ? 'Campus Security Desk / Dispatch Hub'
    : item.finder_contact;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flyer-modal bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 my-4 sm:my-8 max-h-[92vh] flex flex-col relative"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 z-20 p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center print:hidden"
          aria-label="Close flyer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 sm:p-6 pt-14 flex flex-col min-h-0 flex-1">
        {/* Top Controls Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pb-3 sm:pb-4 border-b border-slate-100 mb-3 sm:mb-4 print:hidden shrink-0 pr-1">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Campus Bulletin Board Notice
            </h3>
          </div>
          <div className="flex items-center">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 sm:px-3.5 py-2 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Notice</span>
            </button>
          </div>
        </div>

        {/* Privacy & Confidentiality Toggle (Keep personal phone/email safe) */}
        <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs print:hidden shrink-0">
          <div className="flex items-center space-x-2 text-slate-700">
            <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px]">
              Keep personal phone confidential on public bulletin:
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMaskContact(!maskContact)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
              maskContact
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {maskContact ? 'Confidential: Campus Desk' : 'Show Contact Info'}
          </button>
        </div>

        {/* Printable Bulletin Flyer Sheet (scrollable on mobile) */}
        <div className="overflow-y-auto flex-1 pr-1">
          <div className="flyer-sheet border-4 border-slate-900 p-4 sm:p-6 rounded-2xl bg-white text-slate-900 font-sans space-y-4">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <div className="inline-block bg-slate-900 text-white font-black text-lg sm:text-2xl px-4 py-1 uppercase tracking-widest rounded-md">
                {isLost ? 'LOST ITEM NOTICE' : 'FOUND ITEM NOTICE'}
              </div>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-600 font-bold mt-1">
                CampusTrace • University Student Community Notice
              </p>
            </div>

            {/* Item Highlight */}
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase break-words">
                {item.item_name}
              </h2>
              <div className="inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 border border-slate-300">
                Category: {item.category_name}
              </div>
            </div>

            {/* Picture if available */}
            {item.image_path && (
              <div className="h-40 sm:h-48 w-full rounded-xl overflow-hidden border-2 border-slate-900 flex items-center justify-center bg-slate-100">
                <img
                  src={item.image_path}
                  alt={item.item_name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs border-y-2 border-slate-900 py-3">
              <div>
                <span className="font-bold text-slate-500 uppercase block text-[10px]">
                  {isLost ? 'Last Seen Location' : 'Location Recovered'}
                </span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.location_found}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase block text-[10px]">
                  Current Handover Location
                </span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  {item.dropoff_location || 'Campus Desk'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="font-bold text-slate-500 uppercase block text-[10px] mb-1">
                Description &amp; Marks
              </span>
              <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {item.description}
              </p>
            </div>

            {/* Contact Box */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-300 block font-semibold">
                To verify and claim, contact:
              </span>
              <div className="font-mono text-base sm:text-xl font-black mt-0.5 tracking-wider break-all">
                {displayedContact}
              </div>
              {item.finder_name && !maskContact && (
                <span className="text-xs text-slate-300">Finder: {item.finder_name}</span>
              )}
            </div>

            {/* Tear-off Slips simulation at bottom */}
            <div className="pt-2 border-t border-dashed border-slate-400">
              <div className="text-[9px] uppercase tracking-wider text-slate-400 text-center mb-1">
                ✂ Tear-off contact strips for noticeboard
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="border-l border-dashed border-slate-300 p-1 text-[10px] font-mono leading-tight"
                  >
                    <div className="font-bold truncate">{item.item_name}</div>
                    <div className="text-indigo-700 font-black truncate">{displayedContact}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar (Guaranteed Easy Close for Mobile) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0 mt-3 print:hidden">
          <span className="text-[11px] text-slate-400 hidden xs:inline">
            Press Esc or tap Close
          </span>
          <div className="flex items-center space-x-2 w-full xs:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold px-3 py-2 rounded-xl transition cursor-pointer min-h-[40px] flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Flyer</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl transition cursor-pointer min-h-[44px]"
            >
              Close Notice
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
