import React, { useState, useEffect } from 'react';
import { LostFoundItem } from '../types';
import { claimItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { updateFirestoreClaim } from '../firebase/firestoreService';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  User,
  Phone,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface ClaimModalProps {
  item: LostFoundItem | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess: (updatedItem: LostFoundItem) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  item,
  isOpen,
  onClose,
  onClaimSuccess,
}) => {
  const { user } = useAuth();
  const [claimantName, setClaimantName] = useState('');
  const [claimantContact, setClaimantContact] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [confirmTruth, setConfirmTruth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMode, setSuccessMode] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (user && !claimantName) {
      setClaimantName(user.displayName || user.email || 'Verified Student');
    }
  }, [user]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimantName.trim() || !claimantContact.trim()) {
      setErrorMsg('Please enter your name and phone or student ID.');
      return;
    }
    if (!confirmTruth) {
      setErrorMsg('Please confirm that you are the lawful owner or authorized to claim this item.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const notes = verificationNotes.trim()
        ? `Claimed by ${claimantName} (${claimantContact}). Proof provided: ${verificationNotes}`
        : `Claimed by ${claimantName} (${claimantContact}). Verified with finder.`;

      // Sync with both backend and Cloud Firestore
      const claimPayload = {
        claimed_by: `${claimantName} (${claimantContact})`,
        claim_notes: notes,
      };

      try {
        await updateFirestoreClaim(item, claimPayload);
      } catch (fsErr) {
        console.warn('Firestore claim update note:', fsErr);
      }

      const result = await claimItem(item.item_id, claimPayload);

      if (result.success && result.item) {
        // Trigger celebratory confetti!

        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6'],
          });
        } catch {
          // ignore if canvas unavailable
        }

        setSuccessMode(true);
        setTimeout(() => {
          onClaimSuccess(result.item!);
          handleClose();
        }, 1800);
      } else {
        setErrorMsg(result.message || 'Failed to update claim status.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while claiming item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setClaimantName('');
    setClaimantContact('');
    setVerificationNotes('');
    setConfirmTruth(false);
    setErrorMsg('');
    setSuccessMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                Claim Item Verification
              </h3>
              <p className="text-xs text-slate-500">
                Verify identity &amp; record safe return to rightful owner
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMode ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Item Successfully Claimed!</h4>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Status updated to <strong>Claimed &amp; Returned</strong>. Thank you for using CampusTrace to safely resolve campus lost belongings!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Target Item summary card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3.5">
              {item.image_path && !imgError ? (
                <img
                  src={item.image_path}
                  alt={item.item_name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {item.item_name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-xs space-y-0.5 min-w-0">
                <span className="font-semibold px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-block mb-0.5">
                  {item.category_name}
                </span>
                <h5 className="font-bold text-slate-900 text-sm truncate">{item.item_name}</h5>
                <p className="text-slate-500 text-[11px] truncate">
                  Found at: <span className="text-slate-700">{item.location_found}</span>
                </p>
              </div>
            </div>

            {/* Name field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  placeholder="e.g. Kwame Mensah / Sarah Boateng"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Contact / Student ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number or Student ID *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={claimantContact}
                  onChange={(e) => setClaimantContact(e.target.value)}
                  placeholder="e.g. 0241234567 or Student ID #10849201"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Verification Proof notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Proof of Ownership / Distinct Details
              </label>
              <textarea
                rows={3}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Mention unique marks, lockscreen photo, stickers, serial hints, or receipts to verify this belongs to you..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Helps campus staff or finders verify the rightful owner before releasing the item.
              </p>
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-start space-x-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmTruth}
                onChange={(e) => setConfirmTruth(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-600 leading-snug">
                I confirm that I am the rightful owner (or have received the item back from finder).
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Updating...' : 'Confirm Claim & Return'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
