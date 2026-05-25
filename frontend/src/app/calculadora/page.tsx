'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, DollarSign, ArrowRight, Info } from 'lucide-react';

const CDI  = 10.75;
const SELIC = 10.75;
const FII   = 8.5;

function calcMortgage(price: number, ltv = 0.8, rate = 10.5, years = 30) {
  const P = price * ltv;
  const i = rate / 100 / 12;
  const n = years * 12;
  return P * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
}

export default function CalculadoraPage() {
  const [v, setV] = useState({
    price: 350000,
    rent: 2200,
    condo: 500,
    iptu: 150,
    useFinancing: true,
  });

  const set = (k: keyof typeof v, val: number | boolean) =>
    setV(prev => ({ ...prev, [k]: val }));

  const r = useMemo(() => {
    const admFee      = v.rent * 0.08;
    const vacancy     = v.rent * (1 / 12);
    const maintenance = (v.price * 0.005) / 12;
    const insurance   = (v.price * 0.001) / 12;
    const netRent     = v.rent - admFee - vacancy - maintenance - insurance - v.condo - v.iptu;
    const mortgage    = v.useFinancing ? calcMortgage(v.price) : 0;
    const cashflow    = netRent - mortgage;
    const grossYield  = (v.rent * 12) / v.price * 100;
    const netYield    = (netRent * 12) / v.price * 100;
    const ownCapital  = v.price * (v.useFinancing ? 0.255 : 1);
    const roi         = (netRent * 12) / ownCapital * 100;
    let tag: 'EXCELENTE' | 'MODERADA' | 'NAO_REC' = 'NAO_REC';
    if (grossYield >= 7.2 && cashflow >= 500) tag = 'EXCELENTE';
    else if (grossYield >= 4.8) tag = 'MODERADA';
    return { admFee, vacancy, maintenance, insurance, netRent, mortgage, cashflow, grossYield, netYield, roi, ownCapital, tag };
  }, [v]);

  const tagCfg = {
    EXCELENTE: { label: 'EXCELENTE OPORTUNIDADE', bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-200', light: 'bg-green-50' },
    MODERADA:  { label: 'OPORTUNIDADE MODERADA',  bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-200', light: 'bg-yellow-50' },
    NAO_REC:   { label: 'NÃO RECOMENDADO',         bg: 'bg-red-500',   text: 'text-red-700',   border: 'border-red-200',   light: 'bg-red-50' },
  }[r.tag];

  const fmt  = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const fmtp = (n: number) => `${n.toFixed(2)}% a.a.`;

  const shareText = encodeURIComponent(
    `📊 Calculei esse imóvel no Atlas:\n\nPreço: ${fmt(v.price)}\nAluguel: ${fmt(v.rent)}/mês\nYield Bruto: ${fmtp(r.grossYield)}\nCashflow: ${fmt(r.cashflow)}/mês\nClassificação: ${tagCfg.label}\n\n🔗 Calcule o seu: atlasimob.app.br/calculadora`
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/">
            <img src="/atlas-logo.png" alt="Atlas — Inteligência Imobiliária" className="h-20 w-auto" />
          </Link>
          <Link href="/register" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">
            Testar Grátis
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            Ferramenta gratuita
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Calculadora de Yield Imobiliário
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Descubra se um imóvel gera mais que CDI, SELIC e FIIs — com cashflow real, descontando todos os custos.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Inputs ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border p-6 space-y-5">
              <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Dados do Imóvel</h2>

              {([
                { label: 'Preço de Venda', key: 'price', prefix: 'R$' },
                { label: 'Aluguel Estimado / mês', key: 'rent', prefix: 'R$' },
                { label: 'Condomínio / mês', key: 'condo', prefix: 'R$' },
                { label: 'IPTU / mês', key: 'iptu', prefix: 'R$' },
              ] as const).map(({ label, key, prefix }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">{prefix}</span>
                    <input
                      type="number"
                      value={v[key] as number}
                      onChange={e => set(key, Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => set('useFinancing', !v.useFinancing)}
                    className={`w-10 h-6 rounded-full transition-colors ${v.useFinancing ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${v.useFinancing ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Financiamento (80% LTV)</div>
                    <div className="text-xs text-gray-400">10,5% a.a. — 30 anos — Caixa/SBPE</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Premissas */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs mb-3 uppercase tracking-wider">
                <Info className="h-3.5 w-3.5" /> Premissas automáticas
              </div>
              <ul className="space-y-1 text-xs text-blue-600">
                <li>• Administração: 8% do aluguel</li>
                <li>• Vacância: 1 mês/ano (8,3%)</li>
                <li>• Manutenção: 0,5% do valor/ano</li>
                <li>• Seguro: 0,1% do valor/ano</li>
                <li>• Custos de aquisição: 5,5% (ITBI + escritura)</li>
              </ul>
            </div>
          </div>

          {/* ── Resultados ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Classificação */}
            <div className={`rounded-2xl border-2 p-6 ${tagCfg.light} ${tagCfg.border}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`${tagCfg.bg} text-white font-bold text-sm px-4 py-1.5 rounded-full`}>
                  {tagCfg.label}
                </span>
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Compartilhar
                </a>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Yield Bruto',  value: fmtp(r.grossYield), big: true },
                  { label: 'Yield Líquido', value: fmtp(r.netYield),  big: true },
                  { label: 'ROI s/ Capital', value: fmtp(r.roi),      big: true },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className={`text-2xl font-extrabold ${tagCfg.text}`}>{m.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cashflow */}
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Cashflow Mensal Detalhado</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Aluguel bruto', value: v.rent, positive: true },
                  { label: '(-) Administração (8%)',  value: -r.admFee },
                  { label: '(-) Vacância (1 mês/ano)', value: -r.vacancy },
                  { label: '(-) Manutenção',           value: -r.maintenance },
                  { label: '(-) Seguro',                value: -r.insurance },
                  { label: '(-) Condomínio',            value: -v.condo },
                  { label: '(-) IPTU mensal',           value: -v.iptu },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{row.label}</span>
                    <span className={`font-medium ${row.positive ? 'text-gray-900' : 'text-red-500'}`}>
                      {fmt(Math.abs(row.value))}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2.5 flex justify-between text-sm font-bold">
                  <span className="text-gray-700">Aluguel líquido</span>
                  <span className={r.netRent >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(r.netRent)}</span>
                </div>
                {v.useFinancing && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">(-) Parcela financiamento</span>
                    <span className="font-medium text-red-500">{fmt(r.mortgage)}</span>
                  </div>
                )}
                <div className={`border-t pt-2.5 flex justify-between font-extrabold text-base rounded-xl px-3 py-2 ${r.cashflow >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <span>Cashflow líquido / mês</span>
                  <span>{fmt(r.cashflow)}</span>
                </div>
              </div>
            </div>

            {/* Comparativo benchmarks */}
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Comparativo com Renda Fixa</h3>
              <div className="space-y-3">
                {[
                  { label: 'Este imóvel (yield líquido)', value: r.netYield, yours: true },
                  { label: 'CDI (atual)',   value: CDI },
                  { label: 'SELIC (atual)', value: SELIC },
                  { label: 'FIIs (média)', value: FII },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-medium ${item.yours ? 'text-blue-700' : 'text-gray-600'}`}>{item.label}</span>
                      <span className={`font-bold ${item.yours ? 'text-blue-700' : 'text-gray-900'}`}>{fmtp(item.value)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.yours ? 'bg-blue-600' : 'bg-gray-300'}`}
                        style={{ width: `${Math.min((item.value / 15) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                {r.netYield > CDI
                  ? `✅ Este imóvel supera o CDI em ${(r.netYield - CDI).toFixed(2)} pontos percentuais.`
                  : `⚠️ Este imóvel não supera o CDI. Considere negociar o preço ou revisar custos.`}
              </p>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white text-center">
              <div className="font-bold text-lg mb-2">Quer analisar imóveis automaticamente?</div>
              <p className="text-blue-200 text-sm mb-4">
                O Atlas monitora ZAP, VivaReal e OLX e entrega só as Excelentes Oportunidades direto no seu WhatsApp.
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 text-sm">
                Criar Conta Grátis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
