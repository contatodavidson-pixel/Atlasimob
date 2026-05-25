'use client';
import { Activity, TrendingUp, Clock, Users, MapPin } from 'lucide-react';

interface LiquidityScoreProps {
  index: string;          // 'ALTA' | 'MEDIA' | 'BAIXA'
  area?: string;
  propertyType?: string;
  bedrooms?: number;
  daysListed?: number;
  compact?: boolean;      // compact = badge only (used in cards), default = full panel
}

const DIMENSIONS = [
  {
    key: 'demand',
    label: 'Demanda da região',
    icon: MapPin,
    getScore: (area: string, type: string) => {
      const highDemandAreas = ['São Paulo', 'Campinas', 'Florianópolis', 'Curitiba', 'Porto Alegre', 'Belo Horizonte', 'Rio de Janeiro'];
      const medDemandAreas = ['Goiânia', 'Fortaleza', 'Salvador', 'Recife', 'Manaus'];
      const areaScore = highDemandAreas.some(a => area?.includes(a)) ? 90
        : medDemandAreas.some(a => area?.includes(a)) ? 65 : 45;
      const typeBonus = ['Apartamento', 'Kitnet/Studio'].includes(type) ? 10 : 0;
      return Math.min(100, areaScore + typeBonus);
    },
  },
  {
    key: 'absorption',
    label: 'Velocidade de absorção',
    icon: TrendingUp,
    getScore: (_area: string, _type: string, bedrooms: number) => {
      // 1-2 bedrooms absorb faster
      if (bedrooms <= 1) return 88;
      if (bedrooms === 2) return 75;
      if (bedrooms === 3) return 60;
      return 40;
    },
  },
  {
    key: 'daysListed',
    label: 'Tempo em mercado',
    icon: Clock,
    getScore: (_area: string, _type: string, _bed: number, days: number) => {
      if (!days || days <= 7) return 95;
      if (days <= 15) return 82;
      if (days <= 30) return 68;
      if (days <= 60) return 50;
      if (days <= 90) return 35;
      return 20;
    },
  },
  {
    key: 'renters',
    label: 'Perfil de locatários',
    icon: Users,
    getScore: (_area: string, type: string) => {
      if (['Kitnet/Studio', 'Apartamento'].includes(type)) return 85;
      if (type === 'Casa') return 70;
      if (type === 'Cobertura') return 60;
      if (type === 'Sala Comercial') return 45;
      return 55;
    },
  },
];

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  );
}

const CONFIG = {
  ALTA: { label: 'Alta Liquidez', color: '#16a34a', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: '#16a34a', score: 85 },
  MEDIA: { label: 'Liquidez Média', color: '#d97706', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', bar: '#d97706', score: 55 },
  BAIXA: { label: 'Baixa Liquidez', color: '#dc2626', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: '#dc2626', score: 25 },
};

export default function LiquidityScore({ index, area = '', propertyType = '', bedrooms = 2, daysListed, compact = false }: LiquidityScoreProps) {
  const cfg = CONFIG[index as keyof typeof CONFIG] ?? CONFIG.MEDIA;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
        <Activity className="h-3 w-3" />
        {cfg.label}
      </span>
    );
  }

  const dimScores = DIMENSIONS.map(d => ({
    ...d,
    score: d.getScore(area, propertyType, bedrooms, daysListed ?? 30),
  }));

  return (
    <div className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: cfg.color }} />
            Índice de Liquidez
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Estimativa de facilidade de alugar / vender</p>
        </div>
        {/* Score circle */}
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 60 60" className="w-16 h-16 -rotate-90">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="30" cy="30" r="24" fill="none"
              stroke={cfg.color} strokeWidth="6"
              strokeDasharray={`${(cfg.score / 100) * 150.8} 150.8`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black" style={{ color: cfg.color }}>{cfg.score}</span>
            <span className="text-[8px] text-gray-400">/100</span>
          </div>
        </div>
      </div>

      {/* Label badge */}
      <div className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full mb-4 ${cfg.bg} ${cfg.border} border ${cfg.text}`}>
        <Activity className="h-3.5 w-3.5" />
        {cfg.label}
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        {dimScores.map(d => {
          const Icon = d.icon;
          return (
            <div key={d.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-gray-400" />
                  {d.label}
                </span>
                <span className="text-xs font-bold text-gray-700">{d.score}/100</span>
              </div>
              <ScoreBar score={d.score} color={cfg.bar} />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        {index === 'ALTA'
          ? 'Alta procura na região. Imóvel tende a locar rapidamente com mínima vacância.'
          : index === 'MEDIA'
          ? 'Demanda moderada. Pode exigir ajuste fino de preço para locação rápida.'
          : 'Mercado restrito. Avalie estratégias alternativas como aluguel por temporada.'}
      </p>
    </div>
  );
}
