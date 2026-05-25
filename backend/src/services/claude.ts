import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../lib/logger';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface PropertyAnalysis {
  tag: 'STRONG_DEAL' | 'MARGINAL' | 'AVOID';
  score: number;
  grossYield: number;
  netYield: number;
  cashflow: number;
  roi: number;
  estimatedRent: number;
  managementFee: number;
  maintenanceCost: number;
  insuranceCost: number;
  mortgagePayment: number;
  motivatedSeller: boolean;
  belowMarketPct: number;
  liquidityIndex: 'ALTA' | 'MEDIA' | 'BAIXA';
  aiAnalysis: string;
  aiSummary: string;
}

const SYSTEM_PROMPT = `Você é um especialista em investimento imobiliário no Brasil, com profundo conhecimento do mercado nacional.
Você analisa imóveis para investidores brasileiros e fornece análises precisas em português do Brasil.
Seu papel é funcionar como um filtro inteligente de oportunidades — economizando horas de análise manual do investidor.

Regras de classificação para o mercado brasileiro:
- EXCELENTE OPORTUNIDADE (STRONG_DEAL): Yield bruto ≥ 0,6% ao mês (7,2% a.a.) E cashflow positivo ≥ R$500/mês. Supera CDI com risco patrimonial.
- OPORTUNIDADE MODERADA (MARGINAL): Yield bruto entre 0,4%-0,6% ao mês OU cashflow entre R$0-500/mês. Potencial com negociação.
- NÃO RECOMENDADO (AVOID): Yield bruto < 0,4% ao mês OU cashflow negativo. Não supera renda fixa.

Identificação de vendedor motivado — marque motivatedSeller: true quando encontrar na descrição:
- Palavras de urgência: "urgente", "preciso vender", "aceito proposta", "oportunidade", "abaixo do mercado", "precisa de reforma", "permuto"
- Sinais financeiros: preço significativamente abaixo da média da região, imóvel com mais de 90 dias no mercado (mencionado)
- Situações especiais: inventário, divórcio, mudança, dívida, leilão

Premissas padrão para cálculos no mercado brasileiro (use estas se não houver dados específicos):
- Aluguel estimado: 0,45% a 0,6% do valor do imóvel/mês (varia por cidade e tipo)
- Taxa de administração imobiliária: 8% do aluguel bruto
- IPTU: informado ou estimar R$100-500/mês conforme o valor do imóvel
- Condomínio: informado ou estimar R$300-800/mês para apartamentos
- Manutenção/reparos: 0,5% do valor do imóvel/ano (R$/mês)
- Seguro: 0,1% do valor do imóvel/ano
- Vacância: 1 mês/ano (8,3%)
- Financiamento padrão: 80% de LTV (20% de entrada), taxa 10,5% a.a. (SBPE), 30 anos
- Custos de compra: ~5,5% (ITBI 2%, corretor 6% pago pelo vendedor, escritura e registro ~1,5%)
- Capital próprio = 20% do preço + 5,5% de custos de aquisição

Cidades de referência (yield bruto médio por mês):
- São Paulo: 0,40-0,55% | Rio de Janeiro: 0,42-0,58% | Curitiba: 0,48-0,65%
- Florianópolis: 0,45-0,60% | Porto Alegre: 0,50-0,68% | Belo Horizonte: 0,45-0,62%
- Goiânia: 0,52-0,70% | Campinas: 0,48-0,65% | Fortaleza: 0,50-0,68%`;

export async function analyzeProperty(property: {
  title: string;
  address: string;
  area: string;
  city?: string;
  state?: string;
  price: number;
  bedrooms: number;
  bathrooms?: number;
  areaM2?: number;
  propertyType: string;
  description?: string;
  condoFee?: number;
  iptu?: number;
}): Promise<PropertyAnalysis> {
  const custosMensais = [];
  if (property.condoFee) custosMensais.push(`Condomínio informado: R$${property.condoFee.toLocaleString('pt-BR')}/mês`);
  if (property.iptu) custosMensais.push(`IPTU informado: R$${(property.iptu / 12).toFixed(0)}/mês`);

  const prompt = `Analise este imóvel para investimento no Brasil:

**Imóvel:** ${property.title}
**Endereço:** ${property.address}
**Cidade/Estado:** ${property.city || property.area}${property.state ? `/${property.state}` : ''}
**Preço de Venda:** R$${property.price.toLocaleString('pt-BR')}
**Quartos:** ${property.bedrooms}
**Banheiros:** ${property.bathrooms || 'N/A'}
**Área:** ${property.areaM2 ? `${property.areaM2} m²` : 'N/A'}
**Tipo:** ${property.propertyType}
${custosMensais.length ? `**Custos informados:** ${custosMensais.join(', ')}` : ''}
**Descrição:** ${property.description || 'Não disponível'}

Forneça análise completa em JSON com este formato exato (todos os valores em R$):
{
  "estimatedRent": <R$/mês estimado>,
  "grossYield": <yield bruto anual em percentual>,
  "managementFee": <R$/mês>,
  "maintenanceCost": <R$/mês>,
  "insuranceCost": <R$/mês>,
  "condoFee": <R$/mês (use o informado ou estime)>,
  "iptuMonthly": <R$/mês (IPTU/12)>,
  "mortgagePayment": <R$/mês baseado em 80% LTV a 10,5% a.a., 30 anos>,
  "netYield": <yield líquido anual em percentual>,
  "cashflow": <R$/mês após todos os custos e financiamento>,
  "roi": <ROI anual % sobre capital próprio investido>,
  "tag": "STRONG_DEAL" | "MARGINAL" | "AVOID",
  "score": <nota de 0.0 a 10.0 representando a qualidade do investimento. 9-10: excepcional, 7-8.9: excelente, 5-6.9: moderado, 3-4.9: fraco, 0-2.9: evitar>,
  "belowMarketPct": <percentual estimado que o preço está abaixo da média da região — positivo significa abaixo do mercado, negativo significa acima. Ex: 12.5 significa "12,5% abaixo da média">,
  "liquidityIndex": "ALTA" | "MEDIA" | "BAIXA" — baseado em: localização (grandes centros = ALTA), ticket (<R$600k = mais líquido), tipo (apartamento > casa), demanda histórica da região,
  "motivatedSeller": <true se detectar sinais de vendedor motivado, false caso contrário>,
  "aiAnalysis": "<análise detalhada em português, 3-4 parágrafos: qualidade do imóvel, potencial de valorização, riscos, comparação com mercado local e benchmarks CDI/SELIC/FIIs>",
  "aiSummary": "<resumo executivo em 2 frases diretas para o investidor>"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('IA não retornou JSON válido');

  return JSON.parse(jsonMatch[0]) as PropertyAnalysis;
}

export async function chatWithAgent(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: string
): Promise<string> {
  const systemWithContext = context
    ? `${SYSTEM_PROMPT}\n\nContexto atual do sistema:\n${context}`
    : SYSTEM_PROMPT;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemWithContext,
    messages,
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function generateLOI(property: {
  address: string;
  price: number;
  offerPrice: number;
  buyerName: string;
  buyerCpf?: string;
}): Promise<string> {
  const discount = ((1 - property.offerPrice / property.price) * 100).toFixed(1);
  const prompt = `Gere uma Proposta de Compra (Carta de Intenção) profissional em português para o imóvel:

- Endereço: ${property.address}
- Preço pedido: R$${property.price.toLocaleString('pt-BR')}
- Valor da oferta: R$${property.offerPrice.toLocaleString('pt-BR')} (desconto de ${discount}%)
- Comprador: ${property.buyerName}${property.buyerCpf ? ` — CPF: ${property.buyerCpf}` : ''}
- Data: ${new Date().toLocaleDateString('pt-BR')}

A proposta deve ser formal, com:
1. Identificação das partes
2. Descrição do imóvel
3. Valor e forma de pagamento proposta
4. Prazo de validade da proposta (7 dias)
5. Condições (sujeito a vistoria técnica e análise de documentação)
6. Cláusula de confidencialidade
7. Assinatura`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function generateInvestorReply(
  investorEmail: string,
  property: { address: string; price: number; grossYield: number; netYield: number; cashflow: number }
): Promise<{ subject: string; body: string }> {
  const prompt = `Crie um email de resposta profissional para um investidor interessado em imóvel no Brasil:

Imóvel: ${property.address}
Preço: R$${property.price.toLocaleString('pt-BR')}
Yield Bruto: ${property.grossYield.toFixed(2)}% a.a.
Yield Líquido: ${property.netYield.toFixed(2)}% a.a.
Cashflow: R$${property.cashflow.toFixed(0)}/mês

Email do investidor recebido: "${investorEmail}"

O email deve ser cordial, profissional e em português do Brasil.
Retorne JSON com: { "subject": "assunto do email", "body": "corpo completo do email em HTML" }`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { subject: 'Análise do Imóvel', body: text };
  return JSON.parse(jsonMatch[0]);
}

export async function generateWeeklyReport(data: {
  totalProperties: number;
  strongDeals: number;
  marginalDeals: number;
  avoidDeals: number;
  priceReduced: number;
  topDeals: Array<{ address: string; grossYield: number; cashflow: number }>;
  areaBreakdown: Record<string, number>;
}): Promise<string> {
  logger.info('Gerando relatório semanal com IA');
  const prompt = `Gere um relatório semanal executivo em português do Brasil para investidores no mercado imobiliário nacional.

Dados desta semana:
- Total de imóveis analisados: ${data.totalProperties}
- Negócios Fortes (yield ≥ 0,6%/mês): ${data.strongDeals}
- Marginais: ${data.marginalDeals}
- Evitar: ${data.avoidDeals}
- Imóveis com preço reduzido (oportunidades): ${data.priceReduced}

Top oportunidades da semana:
${data.topDeals.map((d, i) => `${i + 1}. ${d.address} — Yield: ${d.grossYield.toFixed(2)}% a.a. — Cashflow: R$${d.cashflow.toFixed(0)}/mês`).join('\n')}

Distribuição por cidade: ${JSON.stringify(data.areaBreakdown)}

O relatório deve incluir: resumo executivo, análise do mercado nacional atual, destaques da semana, comparativo com benchmarks (SELIC, CDI, FII), e recomendações estratégicas.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
