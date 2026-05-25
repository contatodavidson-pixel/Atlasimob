import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export const agenciesRouter = Router();
agenciesRouter.use(authenticate);

agenciesRouter.get('/', async (req: Request, res: Response) => {
  const { state, type, specialty, search, page = '1', limit = '50' } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (state) where.state = state;
  if (type) where.type = type;
  if (specialty) where.specialty = { contains: specialty };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    prisma.realEstateAgency.findMany({
      where,
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
      skip,
      take: parseInt(limit),
    }),
    prisma.realEstateAgency.count({ where }),
  ]);

  res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
});

agenciesRouter.get('/states', async (_req: Request, res: Response) => {
  const states = await prisma.realEstateAgency.findMany({
    select: { state: true },
    distinct: ['state'],
    orderBy: { state: 'asc' },
  });
  res.json(states.map(s => s.state));
});

agenciesRouter.post('/', async (req: Request, res: Response) => {
  const { name, city, state, phone, email, website, creci, specialty, type } = req.body;
  if (!name || !city || !state) {
    return res.status(400).json({ error: 'Nome, cidade e estado são obrigatórios' });
  }
  const agency = await prisma.realEstateAgency.create({
    data: { name, city, state, phone, email, website, creci, specialty: specialty || 'Residencial', type: type || 'Independente' },
  });
  res.status(201).json(agency);
});

agenciesRouter.put('/:id', async (req: Request, res: Response) => {
  const agency = await prisma.realEstateAgency.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(agency);
});

agenciesRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.realEstateAgency.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
