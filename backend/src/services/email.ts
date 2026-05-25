import { logger } from '../lib/logger';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    logger.warn('RESEND_API_KEY não configurada — envio de email desabilitado');
    return null;
  }
  const { Resend } = require('resend');
  return new Resend(key);
}

const FROM = () => process.env.FROM_EMAIL || 'noreply@realestateai.com.br';

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.warn(`Email NÃO enviado (sem chave Resend): ${opts.subject}`);
    return;
  }
  try {
    await resend.emails.send({
      from: opts.from || FROM(),
      to: typeof opts.to === 'string' ? [opts.to] : opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    logger.info(`Email enviado para ${opts.to}: ${opts.subject}`);
  } catch (error) {
    logger.error('Erro ao enviar email', error);
    throw error;
  }
}

export function buildDailyAlertEmail(properties: Array<{
  address: string;
  price: number;
  bedrooms: number;
  area: string;
  grossYield?: number;
  cashflow?: number;
  tag?: string;
  listingUrl: string;
}>): string {
  const tagColors: Record<string, string> = {
    STRONG_DEAL: '#16a34a',
    MARGINAL: '#d97706',
    AVOID: '#dc2626',
  };
  const tagLabels: Record<string, string> = {
    STRONG_DEAL: 'EXCELENTE OPORTUNIDADE',
    MARGINAL: 'OPORTUNIDADE MODERADA',
    AVOID: 'NÃO RECOMENDADO',
  };

  const rows = properties.map(p => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:12px;">${p.address}</td>
      <td style="padding:12px;">R$${p.price.toLocaleString('pt-BR')}</td>
      <td style="padding:12px;">${p.bedrooms} quartos</td>
      <td style="padding:12px;">${p.grossYield ? p.grossYield.toFixed(2) + '% a.a.' : '-'}</td>
      <td style="padding:12px;">R$${p.cashflow ? p.cashflow.toFixed(0) : '-'}/mês</td>
      <td style="padding:12px;">
        ${p.tag ? `<span style="background:${tagColors[p.tag]};color:white;padding:2px 8px;border-radius:4px;font-size:12px;">${tagLabels[p.tag]}</span>` : '-'}
      </td>
      <td style="padding:12px;"><a href="${p.listingUrl}" style="color:#2563eb;">Ver</a></td>
    </tr>
  `).join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:900px;margin:0 auto;">
      <div style="background:#1e3a8a;color:white;padding:20px;text-align:center;">
        <h1 style="margin:0;">🏠 Alerta Diário — Novos Imóveis</h1>
        <p style="margin:4px 0;opacity:0.8;">${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      <div style="padding:20px;">
        <p>Encontramos <strong>${properties.length} novos imóveis</strong> analisados hoje no mercado brasileiro.</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:12px;text-align:left;">Endereço</th>
              <th style="padding:12px;text-align:left;">Preço</th>
              <th style="padding:12px;text-align:left;">Quartos</th>
              <th style="padding:12px;text-align:left;">Yield a.a.</th>
              <th style="padding:12px;text-align:left;">Cashflow</th>
              <th style="padding:12px;text-align:left;">Classificação</th>
              <th style="padding:12px;text-align:left;">Link</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;color:#6b7280;font-size:12px;">
        RealEstate AI — Sistema de Investimento Imobiliário com IA | Para cancelar alertas, acesse seu painel.
      </div>
    </div>
  `;
}

export function buildWeeklyReportEmail(reportText: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
      <div style="background:#1e3a8a;color:white;padding:20px;text-align:center;">
        <h1 style="margin:0;">📊 Relatório Semanal</h1>
        <p style="margin:4px 0;opacity:0.8;">${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      <div style="padding:24px;white-space:pre-wrap;line-height:1.7;">
        ${reportText.replace(/\n/g, '<br>')}
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;color:#6b7280;font-size:12px;">
        RealEstate AI — Inteligência Artificial para Investimento Imobiliário no Brasil
      </div>
    </div>
  `;
}
