import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { notifier } from '../services/notifier';
import { authenticate, AuthRequest } from '../middleware/auth';

export const notificationsRouter = Router();

// SSE stream — cada usuário conecta aqui para receber eventos em tempo real
notificationsRouter.get('/stream', authenticate, (req: AuthRequest, res) => {
  const clientId = `${req.userId}-${uuidv4()}`;
  notifier.addClient(clientId, res);
});

// Endpoint interno para testar o broadcast (dev only)
notificationsRouter.post('/test', authenticate, (_req, res) => {
  notifier.broadcast('strong_deal', {
    message: 'Novo STRONG_DEAL detectado!',
    area: 'São Paulo',
    score: 9.2,
    grossYield: 11.4,
    timestamp: new Date().toISOString(),
  });
  res.json({ sent: notifier.connectedCount });
});
