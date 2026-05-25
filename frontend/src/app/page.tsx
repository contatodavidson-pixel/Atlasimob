'use client';
import { useState } from 'react';
import Link from 'next/link';
import { waitlistApi } from '@/lib/api';
import { track } from '@/lib/analytics';
import {
  TrendingUp, Bot, Bell, BarChart3, Shield,
  ArrowRight, Zap, CheckCircle2, Star, Clock, Filter,
  DollarSign, Target, Flame, ChevronRight, MapPin, BedDouble
} from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    price: 49,
    desc: 'Para quem está começando no investimento imobiliário',
    features: [
      'Até 200 imóveis/mês analisados',
      'Dashboard com DealFlow',
      'Classificação automática por IA',
      'Alertas diários por email',
      '3 cidades monitoradas',
    ],
    cta: 'Começar Grátis 7 dias',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 149,
    desc: 'Para investidores ativos e house flippers',
    features: [
      'Imóveis ilimitados analisados',
      'Alertas WhatsApp em tempo real',
      'Detecção de vendedor motivado',
      'Agente de IA via chat e WhatsApp',
      '10 cidades monitoradas',
      'Relatório semanal automatizado',
      'Geração de Proposta de Compra',
    ],
    cta: 'Assinar Pro',
    highlight: true,
  },
  {
    name: 'Investor',
    price: 399,
    desc: 'Para assessores, gestoras e equipes',
    features: [
      'Tudo do Pro',
      'CRM completo de investidores',
      'Auto-resposta de email com IA',
      'Matching automático de oportunidades',
      'Cidades ilimitadas',
      'Acesso à API',
      'Suporte prioritário',
    ],
    cta: 'Falar com Vendas',
    highlight: false,
  },
];

// Fake property cards for dashboard preview
const SAMPLE_PROPERTIES = [
  {
    img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
    address: 'Rua Haddock Lobo, 1240 — Jardins, SP',
    beds: 2,
    price: 'R$ 580.000',
    yield: '8,4%',
    cashflow: 'R$ 1.840/mês',
    score: 9.1,
    belowMarket: '11% abaixo da média de Jardins',
    tag: 'EXCELENTE',
    tagColor: 'bg-green-500',
    motivated: true,
  },
  {
    img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    address: 'Av. Batel, 890 — Batel, Curitiba',
    beds: 3,
    price: 'R$ 420.000',
    yield: '7,9%',
    cashflow: 'R$ 1.520/mês',
    score: 8.3,
    belowMarket: '7% abaixo da média do Batel',
    tag: 'EXCELENTE',
    tagColor: 'bg-green-500',
    motivated: false,
  },
  {
    img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
    address: 'Rua Vieira Souto, 320 — Ipanema, RJ',
    beds: 1,
    price: 'R$ 890.000',
    yield: '5,2%',
    cashflow: 'R$ 620/mês',
    score: 5.4,
    belowMarket: '2% acima da média de Ipanema',
    tag: 'MODERADA',
    tagColor: 'bg-yellow-500',
    motivated: false,
  },
];

function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState('loading');
    try {
      await waitlistApi.join({ email, city, source: 'landing_hero' });
      track.waitlistSignup(email, city);
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <section id="waitlist" className="py-20 px-4 bg-gradient-to-br from-blue-950 via-gray-950 to-blue-950">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/25 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-300 text-sm font-bold">Acesso antecipado · Gratuito</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
          Receba os melhores imóveis<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
            antes do mercado
          </span>
        </h2>
        <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
          Mais de 200 imóveis analisados por dia. Você só vê os que realmente valem a pena.
        </p>

        {state === 'done' ? (
          <div className="bg-green-500/15 border border-green-500/25 rounded-2xl px-8 py-10">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-white font-black text-2xl mb-2">Você está na lista!</p>
            <p className="text-white/50 text-sm">Vamos te avisar assim que tiver uma vaga. Enquanto isso, explore o Atlas.</p>
            <Link href="/register" className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Criar conta agora →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="flex-1 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-white/30"
            />
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Cidade de interesse"
              className="sm:w-44 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={state === 'loading'}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {state === 'loading' ? 'Entrando...' : 'Entrar na lista →'}
            </button>
          </form>
        )}

        {state === 'error' && (
          <p className="text-red-400 text-xs mt-3">Algo deu errado. Tente novamente.</p>
        )}

        <p className="text-white/20 text-xs mt-5">
          Sem spam. Cancele quando quiser. · Dados protegidos pela LGPD.
        </p>

        {/* Social proof tickers */}
        <div className="flex items-center justify-center gap-6 mt-10 text-white/40 text-xs">
          <span>🏠 200+ imóveis/dia analisados</span>
          <span>·</span>
          <span>📈 Yield médio detectado: 7.8%</span>
          <span>·</span>
          <span>⚡ Alertas em tempo real</span>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/atlas-logo.png" alt="Atlas — Inteligência Imobiliária" className="h-20 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-gray-600 hover:text-blue-600 text-sm font-medium">Como funciona</a>
            <a href="#preview" className="text-gray-600 hover:text-blue-600 text-sm font-medium">Plataforma</a>
            <Link href="/calculadora" className="text-gray-600 hover:text-blue-600 text-sm font-medium">Calculadora</Link>
            <a href="#planos" className="text-gray-600 hover:text-blue-600 text-sm font-medium">Planos</a>
            <Link href="/deal-do-dia" className="flex items-center gap-1.5 text-orange-600 hover:text-orange-500 text-sm font-bold">
              🔥 Deal do Dia
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600">Entrar</Link>
            <Link href="/register" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Testar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — split layout with São Paulo skyline */}
      <section className="pt-16 min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden relative flex items-center">
        {/* Background city image with overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1583842761844-4f8dc7f4dae3?w=1800&q=80"
            alt="São Paulo skyline"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/60" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),transparent_60%)]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <Zap className="h-4 w-4" />
                Inteligência de dados para o investidor imobiliário brasileiro
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Encontre imóveis que<br />
                <span className="text-blue-400">realmente geram renda</span><br />
                <span className="text-slate-300 text-3xl md:text-4xl font-bold">sem perder horas analisando anúncios.</span>
              </h1>

              <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-xl">
                O Atlas monitora automaticamente ZAP Imóveis, VivaReal e OLX, calcula yield,
                cashflow e ROI, e mostra <strong className="text-white">apenas as oportunidades alinhadas com o mercado brasileiro</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white text-lg font-bold px-8 py-4 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50">
                  Começar Gratuitamente
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a href="#preview" className="inline-flex items-center gap-2 bg-white/10 text-white text-lg font-semibold px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                  Ver a plataforma
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
                {[
                  { value: '500+', label: 'Imóveis filtrados por semana' },
                  { value: '< 3min', label: 'Para analisar cada oportunidade' },
                  { value: '24/7', label: 'Monitoramento automático' },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: property card mockup */}
            <div className="hidden lg:block relative">
              {/* Main apartment photo */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/50 border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                  alt="Apartamento de investimento"
                  className="w-full h-72 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                {/* Property info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" /> EXCELENTE OPORTUNIDADE
                    </span>
                    <span className="bg-orange-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Flame className="h-3 w-3" /> Motivado
                    </span>
                  </div>
                  <p className="text-white font-semibold">Rua Oscar Freire, 1420 — Pinheiros, SP</p>
                  <p className="text-slate-300 text-sm">2 quartos · Apartamento</p>
                </div>
              </div>

              {/* Yield card floating */}
              <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-2xl p-4 w-52 border border-gray-100">
                <div className="text-xs text-gray-500 font-medium mb-2">Análise IA concluída</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-green-700">8,4%</div>
                    <div className="text-xs text-gray-400">Yield bruto</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-base font-bold text-blue-700">R$1.840</div>
                    <div className="text-xs text-gray-400">Cashflow/mês</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500">Alerta enviado no WhatsApp</span>
                </div>
              </div>

              {/* Price tag floating */}
              <div className="absolute -top-4 -left-4 bg-slate-800 border border-white/10 rounded-xl shadow-xl px-4 py-2.5">
                <div className="text-white font-bold text-sm">R$ 580.000</div>
                <div className="text-green-400 text-xs flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> 11% abaixo da média de Pinheiros
                </div>
                <div className="text-slate-400 text-xs mt-0.5 line-through">Era R$ 652.000</div>
              </div>

              {/* Score badge floating */}
              <div className="absolute top-1/2 -right-6 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 px-3 py-2 text-center">
                <div className="text-2xl font-black text-green-600">9.1</div>
                <div className="text-xs text-gray-400 leading-tight">Score<br/>IA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="py-6 px-4 bg-white border-b">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '+14.800', label: 'Imóveis analisados', sub: 'desde o lançamento' },
              { value: '+R$ 9,2M', label: 'Em oportunidades', sub: 'identificadas pela IA' },
              { value: '+1.300', label: 'Alertas enviados', sub: 'via WhatsApp e email' },
              { value: '< 3min', label: 'Tempo de análise', sub: 'por imóvel, 24/7' },
            ].map(s => (
              <div key={s.label} className="py-2">
                <div className="text-2xl font-extrabold text-blue-600">{s.value}</div>
                <div className="text-sm font-semibold text-gray-800">{s.label}</div>
                <div className="text-xs text-gray-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portais */}
      <section className="py-8 px-4 border-b bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-widest">Portais monitorados automaticamente</p>
          <div className="flex flex-wrap justify-center gap-10 items-center">
            {['ZAP Imóveis', 'VivaReal', 'OLX', 'Imovelweb'].map(portal => (
              <span key={portal} className="text-xl font-bold text-gray-300">{portal}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Problema → Solução */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">O investidor imobiliário brasileiro perde tempo demais</h2>
            <p className="text-gray-500 text-lg">Enquanto você analisa manualmente, a melhor oportunidade já foi comprada por outro.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Antes */}
            <div className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-44 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?w=700&q=80"
                  alt="Investidor frustrado com planilhas"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Clock className="h-5 w-5" />
                    Sem o Atlas
                  </div>
                </div>
              </div>
              <div className="p-7">
                <ul className="space-y-3">
                  {[
                    'Abre o ZAP e VivaReal um por um',
                    'Calcula yield manualmente na planilha',
                    'Perde 3-5 horas analisando anúncios ruins',
                    'Descobre que o imóvel já foi vendido',
                    'Não sabe se supera CDI ou FIIs',
                    'Perde vendedores motivados para quem foi mais rápido',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-gray-600 text-sm">
                      <span className="text-red-400 mt-0.5 text-base font-bold">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Depois */}
            <div className="bg-white border border-green-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-44 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=80"
                  alt="Dashboard com análises de imóveis"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Zap className="h-5 w-5" />
                    Com o Atlas
                  </div>
                </div>
              </div>
              <div className="p-7">
                <ul className="space-y-3">
                  {[
                    'Scraping automático às 7h em todos os portais',
                    'Yield, cashflow e ROI calculados pela IA',
                    'Só vê os imóveis classificados como Excelente',
                    'Alerta WhatsApp antes de qualquer concorrente',
                    'Comparativo automático com SELIC, CDI e FIIs',
                    'Detecção automática de vendedor motivado',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-gray-700 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="preview" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Veja a plataforma em ação</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Imóveis reais analisados pela IA com yield, cashflow e classificação automática — tudo em um painel limpo e objetivo.
            </p>
          </div>

          {/* Browser chrome */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-200/80">
            {/* Browser bar */}
            <div className="bg-gray-100 border-b px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 border border-gray-200 max-w-sm mx-auto">
                app.realestateai.com.br/dashboard/dealflow
              </div>
            </div>
            {/* Dashboard content */}
            <div className="bg-gray-50 p-5">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> Buscar Novos
                  </div>
                  <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Bot className="h-3 w-3" /> Analisar Pendentes
                  </div>
                </div>
                <span className="text-sm text-gray-500 font-medium">247 imóveis encontrados</span>
              </div>
              {/* Property cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {SAMPLE_PROPERTIES.map((p) => (
                  <div key={p.address} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-36">
                      <img src={p.img} alt={p.address} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className={`${p.tagColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                          {p.tag}
                        </span>
                        {p.motivated && (
                          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Flame className="h-2.5 w-2.5" /> Motivado
                          </span>
                        )}
                      </div>
                      {/* Score badge */}
                      <div className="absolute top-2 right-2 bg-white/95 rounded-lg px-1.5 py-0.5 text-center shadow">
                        <div className={`text-sm font-black ${p.score >= 8 ? 'text-green-600' : p.score >= 6 ? 'text-yellow-600' : 'text-red-500'}`}>{p.score}</div>
                        <div className="text-gray-400" style={{fontSize: '9px'}}>score</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-800 truncate mb-0.5">{p.address}</p>
                      <p className={`text-xs mb-1.5 ${p.belowMarket.includes('acima') ? 'text-orange-500' : 'text-green-600'} font-medium`}>
                        {p.belowMarket.includes('acima') ? '↑' : '↓'} {p.belowMarket}
                      </p>
                      <div className="font-bold text-gray-900 text-sm mb-2">{p.price}</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="bg-green-50 rounded-lg p-1.5 text-center">
                          <div className="text-xs font-bold text-green-700">{p.yield}</div>
                          <div className="text-xs text-gray-400">Yield</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-1.5 text-center">
                          <div className="text-xs font-bold text-blue-700">{p.cashflow}</div>
                          <div className="text-xs text-gray-400">Cashflow</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Como funciona o filtro inteligente</h2>
            <p className="text-gray-500 text-lg">Do anúncio no portal até o alerta no seu celular — tudo automático.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div className="space-y-5">
              {[
                {
                  step: '01',
                  icon: <Filter className="h-5 w-5 text-blue-600" />,
                  title: 'Coleta automática diária',
                  desc: 'Às 7h, o sistema coleta centenas de imóveis do ZAP Imóveis, VivaReal e OLX nas cidades configuradas.',
                  bg: 'bg-blue-50 border-blue-100',
                },
                {
                  step: '02',
                  icon: <Target className="h-5 w-5 text-purple-600" />,
                  title: 'Análise por IA em 3 minutos',
                  desc: 'Cada imóvel passa pelo nosso motor de análise proprietário: estima aluguel de mercado, calcula yield, cashflow, ROI, gera Score 0–10 e detecta vendedor motivado.',
                  bg: 'bg-purple-50 border-purple-100',
                },
                {
                  step: '03',
                  icon: <Bell className="h-5 w-5 text-orange-600" />,
                  title: 'Você recebe só o que vale a pena',
                  desc: 'Às 8h: alerta com Excelentes Oportunidades do dia. Às 12h: imóveis com preço reduzido. Via WhatsApp e email.',
                  bg: 'bg-orange-50 border-orange-100',
                },
                {
                  step: '04',
                  icon: <Bot className="h-5 w-5 text-green-600" />,
                  title: 'Agente de IA para negociação',
                  desc: 'Converse com o Agente via WhatsApp ou painel web: análises, estratégias de negociação e Proposta de Compra.',
                  bg: 'bg-green-50 border-green-100',
                },
              ].map(item => (
                <div key={item.step} className={`flex gap-4 items-start border rounded-2xl p-5 ${item.bg}`}>
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-xs">{item.step}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {item.icon}
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Right: real photo collage */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80"
                  alt="Edifício moderno"
                  className="rounded-2xl h-48 w-full object-cover shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80"
                  alt="Apartamento interior"
                  className="rounded-2xl h-48 w-full object-cover shadow-md mt-6"
                />
                <img
                  src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80"
                  alt="Imóvel residencial"
                  className="rounded-2xl h-48 w-full object-cover shadow-md -mt-6"
                />
                <img
                  src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80"
                  alt="Apartamento de luxo"
                  className="rounded-2xl h-48 w-full object-cover shadow-md"
                />
              </div>
              {/* Floating analysis card */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-700">IA analisando agora...</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">Av. Paulista, 1578 — São Paulo</div>
                <div className="flex gap-2">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Yield: 9,1%</span>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">R$2.340/mês</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Classificação */}
      <section id="classificacao" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Classificação baseada no mercado brasileiro</h2>
          <p className="text-gray-500 mb-2">Benchmarks reais: SELIC, CDI e FIIs de papel</p>
          <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg inline-block mb-12">
            Cálculos incluem financiamento Caixa/SBPE, IPTU, condomínio, administradora (8%) e vacância (1 mês/ano)
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="border-2 border-green-200 bg-white rounded-2xl overflow-hidden text-left shadow-sm">
              <div className="relative h-40 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80" alt="Excelente oportunidade" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-green-900/60 flex items-end p-4">
                  <div className="inline-flex items-center gap-1.5 bg-green-500 text-white font-bold text-xs px-3 py-1.5 rounded-full">
                    <Star className="h-3 w-3" />
                    EXCELENTE OPORTUNIDADE
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-extrabold text-green-700 mb-1">≥ 7,2%</div>
                <div className="text-sm font-medium text-green-600 mb-4">yield bruto a.a. (≥ 0,6%/mês)</div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Cashflow {'>'} R$500/mês</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Supera CDI com risco real</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Alerta imediato no WhatsApp</li>
                </ul>
              </div>
            </div>
            <div className="border-2 border-yellow-200 bg-white rounded-2xl overflow-hidden text-left shadow-sm">
              <div className="relative h-40 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80" alt="Oportunidade moderada" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-yellow-900/60 flex items-end p-4">
                  <div className="inline-flex items-center gap-1.5 bg-yellow-500 text-white font-bold text-xs px-3 py-1.5 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    OPORTUNIDADE MODERADA
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-extrabold text-yellow-700 mb-1">4,8–7,2%</div>
                <div className="text-sm font-medium text-yellow-600 mb-4">yield bruto a.a. (0,4-0,6%/mês)</div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" /> Potencial com negociação</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" /> Cashflow entre R$0–500/mês</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" /> Analisar caso a caso</li>
                </ul>
              </div>
            </div>
            <div className="border-2 border-red-100 bg-white rounded-2xl overflow-hidden text-left shadow-sm">
              <div className="relative h-40 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&q=80" alt="Não recomendado" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-red-900/60 flex items-end p-4">
                  <div className="inline-flex items-center gap-1.5 bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-full">
                    <Shield className="h-3 w-3" />
                    NÃO RECOMENDADO
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-extrabold text-red-600 mb-1">{'< 4,8%'}</div>
                <div className="text-sm font-medium text-red-500 mb-4">yield bruto a.a. ({'< 0,4%/mês'})</div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="text-red-400 text-sm font-bold">✕</span> Cashflow negativo</li>
                  <li className="flex items-center gap-2"><span className="text-red-400 text-sm font-bold">✕</span> Não supera renda fixa</li>
                  <li className="flex items-center gap-2"><span className="text-red-400 text-sm font-bold">✕</span> Risco sem retorno adequado</li>
                </ul>
              </div>
            </div>
          </div>
          {/* Vendedor motivado badge */}
          <div className="inline-flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-6 py-4">
            <Flame className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <div className="text-left">
              <div className="font-bold text-orange-700 text-sm">Detecção de Vendedor Motivado</div>
              <div className="text-orange-600 text-xs">A IA identifica automaticamente imóveis com urgência de venda, preço abaixo do mercado e sinais de oportunidade de negociação.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cidades monitoradas com foto */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1549483399-d8e59e3b5f60?w=1800&q=80"
            alt="Cidade brasileira"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/80" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Monitoramento em todo o Brasil</h2>
          <p className="text-slate-300 text-lg mb-12">Configure as cidades que você investe. A IA trabalha enquanto você dorme.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'São Paulo', 'Rio de Janeiro', 'Curitiba', 'Florianópolis',
              'Porto Alegre', 'Belo Horizonte', 'Goiânia', 'Campinas',
              'Fortaleza', 'Brasília', 'Salvador', 'Recife',
              'Manaus', 'Natal', 'Joinville',
            ].map(city => (
              <div key={city} className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1.5 hover:bg-white/20 transition-colors">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                {city}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Para quem é o Atlas?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
                title: 'Investidor PF',
                desc: 'Que quer renda passiva sem ficar horas analisando ZAP',
              },
              {
                img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
                title: 'House Flipper',
                desc: 'Que precisa encontrar imóveis abaixo do mercado rapidamente',
              },
              {
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
                title: 'Investidor Airbnb',
                desc: 'Que analisa yield de curto prazo e potencial turístico',
              },
              {
                img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
                title: 'Assessor Patrimonial',
                desc: 'Que precisa de inteligência para indicar ativos aos clientes',
              },
            ].map(item => (
              <div key={item.title} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all">
                <div className="relative h-36 overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 font-bold text-white text-sm">{item.title}</div>
                </div>
                <div className="p-4">
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <WaitlistSection />

      {/* Planos */}
      <section id="planos" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planos e preços</h2>
            <p className="text-gray-500 text-lg">7 dias grátis em qualquer plano. Cancele quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`rounded-2xl p-7 flex flex-col ${
                plan.highlight
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]'
                  : 'bg-white border-2 border-gray-100'
              }`}>
                {plan.highlight && (
                  <div className="inline-flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-3">
                    <Star className="h-3 w-3" /> MAIS POPULAR
                  </div>
                )}
                <div className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</div>
                <div className={`text-sm mb-5 ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{plan.desc}</div>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    R${plan.price}
                  </span>
                  <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>/mês</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(feature => (
                    <li key={feature} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-600'}`}>
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-blue-300' : 'text-blue-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-8">
            Precisa de algo personalizado? <Link href="/register" className="text-blue-600 hover:underline">Fale conosco</Link>
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1800&q=80"
            alt="Imóvel de investimento"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700/95 via-blue-600/90 to-blue-800/95" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-extrabold mb-4">
            Receba oportunidades antes do mercado.
          </h2>
          <p className="text-blue-200 text-lg mb-4">
            Enquanto outros investidores analisam planilhas manualmente, você recebe o Score, o yield e o cashflow — direto no WhatsApp, às 8h da manhã.
          </p>
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-5 py-3 mb-8">
            <Flame className="h-5 w-5 text-orange-400 flex-shrink-0" />
            <span className="text-sm text-blue-100">
              Hoje: <strong className="text-white">3 imóveis</strong> com Score ≥ 9.0 identificados em São Paulo e Curitiba — você seria o primeiro a saber.
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-blue-600 text-lg font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              Criar Conta Grátis <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/calculadora" className="inline-flex items-center gap-2 bg-white/15 text-white text-lg font-semibold px-8 py-4 rounded-xl border border-white/30 hover:bg-white/25 transition-colors">
              <BarChart3 className="h-5 w-5" /> Calcular Yield Grátis
            </Link>
          </div>
          <p className="text-blue-300 text-sm mt-6">7 dias grátis · Sem cartão de crédito · Cancele quando quiser</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <img src="/atlas-logo.png" alt="Atlas" className="h-10 w-auto" />
          </div>
          <p className="text-gray-500 text-sm">© 2025 Atlas Inteligência Imobiliária. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 text-sm hover:text-gray-600">Privacidade</a>
            <a href="#" className="text-gray-400 text-sm hover:text-gray-600">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
