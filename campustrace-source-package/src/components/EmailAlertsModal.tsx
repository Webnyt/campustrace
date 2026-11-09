import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  CheckCircle2,
  Trash2,
  AlertCircle,
  X,
  Sparkles,
  Send,
  Building2,
  Eye,
  Check,
  Power,
  RotateCcw,
  ExternalLink,
  Smartphone,
  ChevronRight,
  BellRing,
  Volume2,
  Shield,
} from 'lucide-react';
import { Category, EmailAlertSubscription, DispatchedEmail, LostFoundItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  fetchEmailAlerts,
  createEmailAlert,
  deleteEmailAlert,
  toggleEmailAlert,
  fetchDispatchedEmails,
  sendItemAlertEmail,
} from '../services/emailAlertService';
import {
  isPushSupported,
  getPushPermissionStatus,
  requestPushPermission,
  isPushEnabled,
  setPushEnabled,
  sendBrowserPushNotification,
  PushPermissionStatus,
} from '../services/notificationService';
import {
  getOneSignalAppId,
  saveOneSignalAppId,
  initOneSignal,
  isOneSignalSubscribed,
  optInOneSignalPush,
  sendOneSignalItemNotification,
} from '../services/oneSignalService';

interface EmailAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialKeyword?: string;
  initialCategory?: string;
  sampleItems?: LostFoundItem[];
  onAlertCreated?: (alert: EmailAlertSubscription) => void;
}

export const EmailAlertsModal: React.FC<EmailAlertsModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialKeyword = '',
  initialCategory = 'All',
  sampleItems = [],
  onAlertCreated,
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'subscribe' | 'my-alerts' | 'outbox'>(
    initialKeyword ? 'subscribe' : 'subscribe'
  );

  // Form State
  const [userEmail, setUserEmail] = useState(user?.email || 'govindamensah1@gmail.com');
  const [userName, setUserName] = useState(user?.displayName || '');
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState<string | number>(
    initialCategory || 'All'
  );
  const [locationFilter, setLocationFilter] = useState('');
  const [alertType, setAlertType] = useState<'instant' | 'daily_digest'>('instant');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Subscriptions & Outbox state
  const [alerts, setAlerts] = useState<EmailAlertSubscription[]>([]);
  const [dispatches, setDispatches] = useState<DispatchedEmail[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<DispatchedEmail | null>(null);
  const [testSendingId, setTestSendingId] = useState<string | null>(null);

  // Push Notifications State
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>('default');
  const [pushEnabled, setPushEnabledState] = useState<boolean>(true);

  // OneSignal Real Web Push State (Closed-tab push)
  const [oneSignalAppId, setOneSignalAppId] = useState<string>(getOneSignalAppId());
  const [oneSignalInput, setOneSignalInput] = useState<string>(getOneSignalAppId());
  const [oneSignalSubscribed, setOneSignalSubscribed] = useState<boolean>(false);
  const [showOneSignalGuide, setShowOneSignalGuide] = useState<boolean>(false);
  const [testingOneSignal, setTestingOneSignal] = useState<boolean>(false);

  useEffect(() => {
    if (oneSignalAppId) {
      initOneSignal(oneSignalAppId).then(() => {
        isOneSignalSubscribed().then(setOneSignalSubscribed);
      });
    }
  }, [oneSignalAppId]);

  const handleSaveOneSignal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!oneSignalInput.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a valid OneSignal App ID.' });
      return;
    }
    const cleanId = oneSignalInput.trim();
    saveOneSignalAppId(cleanId);
    setOneSignalAppId(cleanId);
    await initOneSignal(cleanId);
    const subscribed = await optInOneSignalPush();
    setOneSignalSubscribed(subscribed);
    setFeedback({
      type: 'success',
      message: 'OneSignal App ID configured! Real push notifications enabled even when your tab is closed.',
    });
  };

  const handleOneSignalOptIn = async () => {
    if (!oneSignalAppId) {
      setShowOneSignalGuide(true);
      return;
    }
    const ok = await optInOneSignalPush();
    setOneSignalSubscribed(ok);
    if (ok) {
      setFeedback({
        type: 'success',
        message: 'Subscribed to OneSignal closed-tab push notifications! You will receive alerts even with the tab closed.',
      });
    }
  };

  const handleTestOneSignalPush = async () => {
    setTestingOneSignal(true);
    const targetItem = sampleItems[0] || {
      item_id: 1,
      item_name: 'Casio Scientific Calculator FX-991ES',
      category_name: 'Electronics',
      location_found: 'Science Complex Lecture Hall 3',
      description: 'Found on front desk with initials KA etched.',
      finder_contact: '0241234567',
      item_status: 'Unclaimed',
      item_type: 'found',
      date_posted: new Date().toISOString(),
    };

    const res = await sendOneSignalItemNotification(targetItem, 'OneSignal Closed-Tab Push Test');
    setTestingOneSignal(false);
    setFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
  };

  useEffect(() => {
    setPushStatus(getPushPermissionStatus());
    setPushEnabledState(isPushEnabled());
  }, [isOpen]);

  const handleRequestPushPermission = async () => {
    const status = await requestPushPermission();
    setPushStatus(status);
    setPushEnabledState(status === 'granted');
    if (status === 'granted') {
      setFeedback({
        type: 'success',
        message: 'Browser push notifications successfully enabled! Real-time alerts are now active.',
      });
      if (sampleItems.length > 0) {
        sendBrowserPushNotification({
          title: 'CampusTrace Push Alerts Activated!',
          body: 'You will receive real-time notifications whenever matching items are reported.',
          item: sampleItems[0],
          matchReason: 'Push alert verification',
        });
      }
    } else if (status === 'denied') {
      setFeedback({
        type: 'error',
        message: 'Push notifications are blocked in your browser settings. Please allow notifications for this site.',
      });
    }
  };

  const handleTogglePushNotifications = () => {
    const next = !pushEnabled;
    setPushEnabled(next);
    setPushEnabledState(next);
    setFeedback({
      type: 'success',
      message: `Browser push notifications are now ${next ? 'enabled' : 'paused'}.`,
    });
  };

  const handleSendTestPushAlert = () => {
    const targetItem = sampleItems[0] || {
      item_id: 1,
      item_name: 'Casio Scientific Calculator FX-991ES',
      category_name: 'Electronics',
      location_found: 'Science Complex Lecture Hall 3',
      description: 'Found on front desk with initials KA etched.',
      finder_contact: '0241234567',
      item_status: 'Unclaimed',
      item_type: 'found',
      date_posted: new Date().toISOString(),
    };

    const notif = sendBrowserPushNotification({
      title: '[CampusTrace Test Alert] Match Found!',
      body: `"${targetItem.item_name}" turned in at ${targetItem.location_found}. Click to view details.`,
      item: targetItem,
      matchReason: 'Live browser push notification test',
    });

    if (notif || Notification.permission === 'granted') {
      setFeedback({
        type: 'success',
        message: 'Test push notification triggered with audio chime! Check your desktop notification center.',
      });
    } else {
      setFeedback({
        type: 'error',
        message: 'Please enable browser notification permissions to receive native desktop alerts.',
      });
    }
  };

  // Sync initialKeyword and user email
  useEffect(() => {
    if (initialKeyword) {
      setKeyword(initialKeyword);
      setActiveTab('subscribe');
    }
  }, [initialKeyword]);

  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
      if (user.displayName) setUserName(user.displayName);
    }
  }, [user]);

  // Load alerts & outbox
  const loadData = async () => {
    setLoadingAlerts(true);
    try {
      const [fetchedAlerts, fetchedDispatches] = await Promise.all([
        fetchEmailAlerts(userEmail || undefined),
        fetchDispatchedEmails(userEmail || undefined),
      ]);
      setAlerts(fetchedAlerts);
      setDispatches(fetchedDispatches);
    } catch (err) {
      console.warn('Error loading email alert data:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userEmail.includes('@')) {
      setFeedback({ type: 'error', message: 'Please enter a valid university email address.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const catObj = categories.find(
      (c) => c.category_name === selectedCategory || c.category_id === Number(selectedCategory)
    );

    const res = await createEmailAlert({
      user_email: userEmail.trim().toLowerCase(),
      user_name: userName.trim() || userEmail.split('@')[0],
      keyword: keyword.trim(),
      category_id: selectedCategory === 'All' ? 'All' : catObj?.category_id || 'All',
      category_name: selectedCategory === 'All' ? 'All Categories' : catObj?.category_name,
      location_filter: locationFilter.trim(),
      alert_type: alertType,
    });

    setSubmitting(false);

    if (res.success && res.alert) {
      setFeedback({
        type: 'success',
        message:
          res.matchesCount && res.matchesCount > 0
            ? `Email alert activated! Found ${res.matchesCount} current campus ${
                res.matchesCount === 1 ? 'item' : 'items'
              } matching your criteria.`
            : `Email alert successfully registered for "${keyword || catObj?.category_name || 'All Categories'}".`,
      });
      setAlerts((prev) => [res.alert!, ...prev]);
      if (onAlertCreated) onAlertCreated(res.alert);
      // Reset keyword
      setKeyword('');
      setLocationFilter('');
      setTimeout(() => {
        setActiveTab('my-alerts');
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Cancel this email alert subscription?')) return;
    const ok = await deleteEmailAlert(id);
    if (ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleToggleAlert = async (alert: EmailAlertSubscription) => {
    const nextState = !alert.active;
    const ok = await toggleEmailAlert(alert.id, nextState);
    if (ok) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, active: nextState } : a))
      );
    }
  };

  const handleSendTestAlert = async (alert: EmailAlertSubscription) => {
    setTestSendingId(alert.id);
    // Find matching sample item or pick first available item
    const targetItem =
      sampleItems.find((i) => {
        if (alert.category_id && alert.category_id !== 'All' && i.category_id !== alert.category_id) {
          return false;
        }
        if (alert.keyword) {
          const hay = `${i.item_name} ${i.description}`.toLowerCase();
          return hay.includes(alert.keyword.toLowerCase());
        }
        return true;
      }) || sampleItems[0];

    if (!targetItem) {
      setFeedback({ type: 'error', message: 'No campus items available to simulate test alert.' });
      setTestSendingId(null);
      return;
    }

    const res = await sendItemAlertEmail(
      alert.user_email,
      targetItem.item_id,
      alert.user_name,
      `Simulated Test Alert for keyword: "${alert.keyword || alert.category_name}"`
    );

    setTestSendingId(null);
    if (res.success && res.email) {
      setDispatches((prev) => [res.email!, ...prev]);
      setPreviewEmail(res.email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-indigo-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold tracking-tight">Campus Email Alerts</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white tracking-wide uppercase">
                  Automated Dispatch
                </span>
              </div>
              <p className="text-xs text-indigo-100">
                Receive instant university email notifications when lost belongings are turned in.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-indigo-500/40 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('subscribe')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'subscribe'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Subscribe to Alert</span>
            </button>

            <button
              onClick={() => setActiveTab('my-alerts')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'my-alerts'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>My Subscriptions</span>
              {alerts.length > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'my-alerts'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {alerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('outbox')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'outbox'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Outbox</span>
              {dispatches.length > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'outbox'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {dispatches.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-4">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: SUBSCRIBE TO ALERT */}
          {activeTab === 'subscribe' && (
            <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      University Notification Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="e.g. yourname@campus.edu"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Your Name / Student ID
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Govinda M. (ID: 10849201)"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Item Keyword or Brand
                    </label>
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="e.g. AirPods, HydroFlask, Casio, Student ID, Keys"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Leave empty to receive alerts for any item in the category.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category Filter</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    >
                      <option value="All">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_name}>
                          {c.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Campus Location Filter (Optional)
                    </label>
                    <input
                      type="text"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="e.g. Science Complex, Library, Cafeteria"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Alert Frequency</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                        <input
                          type="radio"
                          name="alert_type"
                          checked={alertType === 'instant'}
                          onChange={() => setAlertType('instant')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-800">Instant Notice</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                        <input
                          type="radio"
                          name="alert_type"
                          checked={alertType === 'daily_digest'}
                          onChange={() => setAlertType('daily_digest')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-medium text-slate-600">Daily Digest</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Email Notification Simulation Preview */}
              <div className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Live University Email Alert Preview</span>
                  </span>
                  <span className="text-[10px] text-indigo-500 font-mono">
                    Subject: [CampusTrace Alert] New Match Found
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-indigo-200/80 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[11px] font-bold text-slate-800">
                      To: {userEmail || 'student@campus.edu'}
                    </span>
                    <span className="text-[10px] text-slate-400">Campus Security Dispatch</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Hello <strong>{userName || 'Student'}</strong>, a newly reported item matching
                    your alert for <span className="font-bold text-indigo-600">"{keyword || selectedCategory}"</span> has been registered and turned into campus staff!
                  </p>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
                    <span>📍 Handover Drop-off Desk: Campus Security Station #1</span>
                    <span className="text-emerald-700 font-bold">Unclaimed &amp; Safe</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Browser Push Notifications Integration */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-indigo-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">
                          Real-Time Browser Push Notifications
                        </span>
                        {pushStatus === 'granted' && pushEnabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Active &amp; Ready
                          </span>
                        ) : pushStatus === 'denied' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                            Blocked in Browser
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            Permission Needed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        Receive instant native desktop &amp; mobile alerts with audio chimes the instant matching belongings are turned in.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                    {pushStatus === 'granted' ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSendTestPushAlert}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                          title="Trigger a live native browser test alert"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Test Push</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTogglePushNotifications}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                            pushEnabled
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {pushEnabled ? 'Enabled' : 'Paused'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestPushPermission}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1"
                      >
                        <Bell className="w-3 h-3" />
                        <span>Enable Push Notifications</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* OneSignal Real Web Push (Closed-tab notifications) */}
                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-indigo-300">
                        ⚡ Real Push (Works when tab is closed)
                      </span>
                      <span className="text-[10px] text-slate-400">via OneSignal</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {oneSignalSubscribed ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Closed-Tab Ready
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOneSignalOptIn}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] transition cursor-pointer"
                        >
                          Enable Closed-Tab Push
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowOneSignalGuide(!showOneSignalGuide)}
                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        {showOneSignalGuide ? 'Hide Setup' : 'OneSignal Setup'}
                      </button>
                    </div>
                  </div>

                  {showOneSignalGuide && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <p className="font-semibold text-slate-200">
                        How to get Closed-Tab Web Push (Free for up to 10k users):
                      </p>
                      <ol className="list-decimal list-inside text-slate-300 space-y-1 text-[10px]">
                        <li>Go to <a href="https://onesignal.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">onesignal.com</a> &rarr; Create App &rarr; Web Push</li>
                        <li>Copy your <strong>App ID</strong> from OneSignal settings</li>
                        <li>Paste your App ID below (Service Worker is already pre-configured at <code className="bg-slate-900 px-1 py-0.2 rounded text-indigo-300">/OneSignalSDKWorker.js</code>)</li>
                      </ol>

                      <form onSubmit={handleSaveOneSignal} className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={oneSignalInput}
                          onChange={(e) => setOneSignalInput(e.target.value)}
                          placeholder="Paste your OneSignal App ID here..."
                          className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] rounded-lg transition cursor-pointer"
                        >
                          Save &amp; Connect
                        </button>
                      </form>

                      {oneSignalAppId && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>Active App ID: <span className="font-mono text-indigo-300">{oneSignalAppId}</span></span>
                          <button
                            type="button"
                            onClick={handleTestOneSignalPush}
                            disabled={testingOneSignal}
                            className="text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                          >
                            {testingOneSignal ? 'Dispatching...' : 'Test Closed-Tab Push Now'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Bell className="w-4 h-4" />
                  <span>{submitting ? 'Registering Alert...' : 'Activate Campus Email Alert'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MY ALERT SUBSCRIPTIONS */}
          {activeTab === 'my-alerts' && (
            <div className="space-y-3 text-xs">
              {alerts.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 text-sm">No active email subscriptions yet</p>
                  <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                    Subscribe to your lost keywords (e.g. calculator, student ID, keys) to be
                    notified the moment anyone turns them in.
                  </p>
                  <button
                    onClick={() => setActiveTab('subscribe')}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-xs hover:bg-indigo-700 transition cursor-pointer"
                  >
                    Create Your First Alert
                  </button>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      alert.active
                        ? 'bg-white border-slate-200 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {alert.keyword ? `"${alert.keyword}"` : 'Any Item'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {alert.category_name || 'All Categories'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            {alert.alert_type === 'instant' ? 'Instant Notice' : 'Daily Summary'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>📧 {alert.user_email}</span>
                          {alert.location_filter && (
                            <span>• 📍 Zone: {alert.location_filter}</span>
                          )}
                          <span>• Created: {new Date(alert.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          onClick={() => handleSendTestAlert(alert)}
                          disabled={testSendingId === alert.id}
                          title="Simulate sending a university email alert right now"
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>{testSendingId === alert.id ? 'Sending...' : 'Test Send'}</span>
                        </button>

                        <button
                          onClick={() => handleToggleAlert(alert)}
                          title={alert.active ? 'Pause this alert' : 'Resume this alert'}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            alert.active
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-100 border-slate-300 text-slate-500'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          title="Cancel subscription"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: DISPATCH OUTBOX / EMAIL NOTIFICATION HISTORY */}
          {activeTab === 'outbox' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600 px-1">
                <span className="font-semibold text-slate-700">
                  Automated University Dispatch Log
                </span>
                <span className="text-[11px] text-slate-500">
                  {dispatches.length} emails recorded
                </span>
              </div>

              {dispatches.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 text-sm">No emails in dispatch history</p>
                  <p className="text-slate-500 text-xs mt-1">
                    When someone reports an item matching your keywords, the email will appear here!
                  </p>
                </div>
              ) : (
                dispatches.map((disp) => (
                  <div
                    key={disp.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 text-xs">{disp.subject}</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Delivered
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          To: <span className="font-medium text-slate-700">{disp.to_email}</span> ({disp.recipient_name}) • {new Date(disp.sent_at).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => setPreviewEmail(disp)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] flex items-center space-x-1 cursor-pointer transition shrink-0"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Email</span>
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800">
                          {disp.item_name}
                        </span>
                        <span>•</span>
                        <span>📍 {disp.location}</span>
                      </div>
                      <span className="text-indigo-600 font-medium">
                        {disp.match_reason}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Campus privacy: Your email is used exclusively for lost &amp; found match alerts.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Full Visual HTML Email Viewer Drawer */}
      {previewEmail && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs truncate max-w-md">
                  {previewEmail.subject}
                </span>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 border-b border-slate-200 text-xs space-y-1">
              <p>
                <span className="font-semibold text-slate-500">From:</span> CampusTrace Security Dispatch &lt;alerts@campus.edu&gt;
              </p>
              <p>
                <span className="font-semibold text-slate-500">To:</span> {previewEmail.to_email} ({previewEmail.recipient_name})
              </p>
              <p>
                <span className="font-semibold text-slate-500">Dispatched:</span> {new Date(previewEmail.sent_at).toLocaleString()}
              </p>
            </div>

            {/* Email HTML Iframe Container */}
            <div className="p-4 flex-grow overflow-y-auto bg-slate-50">
              <iframe
                title="Email Preview"
                srcDoc={previewEmail.body_html}
                className="w-full h-[450px] border border-slate-200 rounded-2xl bg-white shadow-xs"
              />
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Back to Outbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
