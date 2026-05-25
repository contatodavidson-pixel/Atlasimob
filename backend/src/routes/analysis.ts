import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { analyzeProperty } from '../services/claude';

export const analysisRouter = Router();
analysisRouter.use(authenticate);

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
