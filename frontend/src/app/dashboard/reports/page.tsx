'use client';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { BarChart3, TrendingUp, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';

export default function ReportsPage() {
  const { data: dashData } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => reportsApi.dashboard().then(r => r.data),
  });

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list().then(r => r.data),
  });

  const areaData = dashData?.byArea?.slice(0, 10).map((a: { area: string; _count: number; _avg: { grossYield: number; cashflow: number } }) => ({
    area: a.area,
    total: a._count,
    yield: Number((a._avg.grossYield || 0).toFixed(2)),
    cashflow: Number((a._avg.cashflow || 0).toFixed(0)),
  })) || [];

  const avgMetrics = dashData?.avgMetrics || {};

  return (
    <div className="space-y-6">
      {/* Benchmarks */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">Benchmarks do Mercado Brasileiro (referência)</p>
        <div className="flex flex-wrap gap-4 text-sm text-blue-700">
          <span>SELIC: ~10,5% a.a.</span>
          <span>CDI: ~10,4% a.a.</span>
          <span>FIIs (IFIX): ~8-10% a.a.</span>
          <span>Poupança: ~7,5% a.a.</span>
        </div>
      </div>

      {/* Métricas médias */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Yield Bruto Médio', value: `${(avgMetrics.grossYield || 0).toFixed(2)}% a.a.`, icon: TrendingUp, color: 'blue' },
          { label: 'Yield Líquido Médio', value: `${(avgMetrics.netYield || 0).toFixed(2)}% a.a.`, icon: TrendingUp, color: 'green' },
          { label: 'Cashflow Médio', value: `R$${(avgMetrics.cashflow || 0).toFixed(0)}/mês`, icon: BarChart3, color: 'purple' },
          { label: 'ROI Médio', value: `${(avgMetrics.roi || 0).toFixed(2)}%`, icon: TrendingUp, color: 'orange' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border p-4">
            <div className={`text-2xl font-bold text-${m.color}-600 mb-1`}>{m.value}</div>
            <div className="text-xs text-gray-500">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Yield Médio por Área</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={areaData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="area" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => [`${v}% a.a.`, 'Yield Bruto']} />
              <Bar dataKey="yield" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Yield Bruto" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Cashflow por Área</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={areaData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="area" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="R$" />
              <Tooltip formatter={(v) => [`R$${v}`, 'Cashflow médio/mês']} />
              <Bar dataKey="cashflow" fill="#16a34a" radius={[4, 4, 0, 0]} name="Cashflow" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report history */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Histórico de Relatórios</h3>
        </div>
        <div className="divide-y">
          {reports?.map((r: { id: string; type: string; period: string; createdAt: string; data: { total: number } }) => (
            <div key={r.id} className="px-5 py-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {r.type === 'WEEKLY' ? 'Relatório Semanal' : 'Relatório Mensal'}
                </p>
                <p className="text-xs text-gray-500">
                  Período: {r.period} · {r.data?.total || 0} imóveis analisados
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(r.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          ))}
          {!reports?.length && (
            <div className="py-12 text-center text-gray-400 text-sm">
              Nenhum relatório gerado ainda. O primeiro relatório será enviado na próxima segunda-feira.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
