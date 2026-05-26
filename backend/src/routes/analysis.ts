import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { analyzeProperty } from '../services/claude';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export const analysisRouter = Router();
analysisRouter.use(authenticate);

// Analisar todos os imóveis pendentes em batch
analysisRouter.post('/batch', async (req, res) => {
  const limit = Number(req.query.limit ?? 10);

  const pending = await prisma.property.findMany({
    where: { analysisStatus: 'PENDING' },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  if (!pending.length) {
    return res.json({ message: 'Nenhum imóvel pendente para análise', total: 0 });
  }

  res.json({ message: `Analisando ${pending.length} imóveis em background...`, total: pending.length });

  (async () => {
    let success = 0;
    for (const property of pending) {
      try {
        await prisma.property.update({ where: { id: property.id }, data: { analysisStatus: 'ANALYZING' } });
        // Extract city from address for better analysis context
        const cityFromAddress = property.address.split(',').slice(-2).join(',').trim();
        const analysis = await analyzeProperty({
          title: property.title,
          address: property.address,
          area: property.area,
          city: cityFromAddress || property.area,
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
        success++;
        logger.info(`Análise batch: ${success}/${pending.length} — ${property.address}`);
      } catch (err) {
        await prisma.property.update({ where: { id: property.id }, data: { analysisStatus: 'FAILED' } });
        logger.error(`Erro ao analisar ${property.id}`, err);
      }
    }
    logger.info(`Batch concluído: ${success}/${pending.length} imóveis analisados`);
  })();
});

// Reset imóveis para re-análise (admin)
analysisRouter.post('/reset', async (req, res) => {
  const { ids, status } = req.body as { ids?: string[]; status?: string[] };
  const statusFilter = status ?? ['COMPLETED', 'FAILED'];

  const where = ids?.length
    ? { id: { in: ids } }
    : { analysisStatus: { in: statusFilter } };

  const { count } = await prisma.property.updateMany({
    where,
    data: {
      analysisStatus: 'PENDING',
      tag: null,
      score: null,
      grossYield: null,
      netYield: null,
      cashflow: null,
      roi: null,
      estimatedRent: null,
      managementFee: null,
      maintenanceCost: null,
      insuranceCost: null,
      mortgagePayment: null,
      motivatedSeller: false,
      belowMarketPct: null,
      liquidityIndex: null,
      aiAnalysis: null,
      aiSummary: null,
    },
  });

  res.json({ message: `${count} imóveis resetados para PENDING`, count });
});

// Análise rápida de imóvel por URL ou dados manuais
analysisRouter.post('/quick', async (req, res) => {
  const { price, bedrooms, bathrooms, propertyType, area, address, description } = req.body;

  if (!price || !bedrooms || !area) {
    return res.status(400).json({ error: 'Campos obrigatórios: price, bedrooms, area' });
  }

  const analysis = await analyzeProperty({
    title: address || `Imóvel em ${area}`,
    address: address || area,
    area,
    price: Number(price),
    bedrooms: Number(bedrooms),
    bathrooms: bathrooms ? Number(bathrooms) : undefined,
    propertyType: propertyType || 'residential',
    description,
  });

  res.json(analysis);
});
