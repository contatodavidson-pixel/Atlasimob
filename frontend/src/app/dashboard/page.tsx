'use client';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi, reportsApi } from '@/lib/api';
import { formatBRL, TAG_CONFIG } from '@/lib/utils';
import { Building2, TrendingUp, TrendingDown, AlertCircle, Star, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = { STRONG_DEAL: '#16a34a', MARGINAL: '#d97706', AVOID: '#dc2626' };

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['property-stats'],
    queryFn: () => propertiesApi.stats().then(r => r.data),
  });

  const { data: dashData } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => reportsApi.dashboard().then(r => r.data),
  });

  const { data: topDeals } = useQuery({
    queryKey: ['top-deals'],
    queryFn: () => propertiesApi.list({ tag: 'STRONG_DEAL', limit: 5, sortBy: 'grossYield', sortOrder: 'desc' }).then(r => r.data.data),
  });

  const pieData = stats ? [
    { name: 'Negócio Forte', value: stats.strongDeals, key: 'STRONG_DEAL' },
    { name: 'Marginal', value: stats.marginalDeals, key: 'MARGINAL' },
    { name: 'Evitar', value: stats.avoidDeals, key: 'AVOID' },
  ].filter(d => d.value > 0) : [];

  const areaData = dashData?.byArea?.slice(0, 8).map((a: { area: string; _count: number; _avg: { grossYield: number } }) => ({
    area: a.area,
    total: a._count,
    yield: Number(a._avg.grossYield?.toFixed(2) || 0),
  })) || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total de Imóveis', value: stats?.total || 0, icon: Building2, color: 'blue' },
          { label: 'Negócios Fortes', value: stats?.strongDeals || 0, icon: Star, color: 'green' },
          { label: 'Marginais', value: stats?.marginalDeals || 0, icon: TrendingUp, color: 'yellow' },
          { label: 'Evitar', value: stats?.avoidDeals || 0, icon: TrendingDown, color: 'red' },
          { label: 'Novos Hoje', value: stats?.newToday || 0, icon: AlertCircle, color: 'purple' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border p-4">
            <div className={`w-8 h-8 rounded-lg bg-${card.color}-100 flex items-center justify-center mb-3`}>
              <card.icon className={`h-4 w-4 text-${card.color}-600`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Qualidade dos Negócios</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={PIE_COLORS[entry.key as keyof typeof PIE_COLORS]} />
                ))}
              </Pie>
              <Legend formatter={(v) => TAG_CONFIG[v as keyof typeof TAG_CONFIG]?.label || v} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart por área */}
        <div className="bg-white rounded-xl border p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Imóveis por Cidade</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={areaData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="area" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Deals */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Top Negócios (Yield Bruto)</h3>
          <a href="/dashboard/dealflow?tag=STRONG_DEAL" className="text-blue-600 text-sm font-medium hover:underline">Ver todos</a>
        </div>
        <div className="divide-y">
          {topDeals?.map((p: {
            id: string; address: string; area: string; price: number;
            bedrooms: number; grossYield: number; netYield: number;
            cashflow: number; tag: keyof typeof TAG_CONFIG;
          }) => (
            <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{p.address}</p>
                <p className="text-xs text-gray-500">{p.area} · {p.bedrooms} quartos</p>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-gray-900">{formatBRL(p.price)}</div>
                <div className="text-gray-500 text-xs">Yield: {p.grossYield?.toFixed(2)}%</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-green-600">{formatBRL(p.cashflow)}/mês</div>
                <div className="text-gray-500 text-xs">Cashflow</div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full border ${TAG_CONFIG[p.tag]?.color || ''}`}>
                {TAG_CONFIG[p.tag]?.label || p.tag}
              </span>
            </div>
          ))}
          {!topDeals?.length && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              Nenhum negócio forte encontrado. Execute o scraping para popular o sistema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
