import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const alertsRouter = Router();
alertsRouter.use(authenticate);

alertsRouter.get('/', async (req: AuthRequest, res) => {
  const alerts = await prisma.alertConfig.findMany({ where: { userId: req.userId! } });
  res.json(alerts);
});

alertsRouter.post('/', async (req: AuthRequest, res) => {
  const alert = await prisma.alertConfig.create({
    data: { ...req.body, userId: req.userId! },
  });
  res.status(201).json(alert);
});

alertsRouter.put('/:id', async (req: AuthRequest, res) => {
  const alert = await prisma.alertConfig.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(alert);
});

alertsRouter.delete('/:id', async (req, res) => {
  await prisma.alertConfig.delete({ where: { id: req.params.id } });
  res.json({ message: 'Alerta removido' });
});
