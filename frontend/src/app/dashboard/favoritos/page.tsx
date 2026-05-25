'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { formatBRL, TAG_CONFIG } from '@/lib/utils';
import Link from 'next/link';
import {
  Heart, Trash2, ExternalLink, TrendingUp, MapPin,
  BedDouble, Home, Activity, Clock, StickyNote, Loader2,
  Bookmark, AlertCircle
} from 'lucide-react';

interface SavedEntry {
  id: string;
  notes?: string;
  createdAt: string;
  property: {
    id: string; address: string; area: string; price: number;
    bedrooms: number; propertyType: string; tag: string; score: number;
    grossYield: number; cashflow: number; belowMarketPct: number;
    motivatedSeller: boolean; liquidityIndex: string; listingUrl: string;
    analysisStatus: string; aiSummary: string; priceReduced: boolean;
    priceReducedBy: number; updatedAt: string;
  };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return 'hoje';
  if (d === 1) return 'ontem';
  return `${d}d atrás`;
}

function yieldColor(y: number) {
  if (y >= 9) return 'text-green-600';
  if (y >= 7) return 'text-green-500';
  if (y >= 5) return 'text-yellow-500';
  return 'text-red-500';
}

export default function FavoritosPage() {
  const qc = useQueryClient();
  const [editingNotes, setEditingNotes] = useState<{ id: string; text: string } | null>(null);

  const { data: savedList, isLoading } = useQuery<SavedEntry[]>({
    queryKey: ['saved-properties'],
    queryFn: () => propertiesApi.saved().then(r => r.data),
  });

  const removeMutation = useMutation({
    mutationFn: (propertyId: string) => propertiesApi.unsave(propertyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-properties'] }),
  });

  const saveMutation = useMutation({
    mutationFn: ({ propertyId, notes }: { propertyId: string; notes: string }) =>
      propertiesApi.save(propertyId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-properties'] });
      setEditingNotes(null);
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  const list = savedList || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-blue-600" fill="currentColor" />
            Minha Watchlist
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {list.length} {list.length === 1 ? 'imóvel salvo' : 'imóveis salvos'}
          </p>
        </div>
        <Link
          href="/dashboard/dealflow"
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
        >
          <TrendingUp className="h-4 w-4" /> Explorar DealFlow
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center">
          <Heart className="h-14 w-14 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">Watchlist vazia</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
            Salve imóveis do DealFlow para acompanhar suas oportunidades favoritas aqui.
          </p>
          <Link
            href="/dashboard/dealflow"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="h-4 w-4" /> Ver oportunidades
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map(entry => {
            const p = entry.property;
            const tag = p.tag as keyof typeof TAG_CONFIG;
            const isAnalyzed = p.analysisStatus === 'COMPLETED';

            return (
              <div key={entry.id} className="bg-white rounded-2xl border hover:border-blue-200 transition-all shadow-sm group">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Score */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm ${
                      !isAnalyzed ? 'bg-gray-100' :
                      p.score >= 8.5 ? 'bg-green-500' : p.score >= 7 ? 'bg-yellow-500' :
                      p.score >= 5 ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {isAnalyzed ? (
                        <>
                          <span className="text-white text-sm font-black leading-none">{p.score?.toFixed(1)}</span>
                          <span className="text-white/70 text-[9px]">score</span>
                        </>
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {tag && isAnalyzed && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${TAG_CONFIG[tag]?.color}`}>
                                {TAG_CONFIG[tag]?.label}
                              </span>
                            )}
                            {p.motivatedSeller && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-200">
                                🔥 Motivado
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-gray-900 truncate">{p.address}</p>
                          <div className="flex items-center gap-3 text-gray-400 text-xs mt-1">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.area}</span>
                            <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{p.bedrooms}q</span>
                            <span className="flex items-center gap-1"><Home className="h-3 w-3" />{p.propertyType}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Salvo {timeAgo(entry.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900">{formatBRL(p.price)}</p>
                          {p.priceReduced && p.priceReducedBy > 0 && (
                            <p className="text-xs text-green-600 font-semibold">↓ {formatBRL(p.priceReducedBy)}</p>
                          )}
                        </div>
                      </div>

                      {/* Metrics */}
                      {isAnalyzed && (
                        <div className="flex items-center gap-5 mt-3 pt-3 border-t">
                          <div>
                            <span className={`text-base font-black ${yieldColor(p.grossYield ?? 0)}`}>
                              {p.grossYield?.toFixed(1)}%
                            </span>
                            <span className="text-gray-400 text-xs ml-1">yield</span>
                          </div>
                          <div>
                            <span className={`text-sm font-bold ${(p.cashflow ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {formatBRL(p.cashflow)}
                            </span>
                            <span className="text-gray-400 text-xs ml-1">/mês</span>
                          </div>
                          {p.belowMarketPct != null && (
                            <div>
                              <span className={`text-sm font-bold ${p.belowMarketPct > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                                {p.belowMarketPct > 0 ? `↓${p.belowMarketPct?.toFixed(1)}%` : `↑${Math.abs(p.belowMarketPct)?.toFixed(1)}%`}
                              </span>
                              <span className="text-gray-400 text-xs ml-1">vs média</span>
                            </div>
                          )}
                          {p.liquidityIndex && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              p.liquidityIndex === 'ALTA' ? 'bg-green-50 text-green-600' :
                              p.liquidityIndex === 'MEDIA' ? 'bg-yellow-50 text-yellow-600' :
                              'bg-red-50 text-red-500'
                            }`}>
                              <Activity className="h-2.5 w-2.5" />
                              {p.liquidityIndex === 'ALTA' ? 'Alta' : p.liquidityIndex === 'MEDIA' ? 'Média' : 'Baixa'} liq.
                            </span>
                          )}

                          {/* Actions */}
                          <div className="ml-auto flex items-center gap-2">
                            <Link
                              href={`/dashboard/dealflow/${p.id}`}
                              className="text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                            >
                              <TrendingUp className="h-3 w-3" /> Analisar
                            </Link>
                            {p.listingUrl && (
                              <a href={p.listingUrl} target="_blank" rel="noopener noreferrer"
                                className="text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <button
                              onClick={() => removeMutation.mutate(p.id)}
                              disabled={removeMutation.isPending}
                              className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              title="Remover da watchlist"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {!isAnalyzed && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-gray-400">Aguardando análise</span>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/dealflow/${p.id}`}
                              className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                              Analisar agora
                            </Link>
                            <button onClick={() => removeMutation.mutate(p.id)}
                              className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes section */}
                  {editingNotes?.id === entry.id ? (
                    <div className="mt-3 pt-3 border-t">
                      <textarea
                        value={editingNotes.text}
                        onChange={e => setEditingNotes(n => n ? { ...n, text: e.target.value } : n)}
                        placeholder="Adicione uma nota sobre este imóvel..."
                        rows={2}
                        className="w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => saveMutation.mutate({ propertyId: p.id, notes: editingNotes.text })}
                          disabled={saveMutation.isPending}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {saveMutation.isPending ? 'Salvando...' : 'Salvar nota'}
                        </button>
                        <button
                          onClick={() => setEditingNotes(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t">
                      {entry.notes ? (
                        <div className="flex items-start gap-2 group/note">
                          <StickyNote className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-600 flex-1 italic">{entry.notes}</p>
                          <button
                            onClick={() => setEditingNotes({ id: entry.id, text: entry.notes ?? '' })}
                            className="text-[10px] text-gray-400 hover:text-blue-600 opacity-0 group-hover/note:opacity-100 transition-all"
                          >
                            editar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingNotes({ id: entry.id, text: '' })}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <StickyNote className="h-3 w-3" />
                          Adicionar nota
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
