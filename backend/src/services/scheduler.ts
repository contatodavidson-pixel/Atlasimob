import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { scrapeZapImoveis, scrapeVivaReal } from './apify';
import { analyzeProperty, generateWeeklyReport } from './claude';
import { sendEmail, buildDailyAlertEmail, buildWeeklyReportEmail } from './email';
import { whatsappService } from './whatsapp';
import { logger } from '../lib/logger';

const DEFAULT_CITIES = [
  { city: 'São Paulo', state: 'SP' },
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'Curitiba', state: 'PR' },
  { city: 'Belo Horizonte', state: 'MG' },
  { city: 'Florianópolis', state: 'SC' },
  { city: 'Porto Alegre', state: 'RS' },
];

async function runDailyScraping() {
  logger.info('Iniciando scraping diário — portais brasileiros');
  for (const loc of DEFAULT_CITIES) {
    const [zap, vr] = await Promise.all([
      scrapeZapImoveis({ city: loc.city, state: loc.state }),
      scrapeVivaReal({ city: loc.city, state: loc.state }),
    ]);

    for (const prop of [...zap, ...vr]) {
      await prisma.property.upsert({
        where: { externalId: prop.externalId },
        update: {
          price: prop.price,
          priceReduced: prop.priceReduced,
          priceReducedBy: prop.priceReducedBy,
          originalPrice: prop.originalPrice,
        },
        create: {
          externalId: prop.externalId,
          source: prop.source,
          title: prop.title,
          address: prop.address,
          area: prop.city,
          price: prop.price,
          originalPrice: prop.originalPrice,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          propertyType: prop.propertyType,
          description: prop.description,
          imageUrls: prop.imageUrls,
          listingUrl: prop.listingUrl,
          priceReduced: prop.priceReduced,
          priceReducedBy: prop.priceReducedBy,
          analysisStatus: 'PENDING',
        },
      });
    }
    logger.info(`Scraping concluído para ${loc.city}: ${zap.length + vr.length} imóveis`);
  }
}

async function analyzeNewProperties() {
  const pending = await prisma.property.findMany({
    where: { analysisStatus: 'PENDING' },
    take: 20,
  });

  for (const prop of pending) {
    try {
      await prisma.property.update({ where: { id: prop.id }, data: { analysisStatus: 'ANALYZING' } });
      const analysis = await analyzeProperty({
        title: prop.title,
        address: prop.address,
        area: prop.area,
        price: prop.price,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms ?? undefined,
        propertyType: prop.propertyType,
        description: prop.description ?? undefined,
      });
      await prisma.property.update({
        where: { id: prop.id },
        data: {
          analysisStatus: 'COMPLETED',
          tag: analysis.tag,
          grossYield: analysis.grossYield,
          netYield: analysis.netYield,
          cashflow: analysis.cashflow,
          roi: analysis.roi,
          estimatedRent: analysis.estimatedRent,
          managementFee: analysis.managementFee,
          maintenanceCost: analysis.maintenanceCost,
          insuranceCost: analysis.insuranceCost,
          mortgagePayment: analysis.mortgagePayment,
          motivatedSeller: analysis.motivatedSeller,
          score: analysis.score,
          belowMarketPct: analysis.belowMarketPct,
          aiAnalysis: analysis.aiAnalysis,
          aiSummary: analysis.aiSummary,
        },
      });
      logger.info(`Analisado: ${prop.address} → ${analysis.tag}`);
    } catch (err) {
      await prisma.property.update({ where: { id: prop.id }, data: { analysisStatus: 'FAILED' } });
      logger.error(`Falha na análise de ${prop.address}`, err);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function sendMorningAlert() {
  logger.info('Enviando alerta das 8h');
  const newProperties = await prisma.property.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      analysisStatus: 'COMPLETED',
    },
    orderBy: { grossYield: 'desc' },
    take: 20,
  });

  if (!newProperties.length) return;

  const users = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  const emailHtml = buildDailyAlertEmail(newProperties);

  for (const user of users) {
    await sendEmail({
      to: user.email,
      subject: `🏠 ${newProperties.length} Novos Imóveis Analisados — ${new Date().toLocaleDateString('pt-BR')}`,
      html: emailHtml,
    });
  }

  const summary =
    `🏠 *Alerta das 8h — ${newProperties.length} novos imóveis!*\n` +
    `✅ Excelentes Oportunidades: ${newProperties.filter(p => p.tag === 'STRONG_DEAL').length}\n` +
    `🔶 Oportunidades Moderadas: ${newProperties.filter(p => p.tag === 'MARGINAL').length}\n` +
    `Ver todos no painel: ${process.env.APP_URL}/dashboard`;

  for (const user of users) {
    if (user.whatsappPhone) {
      await whatsappService.sendMessage(user.whatsappPhone, summary).catch(() => {});
    }
  }
}

async function sendNoonAlert() {
  logger.info('Enviando alerta de preços reduzidos das 12h');
  const reduced = await prisma.property.findMany({
    where: {
      priceReduced: true,
      updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { priceReducedBy: 'desc' },
    take: 10,
  });

  if (!reduced.length) return;

  const users = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  const msg =
    `🔥 ${reduced.length} imóveis com preço reduzido hoje!\n\n` +
    reduced.slice(0, 5).map(p =>
      `🏠 ${p.address}\n💰 R$${p.price.toLocaleString('pt-BR')} (↓R$${p.priceReducedBy?.toLocaleString('pt-BR')})`
    ).join('\n\n') +
    `\n\nVer todos: ${process.env.APP_URL}/dashboard?priceReduced=true`;

  for (const user of users) {
    if (user.whatsappPhone) {
      await whatsappService.sendMessage(user.whatsappPhone, msg).catch(() => {});
    }
  }
}

async function sendWeeklyReport() {
  logger.info('Gerando relatório semanal');
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, byTag, priceReduced, topDeals] = await Promise.all([
    prisma.property.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.property.groupBy({ by: ['tag'], _count: true, where: { createdAt: { gte: weekAgo } } }),
    prisma.property.count({ where: { priceReduced: true, updatedAt: { gte: weekAgo } } }),
    prisma.property.findMany({
      where: { tag: 'STRONG_DEAL', analysisStatus: 'COMPLETED', createdAt: { gte: weekAgo } },
      orderBy: { grossYield: 'desc' },
      take: 3,
    }),
  ]);

  const tagMap = byTag.reduce((acc, { tag, _count }) => {
    if (tag) acc[tag] = _count;
    return acc;
  }, {} as Record<string, number>);

  const areaData = await prisma.property.groupBy({
    by: ['area'],
    _count: true,
    where: { createdAt: { gte: weekAgo } },
  });
  const areaBreakdown = areaData.reduce((acc, { area, _count }) => ({ ...acc, [area]: _count }), {});

  const reportText = await generateWeeklyReport({
    totalProperties: total,
    strongDeals: tagMap.STRONG_DEAL || 0,
    marginalDeals: tagMap.MARGINAL || 0,
    avoidDeals: tagMap.AVOID || 0,
    priceReduced,
    topDeals: topDeals.map(p => ({
      address: p.address,
      grossYield: p.grossYield || 0,
      cashflow: p.cashflow || 0,
    })),
    areaBreakdown,
  });

  await prisma.report.create({
    data: {
      type: 'WEEKLY',
      period: weekAgo.toISOString().split('T')[0],
      data: { total, tagMap, priceReduced, reportText },
      sentAt: new Date(),
    },
  });

  const users = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  for (const user of users) {
    await sendEmail({
      to: user.email,
      subject: `📊 Relatório Semanal — ${new Date().toLocaleDateString('pt-BR')}`,
      html: buildWeeklyReportEmail(reportText),
    });
  }

  logger.info('Relatório semanal enviado');
}

export const schedulerService = {
  start() {
    cron.schedule('0 7 * * *', () => {
      runDailyScraping().then(analyzeNewProperties).catch(logger.error);
    });
    cron.schedule('0 8 * * *', () => sendMorningAlert().catch(logger.error));
    cron.schedule('0 12 * * *', () => sendNoonAlert().catch(logger.error));
    cron.schedule('0 * * * *', () => analyzeNewProperties().catch(logger.error));
    cron.schedule('0 8 * * 1', () => sendWeeklyReport().catch(logger.error));

    logger.info('Agendamentos: 7h scraping ZAP+VivaReal, 8h alerta WhatsApp+email, 12h reduções, segunda relatório');
  },
};
