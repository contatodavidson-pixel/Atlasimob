# Guia Completo de Configuração do .env

## Para rodar LOCAL (desenvolvimento, sem servidor)

Preencha o arquivo `.env` com estes valores mínimos:

```env
# Banco de dados local
DB_USER=admin
DB_PASSWORD=MinhaS3nhaLocal!

# JWT — gere uma string aleatória longa (ex: rode no terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=cole_aqui_a_string_gerada

# Claude AI — OBRIGATÓRIO para a IA funcionar
# Obter em: https://console.anthropic.com → API Keys → Create Key
ANTHROPIC_API_KEY=sk-ant-SUA_CHAVE_AQUI

# URLs locais
API_URL=http://localhost:3001
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Estas podem ficar em branco para rodar local (funcionalidades desabilitadas):
APIFY_API_KEY=
RESEND_API_KEY=
FROM_EMAIL=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
N8N_USER=admin
N8N_PASSWORD=admin
N8N_HOST=localhost
N8N_WEBHOOK_URL=http://localhost:5678/
```

---

## Onde obter cada chave

### ANTHROPIC_API_KEY (obrigatório)
1. Acesse https://console.anthropic.com
2. Faça login ou crie conta
3. Menu esquerdo: **API Keys** → **Create Key**
4. Copie a chave (começa com `sk-ant-`)
5. Adicione créditos em **Billing** (mínimo $5)

### APIFY_API_KEY (para scraping ZAP/VivaReal)
1. Acesse https://apify.com → criar conta grátis
2. Menu: **Settings** → **Integrations** → **API tokens**
3. Copie o token pessoal
4. **Atores necessários** (ative no marketplace):
   - `compass/zap-imoveis-scraper`
   - `compass/vivareal-scraper`
   - `compass/olx-imoveis-scraper`

### RESEND_API_KEY (para envio de emails)
1. Acesse https://resend.com → criar conta grátis
2. **API Keys** → **Create API Key**
3. Em **Domains**, adicione e verifique seu domínio (para produção)
4. Para testar, use o domínio `resend.dev` deles

### TELEGRAM_BOT_TOKEN (para o agente no Telegram)
1. Abra o Telegram → procure **@BotFather**
2. Envie `/newbot`
3. Nome do bot: `RealEstate AI`
4. Username: `realestateai_seu_nome_bot`
5. Copie o token fornecido (ex: `123456789:AAF_abc...`)
6. Para obter o CHAT_ID: fale `/start` com o bot, depois acesse:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`

---

## Para PRODUÇÃO (Hetzner VPS)

```env
# Banco de dados (será criado pelo Docker)
DB_USER=admin
DB_PASSWORD=SuaSenhaSegura2025!

# JWT — use string de 64+ caracteres aleatórios
JWT_SECRET=a1b2c3d4e5f6...

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# Apify
APIFY_API_KEY=apify_api_...

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@seudominio.com.br

# WhatsApp
EVOLUTION_API_URL=https://whatsapp.seudominio.com.br
EVOLUTION_API_KEY=chave_aleatoria_segura

# Telegram
TELEGRAM_BOT_TOKEN=123456789:AAF...
TELEGRAM_CHAT_ID=seu_chat_id

# URLs de produção
API_URL=https://api.seudominio.com.br
APP_URL=https://seudominio.com.br
FRONTEND_URL=https://seudominio.com.br

# n8n
N8N_USER=admin
N8N_PASSWORD=SenhaN8n2025!
N8N_HOST=n8n.seudominio.com.br
N8N_WEBHOOK_URL=https://n8n.seudominio.com.br/
```
