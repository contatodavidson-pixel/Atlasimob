import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { chatWithAgent, generateLOI } from '../services/claude';
import { prisma } from '../lib/prisma';
import { v4 as uuid } from 'uuid';

export const chatRouter = Router();
chatRouter.use(authenticate);

// Chat com agente IA
chatRouter.post('/message', async (req: AuthRequest, res) => {
  const { message, sessionId: existingSession } = req.body;
  const sessionId = existingSession || uuid();

  const history = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const messages = history.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  messages.push({ role: 'user', content: message });

  const recentDeals = await prisma.property.findMany({
    where: { tag: 'STRONG_DEAL', analysisStatus: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { address: true, price: true, grossYield: true, cashflow: true, area: true, netYield: true },
  });

  const context = recentDeals.length
    ? `Melhores negócios no sistema:\n${recentDeals.map(p =>
        `- ${p.address} (${p.area}): R$${p.price.toLocaleString('pt-BR')}, Yield Bruto ${p.grossYield?.toFixed(2)}% a.a., Yield Líquido ${p.netYield?.toFixed(2)}% a.a., Cashflow R$${p.cashflow?.toFixed(0)}/mês`
      ).join('\n')}`
    : undefined;

  const reply = await chatWithAgent(messages, context);

  await prisma.chatMessage.createMany({
    data: [
      { sessionId, platform: 'WEB', role: 'user', content: message },
      { sessionId, platform: 'WEB', role: 'assistant', content: reply },
    ],
  });

  res.json({ reply, sessionId });
});

// Histórico de chat
chatRouter.get('/history/:sessionId', async (_req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: _req.params.sessionId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(messages);
});

// Gerar LOI via chat
chatRouter.post('/loi', async (req: AuthRequest, res) => {
  const { propertyId, offerPrice } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const property = await prisma.property.findUnique({ where: { id: propertyId } });

  if (!property) return res.status(404).json({ error: 'Imóvel não encontrado' });

  const loi = await generateLOI({
    address: property.address,
    price: property.price,
    offerPrice,
    buyerName: user?.name || 'Investidor',
  });

  res.json({ loi });
});
