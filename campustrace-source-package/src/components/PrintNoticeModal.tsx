import React from 'react';
import { LostFoundItem } from '../types';
import { X, Printer, Package, Phone, MapPin, Calendar, QrCode } from 'lucide-react';

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
  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const isLost = item.item_type === 'lost';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-6">
        {/* Top Controls */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">
              Campus Bulletin Board Notice
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Notice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bulletin Flyer Sheet */}
        <div className="border-4 border-slate-900 p-6 rounded-2xl bg-white text-slate-900 font-sans space-y-4">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <div className="inline-block bg-slate-900 text-white font-black text-xl sm:text-2xl px-4 py-1 uppercase tracking-widest rounded-md">
              {isLost ? 'LOST ITEM NOTICE' : 'FOUND ITEM NOTICE'}
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-600 font-bold mt-1">
              CampusTrace • University Student Community Notice
            </p>
          </div>

          {/* Item Highlight */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-slate-900 uppercase">
              {item.item_name}
            </h2>
            <div className="inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 border border-slate-300">
              Category: {item.category_name}
            </div>
          </div>

          {/* Picture if available */}
          {item.image_path && (
            <div className="h-44 w-full rounded-xl overflow-hidden border-2 border-slate-900 flex items-center justify-center bg-slate-100">
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
          <div className="grid grid-cols-2 gap-3 text-xs border-y-2 border-slate-900 py-3">
            <div>
              <span className="font-bold text-slate-500 uppercase block text-[10px]">
                {isLost ? 'Last Seen Location' : 'Location Recovered'}
              </span>
              <span className="font-bold text-slate-900 text-sm">{item.location_found}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase block text-[10px]">
                Current Handover Location
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {item.dropoff_location || 'With Finder'}
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
            <div className="font-mono text-xl font-black mt-0.5 tracking-wider">
              {item.finder_contact}
            </div>
            {item.finder_name && (
              <span className="text-xs text-slate-300">Finder: {item.finder_name}</span>
            )}
          </div>

          {/* Tear-off Slips simulation at bottom */}
          <div className="pt-2 border-t border-dashed border-slate-400">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 text-center mb-1">
              ✂ Tear-off contact strips for noticeboard
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-l border-dashed border-slate-300 p-1 text-[10px] font-mono leading-tight"
                >
                  <div className="font-bold truncate">{item.item_name}</div>
                  <div className="text-indigo-700 font-black">{item.finder_contact}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
