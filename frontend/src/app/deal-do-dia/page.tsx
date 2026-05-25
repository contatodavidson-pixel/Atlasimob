'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { formatBRL } from '@/lib/utils';
import Link from 'next/link';
import {
  Flame, TrendingUp, DollarSign, Star, Zap,
  Share2, ArrowRight, Building2, BadgePercent, BarChart3,
  Bell
} from 'lucide-react';

interface Deal {
  id: string;
  address: string;
  area: string;
  price: number;
  originalPrice: number;
  bedrooms: number;
  propertyType: string;
  grossYield: number;
  netYield: number;
  cashflow: number;
  roi: number;
  estimatedRent: number;
  score: number;
  belowMarketPct: number;
  liquidityIndex: string;
  aiSummary: string;
  listingUrl: string;
  motivatedSeller: boolean;
  priceReduced: boolean;
  priceReducedBy: number;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? '#16a34a' : score >= 6 ? '#d97706' : '#dc2626';
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 10) * circumference;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white leading-none">{score?.toFixed(1)}</span>
        <span className="text-xs text-white/50 font-medium mt-0.5">SCORE IA</span>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, highlight = false }: {
  icon: React.ElementType; label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 ${highlight
      ? 'bg-green-500/20 border border-green-500/30'
      : 'bg-white/8 border border-white/10'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${highlight ? 'text-green-400' : 'text-white/40'}`} />
        <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-black ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-white/30 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DealDoDiaPage() {
  const { data: deal, isLoading, isError } = useQuery<Deal>({
    queryKey: ['deal-of-day'],
    queryFn: () => propertiesApi.dealOfDay().then(r => r.data),
    retry: false,
  });

  // Track deal do dia view
  useEffect(() => {
    import('@/lib/analytics').then(({ track }) => track.dealOfDayViewed());
  }, []);

  const beatsCDI = (deal?.grossYield ?? 0) > 10.75;
  const shareText = deal
    ? `🏠 *DEAL DO DIA — ${deal.area}*\n${beatsCDI ? '✅ Esse imóvel VENCE o CDI!' : '📈 Oportunidade detectada pela IA'}\n\n📍 ${deal.address}\n💰 ${formatBRL(deal.price)}${deal.originalPrice > deal.price ? ` (era ${formatBRL(deal.originalPrice)})` : ''}\n📈 Yield bruto: ${deal.grossYield?.toFixed(1)}% a.a.\n💵 Cashflow: ${formatBRL(deal.cashflow)}/mês\n⭐ Score IA: ${deal.score?.toFixed(1)}/10\n${deal.belowMarketPct > 0 ? `🎯 ${deal.belowMarketPct?.toFixed(1)}% abaixo da média\n` : ''}${deal.motivatedSeller ? '🔥 Vendedor motivado\n' : ''}\nEnquanto outros analisam planilhas, o Atlas encontra oportunidades.\n👉 atlasimob.app.br/deal-do-dia`
    : '';

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto border-b border-white/5">
        <Link href="/">
          <img src="/atlas-logo-dark.png" alt="Atlas — Inteligência Imobiliária" className="h-24 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">Entrar</Link>
          <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
            Acesso gratuito
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* JSON-LD structured data */}
        {deal && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: `Deal do Dia — ${deal.area}: ${formatBRL(deal.price)} · Yield ${deal.grossYield?.toFixed(1)}%`,
                description: deal.aiSummary || `Imóvel em ${deal.area} com yield de ${deal.grossYield?.toFixed(1)}% a.a. Score IA: ${deal.score?.toFixed(1)}/10.`,
                author: { '@type': 'Organization', name: 'Atlas — Inteligência Imobiliária' },
                publisher: { '@type': 'Organization', name: 'Atlas', url: 'https://atlasimob.app.br' },
                datePublished: new Date().toISOString(),
                mainEntityOfPage: 'https://atlasimob.app.br/deal-do-dia',
              }),
            }}
          />
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/25 rounded-full px-4 py-1.5 mb-5">
            <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
            <span className="text-orange-300 text-sm font-bold uppercase tracking-widest">Deal do Dia</span>
          </div>
          {deal ? (
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              Esse imóvel{' '}
              {(deal.grossYield ?? 0) > 10.75 ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                  vence o CDI
                </span>
              ) : (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                  supera a poupança
                </span>
              )}
              <br />em {deal.area.split('/')[0]}
            </h1>
          ) : (
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              A melhor oportunidade<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                detectada pela IA hoje
              </span>
            </h1>
          )}
          <p className="text-white/40 text-sm capitalize">{dateStr}</p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white/40 text-sm">Analisando o mercado...</p>
          </div>
        )}

        {/* Empty state */}
        {isError && (
          <div className="text-center py-32">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-10 w-10 text-white/20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Nenhum deal disponível hoje</h2>
            <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
              Nossa IA ainda está varrendo o mercado. Cadastre-se para receber alertas assim que surgir uma oportunidade.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
              <Bell className="h-4 w-4" />
              Receber alertas diários
            </Link>
          </div>
        )}

        {deal && (
          <>
            {/* Main card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-5">
              {/* Status bar */}
              <div className="bg-gradient-to-r from-green-600/20 via-blue-600/10 to-transparent px-6 py-3 flex flex-wrap items-center gap-3 border-b border-white/8">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-green-400 fill-green-400" />
                  <span className="text-green-300 text-xs font-bold uppercase tracking-widest">Excelente Oportunidade</span>
                </div>
                {deal.motivatedSeller && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/20">·</span>
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-orange-300 text-xs font-semibold">Vendedor motivado</span>
                  </div>
                )}
                {deal.priceReduced && deal.priceReducedBy > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/20">·</span>
                    <BadgePercent className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-yellow-300 text-xs font-semibold">Preço reduzido {deal.priceReducedBy?.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                <div className="grid md:grid-cols-3 gap-8 items-center mb-8">
                  {/* Score gauge */}
                  <div className="text-center">
                    <ScoreBadge score={deal.score} />
                    <div className="mt-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                        deal.liquidityIndex === 'ALTA' ? 'bg-green-500/15 text-green-300 border border-green-500/25'
                        : deal.liquidityIndex === 'MEDIA' ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25'
                        : 'bg-red-500/15 text-red-300 border border-red-500/25'
                      }`}>
                        <Zap className="h-3 w-3" />
                        {deal.liquidityIndex === 'ALTA' ? 'Alta Liquidez' : deal.liquidityIndex === 'MEDIA' ? 'Liquidez Média' : 'Baixa Liquidez'}
                      </span>
                    </div>
                  </div>

                  {/* Property info */}
                  <div className="md:col-span-2">
                    <h2 className="text-2xl font-black text-white leading-tight mb-1">{deal.address}</h2>
                    <p className="text-white/40 text-sm mb-4">{deal.area} · {deal.bedrooms} quartos · {deal.propertyType}</p>

                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-4xl font-black text-white">{formatBRL(deal.price)}</span>
                      {deal.originalPrice > deal.price && (
                        <span className="text-white/25 line-through text-xl">{formatBRL(deal.originalPrice)}</span>
                      )}
                    </div>

                    {deal.belowMarketPct > 0 && (
                      <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/25 rounded-xl px-4 py-2 mb-4">
                        <TrendingUp className="h-4 w-4 text-green-400 rotate-180" />
                        <span className="text-green-300 font-bold text-sm">
                          {deal.belowMarketPct?.toFixed(1)}% abaixo da média da região
                        </span>
                      </div>
                    )}

                    {deal.aiSummary && (
                      <p className="text-white/50 text-sm leading-relaxed italic border-l-2 border-white/10 pl-3">
                        "{deal.aiSummary}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard icon={TrendingUp} label="Yield bruto" value={`${deal.grossYield?.toFixed(1)}%`} sub="ao ano" highlight />
                  <MetricCard icon={DollarSign} label="Cashflow" value={formatBRL(deal.cashflow)} sub="por mês" highlight />
                  <MetricCard icon={BarChart3} label="Yield líquido" value={`${deal.netYield?.toFixed(1)}%`} sub="após custos" />
                  <MetricCard icon={Building2} label="Aluguel est." value={formatBRL(deal.estimatedRent)} sub="estimativa IA" />
                </div>
              </div>
            </div>

            {/* Benchmark */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-4">Comparativo de retorno anual</p>
              <div className="space-y-3">
                {[
                  { label: 'Este imóvel', value: deal.grossYield ?? 0, color: 'bg-green-500', bold: true },
                  { label: 'CDI / Selic', value: 10.75, color: 'bg-yellow-400', bold: false },
                  { label: 'FII médio (IFIX)', value: 8.5, color: 'bg-blue-400', bold: false },
                  { label: 'Poupança', value: 6.17, color: 'bg-gray-500', bold: false },
                ].sort((a, b) => b.value - a.value).map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-28 text-right shrink-0">
                      <span className={`text-xs ${item.bold ? 'text-white font-bold' : 'text-white/40'}`}>{item.label}</span>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div className={`${item.color} h-full rounded-full`} style={{ width: `${Math.min(100, (item.value / 14) * 100)}%` }} />
                    </div>
                    <div className="w-12 text-left shrink-0">
                      <span className={`text-sm font-bold ${item.bold ? 'text-green-400' : 'text-white/40'}`}>
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <Link
                href={`/login?redirect=/dashboard/dealflow/${deal.id}`}
                className="flex items-center justify-between bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-6 py-5 transition-all group shadow-lg shadow-blue-900/20"
              >
                <div>
                  <div className="font-black text-lg">Ver análise completa</div>
                  <div className="text-blue-200 text-sm mt-0.5">LOI, histórico, dados detalhados</div>
                </div>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-between bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 text-white rounded-2xl px-6 py-5 transition-all group"
              >
                <div>
                  <div className="font-black text-lg">Receber todos os dias</div>
                  <div className="text-white/40 text-sm mt-0.5">Alertas antes do mercado · Grátis</div>
                </div>
                <Bell className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform" />
              </Link>
            </div>

            {/* Share block */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-4 w-4 text-white/30" />
                <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Compartilhar</span>
              </div>
              <div className="bg-black/20 rounded-xl p-4 mb-4 font-mono text-xs text-white/60 leading-relaxed whitespace-pre-wrap">
                {shareText}
              </div>
              <div className="flex gap-3">
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600/15 hover:bg-green-600/25 border border-green-600/25 text-green-300 rounded-xl py-3 text-sm font-bold transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.123 1.528 5.855L0 24l6.341-1.503A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.491-5.179-1.347l-.371-.22-3.768.893.934-3.668-.241-.387A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  WhatsApp
                </a>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 rounded-xl py-3 text-sm font-bold transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X / Twitter
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://atlasimob.app.br/deal-do-dia')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-700/15 hover:bg-blue-700/25 border border-blue-700/25 text-blue-300 rounded-xl py-3 text-sm font-bold transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
                <button onClick={() => navigator.clipboard?.writeText(shareText)}
                  className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white rounded-xl py-3 px-4 text-sm font-bold transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="text-center py-8 text-white/20 text-xs border-t border-white/5 mt-4">
        <p>Atlas · Inteligência Imobiliária · Dados atualizados diariamente</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link href="/" className="hover:text-white/40 transition-colors">Início</Link>
          <Link href="/register" className="hover:text-white/40 transition-colors">Cadastrar</Link>
          <Link href="/login" className="hover:text-white/40 transition-colors">Entrar</Link>
        </div>
      </footer>
    </div>
  );
}
