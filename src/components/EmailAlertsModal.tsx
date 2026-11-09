import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Send,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Category, LostFoundItem, EmailAlertSubscription, DispatchedEmail } from '../types';
import {
  fetchEmailAlerts,
  createEmailAlert,
  deleteEmailAlert,
  toggleEmailAlert,
  fetchDispatchedEmails,
  sendItemAlertEmail,
} from '../services/emailAlertService';
import { useAuth } from '../context/AuthContext';

interface EmailAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialKeyword?: string;
  initialCategory?: string;
  sampleItems?: LostFoundItem[];
  onAlertCreated?: (alert: EmailAlertSubscription) => void;
}

function resolveCategorySelectValue(value: string | undefined, categories: Category[]): string {
  if (!value || value === 'All') return 'All';
  const byId = categories.find((c) => String(c.category_id) === String(value));
  if (byId) return String(byId.category_id);
  const byName = categories.find(
    (c) => c.category_name.toLowerCase() === value.toLowerCase()
  );
  return byName ? String(byName.category_id) : 'All';
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

  // Form State - strictly neutral campus placeholders, no hardcoded user emails
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [userName, setUserName] = useState(user?.displayName || '');
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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

  // Load existing alerts
  const loadData = async () => {
    setLoadingAlerts(true);
    try {
      const [fetchedAlerts, fetchedDispatches] = await Promise.all([
        fetchEmailAlerts(),
        fetchDispatchedEmails(),
      ]);
      setAlerts(fetchedAlerts);
      setDispatches(fetchedDispatches);
    } catch {
      // ignore
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (initialKeyword) setKeyword(initialKeyword);
      setSelectedCategory(resolveCategorySelectValue(initialCategory, categories));
      if (user?.email && !userEmail) setUserEmail(user.email);
      if (user?.displayName && !userName) setUserName(user.displayName);
    }
  }, [isOpen, initialKeyword, initialCategory, user, categories]);

  // Handle escape key closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your university notification email.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const categoryId: number | 'All' =
      selectedCategory === 'All' ? 'All' : Number(selectedCategory) || 'All';
    const catName =
      categoryId === 'All'
        ? 'All Categories'
        : categories.find((c) => c.category_id === categoryId)?.category_name || 'All Categories';

    try {
      const res = await createEmailAlert({
        user_email: userEmail.trim(),
        user_name: userName.trim() || 'Campus Student',
        keyword: keyword.trim(),
        category_id: categoryId,
        category_name: catName,
        location_filter: locationFilter.trim(),
        alert_type: alertType,
      });

      if (res.success && res.alert) {
        setFeedback({
          type: 'success',
          message: `Email alert created! We will notify ${userEmail} instantly when matching items arrive.`,
        });
        setAlerts((prev) => [res.alert!, ...prev]);
        if (onAlertCreated) onAlertCreated(res.alert);

        // Reset form
        setKeyword('');
        setLocationFilter('');
        setTimeout(() => setActiveTab('my-alerts'), 1800);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Failed to create alert.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Could not connect to server to save alert.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const ok = await toggleEmailAlert(id, !current);
    if (ok) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: !current } : a))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this email alert subscription?')) return;
    const ok = await deleteEmailAlert(id);
    if (ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      setFeedback({ type: 'success', message: 'Alert removed.' });
    }
  };

  const handleTestDispatch = async (alert: EmailAlertSubscription) => {
    setTestSendingId(alert.id);
    setFeedback(null);

    const targetItem =
      sampleItems.find((i) =>
        alert.keyword
          ? i.item_name.toLowerCase().includes(alert.keyword.toLowerCase())
          : alert.category_name === 'All Categories' || i.category_name === alert.category_name
      ) ||
      sampleItems[0] || {
        item_id: 9999,
        category_id: 1,
        category_name: alert.category_name || 'General',
        item_name: alert.keyword || 'Sample Found Item',
        description: 'Black portable item recovered in Campus Library near central study desks.',
        location_found: 'University Library - 2nd Floor Study Commons',
        dropoff_location: 'Library Help Desk',
        finder_contact: 'Campus Security Hub',
        date_posted: new Date().toISOString(),
        item_status: 'Unclaimed',
        item_type: 'found',
      };

    const res = await sendItemAlertEmail(
      alert.user_email,
      targetItem.item_id,
      alert.user_name,
      alert.keyword
        ? `Test alert for keyword "${alert.keyword}"`
        : `Test alert for ${alert.category_name || 'all categories'}`
    );
    setTestSendingId(null);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Simulation email sent to ${alert.user_email}! View in Email Outbox tab.`,
      });
      loadData();
    } else {
      setFeedback({ type: 'error', message: 'Simulation failed: ' + res.message });
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 sm:my-8 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-tr from-indigo-700 to-indigo-600 text-white p-2 rounded-xl shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                Campus Email Alerts
              </h3>
              <p className="text-xs text-slate-500">
                Automatic notifications when matching lost items are found
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-2 mt-3 sm:mt-4 p-1 bg-slate-100 rounded-xl shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('subscribe')}
            className={`flex-1 py-2 px-2.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'subscribe'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Alert</span>
          </button>
          <button
            onClick={() => setActiveTab('my-alerts')}
            className={`flex-1 py-2 px-2.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'my-alerts'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Active Alerts ({alerts.filter((a) => a.active).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`flex-1 py-2 px-2.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'outbox'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Outbox Log ({dispatches.length})</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs flex items-start space-x-2 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <X className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Create New Alert Form */}
        {activeTab === 'subscribe' && (
          <div className="overflow-y-auto flex-1 mt-3 pr-1 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 flex items-start space-x-2 text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Lost something valuable? Save keywords like <strong>"AirPods"</strong>, <strong>"Calculus Notebook"</strong>, or your <strong>"Student ID"</strong>. When any matching item is posted to CampusTrace, you will receive an automatic email alert.
                </p>
              </div>

              {/* Personal Data Confidentiality Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-2 text-slate-600">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Confidentiality Guarantee:</strong> Your notification email and identity details are strictly protected under campus privacy standards. They will never be displayed publicly or shared with third parties.
                </p>
              </div>

              {/* User Identity Fields - Clean Placeholders */}
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
                    placeholder="e.g. student@university.edu"
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
                    placeholder="e.g. Campus Student (ID: 10849201)"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Matching Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <option value="All">All Campus Categories</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location filter */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Specific Campus Location (Optional)
                </label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="e.g. Science Complex, Library, Cafeteria, North Field"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              {/* Alert Frequency */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Alert Frequency</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start space-x-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      alertType === 'instant'
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="alertType"
                      checked={alertType === 'instant'}
                      onChange={() => setAlertType('instant')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Instant Notification
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Email sent the second item is posted
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start space-x-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      alertType === 'daily_digest'
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="alertType"
                      checked={alertType === 'daily_digest'}
                      onChange={() => setAlertType('daily_digest')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Daily Digest</span>
                      <span className="text-[10px] text-slate-500">
                        1 summary email daily at 5:00 PM
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  <Bell className="w-4 h-4" />
                  <span>{submitting ? 'Activating Alert...' : 'Subscribe to Campus Email Alerts'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Manage My Active Alerts */}
        {activeTab === 'my-alerts' && (
          <div className="overflow-y-auto flex-1 mt-3 pr-1 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
              <span>Your registered notification triggers ({alerts.length})</span>
              <button
                onClick={loadData}
                className="hover:text-indigo-600 flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {loadingAlerts ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Loading saved alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No active email alerts</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Create an alert for lost items you are hoping to recover.
                </p>
                <button
                  onClick={() => setActiveTab('subscribe')}
                  className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                >
                  Create Your First Alert
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition ${
                      alert.active
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {alert.keyword ? `"${alert.keyword}"` : 'Any Item'}
                          </span>
                          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                            {alert.category_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Recipient: <span className="text-slate-700 font-medium">{alert.user_email}</span>
                          {alert.location_filter && (
                            <span> • Location: <strong>{alert.location_filter}</strong></span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggle(alert.id, alert.active)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                            alert.active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {alert.active ? 'Active' : 'Paused'}
                        </button>

                        {/* Test Email */}
                        <button
                          onClick={() => handleTestDispatch(alert)}
                          disabled={testSendingId === alert.id}
                          title="Simulate immediate matching email"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Outbox Log & Email Preview */}
        {activeTab === 'outbox' && (
          <div className="overflow-y-auto flex-1 mt-3 pr-1 space-y-3">
            {previewEmail ? (
              <div className="space-y-3">
                <button
                  onClick={() => setPreviewEmail(null)}
                  className="text-xs text-indigo-600 hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
                >
                  <span>&larr; Back to Dispatched Emails</span>
                </button>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                  <div className="bg-slate-900 text-white p-3.5 text-xs">
                    <p className="font-bold text-sm text-indigo-300">{previewEmail.subject}</p>
                    <div className="flex justify-between items-center text-slate-400 text-[11px] mt-1">
                      <span>To: {previewEmail.recipient_name} &lt;{previewEmail.to_email}&gt;</span>
                      <span>{new Date(previewEmail.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div
                    className="p-4 overflow-x-auto text-xs"
                    dangerouslySetInnerHTML={{ __html: previewEmail.body_html }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  History of automated campus notification emails generated by the system:
                </p>

                {dispatches.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                    <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No emails in outbox yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Emails are dispatched when new found items match active subscription keywords.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dispatches.map((mail) => (
                      <div
                        key={mail.id}
                        onClick={() => setPreviewEmail(mail)}
                        className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{mail.subject}</p>
                          <p className="text-slate-500 text-[11px] truncate">
                            To: {mail.to_email} • {new Date(mail.sent_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center space-x-1 text-indigo-600 font-semibold text-[11px]">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer info & Done button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0 mt-3">
          <div className="flex items-center space-x-1.5 text-emerald-700 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Campus Verified Dispatcher</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer min-h-[40px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
