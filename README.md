# 🏠 RealEstate AI — Sistema de Investimento Imobiliário com IA

> Plataforma completa para investidores brasileiros no mercado imobiliário do Reino Unido, com análise automática por IA, alertas inteligentes e gestão de investidores.

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 🔍 **DealFlow** | Scraping automático do Rightmove e OnTheMarket com análise IA |
| 🤖 **Agente IA** | Chatbot no Telegram e web (Claude claude-sonnet-4-6) |
| 💰 **Análise Financeira** | Yield bruto/líquido, cashflow, ROI calculados automaticamente |
| 🏷️ **Tags Automáticas** | NEGÓCIO FORTE / MARGINAL / EVITAR |
| 👥 **CRM Investidores** | Pipeline, matching automático e auto-resposta por email |
| 🔔 **Alertas** | Telegram + email às 8h (novos) e 12h (preço reduzido) |
| 📊 **Relatórios** | Semanal automatizado toda segunda-feira |
| 🚀 **Deploy 24/7** | Docker Compose no Hetzner VPS |

## Stack Tecnológica

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript + Prisma
- **Banco:** PostgreSQL
- **IA:** Claude API (Anthropic) — `claude-sonnet-4-6`
- **Scraping:** Apify
- **Email:** Resend
- **WhatsApp:** Evolution API
- **Telegram:** Telegraf.js
- **Automação:** n8n
- **Deploy:** Docker Compose + Hetzner VPS + Nginx

## Início Rápido

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd realestate-ai

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves de API

# 3. Iniciar em desenvolvimento
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev

# 4. Deploy em produção
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```

## Estrutura do Projeto

```
├── frontend/               # Next.js 14
│   └── src/
│       ├── app/           # Pages (App Router)
│       │   ├── page.tsx       # Landing page
│       │   ├── login/         # Autenticação
│       │   ├── register/      # Cadastro
│       │   └── dashboard/     # Painel (DealFlow, Agent, Investors...)
│       ├── components/    # Componentes React
│       └── lib/           # API client, stores, utils
│
├── backend/                # Node.js + Express
│   ├── src/
│   │   ├── routes/        # Endpoints da API
│   │   ├── services/      # Claude AI, Apify, Email, Telegram, Scheduler
│   │   └── lib/           # Prisma, Logger
│   └── prisma/            # Schema do banco de dados
│
├── n8n-workflows/          # Automações n8n
├── nginx/                  # Configuração do proxy reverso
├── docs/                   # Manual e guia de deploy
└── docker-compose.yml      # Orquestração completa
```

## Documentação

- [📖 Manual do Sistema](docs/MANUAL.md)
- [🚀 Guia de Deploy](docs/DEPLOY.md)

## Classificação de Negócios

| Tag | Critério | Exemplo |
|-----|----------|---------|
| 🟢 NEGÓCIO FORTE | Yield líquido ≥ 7% + cashflow ≥ £200/mês | Terraced house em Manchester: 8.2%, £380/mês |
| 🟡 MARGINAL | Yield 5-7% ou cashflow £0-200/mês | Flat em Birmingham: 6.1%, £120/mês |
| 🔴 EVITAR | Yield < 5% ou cashflow negativo | Apartamento em Londres: 3.8%, -£200/mês |

## Variáveis de Ambiente Necessárias

```env
ANTHROPIC_API_KEY=      # Claude AI
APIFY_API_KEY=          # Scraping
RESEND_API_KEY=         # Email
TELEGRAM_BOT_TOKEN=     # Bot Telegram
EVOLUTION_API_KEY=      # WhatsApp
DB_PASSWORD=            # PostgreSQL
JWT_SECRET=             # Autenticação
```

---

*Desenvolvido para investidores brasileiros no mercado UK* 🇧🇷 🏴󠁧󠁢󠁥󠁮󠁧󠁿
