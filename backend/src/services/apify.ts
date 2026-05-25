import axios from 'axios';
import { logger } from '../lib/logger';

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

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

const INCLUDE_FIELDS = 'search(result(listings(listing(description,title,id,businessType,address,usableAreas,parkingSpaces,bathrooms,bedrooms,pricingInfos,propertyType,externalId),medias,link)))';

function mapListing(
  item: Record<string, unknown>,
  source: 'ZAPIMOVEIS' | 'VIVAREAL',
  baseUrl: string,
  prefix: string,
  defaultCity: string,
  defaultState: string,
): ScrapedProperty {
  const listing = (item.listing ?? {}) as Record<string, unknown>;
  const address = (listing.address ?? {}) as Record<string, unknown>;
  const pricingList = (listing.pricingInfos ?? []) as Record<string, unknown>[];
  const pricing = pricingList[0] ?? {};
  const medias = (item.medias ?? []) as Record<string, unknown>[];
  const link = (item.link ?? {}) as Record<string, unknown>;

  const bedroomsArr = listing.bedrooms as number[] | undefined;
  const bathroomsArr = listing.bathrooms as number[] | undefined;
  const parkingArr = listing.parkingSpaces as number[] | undefined;
  const areasArr = listing.usableAreas as number[] | undefined;
  const propertyTypeArr = listing.propertyType as string[] | undefined;

  const price = Number(pricing.price ?? 0);
  const originalPrice = pricing.originalPrice ? Number(pricing.originalPrice) : undefined;
  const neighborhood = String(address.neighborhood ?? '');
  const street = String(address.street ?? '');
  const city = String(address.city ?? defaultCity);
  const state = String(address.state ?? defaultState);

  const fullAddress = [street, neighborhood, city].filter(Boolean).join(', ');

  return {
    externalId: `${prefix}_${listing.id ?? listing.externalId ?? Math.random()}`,
    source,
    title: String(listing.title ?? `${propertyTypeArr?.[0] ?? 'Imóvel'} em ${neighborhood || city}`),
    address: fullAddress || city,
    area: neighborhood || city,
    city,
    state,
    price,
    originalPrice,
    bedrooms: Number(bedroomsArr?.[0] ?? 0),
    bathrooms: bathroomsArr?.[0] != null ? Number(bathroomsArr[0]) : undefined,
    parkingSpots: parkingArr?.[0] != null ? Number(parkingArr[0]) : undefined,
    areaM2: areasArr?.[0] != null ? Number(areasArr[0]) : undefined,
    propertyType: propertyTypeArr?.[0] ?? 'APARTMENT',
    description: String(listing.description ?? ''),
    imageUrls: medias
      .slice(0, 6)
      .map((m) => String((m as Record<string, unknown>).url ?? (m as Record<string, unknown>).urlMedium ?? ''))
      .filter(Boolean),
    listingUrl: `${baseUrl}${String(link.href ?? '')}`,
    priceReduced: originalPrice != null && originalPrice > price,
    priceReducedBy: originalPrice != null && originalPrice > price ? originalPrice - price : undefined,
    condoFee: pricing.monthlyCondoFee ? Number(pricing.monthlyCondoFee) : undefined,
    iptu: pricing.yearlyIptu ? Number(pricing.yearlyIptu) : undefined,
  };
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
    const params: Record<string, string | number> = {
      portal: 'ZAP',
      businessType: filters.businessType ?? 'SALE',
      listingType: 'USED',
      addressCity: filters.city,
      size: 24,
      from: 0,
      includeFields: INCLUDE_FIELDS,
    };
    if (filters.state) params.addressState = filters.state;
    if (filters.minBedrooms) params['bedrooms[]'] = filters.minBedrooms;
    if (filters.minPrice) params.priceMin = filters.minPrice;
    if (filters.maxPrice) params.priceMax = filters.maxPrice;

    const res = await axios.get('https://glue-api.zapimoveis.com.br/v2/listings', {
      params,
      headers: { ...BROWSER_HEADERS, 'X-Domain': 'www.zapimoveis.com.br', 'Referer': 'https://www.zapimoveis.com.br/' },
      timeout: 30000,
    });

    const listings = (res.data?.search?.result?.listings ?? []) as Record<string, unknown>[];
    const results = listings.map((item) =>
      mapListing(item, 'ZAPIMOVEIS', 'https://www.zapimoveis.com.br', 'zap', filters.city, filters.state ?? '')
    );
    logger.info(`ZAP Imóveis: ${results.length} imóveis encontrados em ${filters.city}`);
    return results;
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } };
    logger.error('Erro no scraping ZAP Imóveis', { message: err?.message, status: err?.response?.status });
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
    const params: Record<string, string | number> = {
      portal: 'VIVAREAL',
      businessType: filters.businessType ?? 'SALE',
      listingType: 'USED',
      addressCity: filters.city,
      size: 24,
      from: 0,
      includeFields: INCLUDE_FIELDS,
    };
    if (filters.state) params.addressState = filters.state;
    if (filters.minBedrooms) params['bedrooms[]'] = filters.minBedrooms;
    if (filters.minPrice) params.priceMin = filters.minPrice;
    if (filters.maxPrice) params.priceMax = filters.maxPrice;

    const res = await axios.get('https://glue-api.vivareal.com.br/v2/listings', {
      params,
      headers: { ...BROWSER_HEADERS, 'X-Domain': 'www.vivareal.com.br', 'Referer': 'https://www.vivareal.com.br/' },
      timeout: 30000,
    });

    const listings = (res.data?.search?.result?.listings ?? []) as Record<string, unknown>[];
    const results = listings.map((item) =>
      mapListing(item, 'VIVAREAL', 'https://www.vivareal.com.br', 'vr', filters.city, filters.state ?? '')
    );
    logger.info(`VivaReal: ${results.length} imóveis encontrados em ${filters.city}`);
    return results;
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } };
    logger.error('Erro no scraping VivaReal', { message: err?.message, status: err?.response?.status });
    return [];
  }
}

export async function scrapeOLX(filters: {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<ScrapedProperty[]> {
  logger.info('Iniciando scraping OLX Imóveis', filters);
  try {
    const citySlug = filters.city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-');

    const params: Record<string, string | number> = {
      category: '1020',
      sf: '1',
      utype: 'u',
    };
    if (filters.minPrice) params.pe = filters.minPrice;
    if (filters.maxPrice) params.ps = filters.maxPrice;

    const res = await axios.get(
      `https://www.olx.com.br/imoveis/venda/estado-sp/${citySlug}`,
      {
        params,
        headers: {
          ...BROWSER_HEADERS,
          'Referer': 'https://www.olx.com.br/',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 30000,
      }
    );

    const ads = (res.data?.data?.ads ?? []) as Record<string, unknown>[];
    const results: ScrapedProperty[] = ads.map((item) => {
      const location = (item.location ?? {}) as Record<string, unknown>;
      const priceObj = (item.price ?? {}) as Record<string, unknown>;
      const images = (item.images ?? []) as Record<string, unknown>[];
      const props = (item.properties ?? []) as Record<string, unknown>[];

      return {
        externalId: `olx_${item.listId ?? item.pk ?? Math.random()}`,
        source: 'OLX' as const,
        title: String(item.subject ?? ''),
        address: String(location.address ?? filters.city),
        area: String(location.neighbourhood ?? filters.city),
        city: filters.city,
        state: String(location.uf ?? ''),
        price: Number(String(priceObj.value ?? '0').replace(/\D/g, '')),
        bedrooms: Number(props.find((p) => p.name === 'rooms')?.value ?? 0),
        propertyType: String((item.category as Record<string, unknown>)?.name ?? 'imóvel'),
        description: String(item.body ?? ''),
        imageUrls: images
          .slice(0, 5)
          .map((img) => String(img.original ?? img.medium ?? ''))
          .filter(Boolean),
        listingUrl: String(item.url ?? ''),
        priceReduced: false,
      };
    });
    logger.info(`OLX: ${results.length} imóveis encontrados em ${filters.city}`);
    return results;
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } };
    logger.error('Erro no scraping OLX', { message: err?.message, status: err?.response?.status });
    return [];
  }
}
