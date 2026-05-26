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

IMPORTANTE: O cashflow calculado é o CASHFLOW OPERACIONAL (sem considerar parcelas de financiamento).
Ele representa o resultado mensal para um investidor que compra à vista ou usa pouco apalancamento.
O mortgagePayment é fornecido separadamente como referência para investidores que financiam.

Regras de classificação para o mercado brasileiro (baseadas em yield bruto e cashflow operacional):
- EXCELENTE OPORTUNIDADE (STRONG_DEAL): Yield bruto ≥ 0,55% ao mês (6,6% a.a.) E cashflow operacional ≥ R$800/mês. Supera CDI com risco patrimonial.
- OPORTUNIDADE MODERADA (MARGINAL): Yield bruto entre 0,40%-0,55% ao mês E cashflow operacional entre R$200-800/mês. Potencial com negociação.
- NÃO RECOMENDADO (AVOID): Yield bruto < 0,40% ao mês OU cashflow operacional < R$200/mês. Não supera renda fixa de forma segura.

Score de 0 a 10:
- 8,5-10: Excepcional (yield ≥ 0,7%/mês, localização prime, potencial de valorização alto)
- 7,0-8,4: Excelente (yield 0,6-0,7%/mês, boa localização, baixo risco)
- 5,0-6,9: Moderado (yield 0,45-0,6%/mês, potencial com negociação)
- 3,0-4,9: Fraco (yield 0,35-0,45%/mês, apenas preservação de capital)
- 0,0-2,9: Evitar (yield < 0,35%/mês ou riscos elevados)

Identificação de vendedor motivado — marque motivatedSeller: true quando encontrar na descrição:
- Palavras de urgência: "urgente", "preciso vender", "aceito proposta", "oportunidade", "abaixo do mercado", "precisa de reforma", "permuto"
- Sinais financeiros: preço significativamente abaixo da média da região, imóvel com mais de 90 dias no mercado (mencionado)
- Situações especiais: inventário, divórcio, mudança, dívida, leilão

Premissas padrão para cálculos no mercado brasileiro (use estas se não houver dados específicos):
- Aluguel estimado: 0,45% a 0,65% do valor do imóvel/mês (varia por cidade e tipo)
- Taxa de administração imobiliária: 8% do aluguel bruto
- IPTU: informado ou estimar R$80-400/mês conforme o valor do imóvel
- Condomínio: informado ou estimar R$300-700/mês para apartamentos (R$0 para casas sem condomínio)
- Manutenção/reparos: 0,5% do valor do imóvel/ano ÷ 12 (R$/mês)
- Seguro: 0,1% do valor do imóvel/ano ÷ 12 (R$/mês)
- Vacância: 1 mês/ano = desconto de 8,3% sobre aluguel anual
- cashflow = aluguel_bruto - (vacância) - administração - IPTU - condomínio - manutenção - seguro
  (NÃO inclui financiamento — este é o cashflow operacional para investidor com capital próprio)
- mortgagePayment: calcule para 80% LTV a 10,5% a.a. (SBPE), 30 anos — apenas informativo
- Custos de compra: ~5,5% (ITBI 2%, escritura e registro ~1,5%, despesas ~2%)
- Capital próprio para ROI = 20% do preço + 5,5% de custos de aquisição
- ROI = (cashflow_anual / capital_proprio) × 100

Cidades de referência (yield bruto médio por mês):
- São Paulo: 0,42-0,58% | Rio de Janeiro: 0,44-0,60% | Curitiba: 0,50-0,68%
- Florianópolis: 0,48-0,65% | Porto Alegre: 0,52-0,70% | Belo Horizonte: 0,48-0,65%
- Goiânia: 0,55-0,72% | Campinas: 0,50-0,67% | Fortaleza: 0,52-0,70%
- Recife: 0,50-0,68% | Salvador: 0,48-0,65% | Manaus: 0,55-0,72%`;

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

Forneça análise completa em JSON com este formato exato (todos os valores em R$, sem formatação de moeda nos números):
{
  "estimatedRent": <número R$/mês estimado>,
  "grossYield": <número, yield bruto ANUAL em percentual. Ex: 6.5 para 6,5% a.a.>,
  "managementFee": <número R$/mês = 8% do aluguel bruto>,
  "maintenanceCost": <número R$/mês = 0,5% do valor/ano ÷ 12>,
  "insuranceCost": <número R$/mês = 0,1% do valor/ano ÷ 12>,
  "mortgagePayment": <número R$/mês para 80% LTV a 10,5% a.a., 30 anos — apenas informativo>,
  "netYield": <número, yield líquido ANUAL em percentual = (cashflow × 12 / preço) × 100>,
  "cashflow": <número R$/mês = aluguel - vacância(8,3%) - administração - IPTU - condomínio - manutenção - seguro. NÃO inclui mortgagePayment>,
  "roi": <número, ROI anual % = (cashflow × 12) / (20% do preço + 5,5% custos) × 100>,
  "tag": "STRONG_DEAL" | "MARGINAL" | "AVOID",
  "score": <número de 0.0 a 10.0. Use a escala completa: propriedades com yield 0,55-0,65%/mês devem receber 6-7, yield 0,65-0,75%/mês → 7-8,5, acima 0,75%/mês → 8,5-10. Yield 0,45-0,55%/mês → 4-5,5. Yield < 0,4%/mês → 1-3>,
  "belowMarketPct": <número, percentual estimado que o preço está abaixo da média da região. Positivo = abaixo do mercado, negativo = acima. Ex: 10.5>,
  "liquidityIndex": "ALTA" | "MEDIA" | "BAIXA",
  "motivatedSeller": <true ou false>,
  "aiAnalysis": "<análise detalhada em português, 3-4 parágrafos: yield comparado ao mercado local, cashflow operacional vs CDI/SELIC, potencial de valorização, riscos e recomendação>",
  "aiSummary": "<resumo executivo em 2 frases diretas com os números-chave: yield, cashflow e recomendação>"
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
