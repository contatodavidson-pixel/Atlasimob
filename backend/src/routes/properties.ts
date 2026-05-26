import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { scrapeMLBProperties } from '../services/mlb';
import { analyzeProperty } from '../services/claude';
import { logger } from '../lib/logger';
import { notifier } from '../services/notifier';

export const propertiesRouter = Router();

// ── Rotas públicas (sem autenticação) ──────────────────────────────────────

// Deal do Dia — melhor STRONG_DEAL das últimas 48h (público)
propertiesRouter.get('/deal-of-day', async (_req, res) => {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const deal = await prisma.property.findFirst({
    where: { tag: 'STRONG_DEAL', analysisStatus: 'COMPLETED', createdAt: { gte: since } },
    orderBy: [{ score: 'desc' }, { grossYield: 'desc' }],
    select: {
      id: true, address: true, area: true, price: true, bedrooms: true,
      propertyType: true, grossYield: true, netYield: true, cashflow: true,
      roi: true, aiSummary: true, listingUrl: true, source: true,
      motivatedSeller: true, priceReduced: true, priceReducedBy: true,
      score: true, belowMarketPct: true, liquidityIndex: true,
      estimatedRent: true, originalPrice: true,
    },
  });
  if (!deal) return res.status(404).json({ error: 'Nenhum deal disponível hoje' });
  res.json(deal);
});

// ── Rotas protegidas ───────────────────────────────────────────────────────
propertiesRouter.use(authenticate);

// Listar propriedades com filtros
propertiesRouter.get('/', async (req: AuthRequest, res) => {
  const {
    page = '1', limit = '20', area, minPrice, maxPrice,
    minBedrooms, propertyType, tag, source, priceReduced, motivatedSeller,
    sortBy = 'createdAt', sortOrder = 'desc',
  } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (area) where.area = { contains: area };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Record<string, number>).gte = Number(minPrice);
    if (maxPrice) (where.price as Record<string, number>).lte = Number(maxPrice);
  }
  if (minBedrooms) where.bedrooms = { gte: Number(minBedrooms) };
  if (propertyType) where.propertyType = { contains: propertyType };
  if (tag) where.tag = tag;
  if (source) where.source = source;
  if (priceReduced === 'true') where.priceReduced = true;
  if (motivatedSeller === 'true') where.motivatedSeller = true;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { [sortBy]: sortOrder },
    }),
  ]);

  res.json({
    data: properties,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// Detalhes de uma propriedade
propertiesRouter.get('/:id', async (req, res) => {
  const property = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!property) return res.status(404).json({ error: 'Imóvel não encontrado' });
  res.json(property);
});

// Histórico de preços
propertiesRouter.get('/:id/price-history', async (req, res) => {
  const history = await prisma.priceHistory.findMany({
    where: { propertyId: req.params.id },
    orderBy: { createdAt: 'asc' },
    select: { price: true, createdAt: true, source: true },
  });
  res.json(history);
});

// Disparar scraping manual via Mercado Livre
propertiesRouter.post('/scrape', async (req: AuthRequest, res) => {
  const {
    city = 'São Paulo',
    state = 'SP',
    minPrice,
    maxPrice,
    minBedrooms,
    propertyType = 'ALL',
    limit = 100,
  } = req.body;

  res.json({ message: `Scraping MLB iniciado para ${city}`, city, source: 'MERCADOLIVRE' });

  (async () => {
    try {
      const scraped = await scrapeMLBProperties({
        city,
        state,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
        propertyType: propertyType as 'APARTMENT' | 'HOUSE' | 'ALL',
        limit: Number(limit),
      });

      let newCount = 0;
      let updatedCount = 0;

      for (const prop of scraped) {
        const existing = await prisma.property.findUnique({
          where: { externalId: prop.externalId },
          select: { id: true, price: true },
        });

        const upserted = await prisma.property.upsert({
          where: { externalId: prop.externalId },
          update: {
            price: prop.price,
            priceReduced: prop.priceReduced,
            priceReducedBy: prop.priceReducedBy ?? null,
            originalPrice: prop.originalPrice ?? null,
            title: prop.title,
            description: prop.description ?? null,
            imageUrls: JSON.stringify(prop.imageUrls),
          },
          create: {
            externalId: prop.externalId,
            source: 'ZAPIMOVEIS', // Campo source reutilizado — identificado pelo externalId "mlb_"
            title: prop.title,
            address: prop.address,
            area: prop.area,
            price: prop.price,
            originalPrice: prop.originalPrice ?? null,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms ?? null,
            propertyType: prop.propertyType,
            description: prop.description ?? null,
            imageUrls: JSON.stringify(prop.imageUrls),
            listingUrl: prop.listingUrl,
            priceReduced: prop.priceReduced,
            priceReducedBy: prop.priceReducedBy ?? null,
            analysisStatus: 'PENDING',
          },
        });

        const isNew = !existing;
        const priceChanged = existing && existing.price !== prop.price;
        if (isNew || priceChanged) {
          await prisma.priceHistory.create({
            data: { propertyId: upserted.id, price: prop.price, source: 'MERCADOLIVRE' },
          });
        }

        if (isNew) newCount++; else updatedCount++;
      }

      logger.info(`Scraping MLB ${city}: ${newCount} novos + ${updatedCount} atualizados`);
    } catch (err) {
      logger.error('Erro no scraping MLB', err);
    }
  })();
});

// Analisar propriedade com IA
propertiesRouter.post('/:id/analyze', async (req, res) => {
  const property = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!property) return res.status(404).json({ error: 'Imóvel não encontrado' });

  await prisma.property.update({ where: { id: req.params.id }, data: { analysisStatus: 'ANALYZING' } });
  res.json({ message: 'Análise iniciada' });

  (async () => {
    try {
      const analysis = await analyzeProperty({
        title: property.title,
        address: property.address,
        area: property.area,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms ?? undefined,
        propertyType: property.propertyType,
        description: property.description ?? undefined,
      });

      await prisma.property.update({
        where: { id: property.id },
        data: {
          analysisStatus: 'COMPLETED',
          tag: analysis.tag,
          score: analysis.score,
          grossYield: analysis.grossYield,
          netYield: analysis.netYield,
          cashflow: analysis.cashflow,
          roi: analysis.roi,
          estimatedRent: analysis.estimatedRent,
          managementFee: analysis.managementFee,
          maintenanceCost: analysis.maintenanceCost,
          insuranceCost: analysis.insuranceCost,
          mortgagePayment: analysis.mortgagePayment,
          motivatedSeller: analysis.motivatedSeller,
          belowMarketPct: analysis.belowMarketPct,
          liquidityIndex: analysis.liquidityIndex,
          aiAnalysis: analysis.aiAnalysis,
          aiSummary: analysis.aiSummary,
        },
      });
      logger.info(`Análise concluída para ${property.address}: ${analysis.tag}`);
      if (analysis.tag === 'STRONG_DEAL') {
        notifier.broadcast('strong_deal', {
          id: property.id,
          address: property.address,
          area: property.area,
          price: property.price,
          score: analysis.score,
          grossYield: analysis.grossYield,
          cashflow: analysis.cashflow,
          belowMarketPct: analysis.belowMarketPct,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      await prisma.property.update({
        where: { id: property.id },
        data: { analysisStatus: 'FAILED' },
      });
      logger.error('Erro na análise', err);
    }
  })();
});

// Listar imóveis salvos do usuário
propertiesRouter.get('/saved', async (req: AuthRequest, res) => {
  const saved = await prisma.savedProperty.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    include: {
      property: true,
    },
  });
  res.json(saved);
});

// Salvar/favoritar imóvel
propertiesRouter.post('/:id/save', async (req: AuthRequest, res) => {
  const { notes } = req.body;
  try {
    const saved = await prisma.savedProperty.create({
      data: { userId: req.userId!, propertyId: req.params.id, notes },
    });
    res.json(saved);
  } catch {
    res.status(409).json({ error: 'Imóvel já salvo' });
  }
});

propertiesRouter.delete('/:id/save', async (req: AuthRequest, res) => {
  await prisma.savedProperty.deleteMany({
    where: { userId: req.userId!, propertyId: req.params.id },
  });
  res.json({ message: 'Removido dos favoritos' });
});

// Gerar LOI
propertiesRouter.post('/:id/loi', async (req: AuthRequest, res) => {
  const { offerPrice, buyerName } = req.body;
  const property = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!property) return res.status(404).json({ error: 'Imóvel não encontrado' });

  const { generateLOI } = await import('../services/claude');
  const loi = await generateLOI({
    address: property.address,
    price: property.price,
    offerPrice,
    buyerName,
  });

  res.json({ loi });
});

// (deal-of-day movido para rota pública acima do middleware authenticate)

// Radar de cidades — yield médio e contagem por área
propertiesRouter.get('/radar/cities', async (_req, res) => {
  const data = await prisma.property.groupBy({
    by: ['area'],
    where: { analysisStatus: 'COMPLETED', grossYield: { gt: 0 } },
    _avg: { grossYield: true, cashflow: true, price: true },
    _count: { id: true },
    orderBy: { _avg: { grossYield: 'desc' } },
    take: 12,
  });
  res.json(data.map(d => ({
    city: d.area,
    avgYield: Number(d._avg.grossYield?.toFixed(2) || 0),
    avgCashflow: Number(d._avg.cashflow?.toFixed(0) || 0),
    avgPrice: Number(d._avg.price?.toFixed(0) || 0),
    total: d._count.id,
  })));
});

// Estatísticas do dashboard
propertiesRouter.get('/stats/summary', async (_req, res) => {
  const [total, byTag, priceReduced, recentCount] = await Promise.all([
    prisma.property.count(),
    prisma.property.groupBy({ by: ['tag'], _count: true }),
    prisma.property.count({ where: { priceReduced: true } }),
    prisma.property.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const tagMap = byTag.reduce((acc, { tag, _count }) => {
    if (tag) acc[tag] = _count;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    total,
    strongDeals: tagMap.STRONG_DEAL || 0,
    marginalDeals: tagMap.MARGINAL || 0,
    avoidDeals: tagMap.AVOID || 0,
    priceReduced,
    newToday: recentCount,
  });
});
