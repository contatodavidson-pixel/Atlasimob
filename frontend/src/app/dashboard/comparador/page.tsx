'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { formatBRL } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { TrendingUp, Info, CheckCircle2, AlertCircle, DollarSign, Percent } from 'lucide-react';

// ── Benchmarks (atualizados manualmente — refletem cenário mai/2026) ──────────
const BENCHMARKS = [
  { key: 'CDI', label: 'CDI', value: 10.75, color: '#3b82f6', desc: 'Taxa CDI anualizada (% a.a.)' },
  { key: 'SELIC', label: 'SELIC', value: 10.75, color: '#6366f1', desc: 'Taxa básica de juros (% a.a.)' },
  { key: 'FII_MEDIO', label: 'FII Médio', value: 8.5, color: '#8b5cf6', desc: 'Dividend Yield médio de FIIs (% a.a.)' },
  { key: 'POUPANCA', label: 'Poupança', value: 6.17, color: '#9ca3af', desc: 'Rendimento da poupança (% a.a.)' },
  { key: 'IPCA', label: 'IPCA', value: 4.5, color: '#f59e0b', desc: 'Inflação oficial acumulada 12 meses' },
];

type Property = { id: string; address: string; area: string; grossYield: number; score: number; tag: string; price: number };

function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) return <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-yellow-400 text-yellow-900">1º</span>;
  if (rank === 1) return <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-gray-300 text-gray-700">2º</span>;
  if (rank === 2) return <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-600/80 text-white">3º</span>;
  return null;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="bg-white border rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-bold text-gray-800">{label}</p>
      <p className="text-gray-600">{v.toFixed(2)}% a.a.</p>
    </div>
  );
}

export default function ComparadorPage() {
  const [capital, setCapital] = useState(300000);
  const [years, setYears] = useState(10);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { data } = useQuery({
    queryKey: ['properties-comparador'],
    queryFn: () => propertiesApi.list({ limit: 100, sortBy: 'score', sortOrder: 'desc' }).then(r => r.data),
  });

  const properties: Property[] = useMemo(() => {
    return ((data?.data || []) as Property[])
      .filter((p: Property) => p.grossYield > 0)
      .slice(0, 20);
  }, [data]);

  // Use selected property or top property
  const activeYield = selectedProperty?.grossYield ?? properties[0]?.grossYield ?? 7.5;
  const activeLabel = selectedProperty?.address ?? properties[0]?.address ?? 'Melhor imóvel';

  // Chart data — merge property yield with benchmarks
  const chartData = [
    {
      name: 'Imóvel',
      label: activeLabel.split(',')[0].substring(0, 22),
      value: activeYield,
      color: activeYield >= 9 ? '#16a34a' : activeYield >= 7 ? '#65a30d' : '#d97706',
      isProperty: true,
    },
    ...BENCHMARKS.map(b => ({ name: b.key, label: b.label, value: b.value, color: b.color, isProperty: false })),
  ].sort((a, b) => b.value - a.value);

  // Compound return simulation
  function compound(rate: number, pv: number, n: number) {
    return pv * Math.pow(1 + rate / 100, n);
  }

  const simulations = [
    { name: 'Imóvel', label: activeLabel.split(',')[0].substring(0, 20), value: compound(activeYield, capital, years), rate: activeYield, color: '#16a34a' },
    ...BENCHMARKS.map(b => ({ name: b.key, label: b.label, value: compound(b.value, capital, years), rate: b.value, color: b.color })),
  ].sort((a, b) => b.value - a.value);

  const propertyRank = simulations.findIndex(s => s.name === 'Imóvel');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" /> Comparador CDI / FII / Imóvel
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare o retorno de imóveis analisados com os principais benchmarks do mercado financeiro brasileiro
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border p-5 grid sm:grid-cols-3 gap-5">
        {/* Capital */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> Capital inicial
          </label>
          <div className="flex flex-col gap-1">
            <input
              type="range" min={100000} max={2000000} step={50000}
              value={capital}
              onChange={e => setCapital(Number(e.target.value))}
              className="accent-blue-600"
            />
            <span className="text-lg font-black text-gray-900">{formatBRL(capital)}</span>
          </div>
        </div>

        {/* Years */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <Percent className="h-3.5 w-3.5" /> Horizonte de investimento
          </label>
          <div className="flex flex-col gap-1">
            <input
              type="range" min={1} max={30} step={1}
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="accent-blue-600"
            />
            <span className="text-lg font-black text-gray-900">{years} anos</span>
          </div>
        </div>

        {/* Property selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <Info className="h-3.5 w-3.5" /> Selecionar imóvel
          </label>
          <select
            className="w-full text-sm border rounded-xl px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedProperty?.id ?? ''}
            onChange={e => {
              const p = properties.find(p => p.id === e.target.value) || null;
              setSelectedProperty(p);
            }}
          >
            <option value="">Melhor imóvel disponível</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.address.substring(0, 35)} — {p.grossYield?.toFixed(1)}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-gray-900 mb-1 text-sm">Yield anual comparado (% a.a.)</h3>
          <p className="text-xs text-gray-400 mb-4">Ordenado do maior para o menor retorno bruto</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, Math.max(...chartData.map(d => d.value)) + 2]} />
              <Tooltip content={<CustomTooltip />} />
              {/* CDI reference line */}
              <ReferenceLine
                y={BENCHMARKS[0].value}
                stroke="#3b82f6"
                strokeDasharray="4 2"
                label={{ value: 'CDI', position: 'insideTopRight', fontSize: 10, fill: '#3b82f6' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={entry.isProperty ? 1 : 0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Ranking de yield</h3>
          <div className="space-y-2.5">
            {chartData.map((item, i) => (
              <div key={item.name} className={`flex items-center gap-2.5 p-2 rounded-lg ${item.isProperty ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                <RankBadge rank={i} />
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.label}</p>
                  {item.isProperty && <p className="text-[10px] text-green-600">Imóvel selecionado</p>}
                </div>
                <span className="text-sm font-black" style={{ color: item.color }}>{item.value.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compound growth simulation */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Simulação de crescimento patrimonial</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatBRL(capital)} investidos por {years} anos com reinvestimento integral
            </p>
          </div>
          {propertyRank <= 2 && (
            <div className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl ${
              propertyRank === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'
            }`}>
              <CheckCircle2 className="h-4 w-4" />
              {propertyRank === 0 ? 'Melhor retorno!' : `${propertyRank + 1}º melhor retorno`}
            </div>
          )}
          {propertyRank > 2 && (
            <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              Abaixo da média
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {simulations.map((s, i) => {
            const gain = s.value - capital;
            const gainPct = (gain / capital) * 100;
            return (
              <div key={s.name} className={`rounded-xl p-4 border ${s.name === 'Imóvel' ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-semibold text-gray-600 truncate max-w-[100px]">{s.label}</span>
                  </div>
                  <RankBadge rank={i} />
                </div>
                <p className="text-xl font-black text-gray-900">{formatBRL(s.value)}</p>
                <p className={`text-xs font-semibold mt-0.5 ${gain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  +{formatBRL(gain)} ({gainPct.toFixed(0)}% de retorno)
                </p>
                <p className="text-[10px] text-gray-400 mt-1">{s.rate.toFixed(2)}% a.a.</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Simulação para fins educacionais. Yield do imóvel é bruto (sem considerar IR, vacância, reformas ou custos de transação).
          CDI/SELIC estão sujeitos a variações. FII Médio baseado em dividend yield histórico.
          Retornos passados não garantem retornos futuros.
        </p>
      </div>
    </div>
  );
}
