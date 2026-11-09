import { EmailAlertSubscription, DispatchedEmail, LostFoundItem } from '../types';

export async function fetchEmailAlerts(email?: string): Promise<EmailAlertSubscription[]> {
  try {
    const url = email ? `/api/email-alerts?email=${encodeURIComponent(email)}` : '/api/email-alerts';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch email alerts');
    const data = await res.json();
    return data.alerts || [];
  } catch (err) {
    console.warn('Error fetching email alerts, using fallback:', err);
    return getLocalAlerts();
  }
}

export async function createEmailAlert(
  alert: Partial<EmailAlertSubscription>
): Promise<{ success: boolean; alert?: EmailAlertSubscription; message: string; matchesCount?: number }> {
  try {
    const res = await fetch('/api/email-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create email alert');
    }
    // Update local backup
    saveLocalAlert(data.alert);
    return {
      success: true,
      alert: data.alert,
      message: data.message,
      matchesCount: data.existingMatchesCount,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create email alert';
    return { success: false, message: msg };
  }
}

export async function deleteEmailAlert(alertId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/email-alerts/${alertId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      removeLocalAlert(alertId);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Error deleting email alert:', err);
    removeLocalAlert(alertId);
    return true;
  }
}

export async function toggleEmailAlert(alertId: string, active: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/email-alerts/${alertId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Error toggling email alert:', err);
    return false;
  }
}

export async function fetchDispatchedEmails(email?: string): Promise<DispatchedEmail[]> {
  try {
    const url = email
      ? `/api/email-alerts/dispatched?email=${encodeURIComponent(email)}`
      : '/api/email-alerts/dispatched';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch dispatched emails');
    const data = await res.json();
    return data.dispatches || [];
  } catch (err) {
    console.warn('Error fetching dispatched emails:', err);
    return [];
  }
}

export async function sendItemAlertEmail(
  toEmail: string,
  itemId: number | string,
  recipientName?: string,
  reason?: string
): Promise<{ success: boolean; message: string; email?: DispatchedEmail }> {
  try {
    const res = await fetch('/api/send-alert-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_email: toEmail,
        item_id: itemId,
        recipient_name: recipientName,
        reason,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to dispatch email');
    }
    return {
      success: true,
      message: data.message,
      email: data.dispatched,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error sending email alert';
    return { success: false, message: msg };
  }
}

// Local Storage helpers for resilient persistence across offline or demo states
const LOCAL_ALERTS_KEY = 'campustrace_email_alerts';

function getLocalAlerts(): EmailAlertSubscription[] {
  try {
    const raw = localStorage.getItem(LOCAL_ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAlert(alert: EmailAlertSubscription) {
  try {
    const existing = getLocalAlerts().filter((a) => a.id !== alert.id);
    existing.unshift(alert);
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

function removeLocalAlert(alertId: string) {
  try {
    const existing = getLocalAlerts().filter((a) => a.id !== alertId);
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}
