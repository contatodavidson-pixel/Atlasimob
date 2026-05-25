'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';
import { Bell, Plus, Trash2, Toggle } from 'lucide-react';

export default function AlertsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'DAILY_MORNING', channels: ['email'] });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => alertsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const TYPE_CONFIG = {
    DAILY_MORNING: { label: 'Alerta Matinal (8h)', desc: 'Novos imóveis do dia', icon: '🌅' },
    DAILY_NOON: { label: 'Alerta ao Meio-dia (12h)', desc: 'Imóveis com preço reduzido', icon: '🔥' },
    WEEKLY_REPORT: { label: 'Relatório Semanal (Segunda)', desc: 'Resumo completo da semana', icon: '📊' },
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Configuração de Alertas</h2>
          <p className="text-sm text-gray-500">Receba notificações automáticas via email e WhatsApp</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Novo Alerta
        </button>
      </div>

      {/* Alertas padrão explicação */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2"><Bell className="h-4 w-4" /> Alertas Automáticos do Sistema</h3>
        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-3 mb-2">
            <span className="text-lg">{config.icon}</span>
            <div>
              <p className="text-sm font-medium text-blue-800">{config.label}</p>
              <p className="text-xs text-blue-600">{config.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Novo Alerta Personalizado</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Alerta</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Canais</label>
              <div className="flex gap-3">
                {['email', 'whatsapp'].map(ch => (
                  <label key={ch} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.channels.includes(ch)}
                      onChange={e => setForm(f => ({
                        ...f,
                        channels: e.target.checked
                          ? [...f.channels, ch]
                          : f.channels.filter(c => c !== ch),
                      }))}
                      className="rounded"
                    />
                    {ch.charAt(0).toUpperCase() + ch.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMutation.mutate()}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Configured alerts */}
      <div className="bg-white rounded-xl border divide-y">
        {alerts?.map((alert: { id: string; type: string; active: boolean; channels: string[] }) => (
          <div key={alert.id} className="px-5 py-4 flex items-center gap-4">
            <div className="text-2xl">{TYPE_CONFIG[alert.type as keyof typeof TYPE_CONFIG]?.icon || '🔔'}</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">
                {TYPE_CONFIG[alert.type as keyof typeof TYPE_CONFIG]?.label || alert.type}
              </p>
              <p className="text-xs text-gray-500">Canais: {alert.channels.join(', ')}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${alert.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {alert.active ? 'Ativo' : 'Pausado'}
            </span>
            <button
              onClick={() => deleteMutation.mutate(alert.id)}
              className="text-red-400 hover:text-red-600 p-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {!alerts?.length && (
          <div className="py-12 text-center text-gray-400 text-sm">
            Nenhum alerta personalizado configurado
          </div>
        )}
      </div>
    </div>
  );
}
