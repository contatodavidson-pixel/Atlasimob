'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  User, Bell, CreditCard, Save, Loader2, CheckCircle2,
  Phone, Mail, Zap, Star, Shield, Smartphone
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'plan', label: 'Plano', icon: CreditCard },
];

const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: 'Grátis',
    color: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    features: ['20 imóveis/mês', 'Análise IA básica', 'Deal do Dia', 'Calculadora'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 197/mês',
    color: 'border-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    features: ['Imóveis ilimitados', 'Análise IA completa', 'Alertas WhatsApp', 'Radar de cidades', 'Mapa de oportunidades', 'Gerador de LOI', 'Suporte prioritário'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Sob consulta',
    color: 'border-purple-500',
    badge: 'bg-purple-100 text-purple-700',
    features: ['Tudo do Pro', 'API de dados', 'Integração CRM', 'White-label', 'Gestor dedicado', 'SLA garantido'],
  },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const { setAuth, token } = useAuthStore();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then(r => r.data),
  });

  const [form, setForm] = useState({ name: '', phone: '', whatsappPhone: '' });
  const [notifForm, setNotifForm] = useState({ notifyEmail: true });
  const { permission, supported, requestPermission } = usePushNotifications();

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', phone: profile.phone || '', whatsappPhone: profile.whatsappPhone || '' });
      setNotifForm({ notifyEmail: profile.notifyEmail ?? true });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: object) => authApi.updateMe(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['me'] });
      if (token) setAuth(res.data, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  );

  const p = profile || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-2xl border p-1.5 flex gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="bg-white rounded-2xl border p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-black">{(p.name || 'U')[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{p.name}</h2>
              <p className="text-sm text-gray-500">{p.email}</p>
              <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {p.role === 'ADMIN' ? 'Administrador' : 'Investidor'}
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="inline h-3.5 w-3.5 mr-1" />Email
              </label>
              <input
                value={p.email || ''}
                disabled
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="inline h-3.5 w-3.5 mr-1" />Telefone
              </label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+55 11 99999-9999"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                WhatsApp para alertas
              </label>
              <input
                value={form.whatsappPhone}
                onChange={e => setForm(f => ({ ...f, whatsappPhone: e.target.value }))}
                placeholder="+55 11 99999-9999"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Salvo!' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="bg-white rounded-2xl border p-6 space-y-5">
          <div>
            <h2 className="font-bold text-gray-900 mb-1">Preferências de notificação</h2>
            <p className="text-sm text-gray-500">Escolha como quer receber alertas de novos deals</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="mt-0.5 p-2 bg-blue-50 rounded-lg text-blue-600">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Email</p>
                <p className="text-xs text-gray-500 mt-0.5">Resumos diários e alertas de STRONG_DEAL por email</p>
              </div>
              <input
                type="checkbox"
                checked={notifForm.notifyEmail}
                onChange={e => setNotifForm(f => ({ ...f, notifyEmail: e.target.checked }))}
                className="w-4 h-4 mt-1 accent-blue-600 rounded"
              />
            </label>

            <div className="flex items-start gap-4 p-4 border border-green-100 bg-green-50 rounded-xl">
              <div className="mt-0.5 p-2 bg-green-100 rounded-lg text-green-600">
                <Phone className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                {p.whatsappPhone
                  ? <p className="text-xs text-green-700 mt-0.5">Configurado: {p.whatsappPhone}</p>
                  : <p className="text-xs text-gray-500 mt-0.5">Configure seu número na aba Perfil para receber alertas no WhatsApp</p>
                }
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border border-blue-100 bg-blue-50 rounded-xl">
              <div className="mt-0.5 p-2 bg-blue-100 rounded-lg text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Notificações em tempo real (SSE)</p>
                <p className="text-xs text-blue-700 mt-0.5">✅ Ativo — alertas no sino 🔔 quando um STRONG_DEAL é detectado</p>
              </div>
            </div>

            {/* Push Notifications */}
            {supported && (
              <div className={`flex items-start gap-4 p-4 border rounded-xl ${
                permission === 'granted' ? 'border-green-200 bg-green-50' :
                permission === 'denied' ? 'border-red-100 bg-red-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className={`mt-0.5 p-2 rounded-lg ${
                  permission === 'granted' ? 'bg-green-100 text-green-600' :
                  permission === 'denied' ? 'bg-red-100 text-red-500' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Notificações push (browser)</p>
                  {permission === 'granted' && (
                    <p className="text-xs text-green-700 mt-0.5">✅ Ativo — você receberá alertas mesmo com o browser minimizado</p>
                  )}
                  {permission === 'denied' && (
                    <p className="text-xs text-red-600 mt-0.5">❌ Bloqueado — ative nas configurações do seu browser</p>
                  )}
                  {permission === 'default' && (
                    <div>
                      <p className="text-xs text-gray-500 mt-0.5">Receba alertas de STRONG_DEAL mesmo com o browser minimizado</p>
                      <button
                        onClick={requestPermission}
                        className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Ativar notificações push
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => updateMutation.mutate(notifForm)}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Salvo!' : 'Salvar preferências'}
          </button>
        </div>
      )}

      {/* Plan Tab */}
      {tab === 'plan' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl">
              <Shield className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Plano atual: <span className="text-gray-500">Starter (Grátis)</span></p>
              <p className="text-xs text-gray-400">Faça upgrade para desbloquear todos os recursos</p>
            </div>
          </div>

          <div className="grid gap-4">
            {PLANS.map(plan => (
              <div key={plan.id} className={`bg-white rounded-2xl border-2 p-5 ${plan.color} relative`}>
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" /> Recomendado
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.badge}`}>{plan.name}</span>
                    <p className="text-2xl font-black text-gray-900 mt-2">{plan.price}</p>
                  </div>
                  {plan.id === 'free' && (
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-lg">Plano atual</span>
                  )}
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.id !== 'free' && (
                  <button className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    plan.id === 'pro' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}>
                    {plan.id === 'enterprise' ? 'Falar com comercial' : 'Fazer upgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400">
            Pagamentos processados com segurança · Cancele quando quiser · Sem fidelidade
          </p>
        </div>
      )}
    </div>
  );
}
