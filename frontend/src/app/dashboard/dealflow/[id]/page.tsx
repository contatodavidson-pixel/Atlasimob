'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { formatBRL, TAG_CONFIG, SOURCE_LABELS } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, BedDouble, Bath, Home, ExternalLink, Bot,
  Flame, TrendingUp, TrendingDown, Star, Zap, BarChart3,
  Loader2, Heart, ChevronRight, Clock, DollarSign, Shield,
  Activity, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useParams } from 'next/navigation';
import LiquidityScore from '@/components/LiquidityScore';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

const CDI = 10.75;
const SELIC = 10.75;
const FII_MEDIO = 8.5;
const POUPANCA = 6.17;

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 8 ? '#16a34a' : score >= 6 ? '#d97706' : '#dc2626';
  const label = score >= 9 ? 'Excepcional' : score >= 8 ? 'Excelente' : score >= 6 ? 'Moderado' : score >= 4 ? 'Fraco' : 'Evitar';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 10) * 264} 264`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{score?.toFixed(1)}</span>
          <span className="text-xs text-gray-400">/ 10</span>
        </div>
      </div>
      <span className="text-sm font-bold mt-1" style={{ color }}>{label}</span>
      <span className="text-xs text-gray-400">Score de Investimento</span>
    </div>
  );
}


export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.get(id).then(r => r.data),
  });

  const { data: priceHistoryRaw } = useQuery({
    queryKey: ['price-history', id],
    queryFn: () => propertiesApi.priceHistory(id).then(r => r.data),
    enabled: !!id,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => propertiesApi.analyze(id),
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ['property', id] }), 3000);
    },
  });

  const [isSaved, setIsSaved] = useState(false);
  const saveMutation = useMutation({
    mutationFn: () => isSaved ? propertiesApi.unsave(id) : propertiesApi.save(id),
    onSuccess: () => {
      setIsSaved(v => !v);
      qc.invalidateQueries({ queryKey: ['saved-properties'] });
    },
  });

  const loiMutation = useMutation({
    mutationFn: () => propertiesApi.generateLOI(id, {
      offerPrice: property ? Math.round(property.price * 0.92) : 0,
      buyerName: 'Investidor',
    }),
    onSuccess: (data) => {
      const blob = new Blob([data.data.loi], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'proposta.txt'; a.click();
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (!property) return (
    <div className="text-center py-24 text-gray-400">Imóvel não encontrado.</div>
  );

  const tag = property.tag as keyof typeof TAG_CONFIG;
  const isAnalyzed = property.analysisStatus === 'COMPLETED';

  // Benchmark chart data
  const benchmarkData = isAnalyzed ? [
    { name: 'Este Imóvel', value: property.grossYield, color: property.grossYield >= 7.2 ? '#16a34a' : property.grossYield >= 4.8 ? '#d97706' : '#dc2626' },
    { name: 'CDI', value: CDI, color: '#3b82f6' },
    { name: 'SELIC', value: SELIC, color: '#6366f1' },
    { name: 'FII Médio', value: FII_MEDIO, color: '#8b5cf6' },
    { name: 'Poupança', value: POUPANCA, color: '#9ca3af' },
  ] : [];

  const imageUrls = (() => {
    try { return JSON.parse(property.imageUrls || '[]'); } catch { return []; }
  })();

  // Price history chart data
  type PricePoint = { price: number; createdAt: string; source: string };
  const priceHistory: PricePoint[] = priceHistoryRaw || [];
  const priceChartData = priceHistory.map((p: PricePoint) => ({
    date: new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    price: p.price,
    fullDate: p.createdAt,
  }));
  const priceDropCount = priceHistory.filter((p: PricePoint, i: number) => i > 0 && p.price < priceHistory[i - 1].price).length;
  const totalDrop = priceHistory.length > 1 ? priceHistory[0].price - priceHistory[priceHistory.length - 1].price : 0;
  const daysTracked = priceHistory.length > 1
    ? Math.round((new Date(priceHistory[priceHistory.length - 1].createdAt).getTime() - new Date(priceHistory[0].createdAt).getTime()) / 86400000)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/dealflow" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao DealFlow
        </Link>
        <ChevronRight className="h-3 w-3 text-gray-300" />
        <span className="text-sm text-gray-400 truncate max-w-xs">{property.address}</span>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="relative h-64 bg-gray-100">
          {imageUrls[0] ? (
            <img src={imageUrls[0]} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-16 w-16 text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Badges overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {tag && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${TAG_CONFIG[tag]?.color}`}>
                {TAG_CONFIG[tag]?.label}
              </span>
            )}
            {property.motivatedSeller && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> Vendedor Motivado
              </span>
            )}
            {property.priceReduced && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                ↓ Preço Reduzido
              </span>
            )}
          </div>
          <div className="absolute top-4 right-4">
            <span className="text-xs bg-black/50 text-white px-3 py-1.5 rounded-full">
              {SOURCE_LABELS[property.source] || property.source}
            </span>
          </div>
          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h1 className="text-xl font-bold text-white mb-1">{property.address}</h1>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {property.area}</span>
              <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} quartos</span>
              {property.bathrooms && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {property.bathrooms} banheiros</span>}
              <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" /> {property.propertyType}</span>
            </div>
          </div>
        </div>

        {/* Price + actions */}
        <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b">
          <div>
            <div className="text-3xl font-extrabold text-gray-900">{formatBRL(property.price)}</div>
            {property.originalPrice && property.originalPrice > property.price && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400 line-through">{formatBRL(property.originalPrice)}</span>
                <span className="text-sm font-bold text-green-600">
                  ↓ {((1 - property.price / property.originalPrice) * 100).toFixed(1)}% de redução
                </span>
              </div>
            )}
            {property.belowMarketPct != null && isAnalyzed && (
              <div className={`text-sm font-semibold mt-1 ${property.belowMarketPct > 0 ? 'text-green-600' : 'text-orange-500'}`}>
                {property.belowMarketPct > 0
                  ? `↓ ${property.belowMarketPct.toFixed(1)}% abaixo da média da região`
                  : `↑ ${Math.abs(property.belowMarketPct).toFixed(1)}% acima da média da região`}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {property.liquidityIndex && <LiquidityScore index={property.liquidityIndex} compact />}
            {property.daysListed && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <Clock className="h-3 w-3" /> {property.daysListed} dias anunciado
              </span>
            )}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60 ${
                isSaved
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Salvo' : 'Salvar'}
            </button>
            <a href={property.listingUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
              <ExternalLink className="h-4 w-4" /> Ver anúncio
            </a>
            {!isAnalyzed && property.analysisStatus === 'PENDING' && (
              <button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}
                className="flex items-center gap-1.5 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
                {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                Analisar com IA
              </button>
            )}
            {isAnalyzed && (
              <button onClick={() => loiMutation.mutate()} disabled={loiMutation.isPending}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
                {loiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                Gerar Proposta
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis grid */}
      {isAnalyzed ? (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Score gauge + key metrics */}
          <div className="bg-white rounded-2xl border p-5 flex flex-col items-center gap-4">
            <ScoreGauge score={property.score ?? 0} />
            <div className="w-full pt-2 border-t space-y-2">
              {[
                { label: 'Yield Bruto', value: `${property.grossYield?.toFixed(2)}% a.a.`, good: property.grossYield >= 7.2 },
                { label: 'Yield Líquido', value: `${property.netYield?.toFixed(2)}% a.a.`, good: property.netYield >= 5.5 },
                { label: 'Cashflow / mês', value: formatBRL(property.cashflow), good: property.cashflow > 0 },
                { label: 'ROI (cap. próprio)', value: `${property.roi?.toFixed(2)}% a.a.`, good: property.roi >= 10 },
                { label: 'Aluguel estimado', value: formatBRL(property.estimatedRent), good: true },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{m.label}</span>
                  <span className={`font-bold ${m.good ? 'text-green-700' : 'text-gray-700'}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score breakdown */}
          <ScoreBreakdown
            score={property.score ?? 0}
            grossYield={property.grossYield ?? 0}
            liquidityIndex={property.liquidityIndex ?? 'MEDIA'}
            belowMarketPct={property.belowMarketPct ?? 0}
            motivatedSeller={!!property.motivatedSeller}
            cashflow={property.cashflow ?? 0}
            priceReduced={!!property.priceReduced}
            priceReducedBy={property.priceReducedBy ?? 0}
          />

          {/* Benchmark chart */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-bold text-gray-900 mb-1">Yield vs Mercado Financeiro</h3>
            <p className="text-xs text-gray-400 mb-4">Comparativo com principais benchmarks do investidor brasileiro</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={benchmarkData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, Math.max(...benchmarkData.map(d => d.value)) + 2]} />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(2)}% a.a.`, 'Yield']}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {benchmarkData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 pt-3 border-t">
              {property.grossYield >= CDI ? (
                <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Yield {((property.grossYield - CDI) > 0 ? '+' : '')}{(property.grossYield - CDI).toFixed(2)} p.p. acima do CDI — supera renda fixa com risco patrimonial.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Yield {(property.grossYield - CDI).toFixed(2)} p.p. abaixo do CDI — avalie o custo de oportunidade antes de investir.
                </div>
              )}
            </div>
          </div>

          {/* Custos detalhados */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" /> Composição de Custos/mês
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Aluguel estimado', value: property.estimatedRent, type: 'income' },
                { label: 'Administradora (8%)', value: -property.managementFee, type: 'cost' },
                { label: 'Manutenção', value: -property.maintenanceCost, type: 'cost' },
                { label: 'Seguro', value: -property.insuranceCost, type: 'cost' },
                { label: 'Parcela financiamento', value: -property.mortgagePayment, type: 'cost' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-semibold ${item.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>
                    {item.type === 'income' ? '+' : ''}{formatBRL(item.value)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t flex items-center justify-between text-sm font-bold">
                <span className="text-gray-900">Cashflow líquido</span>
                <span className={property.cashflow > 0 ? 'text-green-700' : 'text-red-600'}>
                  {formatBRL(property.cashflow)}/mês
                </span>
              </div>
            </div>
          </div>

          {/* Liquidity Score */}
          {property.liquidityIndex && (
            <LiquidityScore
              index={property.liquidityIndex}
              area={property.area}
              propertyType={property.propertyType}
              bedrooms={property.bedrooms}
              daysListed={property.daysListed}
            />
          )}

          {/* Histórico de Preço */}
          <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-2xl border p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-blue-500" /> Histórico de Preço
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Evolução do preço desde o primeiro registro no Atlas</p>
              </div>
              {priceChartData.length > 1 && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <p className={`font-black text-sm ${totalDrop > 0 ? 'text-green-600' : totalDrop < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {totalDrop > 0 ? `↓ ${formatBRL(totalDrop)}` : totalDrop < 0 ? `↑ ${formatBRL(Math.abs(totalDrop))}` : '—'}
                    </p>
                    <p className="text-gray-400">variação total</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-sm text-orange-500">{priceDropCount}x</p>
                    <p className="text-gray-400">reduções</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-sm text-gray-700">{daysTracked}d</p>
                    <p className="text-gray-400">monitorado</p>
                  </div>
                </div>
              )}
            </div>

            {priceChartData.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <TrendingUp className="h-10 w-10 mb-2" />
                <p className="text-sm text-gray-400">Histórico sendo coletado</p>
                <p className="text-xs text-gray-300 mt-1">O Atlas rastreará as variações de preço a partir de agora</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={priceChartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                    domain={['auto', 'auto']}
                    width={60}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatBRL(v), 'Preço']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#priceGrad)"
                    dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* AI Analysis */}
          <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-2xl border p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-600" /> Análise Completa do Motor de IA
            </h3>
            {property.aiSummary && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-purple-900">{property.aiSummary}</p>
              </div>
            )}
            {property.aiAnalysis && (
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{property.aiAnalysis}</div>
            )}
          </div>

          {/* WhatsApp share */}
          {isAnalyzed && (
            <div className="lg:col-span-2 xl:col-span-3 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-lg mb-1">Compartilhar esta oportunidade</div>
                <div className="text-green-200 text-sm">Envie a análise completa por WhatsApp com um clique</div>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `🏠 *${TAG_CONFIG[tag]?.label || property.tag}*\n\n` +
                  `📍 ${property.address}\n` +
                  `💰 ${formatBRL(property.price)}${property.originalPrice && property.originalPrice > property.price ? ` *(era ${formatBRL(property.originalPrice)})*` : ''}\n` +
                  `📈 Yield: ${property.grossYield?.toFixed(2)}% a.a.\n` +
                  `💵 Cashflow: ${formatBRL(property.cashflow)}/mês\n` +
                  `⭐ Score: ${property.score?.toFixed(1)}/10\n` +
                  `🏷 Aluguel estimado: ${formatBRL(property.estimatedRent)}/mês\n` +
                  (property.belowMarketPct > 0 ? `🎯 ${property.belowMarketPct?.toFixed(1)}% abaixo da média da região\n` : '') +
                  (property.motivatedSeller ? `🔥 Vendedor motivado\n` : '') +
                  `\n🔗 Analisado pelo Atlas`
                )}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 bg-white text-green-700 font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Compartilhar no WhatsApp
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border p-10 text-center">
          {property.analysisStatus === 'ANALYZING' ? (
            <div>
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
              <div className="font-bold text-gray-800">Motor de análise rodando...</div>
              <div className="text-sm text-gray-500 mt-2">Calculando yield, cashflow, Score e índice de liquidez</div>
            </div>
          ) : (
            <div>
              <Bot className="h-10 w-10 text-purple-400 mx-auto mb-4" />
              <div className="font-bold text-gray-800">Imóvel aguardando análise</div>
              <div className="text-sm text-gray-500 mt-2 mb-6">O motor proprietário vai calcular yield, cashflow, Score 0–10 e comparar com CDI/SELIC/FIIs</div>
              <button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}
                className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-purple-700 disabled:opacity-60">
                {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Analisar agora
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
