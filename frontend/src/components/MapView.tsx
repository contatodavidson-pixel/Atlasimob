'use client';
import { useEffect, useState, Fragment } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { formatBRL, TAG_CONFIG } from '@/lib/utils';
import Link from 'next/link';

// ── Coordenadas das cidades brasileiras ──────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  'São Paulo': [-23.5505, -46.6333],
  'Rio de Janeiro': [-22.9068, -43.1729],
  'Curitiba': [-25.4290, -49.2671],
  'Florianópolis': [-27.5954, -48.5480],
  'Porto Alegre': [-30.0346, -51.2177],
  'Belo Horizonte': [-19.9167, -43.9345],
  'Goiânia': [-16.6864, -49.2643],
  'Campinas': [-22.9056, -47.0608],
  'Fortaleza': [-3.7172, -38.5433],
  'Brasília': [-15.7797, -47.9297],
  'Salvador': [-12.9714, -38.5014],
  'Recife': [-8.0522, -34.9286],
  'Manaus': [-3.1190, -60.0217],
  'Natal': [-5.7945, -35.2110],
  'Joinville': [-26.3045, -48.8487],
  'São José dos Campos': [-23.1791, -45.8872],
  'Ribeirão Preto': [-21.1775, -47.8103],
  'Santos': [-23.9618, -46.3322],
  'Maceió': [-9.6658, -35.7350],
  'Campo Grande': [-20.4697, -54.6201],
  'João Pessoa': [-7.1195, -34.8450],
  'Belém': [-1.4558, -48.5044],
  'São Luís': [-2.5387, -44.2825],
  'Vitória': [-20.3155, -40.3128],
  'Uberlândia': [-18.9186, -48.2772],
};

function getCityCoords(area: string): [number, number] {
  const exact = CITY_COORDS[area];
  if (exact) return exact;
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (area?.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(area?.toLowerCase() || ''))
      return coords;
  }
  return [-14.235, -51.9253]; // centro do Brasil
}

// Jitter determinístico para separar marcadores na mesma cidade
function jitter(coords: [number, number], idx: number): [number, number] {
  const r = 0.006;
  const angle = (idx * 137.5 * Math.PI) / 180; // golden angle
  const dist = r * Math.sqrt((idx % 20) / 20);
  return [coords[0] + dist * Math.cos(angle), coords[1] + dist * Math.sin(angle)];
}

const TAG_COLORS: Record<string, { fill: string; stroke: string; heat: string }> = {
  STRONG_DEAL: { fill: '#16a34a', stroke: '#15803d', heat: 'rgba(22,163,74,0.08)' },
  MARGINAL:    { fill: '#d97706', stroke: '#b45309', heat: 'rgba(217,119,6,0.06)' },
  AVOID:       { fill: '#dc2626', stroke: '#b91c1c', heat: 'rgba(220,38,38,0.05)' },
};

// Yield heatmap: cor por intensidade de yield (independente do tag)
function yieldHeatColor(y: number): { fill: string; stroke: string; heat: string } {
  if (y >= 10) return { fill: '#059669', stroke: '#047857', heat: 'rgba(5,150,105,0.12)' };  // verde esmeralda
  if (y >= 8)  return { fill: '#16a34a', stroke: '#15803d', heat: 'rgba(22,163,74,0.10)' };  // verde forte
  if (y >= 6)  return { fill: '#65a30d', stroke: '#4d7c0f', heat: 'rgba(101,163,13,0.08)' }; // verde-lima
  if (y >= 4)  return { fill: '#d97706', stroke: '#b45309', heat: 'rgba(217,119,6,0.07)' };  // âmbar
  if (y >= 2)  return { fill: '#ea580c', stroke: '#c2410c', heat: 'rgba(234,88,12,0.06)' };  // laranja
  return               { fill: '#dc2626', stroke: '#b91c1c', heat: 'rgba(220,38,38,0.05)' }; // vermelho
}

// Raio proporcional ao preço do imóvel
function yieldRadius(price: number): number {
  if (price >= 2000000) return 14;
  if (price >= 1000000) return 12;
  if (price >= 500000)  return 10;
  if (price >= 200000)  return 8;
  return 7;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

interface Property {
  id: string; address: string; area: string; price: number; bedrooms: number;
  propertyType: string; tag: string; score: number; grossYield: number;
  netYield: number; cashflow: number; estimatedRent: number;
  belowMarketPct: number; motivatedSeller: boolean; liquidityIndex: string;
  priceReduced: boolean; priceReducedBy: number; analysisStatus: string;
}

export default function MapView() {
  const [filter, setFilter] = useState<'ALL' | 'STRONG_DEAL' | 'MARGINAL' | 'AVOID'>('ALL');
  const [showHeat, setShowHeat] = useState(true);
  const [yieldMode, setYieldMode] = useState(false); // heatmap por yield
  const [minScore, setMinScore] = useState(0);
  const [center, setCenter] = useState<[number, number]>([-15.7797, -47.9297]);

  const { data, isLoading } = useQuery({
    queryKey: ['properties-map'],
    queryFn: () => propertiesApi.list({ limit: 200, page: 1 }).then(r => r.data),
  });

  const analyzed = (data?.data || []).filter((p: Property) =>
    p.analysisStatus === 'COMPLETED' &&
    (filter === 'ALL' || p.tag === filter) &&
    (p.score ?? 0) >= minScore
  );

  const counts = {
    STRONG_DEAL: (data?.data || []).filter((p: Property) => p.tag === 'STRONG_DEAL' && p.analysisStatus === 'COMPLETED').length,
    MARGINAL: (data?.data || []).filter((p: Property) => p.tag === 'MARGINAL' && p.analysisStatus === 'COMPLETED').length,
    AVOID: (data?.data || []).filter((p: Property) => p.tag === 'AVOID' && p.analysisStatus === 'COMPLETED').length,
  };

  // Centralize no grupo filtrado
  useEffect(() => {
    if (analyzed.length > 0) {
      const coords = analyzed.map((p: Property, i: number) => jitter(getCityCoords(p.area), i));
      const avgLat = coords.reduce((s: number, c: [number, number]) => s + c[0], 0) / coords.length;
      const avgLng = coords.reduce((s: number, c: [number, number]) => s + c[1], 0) / coords.length;
      setCenter([avgLat, avgLng]);
    }
  }, [filter]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
        {/* Filtros */}
        <div className="bg-white rounded-2xl border p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Filtros</h3>
          <div className="space-y-2">
            {([
              { key: 'ALL', label: 'Todos os imóveis', count: (data?.data || []).filter((p: Property) => p.analysisStatus === 'COMPLETED').length },
              { key: 'STRONG_DEAL', label: 'Excelente Oportunidade', count: counts.STRONG_DEAL },
              { key: 'MARGINAL', label: 'Oportunidade Moderada', count: counts.MARGINAL },
              { key: 'AVOID', label: 'Não Recomendado', count: counts.AVOID },
            ] as const).map(opt => (
              <button key={opt.key} onClick={() => setFilter(opt.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === opt.key
                    ? opt.key === 'STRONG_DEAL' ? 'bg-green-100 text-green-800 border border-green-200'
                    : opt.key === 'MARGINAL' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : opt.key === 'AVOID' ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}>
                <span>{opt.label}</span>
                <span className="text-xs font-bold bg-white/80 px-2 py-0.5 rounded-full">{opt.count}</span>
              </button>
            ))}
          </div>

          {/* Score mínimo */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Score mínimo</span>
              <span className="font-bold text-blue-600">{minScore.toFixed(0)}+</span>
            </div>
            <input type="range" min={0} max={9} step={1} value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-300 mt-0.5">
              <span>0</span><span>5</span><span>9</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="mt-4 pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Halo de calor</span>
              <button onClick={() => setShowHeat(h => !h)}
                className={`w-10 h-5 rounded-full transition-colors ${showHeat ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${showHeat ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cor por Yield</span>
              <button onClick={() => setYieldMode(y => !y)}
                className={`w-10 h-5 rounded-full transition-colors ${yieldMode ? 'bg-green-600' : 'bg-gray-300'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${yieldMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="bg-white rounded-2xl border p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">
            Legenda — {yieldMode ? 'Yield Heatmap' : 'Score IA'}
          </h3>
          {yieldMode ? (
            <div className="space-y-2">
              {[
                { color: 'bg-emerald-600', label: 'Yield ≥ 10% a.a.' },
                { color: 'bg-green-600', label: 'Yield 8–10% a.a.' },
                { color: 'bg-lime-600', label: 'Yield 6–8% a.a.' },
                { color: 'bg-yellow-500', label: 'Yield 4–6% a.a.' },
                { color: 'bg-orange-500', label: 'Yield 2–4% a.a.' },
                { color: 'bg-red-600', label: 'Yield &lt; 2% a.a.' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full ${item.color} flex-shrink-0`} />
                  <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: item.label }} />
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1 border-t mt-1">
                <div className="w-3.5 h-3.5 rounded-full bg-gray-200 flex-shrink-0" />
                <span>Tamanho = Preço do imóvel</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-green-800 flex-shrink-0" />
                <span className="text-gray-700">Excelente Oportunidade</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-yellow-700 flex-shrink-0" />
                <span className="text-gray-700">Oportunidade Moderada</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-red-800 flex-shrink-0" />
                <span className="text-gray-700">Não Recomendado</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 pt-1 border-t mt-2">
                <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0" />
                <span>Tamanho = Score IA (0–10)</span>
              </div>
            </div>
          )}
        </div>

        {/* Top deals no filtro */}
        <div className="bg-white rounded-2xl border p-4 flex-1">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">
            Top por Yield {filter !== 'ALL' ? `(${TAG_CONFIG[filter as keyof typeof TAG_CONFIG]?.shortLabel || filter})` : ''}
          </h3>
          {isLoading ? (
            <div className="text-xs text-gray-400 text-center py-4">Carregando...</div>
          ) : analyzed.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">Nenhum imóvel analisado ainda.<br />Clique em "Analisar Pendentes" no DealFlow.</div>
          ) : (
            <div className="space-y-2">
              {[...analyzed]
                .sort((a: Property, b: Property) => (b.grossYield ?? 0) - (a.grossYield ?? 0))
                .slice(0, 8)
                .map((p: Property) => {
                  const colors = TAG_COLORS[p.tag] || TAG_COLORS.AVOID;
                  return (
                    <Link key={p.id} href={`/dashboard/dealflow/${p.id}`}
                      className="block rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm p-2.5 transition-all">
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: colors.fill }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{p.address}</p>
                          <p className="text-xs text-gray-400">{p.area}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-black text-green-700">{p.grossYield?.toFixed(1)}%</div>
                          {p.score && <div className="text-xs text-gray-400">{p.score.toFixed(1)}/10</div>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 rounded-2xl overflow-hidden border shadow-sm relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
              <p className="text-sm text-gray-500">Carregando imóveis...</p>
            </div>
          </div>
        )}
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <RecenterMap center={center} />
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {analyzed.map((p: Property, i: number) => {
            const coords = jitter(getCityCoords(p.area), i);
            const colors = yieldMode ? yieldHeatColor(p.grossYield ?? 0) : (TAG_COLORS[p.tag] || TAG_COLORS.AVOID);
            const radius = yieldMode ? yieldRadius(p.price) : 8 + ((p.score ?? 5) / 10) * 6; // 8–14px

            return (
              <Fragment key={p.id}>
                {/* Halo heatmap */}
                {showHeat && (
                  <Circle
                    center={coords}
                    radius={800 + (p.grossYield ?? 5) * 50}
                    pathOptions={{ fillColor: colors.fill, fillOpacity: yieldMode ? 0.15 : 0.08, color: 'transparent', weight: 0 }}
                  />
                )}

                {/* Marcador */}
                <CircleMarker
                  center={coords}
                  radius={radius}
                  pathOptions={{
                    fillColor: colors.fill,
                    fillOpacity: 0.92,
                    color: colors.stroke,
                    weight: 2,
                  }}
                >
                  <Popup maxWidth={280} className="property-popup">
                    <div className="text-sm">
                      {/* Header */}
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-xs leading-tight mb-0.5">{p.address}</div>
                          <div className="text-xs text-gray-400">{p.area}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-black ${p.score >= 8 ? 'text-green-600' : p.score >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {p.score?.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">score</div>
                        </div>
                      </div>

                      {/* Tag badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.tag === 'STRONG_DEAL' ? 'bg-green-100 text-green-700'
                          : p.tag === 'MARGINAL' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {TAG_CONFIG[p.tag as keyof typeof TAG_CONFIG]?.shortLabel || p.tag}
                        </span>
                        {p.motivatedSeller && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-0.5">
                            🔥 Motivado
                          </span>
                        )}
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        {[
                          { label: 'Preço', value: formatBRL(p.price) },
                          { label: 'Aluguel est.', value: formatBRL(p.estimatedRent) + '/mês' },
                          { label: 'Yield bruto', value: `${p.grossYield?.toFixed(2)}% a.a.` },
                          { label: 'Cashflow', value: formatBRL(p.cashflow) + '/mês' },
                        ].map(m => (
                          <div key={m.label} className="bg-gray-50 rounded-lg p-1.5">
                            <div className="text-xs font-semibold text-gray-800">{m.value}</div>
                            <div className="text-xs text-gray-400">{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {p.belowMarketPct != null && (
                        <div className={`text-xs font-medium mb-2 ${p.belowMarketPct > 0 ? 'text-green-700' : 'text-orange-600'}`}>
                          {p.belowMarketPct > 0
                            ? `↓ ${p.belowMarketPct.toFixed(1)}% abaixo da média da região`
                            : `↑ ${Math.abs(p.belowMarketPct).toFixed(1)}% acima da média`}
                        </div>
                      )}

                      {p.liquidityIndex && (
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${
                          p.liquidityIndex === 'ALTA' ? 'bg-green-100 text-green-700'
                          : p.liquidityIndex === 'MEDIA' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {p.liquidityIndex === 'ALTA' ? '⚡ Alta Liquidez' : p.liquidityIndex === 'MEDIA' ? '〰 Liquidez Média' : '🐌 Baixa Liquidez'}
                        </div>
                      )}

                      <Link href={`/dashboard/dealflow/${p.id}`}
                        className="block w-full text-center text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 py-1.5 rounded-lg transition-colors">
                        Ver análise completa →
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              </Fragment>
            );
          })}
        </MapContainer>

        {/* Overlay contador */}
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow-lg border px-4 py-2.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-gray-900">{analyzed.length} imóveis</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1 text-green-700 font-semibold">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              {counts.STRONG_DEAL} excelentes
            </span>
            {filter !== 'ALL' && (
              <button onClick={() => setFilter('ALL')} className="text-xs text-gray-400 hover:text-blue-600 ml-1">
                Limpar filtro ×
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
