import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export const waitlistRouter = Router();

// POST /api/waitlist — public, no auth
waitlistRouter.post('/', async (req, res) => {
  const { email, name, city, source = 'landing' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
    const entry = await prisma.waitlist.create({
      data: { email: email.toLowerCase().trim(), name, city, source },
    });
    logger.info(`Waitlist: novo cadastro ${email} (${city || 'sem cidade'})`);
    res.json({ success: true, id: entry.id });
  } catch {
    // Unique constraint = already registered
    res.json({ success: true, alreadyRegistered: true });
  }
});

// GET /api/waitlist/count — public
waitlistRouter.get('/count', async (_req, res) => {
  const count = await prisma.waitlist.count();
  res.json({ count });
});
