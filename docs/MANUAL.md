# Manual do Sistema de Investimento Imobiliário com IA

## Visão Geral

Sistema completo para investidores brasileiros no mercado imobiliário do Reino Unido. Automatiza desde a busca de imóveis até a comunicação com investidores, usando IA (Claude) para análise e classificação.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Proxy Reverso)                  │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │  Frontend   │        │   Backend   │
    │  Next.js    │        │  Node.js    │
    │  Port 3000  │        │  Port 3001  │
    └─────────────┘        └──────┬──────┘
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
        ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
        │ PostgreSQL  │  │   Claude AI  │  │    Apify     │
        │ (DB)        │  │  (Análise)   │  │  (Scraping)  │
        └─────────────┘  └─────────────┘  └─────────────┘
               │
        ┌──────▼──────┐  ┌─────────────┐  ┌─────────────┐
        │    n8n      │  │  Evolution  │  │   Resend    │
        │ (Automação) │  │ (WhatsApp)  │  │  (Email)    │
        └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Setup Inicial

### 1. Pré-requisitos
- Docker e Docker Compose instalados
- Domínio apontando para o servidor
- Contas criadas em: Anthropic, Apify, Resend, Telegram

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env  # Preencha todas as variáveis
```

Variáveis obrigatórias:
- `ANTHROPIC_API_KEY` — Chave da API do Claude
- `APIFY_API_KEY` — Chave para scraping
- `RESEND_API_KEY` — Chave para envio de email
- `TELEGRAM_BOT_TOKEN` — Token do bot do Telegram
- `DB_PASSWORD` — Senha segura para o banco
- `JWT_SECRET` — String aleatória longa para JWT

### 3. Deploy

```bash
# Primeira vez
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Rodar migrations do banco
docker-compose exec backend npx prisma migrate deploy
```

### 4. Configurar SSL (Let's Encrypt)

```bash
apt install certbot
certbot certonly --standalone -d seudominio.com -d n8n.seudominio.com
```

Copie os certificados para `./nginx/ssl/`

---

## Módulos do Sistema

### 1. DealFlow (CRM de Negócios)

**Como funciona:**
1. Clique em "Buscar Novos" no painel de DealFlow
2. O sistema inicia scraping no Rightmove e OnTheMarket
3. Os imóveis são importados e ficam com status "Aguardando análise"
4. Clique em "Analisar Pendentes" para acionar a IA
5. Cada imóvel recebe uma classificação automática

**Tags automáticas:**
- `NEGÓCIO FORTE` — Yield líquido ≥ 7% e cashflow ≥ £200/mês
- `MARGINAL` — Yield entre 5-7% ou cashflow baixo
- `EVITAR` — Yield < 5% ou cashflow negativo

**Filtros disponíveis:**
- Área geográfica
- Faixa de preço
- Número mínimo de quartos
- Tag de classificação
- Preço reduzido (motivados)

### 2. Agente de IA

O agente usa Claude (claude-sonnet-4-6) e está disponível:
- No painel web (aba "Agente IA")
- No Telegram (após configurar o Chat ID)

**Comandos do Telegram:**
- `/start` — Inicia o agente
- `/menu` — Lista todos os comandos
- `/reducoes` — Imóveis com preço reduzido hoje
- `/top5` — Melhores 5 negócios da semana
- `/limpar` — Limpa histórico da conversa

**Capacidades:**
- Análise de qualquer imóvel (link ou descrição)
- Cálculo de métricas financeiras
- Geração de Carta de Intenção (LOI)
- Busca de vendedores motivados
- Estratégias de negociação

### 3. Gestão de Investidores

**Pipeline de status:**
- Lead → Prospect → Ativo → Investido / Inativo

**Auto-resposta por IA:**
1. Abra o perfil do investidor
2. Clique em "Auto-Responder por IA"
3. Cole o email recebido do investidor
4. O sistema gera e envia a resposta automaticamente em menos de 5 minutos

**Matching automático:**
- Clique em "Fazer Matching Automático" 
- A IA correlaciona imóveis com o perfil de cada investidor (budget, áreas, yield mínimo)
- Os matches são visíveis no perfil do investidor

### 4. Alertas Automáticos

O sistema envia automaticamente:

| Horário | Conteúdo | Canal |
|---------|----------|-------|
| 8h (todo dia) | Novos imóveis analisados | Email + Telegram |
| 12h (todo dia) | Imóveis com preço reduzido | Telegram |
| Segunda 8h | Relatório semanal completo | Email |

Para receber os alertas, configure seu Telegram ID nas configurações.

### 5. Relatórios

- **Dashboard** — Métricas em tempo real com gráficos
- **Relatório Semanal** — Gerado automaticamente toda segunda-feira com análise de IA

---

## Cálculos Financeiros

O sistema usa estas premissas padrão:
- Taxa de administração: 12% do aluguel bruto
- Manutenção: 1% do valor do imóvel/ano
- Seguro: £1.200/ano
- Vazio: 1 mês/ano (8,3%)
- Financiamento: 75% LTV, 5.5% a.a., 25 anos

**Fórmulas:**
```
Yield Bruto = (Aluguel Anual / Preço) × 100

Yield Líquido = ((Aluguel Anual - Custos Anuais) / Preço) × 100

Cashflow Mensal = Aluguel - Administração - Manutenção - Seguro - Hipoteca

ROI = (Cashflow Anual / Capital Próprio) × 100
Capital Próprio = 25% do preço + custos de compra (5%)
```

---

## Manutenção

### Monitoramento
```bash
# Status de todos os serviços
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Uso de recursos
docker stats
```

### Backup do banco de dados
```bash
docker-compose exec postgres pg_dump -U admin realestate_ai > backup_$(date +%Y%m%d).sql
```

### Atualizar o sistema
```bash
git pull
docker-compose build
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

### Reinicialização automática
Todos os containers têm `restart: always`, garantindo reinicialização automática após falhas ou reinício do servidor.

---

## Troubleshooting

**Scraping não retorna imóveis:**
- Verifique a chave Apify em `.env`
- Confirme que os atores do Apify estão com créditos disponíveis
- Teste manualmente em: https://console.apify.com

**Telegram não responde:**
- Verifique se o `TELEGRAM_BOT_TOKEN` está correto
- Confirme que o bot foi criado no BotFather
- Veja os logs: `docker-compose logs -f backend | grep Telegram`

**Emails não sendo enviados:**
- Verifique a chave Resend em `.env`
- Confirme que o domínio está verificado no Resend
- Teste: `docker-compose exec backend node -e "require('./dist/services/email').sendEmail({to:'test@test.com',subject:'Teste',html:'Olá'})"`

**Banco de dados com problemas:**
```bash
# Recriar o banco (CUIDADO: apaga dados)
docker-compose exec backend npx prisma db push --force-reset

# Verificar conexão
docker-compose exec postgres psql -U admin -d realestate_ai -c "SELECT NOW();"
```

---

## Integrações Externas

| Serviço | Propósito | Documentação |
|---------|-----------|--------------|
| Anthropic Claude | Análise de imóveis e agente | https://docs.anthropic.com |
| Apify | Scraping Rightmove/OnTheMarket | https://docs.apify.com |
| Resend | Envio de emails | https://resend.com/docs |
| Evolution API | WhatsApp | https://doc.evolution-api.com |
| Telegram BotFather | Bot do Telegram | https://core.telegram.org/bots |
| n8n | Orquestração de automações | https://docs.n8n.io |

---

*Sistema desenvolvido para investidores brasileiros no mercado imobiliário do Reino Unido.*
