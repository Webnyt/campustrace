/**
 * OneSignal Web Push Integration Service
 * Enables closed-tab native push notifications to reach students and staff
 * even when their browser tab is completely closed.
 */

import { LostFoundItem } from '../types';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => Promise<void> | void>;
    OneSignal?: any;
    ONESIGNAL_APP_ID?: string;
  }
}

const ONESIGNAL_STORAGE_KEY = 'campustrace_onesignal_app_id';
const DEFAULT_APP_ID =
  (import.meta as any).env?.VITE_ONESIGNAL_APP_ID || '';

export function getOneSignalAppId(): string {
  try {
    const saved = localStorage.getItem(ONESIGNAL_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore
  }
  return DEFAULT_APP_ID;
}

export function saveOneSignalAppId(appId: string): void {
  try {
    localStorage.setItem(ONESIGNAL_STORAGE_KEY, appId.trim());
  } catch {
    // ignore
  }
}

let isInitialized = false;

export async function initOneSignal(appIdOverride?: string): Promise<boolean> {
  const appId = appIdOverride || getOneSignalAppId();
  if (!appId) {
    return false;
  }

  if (typeof window === 'undefined') return false;

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  return new Promise((resolve) => {
    window.OneSignalDeferred!.push(async (OneSignal) => {
      try {
        if (!isInitialized) {
          await OneSignal.init({
            appId: appId,
            serviceWorkerParam: { scope: '/' },
            serviceWorkerPath: '/OneSignalSDKWorker.js',
            notifyButton: {
              enable: false,
            },
            allowLocalhostAsSecureOrigin: true,
          });
          isInitialized = true;
        }
        resolve(true);
      } catch (err) {
        console.warn('OneSignal initialization warning:', err);
        resolve(false);
      }
    });
  });
}

export async function isOneSignalSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        const optedIn = OneSignal?.User?.PushSubscription?.optedIn;
        resolve(Boolean(optedIn));
      } catch {
        resolve(false);
      }
    });
  });
}

export async function optInOneSignalPush(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.User.PushSubscription.optIn();
        const optedIn = OneSignal.User.PushSubscription.optedIn;
        resolve(Boolean(optedIn));
      } catch (err) {
        console.warn('OneSignal opt-in error:', err);
        resolve(false);
      }
    });
  });
}

export async function sendOneSignalItemNotification(
  item: LostFoundItem,
  matchReason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/onesignal/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: item.item_id,
        item_name: item.item_name,
        category_name: item.category_name,
        location: item.location_found,
        image_path: item.image_path,
        match_reason: matchReason || 'CampusTrace Match Found',
      }),
    });
    const data = await res.json();
    return {
      success: res.ok,
      message: data.message || (res.ok ? 'Push notification queued for OneSignal subscribers.' : 'Push notification skipped.'),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error sending OneSignal push notification';
    return { success: false, message: msg };
  }
}
