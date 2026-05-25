import { Telegraf, Context } from 'telegraf';
import { chatWithAgent } from './claude';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
const sessions = new Map<number, Array<{ role: 'user' | 'assistant'; content: string }>>();

bot.start((ctx) => {
  ctx.reply(
    '👋 Olá! Sou seu Agente de IA para Investimento Imobiliário no Brasil.\n\n' +
    'Posso ajudar com:\n' +
    '📊 Análise de imóveis (link do ZAP/VivaReal ou descreva)\n' +
    '💰 Cálculo de yield, cashflow e ROI\n' +
    '🔍 Busca de vendedores motivados e preços reduzidos\n' +
    '📝 Geração de Proposta de Compra\n' +
    '🏙️ Comparativo entre cidades e bairros\n\n' +
    'Como posso ajudar?'
  );
});

bot.command('menu', (ctx) => {
  ctx.reply(
    '📋 Menu de Comandos:\n\n' +
    '/analise [endereço] - Analisa um imóvel\n' +
    '/reducoes - Imóveis com preço reduzido hoje\n' +
    '/top5 - Top 5 negócios da semana\n' +
    '/relatorio - Resumo do mercado\n' +
    '/limpar - Limpar histórico da conversa'
  );
});

bot.command('reducoes', async (ctx) => {
  const reduced = await prisma.property.findMany({
    where: { priceReduced: true },
    orderBy: { priceReducedBy: 'desc' },
    take: 5,
  });

  if (!reduced.length) {
    return ctx.reply('Nenhum imóvel com preço reduzido hoje.');
  }

  const msg = reduced.map(p =>
    `🏠 ${p.address}\n` +
    `💰 R$${p.price.toLocaleString('pt-BR')} (↓R$${p.priceReducedBy?.toLocaleString('pt-BR') || '?'})\n` +
    `📊 ${p.tag || 'Sem análise'}\n` +
    `🔗 ${p.listingUrl}`
  ).join('\n\n');

  ctx.reply(`🔥 Imóveis com Preço Reduzido:\n\n${msg}`);
});

bot.command('top5', async (ctx) => {
  const top = await prisma.property.findMany({
    where: { tag: 'STRONG_DEAL', analysisStatus: 'COMPLETED' },
    orderBy: { grossYield: 'desc' },
    take: 5,
  });

  if (!top.length) return ctx.reply('Nenhum negócio forte encontrado ainda.');

  const msg = top.map((p, i) =>
    `${i + 1}. 🏠 ${p.address}\n` +
    `   💰 R$${p.price.toLocaleString('pt-BR')} | 📈 ${p.grossYield?.toFixed(2)}% a.a.\n` +
    `   💵 Cashflow: R$${p.cashflow?.toFixed(0)}/mês`
  ).join('\n\n');

  ctx.reply(`🏆 Top 5 Negócios:\n\n${msg}`);
});

bot.command('limpar', (ctx) => {
  if (ctx.from) sessions.delete(ctx.from.id);
  ctx.reply('✅ Histórico limpo. Podemos começar uma nova conversa!');
});

bot.on('text', async (ctx: Context) => {
  if (!ctx.from || !('text' in ctx.message!)) return;

  const userId = ctx.from.id;
  const userMessage = (ctx.message as { text: string }).text;

  if (!sessions.has(userId)) sessions.set(userId, []);
  const history = sessions.get(userId)!;

  // Buscar contexto de imóveis recentes
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

  history.push({ role: 'user', content: userMessage });

  try {
    await ctx.sendChatAction('typing');
    const reply = await chatWithAgent(history.slice(-10), context);
    history.push({ role: 'assistant', content: reply });

    await prisma.chatMessage.createMany({
      data: [
        { sessionId: `tg_${userId}`, platform: 'TELEGRAM', role: 'user', content: userMessage },
        { sessionId: `tg_${userId}`, platform: 'TELEGRAM', role: 'assistant', content: reply },
      ],
    });

    // Dividir mensagens longas
    if (reply.length > 4000) {
      const parts = reply.match(/.{1,4000}/gs) || [];
      for (const part of parts) await ctx.reply(part);
    } else {
      await ctx.reply(reply);
    }
  } catch (error) {
    logger.error('Erro no Telegram bot', error);
    ctx.reply('Desculpe, ocorreu um erro. Tente novamente.');
  }
});

export const telegramService = {
  launch: async () => {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      logger.warn('TELEGRAM_BOT_TOKEN não configurado — Telegram desabilitado');
      return;
    }
    try {
      await bot.launch();
      logger.info('Telegram bot iniciado');
    } catch (err) {
      logger.error('Erro ao iniciar Telegram bot', err);
    }
  },
  sendMessage: async (chatId: string, message: string) => {
    await bot.telegram.sendMessage(chatId, message);
  },
  stop: () => bot.stop(),
};

export { bot as telegramBot };
