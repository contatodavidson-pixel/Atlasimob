'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { formatBRL, TAG_CONFIG } from '@/lib/utils';
import { useNotifications, DealNotification } from '@/hooks/useNotifications';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import {
  Flame, TrendingUp, Activity, Clock, Zap,
  ExternalLink, Filter, BedDouble, Home, MapPin
} from 'lucide-react';

type FilterType = 'ALL' | 'STRONG_DEAL' | 'MARGINAL' | 'AVOID';

interface Property {
  id: string; address: string; area: string; price: number; bedrooms: number;
  propertyType: string; tag: string; score: number; grossYield: number;
  netYield: number; cashflow: number; belowMarketPct: number;
  motivatedSeller: boolean; liquidityIndex: string; priceReduced: boolean;
  priceReducedBy: number; analysisStatus: string; listingUrl: string;
  aiSummary: string; createdAt: string; updatedAt: string;
}

function yieldColor(y: number) {
  if (y >= 9) return 'text-green-400';
  if (y >= 7) return 'text-green-500';
  if (y >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreColor(s: number) {
  if (s >= 8.5) return 'bg-green-500';
  if (s >= 7) return 'bg-yellow-500';
  if (s >= 5) return 'bg-orange-500';
  return 'bg-red-500';
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

function FeedCard({ p, isNew }: { p: Property; isNew?: boolean }) {
  const tag = p.tag as keyof typeof TAG_CONFIG;
  return (
    <div className={`group relative border-b border-white/5 hover:bg-white/3 transition-all duration-300 ${isNew ? 'animate-pulse-once bg-green-500/5 border-l-2 border-l-green-500' : ''}`}>
      <div className="px-6 py-4">
        <div className="flex items-start gap-4">
          {/* Score badge */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${scoreColor(p.score ?? 0)} flex items-center justify-center shadow-lg`}>
            <span className="text-white text-sm font-black">{p.score?.toFixed(1) ?? '—'}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {tag && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${TAG_CONFIG[tag]?.color}`}>
                      {TAG_CONFIG[tag]?.label}
                    </span>
                  )}
                  {p.motivatedSeller && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                      <Flame className="h-2.5 w-2.5" /> Motivado
                    </span>
                  )}
                  {p.priceReduced && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      ↓ R${p.priceReducedBy?.toLocaleString('pt-BR')}
                    </span>
                  )}
                  {isNew && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" /> NOVO
                    </span>
                  )}
                </div>
                <p className="text-white/90 text-sm font-semibold mt-1 truncate">{p.address}</p>
                <div className="flex items-center gap-3 mt-0.5 text-white/40 text-xs">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.area}</span>
                  <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{p.bedrooms}q</span>
                  <span className="flex items-center gap-1"><Home className="h-3 w-3" />{p.propertyType}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white font-bold text-sm">{formatBRL(p.price)}</p>
                <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" />{timeAgo(p.updatedAt || p.createdAt)}
                </p>
              </div>
            </div>

            {/* Metrics row */}
            <div className="flex items-center gap-5 mt-2.5">
              <div>
                <span className={`text-base font-black ${yieldColor(p.grossYield ?? 0)}`}>
                  {p.grossYield?.toFixed(1) ?? '—'}%
                </span>
                <span className="text-white/30 text-xs ml-1">yield</span>
              </div>
              <div>
                <span className={`text-base font-black ${(p.cashflow ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatBRL(p.cashflow)}
                </span>
                <span className="text-white/30 text-xs ml-1">/mês</span>
              </div>
              {p.belowMarketPct != null && (
                <div>
                  <span className={`text-sm font-bold ${p.belowMarketPct > 0 ? 'text-blue-400' : 'text-white/30'}`}>
                    {p.belowMarketPct > 0 ? `↓${p.belowMarketPct?.toFixed(1)}%` : `↑${Math.abs(p.belowMarketPct)?.toFixed(1)}%`}
                  </span>
                  <span className="text-white/30 text-xs ml-1">vs média</span>
                </div>
              )}
              {p.liquidityIndex && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  p.liquidityIndex === 'ALTA' ? 'bg-green-500/10 text-green-400' :
                  p.liquidityIndex === 'MEDIA' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  <Activity className="inline h-2.5 w-2.5 mr-0.5" />
                  {p.liquidityIndex === 'ALTA' ? 'Alta' : p.liquidityIndex === 'MEDIA' ? 'Média' : 'Baixa'} liq.
                </span>
              )}
              <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/dashboard/dealflow/${p.id}`}
                  className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 rounded-lg font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Analisar
                </Link>
                {p.listingUrl && (
                  <a href={p.listingUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-white/5 text-white/50 hover:bg-white/10 px-3 py-1 rounded-lg font-medium">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {p.aiSummary && (
              <p className="text-white/30 text-xs mt-2 line-clamp-1 italic">{p.aiSummary}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { token } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [liveItems, setLiveItems] = useState<Property[]>([]);
  const topRef = useRef<HTMLDivElement>(null);

  const { notifications } = useNotifications(token);

  const { data, isLoading } = useQuery({
    queryKey: ['properties-feed'],
    queryFn: () => propertiesApi.list({ limit: 50, sortBy: 'updatedAt', sortOrder: 'desc' }).then(r => r.data),
    refetchInterval: 60000,
  });

  // Inject SSE strong_deals into the top of the feed
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    const asProperty: Property = {
      id: latest.id,
      address: latest.address,
      area: latest.area,
      price: latest.price,
      bedrooms: 0,
      propertyType: '',
      tag: 'STRONG_DEAL',
      score: latest.score,
      grossYield: latest.grossYield,
      netYield: 0,
      cashflow: latest.cashflow,
      belowMarketPct: latest.belowMarketPct,
      motivatedSeller: false,
      liquidityIndex: '',
      priceReduced: false,
      priceReducedBy: 0,
      analysisStatus: 'COMPLETED',
      listingUrl: '',
      aiSummary: '',
      createdAt: latest.timestamp,
      updatedAt: latest.timestamp,
    };
    setLiveItems(prev => {
      if (prev.find(p => p.id === latest.id)) return prev;
      return [asProperty, ...prev];
    });
    setNewIds(prev => new Set([...prev, latest.id]));
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(latest.id); return n; }), 8000);
  }, [notifications.length]);

  const properties: Property[] = [
    ...liveItems,
    ...((data?.data || []) as Property[]).filter(p => !liveItems.find(l => l.id === p.id)),
  ].filter(p => p.analysisStatus === 'COMPLETED' && (filter === 'ALL' || p.tag === filter));

  const stats = {
    total: (data?.data || []).filter((p: Property) => p.analysisStatus === 'COMPLETED').length,
    strong: (data?.data || []).filter((p: Property) => p.tag === 'STRONG_DEAL').length,
    avgYield: (() => {
      const analyzed = (data?.data || []).filter((p: Property) => p.grossYield > 0);
      return analyzed.length ? (analyzed.reduce((s: number, p: Property) => s + p.grossYield, 0) / analyzed.length).toFixed(1) : '—';
    })(),
  };

  const FILTERS: { key: FilterType; label: string; color: string }[] = [
    { key: 'ALL', label: 'Todos', color: 'bg-white/10 text-white hover:bg-white/15' },
    { key: 'STRONG_DEAL', label: '🔥 Strong Deal', color: 'bg-green-500/15 text-green-400 hover:bg-green-500/20 border border-green-500/20' },
    { key: 'MARGINAL', label: 'Moderado', color: 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20' },
    { key: 'AVOID', label: 'Evitar', color: 'bg-red-500/15 text-red-400 hover:bg-red-500/20 border border-red-500/20' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-gray-950 rounded-2xl overflow-hidden border border-white/5">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 bg-gray-950">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white font-black text-lg">Feed ao Vivo</span>
            </div>
            <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">ATLAS RADAR</span>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-6 text-xs">
            <div className="text-center">
              <p className="text-white font-bold text-base">{stats.strong}</p>
              <p className="text-white/30">Strong Deals</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">{stats.total}</p>
              <p className="text-white/30">Analisados</p>
            </div>
            <div className="text-center">
              <p className={`font-bold text-base ${yieldColor(Number(stats.avgYield))}`}>{stats.avgYield}%</p>
              <p className="text-white/30">Yield médio</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">{liveItems.length}</p>
              <p className="text-white/30 flex items-center gap-1"><Zap className="h-2.5 w-2.5" />Tempo real</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-white/30" />
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${f.color} ${filter === f.key ? 'ring-1 ring-white/20' : 'opacity-60 hover:opacity-100'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto" ref={topRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-white/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm">Conectando ao radar...</span>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <Activity className="h-12 w-12 mb-3" />
            <p className="text-sm">Aguardando sinais do mercado...</p>
            <p className="text-xs mt-1 text-white/10">Novos imóveis aparecerão aqui em tempo real</p>
          </div>
        ) : (
          properties.map(p => (
            <FeedCard key={p.id} p={p} isNew={newIds.has(p.id)} />
          ))
        )}
      </div>
    </div>
  );
}
