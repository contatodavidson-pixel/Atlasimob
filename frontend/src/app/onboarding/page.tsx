'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { BRAZILIAN_CITIES } from '@/lib/utils';
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

const PROFILES = [
  { id: 'CASUAL', label: 'Iniciante', emoji: '🌱', desc: 'Estou começando no mercado imobiliário e quero aprender' },
  { id: 'ACTIVE', label: 'Ativo', emoji: '📈', desc: 'Já tenho experiência e busco boas oportunidades constantemente' },
  { id: 'PROFESSIONAL', label: 'Profissional', emoji: '🏆', desc: 'Invisto profissionalmente e gerencio múltiplos imóveis' },
];

const PROPERTY_TYPES = ['Apartamento', 'Casa', 'Kitnet/Studio', 'Cobertura', 'Sala Comercial', 'Galpão'];

const BUDGET_OPTIONS = [
  { label: 'Até R$ 200k', value: 200000 },
  { label: 'R$ 200k – 400k', value: 400000 },
  { label: 'R$ 400k – 700k', value: 700000 },
  { label: 'R$ 700k – 1M', value: 1000000 },
  { label: 'Acima de R$ 1M', value: 2000000 },
];

const YIELD_OPTIONS = [
  { label: 'Qualquer yield', value: 0 },
  { label: '> 4% a.a.', value: 4 },
  { label: '> 6% a.a.', value: 6 },
  { label: '> 8% a.a.', value: 8 },
  { label: '> 10% a.a.', value: 10 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    investorProfile: 'CASUAL',
    budget: 400000,
    preferredCities: [] as string[],
    preferredTypes: [] as string[],
    minYield: 6,
    whatsappPhone: '',
  });

  const toggleCity = (city: string) => {
    setData(d => ({
      ...d,
      preferredCities: d.preferredCities.includes(city)
        ? d.preferredCities.filter(c => c !== city)
        : [...d.preferredCities, city].slice(0, 5),
    }));
  };

  const toggleType = (type: string) => {
    setData(d => ({
      ...d,
      preferredTypes: d.preferredTypes.includes(type)
        ? d.preferredTypes.filter(t => t !== type)
        : [...d.preferredTypes, type],
    }));
  };

  const finish = async () => {
    setLoading(true);
    try {
      const res = await authApi.updateMe({
        ...data,
        onboardingCompleted: true,
      });
      if (token) setAuth(res.data, token);
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Qual é o seu perfil de investidor?',
      subtitle: 'Isso nos ajuda a personalizar sua experiência no Atlas',
    },
    {
      title: 'Quais cidades você quer monitorar?',
      subtitle: 'Selecione até 5 cidades. Você pode mudar depois nas configurações.',
    },
    {
      title: 'Quais são seus critérios de investimento?',
      subtitle: 'Vamos filtrar os melhores imóveis para o seu perfil',
    },
    {
      title: 'Tudo pronto!',
      subtitle: 'Configure suas notificações para não perder nenhum deal',
    },
  ];

  const canAdvance = [
    !!data.investorProfile,
    data.preferredCities.length > 0,
    data.budget > 0,
    true,
  ][step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/atlas-logo-dark.png" alt="Atlas" className="h-16 w-auto mx-auto" />
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-blue-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8">
          <h1 className="text-2xl font-black text-white mb-2">{steps[step].title}</h1>
          <p className="text-white/50 text-sm mb-8">{steps[step].subtitle}</p>

          {/* Step 0 — Investor Profile */}
          {step === 0 && (
            <div className="space-y-3">
              {PROFILES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setData(d => ({ ...d, investorProfile: p.id }))}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    data.investorProfile === p.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <span className="text-3xl">{p.emoji}</span>
                  <div>
                    <p className="font-bold text-white">{p.label}</p>
                    <p className="text-sm text-white/50">{p.desc}</p>
                  </div>
                  {data.investorProfile === p.id && (
                    <CheckCircle2 className="h-5 w-5 text-blue-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 1 — Cities */}
          {step === 1 && (
            <div>
              <p className="text-xs text-white/40 mb-3">{data.preferredCities.length}/5 selecionadas</p>
              <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-1">
                {BRAZILIAN_CITIES.map(city => (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      data.preferredCities.includes(city)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white bg-white/5'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Criteria */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-white/80 mb-3">Orçamento máximo</p>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setData(d => ({ ...d, budget: opt.value }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        data.budget === opt.value
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white bg-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white/80 mb-3">Yield mínimo desejado</p>
                <div className="flex flex-wrap gap-2">
                  {YIELD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setData(d => ({ ...d, minYield: opt.value }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        data.minYield === opt.value
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white bg-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white/80 mb-3">Tipos de imóvel</p>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        data.preferredTypes.includes(type)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white bg-white/5'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Notifications */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <h3 className="font-bold text-white text-lg mb-1">Perfil configurado com sucesso!</h3>
                <p className="text-white/50 text-sm">
                  O Atlas vai monitorar {data.preferredCities.length > 0 ? data.preferredCities.join(', ') : 'todas as cidades'} e alertar quando encontrar deals com yield acima de {data.minYield}% a.a.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  WhatsApp para alertas instantâneos (opcional)
                </label>
                <input
                  type="tel"
                  value={data.whatsappPhone}
                  onChange={e => setData(d => ({ ...d, whatsappPhone: e.target.value }))}
                  placeholder="+55 11 99999-9999"
                  className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-white/25"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { emoji: '🔔', text: 'Alertas em tempo real' },
                  { emoji: '🎯', text: 'Score personalizado' },
                  { emoji: '📊', text: 'Análise automática' },
                ].map(item => (
                  <div key={item.text} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <p className="text-xs text-white/60 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-2.5 border border-white/15 text-white/70 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
            )}
            <button
              onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : finish()}
              disabled={!canAdvance || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
              ) : step < steps.length - 1 ? (
                <>Continuar <ChevronRight className="h-4 w-4" /></>
              ) : (
                <>Entrar no Atlas 🚀</>
              )}
            </button>
          </div>

          {/* Skip */}
          {step < steps.length - 1 && (
            <button
              onClick={() => step === steps.length - 2 ? setStep(steps.length - 1) : setStep(s => s + 1)}
              className="w-full text-center text-xs text-white/25 hover:text-white/50 mt-4 transition-colors"
            >
              Pular esta etapa
            </button>
          )}
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Olá, {user?.name?.split(' ')[0]} 👋 — você pode alterar tudo isso depois em Configurações
        </p>
      </div>
    </div>
  );
}
