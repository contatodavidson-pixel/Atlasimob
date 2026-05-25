import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateInvestorReply } from '../services/claude';
import { sendEmail } from '../services/email';
import { logger } from '../lib/logger';

export const investorsRouter = Router();
investorsRouter.use(authenticate, requireAdmin);

// Listar investidores
investorsRouter.get('/', async (req, res) => {
  const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const [total, investors] = await Promise.all([
    prisma.investor.count({ where }),
    prisma.investor.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { emailHistory: true, matches: true } } },
    }),
  ]);

  res.json({ data: investors, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

// Detalhes do investidor
investorsRouter.get('/:id', async (req, res) => {
  const investor = await prisma.investor.findUnique({
    where: { id: req.params.id },
    include: {
      emailHistory: { orderBy: { sentAt: 'desc' }, take: 20 },
      matches: {
        include: { property: true },
        orderBy: { score: 'desc' },
        take: 10,
      },
    },
  });
  if (!investor) return res.status(404).json({ error: 'Investidor não encontrado' });
  res.json(investor);
});

// Criar investidor
investorsRouter.post('/', async (req, res) => {
  const investor = await prisma.investor.create({ data: req.body });
  res.status(201).json(investor);
});

// Atualizar investidor
investorsRouter.put('/:id', async (req, res) => {
  const investor = await prisma.investor.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(investor);
});

// Resposta automática por IA
investorsRouter.post('/:id/auto-reply', async (req, res) => {
  const { incomingEmail, propertyId } = req.body;
  const investor = await prisma.investor.findUnique({ where: { id: req.params.id } });
  if (!investor) return res.status(404).json({ error: 'Investidor não encontrado' });

  let property = null;
  if (propertyId) {
    property = await prisma.property.findUnique({ where: { id: propertyId } });
  }

  const reply = await generateInvestorReply(incomingEmail, {
    address: property?.address || 'Portfólio disponível',
    price: property?.price || 0,
    grossYield: property?.grossYield || 0,
    netYield: property?.netYield || 0,
    cashflow: property?.cashflow || 0,
  });

  await sendEmail({ to: investor.email, subject: reply.subject, html: reply.body });

  await prisma.emailHistory.create({
    data: {
      investorId: investor.id,
      subject: reply.subject,
      body: reply.body,
      direction: 'OUTBOUND',
      aiGenerated: true,
    },
  });

  await prisma.investor.update({
    where: { id: investor.id },
    data: { lastContactAt: new Date() },
  });

  res.json({ message: 'Email enviado com sucesso', subject: reply.subject });
});

// Matching automático de imóveis com investidores
investorsRouter.post('/match-all', async (_req, res) => {
  res.json({ message: 'Matching iniciado em background' });

  (async () => {
    try {
      const investors = await prisma.investor.findMany({ where: { status: { in: ['LEAD', 'PROSPECT', 'ACTIVE'] } } });
      const strongDeals = await prisma.property.findMany({
        where: { tag: 'STRONG_DEAL', analysisStatus: 'COMPLETED' },
      });

      for (const investor of investors) {
        for (const property of strongDeals) {
          const priceMatch = !investor.maxBudget || property.price <= investor.maxBudget;
          const yieldMatch = !investor.minYield || (property.grossYield || 0) >= investor.minYield;
          const areaMatch = !investor.preferredAreas?.length ||
            investor.preferredAreas.some(a => property.area.toLowerCase().includes(a.toLowerCase()));

          if (priceMatch && yieldMatch && areaMatch) {
            const score = ((property.grossYield || 0) * 0.4) +
              ((property.cashflow || 0) / 100 * 0.3) +
              (priceMatch ? 15 : 0) + (areaMatch ? 15 : 0);

            await prisma.investorMatch.upsert({
              where: { investorId_propertyId: { investorId: investor.id, propertyId: property.id } },
              update: { score },
              create: { investorId: investor.id, propertyId: property.id, score },
            });
          }
        }
      }
      logger.info('Matching concluído');
    } catch (err) {
      logger.error('Erro no matching', err);
    }
  })();
});

// Pipeline de investidores
investorsRouter.get('/pipeline/stats', async (_req, res) => {
  const pipeline = await prisma.investor.groupBy({
    by: ['status'],
    _count: true,
  });
  res.json(pipeline);
});
