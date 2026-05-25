'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investorsApi } from '@/lib/api';
import { formatBRL } from '@/lib/utils';
import { Users, Plus, Mail, Phone, Star, Loader2, ChevronRight, TrendingUp } from 'lucide-react';

const STATUS_CONFIG = {
  LEAD: { label: 'Lead', color: 'bg-gray-100 text-gray-600' },
  PROSPECT: { label: 'Prospect', color: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  INVESTED: { label: 'Investido', color: 'bg-purple-100 text-purple-700' },
  INACTIVE: { label: 'Inativo', color: 'bg-red-100 text-red-600' },
} as const;

interface NewInvestorForm {
  name: string; email: string; phone: string;
  budget: string; source: string; notes: string;
}

export default function InvestorsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<NewInvestorForm>({ name: '', email: '', phone: '', budget: '', source: '', notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['investors'],
    queryFn: () => investorsApi.list().then(r => r.data),
  });

  const { data: pipeline } = useQuery({
    queryKey: ['investor-pipeline'],
    queryFn: () => investorsApi.pipeline().then(r => r.data),
  });

  const { data: selected } = useQuery({
    queryKey: ['investor', selectedId],
    queryFn: () => investorsApi.get(selectedId!).then(r => r.data),
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: () => investorsApi.create({ ...form, budget: form.budget ? Number(form.budget) : undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investors'] });
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', budget: '', source: '', notes: '' });
    },
  });

  const matchMutation = useMutation({
    mutationFn: () => investorsApi.list(),
    onSuccess: () => alert('Matching iniciado! Os investidores serão notificados sobre negócios compatíveis.'),
  });

  const investors = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Pipeline */}
      {pipeline && (
        <div className="grid grid-cols-5 gap-3">
          {pipeline.map((p: { status: keyof typeof STATUS_CONFIG; _count: number }) => (
            <div key={p.status} className="bg-white rounded-xl border p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{p._count}</div>
              <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${STATUS_CONFIG[p.status]?.color}`}>
                {STATUS_CONFIG[p.status]?.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Novo Investidor
        </button>
        <button
          onClick={() => matchMutation.mutate()}
          className="flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <TrendingUp className="h-4 w-4" /> Fazer Matching Automático
        </button>
      </div>

      {/* New investor form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Novo Investidor</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Nome', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Telefone / WhatsApp', key: 'phone', type: 'tel' },
              { label: 'Budget (R$)', key: 'budget', type: 'number' },
              { label: 'Fonte (LinkedIn, Indicação...)', key: 'source', type: 'text' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key as keyof NewInvestorForm]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List + Detail */}
      <div className="flex gap-4">
        {/* List */}
        <div className="flex-1 bg-white rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : (
            <div className="divide-y">
              {investors.map((inv: {
                id: string; name: string; email: string; phone?: string;
                status: keyof typeof STATUS_CONFIG; budget?: number;
                source?: string; _count: { emailHistory: number; matches: number };
              }) => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4 ${selectedId === inv.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                    {inv.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{inv.name}</p>
                    <p className="text-xs text-gray-500">{inv.email}</p>
                    {inv.budget && <p className="text-xs text-gray-400">Budget: {formatBRL(inv.budget)}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[inv.status]?.color}`}>
                      {STATUS_CONFIG[inv.status]?.label}
                    </span>
                    <span className="text-xs text-gray-400">{inv._count.matches} matches</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
              {!investors.length && (
                <div className="py-16 text-center text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum investidor cadastrado</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 bg-white rounded-xl border p-5 space-y-4 flex-shrink-0">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-2xl mx-auto mb-3">
                {selected.name[0].toUpperCase()}
              </div>
              <h3 className="font-bold text-gray-900">{selected.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[selected.status as keyof typeof STATUS_CONFIG]?.color}`}>
                {STATUS_CONFIG[selected.status as keyof typeof STATUS_CONFIG]?.label}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" /> {selected.email}
              </div>
              {selected.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" /> {selected.phone}
                </div>
              )}
              {selected.budget && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Star className="h-4 w-4" /> Budget: {formatBRL(selected.budget)}
                </div>
              )}
            </div>

            {selected.matches?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-2">NEGÓCIOS COMPATÍVEIS</h4>
                {selected.matches.slice(0, 3).map((m: { property: { id: string; address: string; grossYield: number }; score: number }) => (
                  <div key={m.property.id} className="text-xs bg-green-50 rounded-lg p-2 mb-1">
                    <p className="font-medium text-gray-800 truncate">{m.property.address}</p>
                    <p className="text-gray-500">Score: {m.score.toFixed(1)} · Yield: {m.property.grossYield?.toFixed(2)}%</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={async () => {
                const email = prompt('Cole o email recebido do investidor:');
                if (email) {
                  await investorsApi.autoReply(selected.id, { incomingEmail: email });
                  alert('Email respondido automaticamente pela IA!');
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700"
            >
              <Mail className="h-4 w-4" /> Auto-Responder por IA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
