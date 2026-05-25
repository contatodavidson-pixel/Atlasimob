import axios from 'axios';
import { chatWithAgent } from './claude';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const sessions = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

function getConfig() {
  return {
    url: process.env.EVOLUTION_API_URL,
    key: process.env.EVOLUTION_API_KEY,
    instance: process.env.EVOLUTION_INSTANCE || 'realestate',
  };
}

function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

async function sendText(phone: string, text: string): Promise<void> {
  const { url, key, instance } = getConfig();
  if (!url || !key) return;
  await axios.post(
    `${url}/message/sendText/${instance}`,
    { number: formatPhone(phone), text },
    { headers: { apikey: key } }
  );
}

export const whatsappService = {
  launch: async () => {
    const { url, key } = getConfig();
    if (!url || !key) {
      logger.warn('EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados — WhatsApp desabilitado');
      return;
    }
    logger.info('Serviço WhatsApp (Evolution API) inicializado');
  },

  sendMessage: async (phone: string, message: string): Promise<void> => {
    const { url, key } = getConfig();
    if (!url || !key) {
      logger.warn(`WhatsApp NÃO enviado (sem config Evolution API): ${phone}`);
      return;
    }
    try {
      await sendText(phone, message);
      logger.info(`WhatsApp enviado para ${phone}`);
    } catch (err) {
      logger.error('Erro ao enviar WhatsApp', err);
    }
  },

  // Processa mensagem recebida via webhook da Evolution API
  handleIncoming: async (remoteJid: string, text: string, pushName: string): Promise<void> => {
    const phone = remoteJid.replace('@s.whatsapp.net', '');

    if (!sessions.has(phone)) sessions.set(phone, []);
    const history = sessions.get(phone)!;

    // Comandos rápidos
    if (text.trim().toLowerCase() === '/top5') {
      const top = await prisma.property.findMany({
        where: { tag: 'STRONG_DEAL', analysisStatus: 'COMPLETED' },
        orderBy: { grossYield: 'desc' },
        take: 5,
      });
      if (!top.length) {
        await whatsappService.sendMessage(phone, '🔍 Nenhuma Excelente Oportunidade encontrada ainda.');
        return;
      }
      const msg =
        '🏆 *Top 5 Excelentes Oportunidades:*\n\n' +
        top.map((p, i) =>
          `${i + 1}. 🏠 ${p.address}\n` +
          `   💰 R$${p.price.toLocaleString('pt-BR')} | 📈 ${p.grossYield?.toFixed(2)}% a.a.\n` +
          `   💵 Cashflow: R$${p.cashflow?.toFixed(0)}/mês`
        ).join('\n\n');
      await whatsappService.sendMessage(phone, msg);
      return;
    }

    if (text.trim().toLowerCase() === '/reducoes') {
      const reduced = await prisma.property.findMany({
        where: { priceReduced: true },
        orderBy: { priceReducedBy: 'desc' },
        take: 5,
      });
      if (!reduced.length) {
        await whatsappService.sendMessage(phone, 'Nenhum imóvel com preço reduzido hoje.');
        return;
      }
      const msg =
        '🔥 *Imóveis com Preço Reduzido:*\n\n' +
        reduced.map(p =>
          `🏠 ${p.address}\n` +
          `💰 R$${p.price.toLocaleString('pt-BR')} (↓R$${p.priceReducedBy?.toLocaleString('pt-BR') || '?'})\n` +
          `🔗 ${p.listingUrl}`
        ).join('\n\n');
      await whatsappService.sendMessage(phone, msg);
      return;
    }

    if (text.trim().toLowerCase() === '/menu' || text.trim().toLowerCase() === '/start') {
      await whatsappService.sendMessage(phone,
        `👋 Olá${pushName ? `, ${pushName}` : ''}! Sou o Agente RealEstateAI 🏠\n\n` +
        'Comandos disponíveis:\n' +
        '*/top5* — Top 5 melhores oportunidades\n' +
        '*/reducoes* — Imóveis com preço reduzido\n' +
        '*/limpar* — Limpar histórico da conversa\n\n' +
        'Ou escreva livremente para falar com o Agente de IA sobre qualquer imóvel!'
      );
      return;
    }

    if (text.trim().toLowerCase() === '/limpar') {
      sessions.delete(phone);
      await whatsappService.sendMessage(phone, '✅ Histórico limpo! Podemos começar uma nova conversa.');
      return;
    }

    // Chat livre com agente IA
    const recentProperties = await prisma.property.findMany({
      where: { tag: 'STRONG_DEAL' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { address: true, price: true, grossYield: true, cashflow: true, area: true },
    });

    const context = recentProperties.length
      ? `Melhores oportunidades no sistema:\n${recentProperties.map(p =>
          `- ${p.address} (${p.area}): R$${p.price.toLocaleString('pt-BR')}, Yield ${p.grossYield?.toFixed(2)}% a.a., Cashflow R$${p.cashflow?.toFixed(0)}/mês`
        ).join('\n')}`
      : undefined;

    history.push({ role: 'user', content: text });

    try {
      const reply = await chatWithAgent(history.slice(-10), context);
      history.push({ role: 'assistant', content: reply });

      await prisma.chatMessage.createMany({
        data: [
          { sessionId: `wa_${phone}`, platform: 'WHATSAPP', role: 'user', content: text },
          { sessionId: `wa_${phone}`, platform: 'WHATSAPP', role: 'assistant', content: reply },
        ],
      });

      // Dividir mensagens longas (WhatsApp aceita até ~65.536 chars, mas melhor limitar)
      if (reply.length > 3000) {
        const parts = reply.match(/[\s\S]{1,3000}/g) || [];
        for (const part of parts) await whatsappService.sendMessage(phone, part);
      } else {
        await whatsappService.sendMessage(phone, reply);
      }
    } catch (err) {
      logger.error('Erro no agente WhatsApp', err);
      await whatsappService.sendMessage(phone, 'Desculpe, ocorreu um erro. Tente novamente em instantes.');
    }
  },
};
