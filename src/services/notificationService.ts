import { LostFoundItem, EmailAlertSubscription } from '../types';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

const PUSH_ENABLED_KEY = 'campustrace_push_notifications_enabled';

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushPermissionStatus(): PushPermissionStatus {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
}

export function isPushEnabled(): boolean {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }
  const saved = localStorage.getItem(PUSH_ENABLED_KEY);
  return saved !== 'false';
}

export function setPushEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export async function requestPushPermission(): Promise<PushPermissionStatus> {
  if (!isPushSupported()) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setPushEnabled(true);
    }
    return perm as PushPermissionStatus;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return getPushPermissionStatus();
  }
}

// Synthesized clean audio chime using Web Audio API (Zero external audio file dependency)
export function playNotificationChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (higher note)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (harmonic resolved note)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.48);
  } catch (e) {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  item: LostFoundItem;
  matchReason?: string;
  onClick?: () => void;
}

export function sendBrowserPushNotification({
  title,
  body,
  item,
  matchReason,
  onClick,
}: PushNotificationPayload): Notification | null {
  playNotificationChime();

  if (!isPushSupported() || Notification.permission !== 'granted' || !isPushEnabled()) {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: item.image_path || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `campustrace-item-${item.item_id}`,
      data: {
        itemId: item.item_id,
        location: item.location_found,
      },
      requireInteraction: false,
    });

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      notification.close();
      if (onClick) {
        onClick();
      }
    };

    return notification;
  } catch (err) {
    console.warn('Native notification dispatch fallback:', err);
    return null;
  }
}

export function checkItemMatchesSavedAlerts(
  item: LostFoundItem,
  alerts: EmailAlertSubscription[]
): { isMatch: boolean; reason: string; matchedAlert?: EmailAlertSubscription } {
  const activeAlerts = alerts.filter((a) => a.active);

  for (const alert of activeAlerts) {
    const catMatches =
      !alert.category_id || alert.category_id === 'All' || alert.category_id === item.category_id;

    const kw = (alert.keyword || '').toLowerCase().trim();
    const itemHaystack = `${item.item_name} ${item.description} ${item.location_found}`.toLowerCase();

    let matched = false;
    let reason = '';

    if (kw) {
      if (itemHaystack.includes(kw) && catMatches) {
        matched = true;
        reason = `Matches your alert for "${alert.keyword}" in ${item.category_name}`;
      }
    } else if (catMatches && alert.category_id !== 'All') {
      matched = true;
      reason = `Matches your category alert: ${item.category_name}`;
    }

    if (matched && alert.location_filter && alert.location_filter.trim()) {
      if (!item.location_found.toLowerCase().includes(alert.location_filter.toLowerCase())) {
        matched = false;
      }
    }

    if (matched) {
      return { isMatch: true, reason, matchedAlert: alert };
    }
  }

  return { isMatch: false, reason: '' };
}
