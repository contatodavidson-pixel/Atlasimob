import axios from 'axios';
import { logger } from '../lib/logger';

const APIFY_BASE = 'https://api.apify.com/v2';
const API_KEY = process.env.APIFY_API_KEY!;

export interface ScrapedProperty {
  externalId: string;
  source: 'ZAPIMOVEIS' | 'VIVAREAL' | 'OLX' | 'IMOVELWEB';
  title: string;
  address: string;
  area: string;
  city: string;
  state: string;
  price: number;
  originalPrice?: number;
  bedrooms: number;
  bathrooms?: number;
  parkingSpots?: number;
  areaM2?: number;
  propertyType: string;
  description?: string;
  imageUrls: string[];
  listingUrl: string;
  priceReduced: boolean;
  priceReducedBy?: number;
  condoFee?: number;
  iptu?: number;
}

async function runActor(actorId: string, input: object): Promise<unknown[]> {
  const runRes = await axios.post(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${API_KEY}`,
    input,
    { headers: { 'Content-Type': 'application/json' } }
  );
  const runId = runRes.data.data.id;

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const statusRes = await axios.get(`${APIFY_BASE}/actor-runs/${runId}?token=${API_KEY}`);
    const status = statusRes.data.data.status;
    if (status === 'SUCCEEDED') break;
    if (status === 'FAILED' || status === 'ABORTED') {
      throw new Error(`Actor ${actorId} falhou com status: ${status}`);
    }
  }

  const itemsRes = await axios.get(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${API_KEY}&format=json`
  );
  return itemsRes.data;
}

export async function scrapeZapImoveis(filters: {
  city: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  propertyType?: string;
  businessType?: 'SALE' | 'RENTAL';
}): Promise<ScrapedProperty[]> {
  logger.info('Iniciando scraping ZAP Imóveis', filters);
  try {
    const items = await runActor('compass/zap-imoveis-scraper', {
      city: filters.city,
      state: filters.state,
      maxPrice: filters.maxPrice,
      minPrice: filters.minPrice,
      minBedrooms: filters.minBedrooms,
      propertyType: filters.propertyType || 'apartamento',
      businessType: filters.businessType || 'SALE',
      maxResults: 50,
    }) as Record<string, unknown>[];

    return items.map(item => ({
      externalId: `zap_${item.id}`,
      source: 'ZAPIMOVEIS' as const,
      title: String(item.title || item.address || ''),
      address: String(item.address || ''),
      area: filters.city,
      city: String(item.city || filters.city),
      state: String(item.state || filters.state || ''),
      price: Number(item.price || 0),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
      bedrooms: Number(item.bedrooms || 0),
      bathrooms: item.bathrooms ? Number(item.bathrooms) : undefined,
      parkingSpots: item.parkingSpots ? Number(item.parkingSpots) : undefined,
      areaM2: item.totalArea ? Number(item.totalArea) : undefined,
      propertyType: String(item.propertyType || 'apartamento'),
      description: String(item.description || ''),
      imageUrls: Array.isArray(item.images) ? (item.images as string[]) : [],
      listingUrl: String(item.url || ''),
      priceReduced: Boolean(item.isPriceReduced),
      priceReducedBy: item.originalPrice && item.price
        ? Number(item.originalPrice) - Number(item.price) : undefined,
      condoFee: item.condoFee ? Number(item.condoFee) : undefined,
      iptu: item.iptu ? Number(item.iptu) : undefined,
    }));
  } catch (error) {
    logger.error('Erro no scraping ZAP Imóveis', error);
    return [];
  }
}

export async function scrapeVivaReal(filters: {
  city: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  businessType?: 'SALE' | 'RENTAL';
}): Promise<ScrapedProperty[]> {
  logger.info('Iniciando scraping VivaReal', filters);
  try {
    const items = await runActor('compass/vivareal-scraper', {
      city: filters.city,
      maxPrice: filters.maxPrice,
      minPrice: filters.minPrice,
      minBedrooms: filters.minBedrooms,
      businessType: filters.businessType || 'SALE',
      maxResults: 50,
    }) as Record<string, unknown>[];

    return items.map(item => ({
      externalId: `vr_${item.id}`,
      source: 'VIVAREAL' as const,
      title: String(item.title || ''),
      address: String(item.address || ''),
      area: filters.city,
      city: String(item.city || filters.city),
      state: String(item.state || filters.state || ''),
      price: Number(item.price || 0),
      bedrooms: Number(item.bedrooms || 0),
      bathrooms: item.bathrooms ? Number(item.bathrooms) : undefined,
      parkingSpots: item.parkingSpots ? Number(item.parkingSpots) : undefined,
      areaM2: item.usableArea || item.totalArea ? Number(item.usableArea || item.totalArea) : undefined,
      propertyType: String(item.propertyType || 'apartamento'),
      description: String(item.description || ''),
      imageUrls: Array.isArray(item.images) ? (item.images as string[]) : [],
      listingUrl: String(item.url || ''),
      priceReduced: Boolean(item.isReduced),
      priceReducedBy: item.reducedBy ? Number(item.reducedBy) : undefined,
      condoFee: item.condoFee ? Number(item.condoFee) : undefined,
      iptu: item.iptu ? Number(item.iptu) : undefined,
    }));
  } catch (error) {
    logger.error('Erro no scraping VivaReal', error);
    return [];
  }
}

export async function scrapeOLX(filters: {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<ScrapedProperty[]> {
  logger.info('Iniciando scraping OLX', filters);
  try {
    const items = await runActor('compass/olx-imoveis-scraper', {
      location: filters.city,
      maxPrice: filters.maxPrice,
      minPrice: filters.minPrice,
      maxResults: 30,
    }) as Record<string, unknown>[];

    return items.map(item => ({
      externalId: `olx_${item.id}`,
      source: 'OLX' as const,
      title: String(item.title || ''),
      address: String(item.location || filters.city),
      area: filters.city,
      city: filters.city,
      state: '',
      price: Number(item.price || 0),
      bedrooms: Number(item.rooms || 0),
      propertyType: String(item.type || 'imóvel'),
      description: String(item.description || ''),
      imageUrls: Array.isArray(item.images) ? (item.images as string[]) : [],
      listingUrl: String(item.url || ''),
      priceReduced: false,
    }));
  } catch (error) {
    logger.error('Erro no scraping OLX', error);
    return [];
  }
}
