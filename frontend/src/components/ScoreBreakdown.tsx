'use client';

interface ScoreBreakdownProps {
  score: number;
  grossYield: number;
  liquidityIndex: string;
  belowMarketPct: number;
  motivatedSeller: boolean;
  cashflow: number;
  priceReduced: boolean;
  priceReducedBy: number;
}

interface Contribution {
  label: string;
  value: number;
  max: number;
  color: string;
  emoji: string;
  detail: string;
}

function computeBreakdown(props: ScoreBreakdownProps): Contribution[] {
  const { grossYield, liquidityIndex, belowMarketPct, motivatedSeller, cashflow, priceReduced, priceReducedBy } = props;

  // Yield contribution (max 3.5 pts)
  const yieldPts = Math.min(3.5, grossYield >= 10 ? 3.5 : grossYield >= 8 ? 3.0 : grossYield >= 6 ? 2.3 : grossYield >= 4 ? 1.5 : 0.8);

  // Liquidity contribution (max 2.0 pts)
  const liqPts = liquidityIndex === 'ALTA' ? 2.0 : liquidityIndex === 'MEDIA' ? 1.2 : 0.5;

  // Below market contribution (max 2.0 pts)
  const mktPts = belowMarketPct > 0
    ? Math.min(2.0, belowMarketPct / 5)
    : Math.max(-0.5, belowMarketPct / 10);

  // Motivated seller (binary, max 1.5 pts)
  const motivPts = motivatedSeller ? 1.5 : 0;

  // Cashflow positivity (max 1.0 pts)
  const cfPts = cashflow > 2000 ? 1.0 : cashflow > 0 ? 0.7 : cashflow > -500 ? 0.3 : 0;

  return [
    {
      label: 'Yield bruto',
      value: yieldPts,
      max: 3.5,
      color: yieldPts >= 3 ? '#16a34a' : yieldPts >= 2 ? '#65a30d' : '#d97706',
      emoji: '📈',
      detail: `${grossYield?.toFixed(2)}% a.a.`,
    },
    {
      label: 'Liquidez do imóvel',
      value: liqPts,
      max: 2.0,
      color: liqPts >= 1.8 ? '#16a34a' : liqPts >= 1.1 ? '#d97706' : '#dc2626',
      emoji: '💧',
      detail: liquidityIndex === 'ALTA' ? 'Alta' : liquidityIndex === 'MEDIA' ? 'Média' : 'Baixa',
    },
    {
      label: 'Desconto regional',
      value: Math.max(0, mktPts),
      max: 2.0,
      color: mktPts >= 1.5 ? '#16a34a' : mktPts >= 0.8 ? '#65a30d' : '#d97706',
      emoji: '🎯',
      detail: belowMarketPct > 0 ? `${belowMarketPct?.toFixed(1)}% abaixo da média` : `${Math.abs(belowMarketPct)?.toFixed(1)}% acima da média`,
    },
    {
      label: 'Vendedor motivado',
      value: motivPts,
      max: 1.5,
      color: '#f97316',
      emoji: '🔥',
      detail: motivatedSeller ? 'Detectado' : 'Não detectado',
    },
    {
      label: 'Cashflow mensal',
      value: cfPts,
      max: 1.0,
      color: cashflow > 0 ? '#16a34a' : '#dc2626',
      emoji: '💵',
      detail: priceReduced && priceReducedBy > 0 ? `Queda de R$${priceReducedBy.toLocaleString('pt-BR')}` : cashflow > 0 ? 'Positivo' : 'Negativo',
    },
  ];
}

export default function ScoreBreakdown(props: ScoreBreakdownProps) {
  const { score } = props;
  const contributions = computeBreakdown(props);
  const scoreColor = score >= 8.5 ? '#16a34a' : score >= 7 ? '#d97706' : '#dc2626';

  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Composição do Score</h3>
          <p className="text-xs text-gray-400 mt-0.5">Como o motor de IA chegou a este resultado</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black" style={{ color: scoreColor }}>{score?.toFixed(1)}</span>
          <span className="text-gray-400 text-sm"> / 10</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {contributions.map(c => (
          <div key={c.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <span>{c.emoji}</span>
                {c.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{c.detail}</span>
                <span className="text-sm font-black tabular-nums" style={{ color: c.color, minWidth: 32, textAlign: 'right' }}>
                  +{c.value.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(c.value / c.max) * 100}%`, backgroundColor: c.color }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-gray-300 mt-0.5">
              <span>0</span>
              <span>max {c.max}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total bar */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-700">Score total</span>
          <span className="text-sm font-black" style={{ color: scoreColor }}>{score?.toFixed(1)} / 10</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${(score / 10) * 100}%`, background: `linear-gradient(90deg, ${scoreColor}cc, ${scoreColor})` }}
          />
        </div>
      </div>
    </div>
  );
}
