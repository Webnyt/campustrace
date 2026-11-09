import React, { useState, useEffect, useRef } from 'react';
import { Category, LostFoundItem, MapsGroundingData } from '../types';
import { CAMPUS_LOCATIONS, DROPOFF_LOCATIONS, PHOTO_PRESETS } from '../data/mockData';
import { createItem } from '../services/api';
import { fetchCampusMapsGrounding } from '../services/mapsService';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  MapPin,
  Phone,
  User,
  Shield,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Compass,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface ReportModalProps {
  categories: Category[];
  isOpen: boolean;
  initialType?: 'found' | 'lost';
  onClose: () => void;
  onItemAdded: (item: LostFoundItem) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  categories,
  isOpen,
  initialType = 'found',
  onClose,
  onItemAdded,
}) => {
  const { user } = useAuth();
  const [itemType, setItemType] = useState<'found' | 'lost'>(initialType);
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.category_id || 1);
  const [locationFound, setLocationFound] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState(DROPOFF_LOCATIONS[0]);
  const [finderContact, setFinderContact] = useState('');
  const [finderName, setFinderName] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size?: string; type?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEnlargedPreview, setIsEnlargedPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPhotoPresets, setShowPhotoPresets] = useState(false);
  const [mapsChecking, setMapsChecking] = useState(false);
  const [mapsGroundingData, setMapsGroundingData] = useState<MapsGroundingData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill finder name from Firebase User if available
  useEffect(() => {
    if (user && !finderName) {
      setFinderName(user.displayName || user.email || 'Campus Student');
    }
  }, [user]);

  // Auto-detect category based on item title
  useEffect(() => {
    const title = itemName.toLowerCase();
    if (title.includes('calculator') || title.includes('phone') || title.includes('airpod') || title.includes('earphone') || title.includes('laptop') || title.includes('charger') || title.includes('macbook')) {
      const elec = categories.find((c) => c.category_name.toLowerCase().includes('electronic'));
      if (elec) setCategoryId(elec.category_id);
    } else if (title.includes('id') || title.includes('card') || title.includes('license') || title.includes('atm') || title.includes('passport')) {
      const ids = categories.find((c) => c.category_name.toLowerCase().includes('id'));
      if (ids) setCategoryId(ids.category_id);
    } else if (title.includes('book') || title.includes('note') || title.includes('binder') || title.includes('syllabus') || title.includes('paper')) {
      const bks = categories.find((c) => c.category_name.toLowerCase().includes('book'));
      if (bks) setCategoryId(bks.category_id);
    } else if (title.includes('key') || title.includes('wallet') || title.includes('fob') || title.includes('lanyard')) {
      const keys = categories.find((c) => c.category_name.toLowerCase().includes('key'));
      if (keys) setCategoryId(keys.category_id);
    } else if (title.includes('bag') || title.includes('jacket') || title.includes('hoodie') || title.includes('backpack') || title.includes('shirt') || title.includes('sweater')) {
      const cloth = categories.find((c) => c.category_name.toLowerCase().includes('cloth') || c.category_name.toLowerCase().includes('bag'));
      if (cloth) setCategoryId(cloth.category_id);
    }
  }, [itemName, categories]);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, or WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('File size exceeds 8MB. Please choose a smaller image.');
      return;
    }

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    // Use the FileReader API to generate a temporary URL from the selected file in the input
    const reader = new FileReader();
    reader.onload = (event) => {
      const temporaryUrl = event.target?.result as string;
      setImagePreview(temporaryUrl);
      setFileInfo({
        name: file.name,
        size: formattedSize,
        type: file.type.split('/')[1]?.toUpperCase() || 'IMAGE',
      });
      setErrorMessage('');
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleSelectPreset = (url: string, name: string) => {
    setImagePreview(url);
    setFileInfo({
      name: `${name} (Campus Preset)`,
      size: 'Sample Photo',
      type: 'PRESET',
    });
    setShowPhotoPresets(false);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFileInfo(null);
    setIsEnlargedPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleVerifyLocationWithMaps = async () => {
    if (!locationFound.trim()) {
      setErrorMessage('Please enter a location name before querying Google Maps.');
      return;
    }
    setMapsChecking(true);
    setErrorMessage('');
    try {
      const result = await fetchCampusMapsGrounding(locationFound.trim(), itemName.trim());
      if (result) {
        setMapsGroundingData(result);
      }
    } catch {
      setErrorMessage('Could not complete Google Maps verification at this moment.');
    } finally {
      setMapsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !locationFound.trim() || !finderContact.trim()) {
      setErrorMessage('Please fill in Item Name, Location, and Contact info.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await createItem({
        item_name: itemName.trim(),
        category_id: categoryId,
        location_found: locationFound.trim(),
        dropoff_location: dropoffLocation,
        finder_contact: finderContact.trim(),
        finder_name: finderName.trim() || undefined,
        finder_id: user?.uid,
        description: description.trim(),
        image_path: imagePreview,
        item_type: itemType,
        map_grounding: mapsGroundingData,
      });

      if (result.success && result.item) {
        onItemAdded(result.item);
        handleClose();
      } else {
        setErrorMessage(result.message || 'Failed to submit report.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error occurred while saving item.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setItemName('');
    setLocationFound('');
    setFinderContact('');
    setFinderName('');
    setDescription('');
    setImagePreview(null);
    setFileInfo(null);
    setIsEnlargedPreview(false);
    setIsDragging(false);
    setErrorMessage('');
    setShowPhotoPresets(false);
    setMapsGroundingData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-xl text-slate-900 flex items-center space-x-2">
              <span>{itemType === 'found' ? 'Report Found Item' : 'Report Lost Item'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {itemType === 'found'
                ? 'Help an owner recover what you picked up across campus'
                : 'Broadcast a missing item so university peers and staff can assist'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Status Banner */}
        {user ? (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-800 flex items-center justify-between">
            <span className="flex items-center space-x-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Authenticated as <strong>{user.displayName || user.email}</strong>
              </span>
            </span>
            <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
              Firebase Synced
            </span>
          </div>
        ) : (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Posting as Guest. You can sign in with Google in the top bar to track reports.</span>
          </div>
        )}

        {/* Type toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setItemType('found')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              itemType === 'found'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            I Found An Item
          </button>
          <button
            type="button"
            onClick={() => setItemType('lost')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              itemType === 'lost'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            I Lost Something
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Casio FX-991ES Calculator, Blue Student ID Card, AirPods Pro"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            />
          </div>

          {/* Category & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {itemType === 'found' ? 'Location Found *' : 'Location Last Seen *'}
                </label>
                <button
                  type="button"
                  onClick={handleVerifyLocationWithMaps}
                  disabled={mapsChecking}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  title="Verify on Google Maps with gemini-3.8-flash"
                >
                  {mapsChecking ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3 h-3 text-indigo-600" />
                      <span>Verify Maps</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                required
                list="campusLocationsList"
                value={locationFound}
                onChange={(e) => setLocationFound(e.target.value)}
                placeholder="e.g. Science Complex LH 3"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              />
              <datalist id="campusLocationsList">
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Google Maps Grounding Feedback */}
          {mapsGroundingData && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-indigo-950 font-bold">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Google Maps Grounded Location:</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-1.5 py-0.2 rounded">
                  Verified with gemini-3.8-flash
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {mapsGroundingData.summary.slice(0, 180)}...
              </p>
              {mapsGroundingData.links.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {mapsGroundingData.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-medium"
                    >
                      <span>{link.title}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Safe Drop-off / Handover Location (for Found items) */}
          {itemType === 'found' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Current Safe Drop-off / Held Location</span>
                <span className="text-[10px] text-slate-400 font-normal">Where owner can verify/collect</span>
              </label>
              <select
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-xs sm:text-sm"
              >
                {DROPOFF_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Finder / Contact row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Contact (Phone / WhatsApp) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={finderContact}
                  onChange={(e) => setFinderContact(e.target.value)}
                  placeholder="e.g. 0241234567 or campus phone"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Name / Department (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={finderName}
                  onChange={(e) => setFinderName(e.target.value)}
                  placeholder="e.g. Kwame A. (CS Level 300)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Item Photo (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowPhotoPresets(!showPhotoPresets)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{showPhotoPresets ? 'Hide Presets' : 'Choose Campus Preset Photo'}</span>
              </button>
            </div>

            {/* Presets Grid */}
            {showPhotoPresets && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-3 grid grid-cols-4 gap-2 animate-in fade-in duration-200">
                {PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url, preset.name)}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 text-left transition group cursor-pointer"
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-12 rounded-lg object-cover mb-1"
                    />
                    <div className="text-[10px] font-semibold text-slate-700 truncate group-hover:text-indigo-600">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Visible File Input */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                name="item_image"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Generated Image Thumbnail Preview (Before Submitting) */}
            {imagePreview ? (
              <div className="mt-2.5 space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-2xl border border-indigo-200/90 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Image Thumbnail */}
                    <div
                      onClick={() => setIsEnlargedPreview(!isEnlargedPreview)}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 cursor-pointer group shadow-2xs"
                      title="Click to toggle enlarged preview"
                    >
                      <img
                        src={imagePreview}
                        alt="Selected item thumbnail preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Thumbnail File Information */}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {fileInfo?.name || 'Image Thumbnail Preview'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                        {fileInfo?.type && (
                          <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[10px] font-mono font-semibold text-slate-700">
                            {fileInfo.type}
                          </span>
                        )}
                        {fileInfo?.size && <span>{fileInfo.size}</span>}
                        <span>• Preview ready</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Thumbnail ready to attach before clicking &ldquo;Post Item&rdquo;.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEnlargedPreview(!isEnlargedPreview)}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                      title={isEnlargedPreview ? 'Collapse preview' : 'Inspect preview'}
                    >
                      {isEnlargedPreview ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Collapse</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Inspect</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                      title="Remove image thumbnail"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Enlarged Inspection Mode */}
                {isEnlargedPreview && (
                  <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-xs text-slate-300 px-1">
                      <span className="font-semibold flex items-center space-x-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Enlarged Thumbnail Inspection</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEnlargedPreview(false)}
                        className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
                      >
                        Close Preview
                      </button>
                    </div>
                    <div className="relative rounded-xl overflow-hidden bg-black/60 max-h-60 flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Enlarged thumbnail preview"
                        className="w-full h-full max-h-60 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Drag & Drop Dropzone if no file selected yet */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-2 border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  Or drag and drop photo here
                </span>
                <span className="text-[10px] text-slate-400">
                  FileReader will generate an instant thumbnail preview
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description &amp; Identifying Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Color, brand name, distinctive stickers, case condition, contents (keep confidential serial numbers unrevealed for claimant verification)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Automated Email Alert Notice */}
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80 text-[11px] text-indigo-900 flex items-center space-x-2">
            <span className="text-indigo-600 font-bold">🔔 Campus Alert Notice:</span>
            <span>Subscribed students and faculty will be automatically notified via university email when this item is posted.</span>
          </div>

          {/* Form buttons */}
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
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting Item...' : 'Post Item to CampusTrace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
