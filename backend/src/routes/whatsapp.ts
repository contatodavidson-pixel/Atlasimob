import { Router, Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp';
import { logger } from '../lib/logger';

export const whatsappRouter = Router();

// Webhook recebido da Evolution API
whatsappRouter.post('/webhook', async (req: Request, res: Response) => {
  res.sendStatus(200); // responde rápido para Evolution API não reenviar

  const { event, data } = req.body;
  if (event !== 'messages.upsert') return;
  if (!data) return;

  const remoteJid: string = data.key?.remoteJid || '';
  const fromMe: boolean = data.key?.fromMe || false;

  // Ignorar mensagens enviadas pelo próprio bot e grupos
  if (fromMe || remoteJid.includes('@g.us')) return;

  const text: string =
    data.message?.conversation ||
    data.message?.extendedTextMessage?.text ||
    '';

  if (!text.trim()) return;

  const pushName: string = data.pushName || '';

  logger.info(`WhatsApp recebido de ${remoteJid}: ${text.substring(0, 60)}`);

  whatsappService.handleIncoming(remoteJid, text, pushName).catch(err =>
    logger.error('Erro ao processar mensagem WhatsApp', err)
  );
});
