'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { formatBRL, TAG_CONFIG, SOURCE_LABELS, BRAZILIAN_CITIES } from '@/lib/utils';
import Link from 'next/link';
import {
  Search, Filter, RefreshCw, ExternalLink, Bot, Heart, Loader2,
  TrendingUp, Home, MapPin, BedDouble, ChevronLeft, ChevronRight, Flame, Activity
} from 'lucide-react';

const TAG_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'STRONG_DEAL', label: 'Excelente Oportunidade' },
  { value: 'MARGINAL', label: 'Oportunidade Moderada' },
  { value: 'AVOID', label: 'Não Recomendado' },
];

export default function DealflowPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    area: '', minPrice: '', maxPrice: '', minBedrooms: '',
    tag: '', priceReduced: false, motivatedSeller: false, page: 1,
  });
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertiesApi.list({
      ...filters,
      priceReduced: filters.priceReduced || undefined,
      limit: 20,
    }).then(r => r.data),
  });

  const scrapeMutation = useMutation({
    mutationFn: () => propertiesApi.scrape({ city: filters.area || 'São Paulo', source: 'all' }),
    onSuccess: () => { alert('Scraping iniciado! Os imóveis serão importados em alguns minutos.'); },
  });

  const analyzeAll = async () => {
    const pending = data?.data?.filter((p: { analysisStatus: string }) => p.analysisStatus === 'PENDING') || [];
    for (const p of pending) {
      setAnalyzingId(p.id);
      await propertiesApi.analyze(p.id);
      await new Promise(r => setTimeout(r, 2000));
    }
    setAnalyzingId(null);
    qc.invalidateQueries({ queryKey: ['properties'] });
  };

  const properties = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <select
              value={filters.area}
              onChange={e => setFilters(f => ({ ...f, area: e.target.value, page: 1 }))}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as cidades</option>
              {BRAZILIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input
            value={filters.minPrice}
            onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value, page: 1 }))}
            placeholder="Preço mín (R$)"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value, page: 1 }))}
            placeholder="Preço máx (R$)"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.tag}
            onChange={e => setFilters(f => ({ ...f, tag: e.target.value, page: 1 }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TAG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.priceReduced}
                onChange={e => setFilters(f => ({ ...f, priceReduced: e.target.checked, page: 1 }))}
                className="rounded"
              />
              Preço reduzido
            </label>
            <label className="flex items-center gap-2 text-sm text-orange-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={filters.motivatedSeller}
                onChange={e => setFilters(f => ({ ...f, motivatedSeller: e.target.checked, page: 1 }))}
                className="rounded accent-orange-500"
              />
              <Flame className="h-3.5 w-3.5" />
              Vendedor motivado
            </label>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => scrapeMutation.mutate()}
            disabled={scrapeMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {scrapeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Buscar Novos
          </button>
          <button
            onClick={analyzeAll}
            className="flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <Bot className="h-4 w-4" />
            Analisar Pendentes
          </button>
          {pagination && (
            <span className="ml-auto text-sm text-gray-500 self-center">
              {pagination.total} imóveis encontrados
            </span>
          )}
        </div>
      </div>

      {/* Property Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p: {
            id: string; title: string; address: string; area: string; source: string;
            price: number; bedrooms: number; propertyType: string; imageUrls: string[];
            grossYield: number; netYield: number; cashflow: number; roi: number;
            tag: keyof typeof TAG_CONFIG; analysisStatus: string; listingUrl: string;
            priceReduced: boolean; priceReducedBy: number; originalPrice: number;
            motivatedSeller: boolean; aiSummary: string;
            score: number; belowMarketPct: number; liquidityIndex: string;
          }) => (
            <div key={p.id} className="bg-white rounded-xl border hover:shadow-md transition-shadow overflow-hidden">
              {/* Image */}
              <div className="relative h-40 bg-gray-100">
                {p.imageUrls?.[0] ? (
                  <img src={p.imageUrls[0]} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {p.tag && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TAG_CONFIG[p.tag]?.color}`}>
                      {TAG_CONFIG[p.tag]?.label}
                    </span>
                  )}
                  {p.priceReduced && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      ↓ R${p.priceReducedBy?.toLocaleString('pt-BR')}
                    </span>
                  )}
                  {p.motivatedSeller && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-0.5">
                      <Flame className="h-3 w-3" /> Motivado
                    </span>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                  <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded">{SOURCE_LABELS[p.source] || p.source}</span>
                  {p.score != null && (
                    <div className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                      p.score >= 8 ? 'bg-green-100 text-green-700 border-green-300'
                      : p.score >= 6 ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                      : 'bg-red-100 text-red-700 border-red-300'
                    }`}>
                      {p.score?.toFixed(1)}/10
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{p.address}</h3>
                <p className="text-xs text-gray-500 mb-1">{p.area} · {p.bedrooms} quartos · {p.propertyType}</p>
                {p.belowMarketPct != null && p.analysisStatus === 'COMPLETED' && (
                  <p className={`text-xs font-medium mb-2 ${p.belowMarketPct > 0 ? 'text-green-600' : 'text-orange-500'}`}>
                    {p.belowMarketPct > 0 ? `↓ ${p.belowMarketPct?.toFixed(1)}% abaixo da média da região` : `↑ ${Math.abs(p.belowMarketPct)?.toFixed(1)}% acima da média`}
                  </p>
                )}

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-bold text-gray-900">{formatBRL(p.price)}</span>
                  {p.originalPrice && p.originalPrice > p.price && (
                    <span className="text-xs text-gray-400 line-through">{formatBRL(p.originalPrice)}</span>
                  )}
                </div>

                {p.analysisStatus === 'COMPLETED' && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: 'Yield Bruto', value: `${p.grossYield?.toFixed(2)}%` },
                      { label: 'Yield Líquido', value: `${p.netYield?.toFixed(2)}%` },
                      { label: 'Cashflow/mês', value: formatBRL(p.cashflow), highlight: p.cashflow > 0 },
                      { label: 'ROI', value: `${p.roi?.toFixed(2)}%` },
                    ].map(m => (
                      <div key={m.label} className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className={`text-sm font-bold ${m.highlight ? 'text-green-600' : 'text-gray-900'}`}>{m.value}</div>
                        <div className="text-xs text-gray-400">{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {p.analysisStatus === 'PENDING' && (
                  <div className="bg-yellow-50 text-yellow-700 text-xs px-3 py-2 rounded-lg mb-3">
                    Aguardando análise da IA
                  </div>
                )}

                {p.analysisStatus === 'ANALYZING' || p.id === analyzingId ? (
                  <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg mb-3 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Analisando...
                  </div>
                ) : null}

                {p.aiSummary && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.aiSummary}</p>
                )}

                {p.liquidityIndex && (
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-flex items-center gap-1 ${
                    p.liquidityIndex === 'ALTA' ? 'bg-green-100 text-green-700'
                    : p.liquidityIndex === 'MEDIA' ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                  }`}>
                    <Activity className="h-3 w-3" />
                    {p.liquidityIndex === 'ALTA' ? 'Alta Liquidez' : p.liquidityIndex === 'MEDIA' ? 'Liquidez Média' : 'Baixa Liquidez'}
                  </div>
                )}

                <div className="flex gap-1.5 flex-wrap">
                  <Link
                    href={`/dashboard/dealflow/${p.id}`}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium py-1.5 rounded-lg hover:bg-blue-100"
                  >
                    <TrendingUp className="h-3 w-3" /> Detalhes
                  </Link>
                  <button
                    onClick={() => propertiesApi.save(p.id).catch(() => propertiesApi.unsave(p.id)).finally(() => qc.invalidateQueries({ queryKey: ['saved-properties'] }))}
                    className="flex items-center justify-center p-1.5 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                    title="Salvar na watchlist"
                  >
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                  {p.analysisStatus === 'PENDING' && (
                    <button
                      onClick={() => propertiesApi.analyze(p.id).then(() => qc.invalidateQueries({ queryKey: ['properties'] }))}
                      className="flex-1 flex items-center justify-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium py-1.5 rounded-lg hover:bg-purple-100"
                    >
                      <Bot className="h-3 w-3" /> Analisar
                    </button>
                  )}
                  <a
                    href={p.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 bg-gray-50 text-gray-700 text-xs font-medium py-1.5 px-3 rounded-lg hover:bg-gray-100"
                  >
                    <ExternalLink className="h-3 w-3" /> Ver
                  </a>
                  {p.analysisStatus === 'COMPLETED' && (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`🏠 *${p.tag === 'STRONG_DEAL' ? 'EXCELENTE OPORTUNIDADE' : p.tag}*\n\n📍 ${p.address}\n💰 R$${p.price.toLocaleString('pt-BR')}${p.originalPrice && p.originalPrice > p.price ? ` *(era R$${p.originalPrice.toLocaleString('pt-BR')})*` : ''}\n📈 Yield: ${p.grossYield?.toFixed(2)}% a.a.\n💵 Cashflow: R$${p.cashflow?.toFixed(0)}/mês\n⭐ Score: ${p.score?.toFixed(1)}/10${p.belowMarketPct && p.belowMarketPct > 0 ? `\n🎯 ${p.belowMarketPct?.toFixed(1)}% abaixo da média da região` : ''}\n\n🔗 Analisado pelo Atlas`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                      title="Compartilhar no WhatsApp"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  )}
                  <button
                    onClick={() => propertiesApi.save(p.id)}
                    className="flex items-center justify-center p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500"
                  >
                    <Heart className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            disabled={filters.page === 1}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">Página {filters.page} de {pagination.pages}</span>
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            disabled={filters.page === pagination.pages}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {!isLoading && !properties.length && (
        <div className="text-center py-16 text-gray-400">
          <Home className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum imóvel encontrado. Clique em &quot;Buscar Novos&quot; para iniciar o scraping.</p>
        </div>
      )}
    </div>
  );
}
