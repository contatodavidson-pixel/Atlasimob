'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, TrendingUp, Bot, Users,
  Bell, BarChart3, Settings, LogOut, Menu, Landmark,
  Radar, Map, Loader2, Flame, X, Zap, GitCompare, Bookmark
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { formatBRL } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard, track: null },
  { href: '/dashboard/dealflow', label: 'DealFlow', icon: TrendingUp, track: null },
  { href: '/dashboard/feed', label: 'Feed ao Vivo', icon: Zap, track: 'feed' },
  { href: '/dashboard/mapa', label: 'Mapa de Oportunidades', icon: Map, track: 'map' },
  { href: '/dashboard/comparador', label: 'Comparador CDI/FII', icon: GitCompare, track: 'comparador' },
  { href: '/dashboard/favoritos', label: 'Watchlist', icon: Bookmark, track: 'watchlist' },
  { href: '/dashboard/agent', label: 'Agente IA', icon: Bot, track: null },
  { href: '/dashboard/investors', label: 'Investidores', icon: Users, track: null },
  { href: '/dashboard/radar', label: 'Radar de Cidades', icon: Radar, track: null },
  { href: '/dashboard/imobiliarias', label: 'Imobiliárias', icon: Landmark, track: null },
  { href: '/dashboard/alerts', label: 'Alertas', icon: Bell, track: 'alert' },
  { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart3, track: null },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings, track: null },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAllRead } = useNotifications(token);
  const { permission, requestPermission, notify } = usePushNotifications();

  // Auto-push browser notification for new strong_deals
  const lastNotifId = useRef<string | null>(null);
  useEffect(() => {
    if (!notifications.length) return;
    const latest = notifications[0];
    if (latest.id === lastNotifId.current) return;
    lastNotifId.current = latest.id;
    if (permission === 'granted') {
      notify(`🏠 STRONG DEAL — ${latest.area}`, {
        body: `Yield ${latest.grossYield?.toFixed(1)}% · Score ${latest.score?.toFixed(1)} · ${formatBRL(latest.price)}`,
        tag: `deal-${latest.id}`,
        data: { url: `/dashboard/dealflow/${latest.id}` },
      });
    }
  }, [notifications.length]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !user) router.push('/login'); }, [user, router, mounted]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (mounted && user && user.onboardingCompleted === false && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [mounted, user, pathname, router]);

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!mounted) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:flex'
      )}>
        <div className="h-20 flex items-center px-4 border-b bg-gray-950">
          <Link href="/dashboard">
            <img src="/atlas-logo-dark.png" alt="Atlas" className="h-16 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 text-sm font-bold">{user.name[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-4 gap-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-gray-900 flex-1">
            {nav.find(n => n.href === pathname)?.label || 'Dashboard'}
          </h1>

          {/* Notification Bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => { setBellOpen(v => !v); if (!bellOpen) markAllRead(); }}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <span className="font-semibold text-gray-900 text-sm">Notificações em tempo real</span>
                  <div className="flex items-center gap-2">
                    {permission !== 'granted' && permission !== 'denied' && (
                      <button
                        onClick={requestPermission}
                        className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-lg font-semibold transition-colors"
                      >
                        Ativar push
                      </button>
                    )}
                    <button onClick={() => setBellOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-gray-400">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aguardando novos deals...</p>
                      <p className="text-xs mt-1 text-gray-300">Você será notificado quando um STRONG_DEAL for detectado</p>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <Link
                        key={i}
                        href={`/dashboard/dealflow/${n.id}`}
                        onClick={() => setBellOpen(false)}
                        className="flex gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-0 transition-colors"
                      >
                        <div className="flex-shrink-0 w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                          <Flame className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{n.area}</p>
                          <p className="text-xs text-gray-500 truncate">{n.address}</p>
                          <div className="flex gap-3 mt-1 text-xs">
                            <span className="text-green-600 font-bold">Yield {n.grossYield?.toFixed(1)}%</span>
                            <span className="text-blue-600 font-bold">Score {n.score?.toFixed(1)}/10</span>
                            <span className="text-gray-500">{formatBRL(n.price)}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-300 flex-shrink-0 mt-1">
                          {new Date(n.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
