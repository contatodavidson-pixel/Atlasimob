'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { NOTIFICATIONS_SSE_URL } from '@/lib/api';

export interface DealNotification {
  id: string;
  address: string;
  area: string;
  price: number;
  score: number;
  grossYield: number;
  cashflow: number;
  belowMarketPct: number;
  timestamp: string;
  read?: boolean;
}

export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<DealNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token || typeof window === 'undefined') return;

    const url = `${NOTIFICATIONS_SSE_URL}?token=${token}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('strong_deal', (e) => {
      const data: DealNotification = JSON.parse(e.data);
      data.read = false;
      setNotifications(prev => [data, ...prev].slice(0, 20));
      setUnreadCount(c => c + 1);
    });

    es.onerror = () => {
      // Reconnect silently — browser handles it automatically for EventSource
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markAllRead };
}
