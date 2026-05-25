'use client';
import { useState, useEffect } from 'react';

export type PushPermission = 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission as PushPermission);
  }, []);

  useEffect(() => {
    if (!supported) return;
    // Register service worker
    navigator.serviceWorker.register('/sw.js').catch(() => {/* non-critical */});
  }, [supported]);

  const requestPermission = async (): Promise<PushPermission> => {
    if (!supported) return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result as PushPermission);
    return result as PushPermission;
  };

  // Send a local notification (for testing / SSE fallback)
  const notify = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        icon: '/atlas-logo.png',
        badge: '/atlas-logo.png',
        ...options,
      });
    });
  };

  return { permission, supported, requestPermission, notify };
}
