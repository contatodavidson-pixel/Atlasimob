import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const reportsRouter = Router();
reportsRouter.use(authenticate, requireAdmin);

reportsRouter.get('/', async (_req, res) => {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(reports);
});

reportsRouter.get('/dashboard', async (_req: AuthRequest, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [byDay, byArea, byTag, avgMetrics] = await Promise.all([
    prisma.property.groupBy({
      by: ['createdAt'],
      _count: true,
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.property.groupBy({
      by: ['area'],
      _count: true,
      _avg: { grossYield: true, cashflow: true },
    }),
    prisma.property.groupBy({ by: ['tag'], _count: true }),
    prisma.property.aggregate({
      _avg: { grossYield: true, netYield: true, cashflow: true, roi: true },
      where: { analysisStatus: 'COMPLETED' },
    }),
  ]);

  res.json({ byDay, byArea, byTag, avgMetrics: avgMetrics._avg });
});
