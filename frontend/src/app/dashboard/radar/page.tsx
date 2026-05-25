'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatBRL } from '@/lib/utils';
import { TrendingUp, MapPin, DollarSign, Building2, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CityRadar {
  city: string; avgYield: number; avgCashflow: number; avgPrice: number; total: number;
}

const CDI = 10.75;

function YieldBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= 7.2 ? '#16a34a' : value >= 4.8 ? '#d97706' : '#dc2626';
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function RadarPage() {
  const { data: cities = [], isLoading } = useQuery<CityRadar[]>({
    queryKey: ['radar-cities'],
    queryFn: () => api.get('/properties/radar/cities').then(r => r.data),
  });

  const { data: dealOfDay } = useQuery({
    queryKey: ['deal-of-day'],
    queryFn: () => api.get('/properties/deal-of-day').then(r => r.data).catch(() => null),
    retry: false,
  });

  const maxYield = Math.max(...cities.map(c => c.avgYield), 1);

  const chartData = [...cities].sort((a, b) => b.avgYield - a.avgYield).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Radar de Oportunidades</h2>
          <p className="text-sm text-gray-500">Yield médio por cidade · dados dos imóveis analisados</p>
        </div>
        <a href="/deal-do-dia" target="_blank"
          className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700">
          <ExternalLink className="h-4 w-4" /> Deal do Dia público
        </a>
      </div>

      {/* Deal do Dia highlight */}
      {dealOfDay && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-5 text-white flex items-center gap-6">
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-green-200 mb-1">🏆 Deal do Dia</div>
            <div className="font-bold text-lg">{dealOfDay.address}</div>
            <div className="text-green-200 text-sm">{dealOfDay.area}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold">{dealOfDay.grossYield?.toFixed(2)}%</div>
            <div className="text-green-200 text-xs">Yield bruto a.a.</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold">{formatBRL(dealOfDay.cashflow)}</div>
            <div className="text-green-200 text-xs">Cashflow/mês</div>
          </div>
          <a href={`https://wa.me/?text=${encodeURIComponent(`🏠 *Deal do Dia — Atlas*\n\n📍 ${dealOfDay.address}\n💰 ${formatBRL(dealOfDay.price)}\n📈 Yield: ${dealOfDay.grossYield?.toFixed(2)}% a.a.\n💵 Cashflow: ${formatBRL(dealOfDay.cashflow)}/mês\n\n🔗 atlasimob.app.br/deal-do-dia`)}`}
             target="_blank" rel="noopener noreferrer"
             className="bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 flex-shrink-0">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Compartilhar
          </a>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <div className="lg:col-span-2 bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-gray-900 mb-1">Yield Médio por Cidade</h3>
          <p className="text-xs text-gray-400 mb-5">Linha vermelha = CDI atual ({CDI}%)</p>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-300">Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(2)}% a.a.`, 'Yield médio']}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="avgYield" radius={[6, 6, 0, 0]} name="Yield">
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.city}
                      fill={entry.avgYield >= 7.2 ? '#16a34a' : entry.avgYield >= 4.8 ? '#d97706' : '#dc2626'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-600" /> Excelente (≥7,2%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-600" /> Moderada (4,8-7,2%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600" /> Não recomendado ({'<4,8%'})</span>
          </div>
        </div>

        {/* Benchmarks */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-gray-900 mb-4">Benchmarks de Mercado</h3>
          <div className="space-y-4">
            {[
              { label: 'CDI',            value: CDI,   color: 'text-blue-600', bar: '#3b82f6' },
              { label: 'SELIC',          value: 10.75, color: 'text-indigo-600', bar: '#6366f1' },
              { label: 'FIIs (média)',   value: 8.5,   color: 'text-purple-600', bar: '#9333ea' },
              { label: 'Poupança',       value: 6.17,  color: 'text-gray-500', bar: '#9ca3af' },
            ].map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{b.label}</span>
                  <span className={`font-bold ${b.color}`}>{b.value.toFixed(2)}% a.a.</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${(b.value / 15) * 100}%`, background: b.bar }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-400 leading-relaxed">
              Um imóvel com yield bruto ≥ 7,2% a.a. supera o CDI com risco patrimonial. Abaixo disso, pode não compensar frente à renda fixa.
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de cidades */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Ranking de Cidades por Yield</h3>
          <span className="text-xs text-gray-400">{cities.length} cidades analisadas</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-gray-300 text-sm">Carregando...</div>
        ) : cities.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Execute o scraping para popular o radar com dados reais.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">#</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Cidade</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Yield Médio</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">vs CDI</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Cashflow Médio</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Preço Médio</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Imóveis</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cities.map((c, i) => {
                  const vsCdi = c.avgYield - CDI;
                  return (
                    <tr key={c.city} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-gray-400 font-bold">{i + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{c.city}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <span className={`font-bold ${c.avgYield >= 7.2 ? 'text-green-600' : c.avgYield >= 4.8 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {c.avgYield.toFixed(2)}% a.a.
                          </span>
                          <YieldBar value={c.avgYield} max={maxYield} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-semibold text-sm ${vsCdi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {vsCdi >= 0 ? '+' : ''}{vsCdi.toFixed(2)} p.p.
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {formatBRL(c.avgCashflow)}/mês
                      </td>
                      <td className="px-5 py-4 text-gray-600">{formatBRL(c.avgPrice)}</td>
                      <td className="px-5 py-4">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {c.total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
