/**
 * Mercado Livre Brasil — Real Estate Scraper
 * API oficial gratuita, sem necessidade de chave para dados públicos.
 * Documentação: https://developers.mercadolibre.com.br/pt_br/itens-e-buscas
 */
import axios from 'axios';
import { logger } from '../lib/logger';
import type { ScrapedProperty } from './apify';

const BASE_URL = 'https://api.mercadolibre.com';

// Categorias de imóveis no MLB Brasil
const CAT = {
  ALL_SALE:      'MLB1459', // Imóveis — Venda (raiz)
  APARTMENT:     'MLB1467', // Apartamentos
  HOUSE:         'MLB1468', // Casas e sobrados
  PENTHOUSE:     'MLB83536',// Coberturas
  COMMERCIAL:    'MLB261773',// Comercial/Salas
  LAND:          'MLB1585', // Terrenos
};

// Mapeamento cidade/estado → state_id MLB
const STATE_MAP: Record<string, string> = {
  'SP': 'BR-SP', 'São Paulo':        'BR-SP',
  'RJ': 'BR-RJ', 'Rio de Janeiro':   'BR-RJ',
  'MG': 'BR-MG', 'Belo Horizonte':   'BR-MG', 'Minas Gerais':    'BR-MG',
  'PR': 'BR-PR', 'Curitiba':         'BR-PR', 'Paraná':          'BR-PR',
  'RS': 'BR-RS', 'Porto Alegre':     'BR-RS', 'Rio Grande do Sul':'BR-RS',
  'SC': 'BR-SC', 'Florianópolis':    'BR-SC', 'Santa Catarina':  'BR-SC',
  'GO': 'BR-GO', 'Goiânia':          'BR-GO', 'Goiás':           'BR-GO',
  'CE': 'BR-CE', 'Fortaleza':        'BR-CE', 'Ceará':           'BR-CE',
  'PE': 'BR-PE', 'Recife':           'BR-PE', 'Pernambuco':      'BR-PE',
  'BA': 'BR-BA', 'Salvador':         'BR-BA', 'Bahia':           'BR-BA',
  'DF': 'BR-DF', 'Brasília':         'BR-DF', 'Distrito Federal':'BR-DF',
  'AM': 'BR-AM', 'Manaus':           'BR-AM', 'Amazonas':        'BR-AM',
  'PA': 'BR-PA', 'Belém':            'BR-PA', 'Pará':            'BR-PA',
  'MA': 'BR-MA', 'São Luís':         'BR-MA', 'Maranhão':        'BR-MA',
  'ES': 'BR-ES', 'Vitória':          'BR-ES', 'Espírito Santo':  'BR-ES',
  'MT': 'BR-MT', 'Cuiabá':           'BR-MT', 'Mato Grosso':     'BR-MT',
  'MS': 'BR-MS', 'Campo Grande':     'BR-MS', 'Mato Grosso do Sul':'BR-MS',
};

// Mapeamento de tipo MLB → tipo interno
function mapPropertyType(attrValue: string | null): string {
  if (!attrValue) return 'APARTMENT';
  const v = attrValue.toLowerCase();
  if (v.includes('apartamento') || v.includes('studio') || v.includes('loft')) return 'APARTMENT';
  if (v.includes('casa') || v.includes('sobrado') || v.includes('village')) return 'HOUSE';
  if (v.includes('cobertura') || v.includes('penthouse')) return 'PENTHOUSE';
  if (v.includes('terreno') || v.includes('lote')) return 'LAND';
  if (v.includes('comercial') || v.includes('sala') || v.includes('loja')) return 'COMMERCIAL';
  if (v.includes('galpão') || v.includes('armazém')) return 'WAREHOUSE';
  return 'APARTMENT';
}

function getAttr(attributes: Record<string, string>[], id: string): string | null {
  return attributes.find(a => a.id === id)?.value_name ?? null;
}

function mapItem(
  item: Record<string, unknown>,
  city: string,
  state: string,
): ScrapedProperty | null {
  try {
    const price = Number(item.price ?? 0);
    if (!price || price < 50000) return null; // Filtra anúncios sem preço ou muito baratos

    const attrs = (item.attributes as Record<string, string>[]) ?? [];
    const sellerAddr = (item.seller_address ?? {}) as Record<string, Record<string, string>>;
    const pictures = (item.pictures ?? item.thumbnail
      ? [{ url: item.thumbnail }]
      : []) as Record<string, string>[];

    const neighborhood = sellerAddr.neighborhood?.name ?? '';
    const cityName = sellerAddr.city?.name ?? city;
    const stateName = sellerAddr.state?.name ?? state;
    const addressLine = (sellerAddr as unknown as Record<string, string>).address_line ?? '';

    const fullAddress = [addressLine, neighborhood, cityName, stateName]
      .filter(Boolean)
      .join(', ');

    const bedrooms = Number(getAttr(attrs, 'BEDROOMS') ?? getAttr(attrs, 'FULL_BEDROOMS') ?? 0);
    const bathrooms = Number(getAttr(attrs, 'BATHROOMS') ?? getAttr(attrs, 'FULL_BATHROOMS') ?? 0) || undefined;
    const parkingSpots = Number(getAttr(attrs, 'PARKING_LOTS') ?? 0) || undefined;
    const areaM2 = Number(getAttr(attrs, 'TOTAL_AREA') ?? getAttr(attrs, 'COVERED_AREA') ?? 0) || undefined;
    const propertyTypeRaw = getAttr(attrs, 'PROPERTY_TYPE');
    const propertyType = mapPropertyType(propertyTypeRaw);

    // Detecta preço reduzido via campo original_price
    const originalPrice = item.original_price ? Number(item.original_price) : undefined;
    const priceReduced = !!(originalPrice && originalPrice > price);

    const title = String(item.title ?? `Imóvel em ${neighborhood || cityName}`);
    const description = `${title}. ${
      areaM2 ? `Área: ${areaM2}m². ` : ''
    }${bedrooms ? `${bedrooms} quarto(s). ` : ''}${
      bathrooms ? `${bathrooms} banheiro(s). ` : ''
    }${parkingSpots ? `${parkingSpots} vaga(s). ` : ''}`.trim();

    return {
      externalId: `mlb_${item.id}`,
      source: 'ZAPIMOVEIS' as const, // Reutiliza o tipo disponível; será identificado pelo externalId
      title,
      address: fullAddress || `${neighborhood || cityName}, ${stateName}`,
      area: neighborhood || cityName,
      city: cityName,
      state: stateName,
      price,
      originalPrice,
      bedrooms,
      bathrooms,
      parkingSpots,
      areaM2,
      propertyType,
      description,
      imageUrls: pictures.slice(0, 6).map(p => String(p.url ?? p.secure_url ?? '')).filter(Boolean),
      listingUrl: String(item.permalink ?? `https://www.mercadolivre.com.br/i/${item.id}`),
      priceReduced,
      priceReducedBy: priceReduced && originalPrice ? originalPrice - price : undefined,
      condoFee: undefined,
      iptu: undefined,
    };
  } catch (err) {
    logger.warn(`MLB: erro ao mapear item ${item.id}`, err);
    return null;
  }
}

export interface MLBFilters {
  /** Nome da cidade (ex: "São Paulo") ou sigla do estado (ex: "SP") */
  city: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  propertyType?: 'APARTMENT' | 'HOUSE' | 'ALL';
  /** Número de resultados (máx 200 por chamada, MLB limita 50/página) */
  limit?: number;
}

async function searchMLB(params: Record<string, string | number>): Promise<Record<string, unknown>[]> {
  const { data } = await axios.get(`${BASE_URL}/sites/MLB/search`, {
    params: { limit: 50, sort: 'date_desc', ...params },
    timeout: 20000,
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'pt-BR',
      'User-Agent': 'AtlasImob/1.0 (+https://atlasimob.app.br)',
    },
  });
  return (data?.results ?? []) as Record<string, unknown>[];
}

export async function scrapeMLBProperties(filters: MLBFilters): Promise<ScrapedProperty[]> {
  const { city, state, minPrice, maxPrice, minBedrooms, propertyType = 'ALL', limit = 100 } = filters;

  // Resolve state_id: tenta pelo estado, depois pela cidade
  const stateKey = state ?? city;
  const stateId = STATE_MAP[stateKey] ?? STATE_MAP[city] ?? 'BR-SP';
  const cityName = city;
  const stateName = state ?? city;

  logger.info(`MLB: buscando imóveis em ${city} (${stateId})`);

  try {
    const results: ScrapedProperty[] = [];
    const categories = propertyType === 'APARTMENT'
      ? [CAT.APARTMENT]
      : propertyType === 'HOUSE'
        ? [CAT.HOUSE]
        : [CAT.APARTMENT, CAT.HOUSE]; // ALL = busca ambos

    for (const category of categories) {
      let offset = 0;
      const pageLimit = 50;
      const maxPages = Math.ceil(Math.min(limit, 200) / pageLimit);

      for (let page = 0; page < maxPages; page++) {
        const params: Record<string, string | number> = {
          category,
          state_id: stateId,
          offset,
          limit: pageLimit,
        };

        if (minPrice) params.price_min = minPrice;
        if (maxPrice) params.price_max = maxPrice;
        if (minBedrooms) params['BEDROOMS-FROM'] = minBedrooms;

        const items = await searchMLB(params);
        if (!items.length) break;

        for (const item of items) {
          const mapped = mapItem(item, cityName, stateName);
          if (mapped) {
            // Filtra pela cidade se informada (MLB retorna toda a cidade/estado)
            const itemCity = (mapped.city ?? '').toLowerCase();
            const filterCity = cityName.toLowerCase();
            // Aceita se cidade bate ou se buscou por estado genérico
            if (!filterCity || itemCity.includes(filterCity) || filterCity.includes(itemCity) || stateKey === state) {
              results.push(mapped);
            }
          }
        }

        offset += pageLimit;
        if (items.length < pageLimit) break; // Última página

        // Rate limiting: aguarda 300ms entre páginas
        await new Promise(r => setTimeout(r, 300));
      }
    }

    logger.info(`MLB: ${results.length} imóveis encontrados em ${city}`);
    return results.slice(0, limit);
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } };
    logger.error(`MLB: erro ao buscar em ${city}`, { message: err?.message, status: err?.response?.status });
    return [];
  }
}

/**
 * Busca detalhes completos de um imóvel pelo ID do Mercado Livre.
 * Retorna descrição completa, fotos adicionais e atributos extras.
 */
export async function fetchMLBDetails(mlbId: string): Promise<{
  description: string;
  pictures: string[];
  condoFee?: number;
  iptu?: number;
} | null> {
  try {
    const [itemResp, descResp] = await Promise.allSettled([
      axios.get(`${BASE_URL}/items/${mlbId}`, { timeout: 10000 }),
      axios.get(`${BASE_URL}/items/${mlbId}/description`, { timeout: 10000 }),
    ]);

    const item = itemResp.status === 'fulfilled' ? itemResp.value.data : null;
    const desc = descResp.status === 'fulfilled' ? descResp.value.data : null;

    const pictures: string[] = (item?.pictures ?? [])
      .map((p: Record<string, string>) => p.secure_url ?? p.url ?? '')
      .filter(Boolean);

    const description = String(desc?.plain_text ?? desc?.text ?? item?.title ?? '');

    // Tenta extrair condomínio e IPTU da descrição com regex
    const condoMatch = description.match(/condom[íi]nio[:\s]+R?\$?\s*([\d.,]+)/i);
    const iptuMatch = description.match(/iptu[:\s]+R?\$?\s*([\d.,]+)/i);

    const condoFee = condoMatch
      ? Number(condoMatch[1].replace(/\./g, '').replace(',', '.'))
      : undefined;
    const iptu = iptuMatch
      ? Number(iptuMatch[1].replace(/\./g, '').replace(',', '.'))
      : undefined;

    return { description, pictures, condoFee, iptu };
  } catch {
    return null;
  }
}

/** Converte externalId "mlb_MLB1234567" → "MLB1234567" */
export function extractMLBId(externalId: string): string | null {
  const match = externalId.match(/mlb_(MLB\d+)/i);
  return match?.[1] ?? null;
}

// Cidades padrão para o scraping diário
export const DEFAULT_MLB_CITIES: MLBFilters[] = [
  { city: 'São Paulo',      state: 'SP', minPrice: 150000, maxPrice: 1500000, limit: 100 },
  { city: 'Rio de Janeiro', state: 'RJ', minPrice: 150000, maxPrice: 1200000, limit: 80 },
  { city: 'Curitiba',       state: 'PR', minPrice: 120000, maxPrice: 800000,  limit: 80 },
  { city: 'Belo Horizonte', state: 'MG', minPrice: 120000, maxPrice: 900000,  limit: 80 },
  { city: 'Goiânia',        state: 'GO', minPrice: 100000, maxPrice: 700000,  limit: 60 },
  { city: 'Porto Alegre',   state: 'RS', minPrice: 100000, maxPrice: 700000,  limit: 60 },
  { city: 'Florianópolis',  state: 'SC', minPrice: 150000, maxPrice: 900000,  limit: 60 },
  { city: 'Fortaleza',      state: 'CE', minPrice: 100000, maxPrice: 600000,  limit: 60 },
  { city: 'Recife',         state: 'PE', minPrice: 100000, maxPrice: 600000,  limit: 60 },
  { city: 'Campinas',       state: 'SP', minPrice: 120000, maxPrice: 800000,  limit: 60 },
];
