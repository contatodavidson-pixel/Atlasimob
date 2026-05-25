# Atlas — Guia de Deploy em Produção

## Stack de produção

| Camada | Serviço | Custo estimado |
|--------|---------|----------------|
| Frontend | Vercel (Hobby) | Grátis |
| Backend | Railway | ~$5/mês |
| Banco | Neon Postgres (Free tier) | Grátis até 0.5GB |
| Domínio | Registro.br | ~R$40/ano |

**Total inicial: ~R$30–50/mês**

---

## 1. Banco de dados — Neon (Postgres)

1. Acesse [neon.tech](https://neon.tech) e faça login na sua conta
2. Crie um projeto chamado **`atlas-prod`** → Region: **US East (Ohio)** (menor latência para Railway)
3. No painel do projeto, clique em **Connection Details**
4. Selecione **Node.js** e copie a connection string completa:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Guarde essa string — você vai usá-la em breve

### Aplicar a migration inicial no Neon

No painel Neon, vá em **SQL Editor** e cole o conteúdo completo de:
`backend/prisma/migrations/0001_initial/migration.sql`

Execute. O banco estará pronto.

---

## 2. Backend — Railway

1. Acesse [railway.app](https://railway.app) e conecte seu GitHub
2. Clique **New Project → Deploy from GitHub repo**
3. Selecione o repositório do Atlas
4. Na tela de configuração, defina **Root Directory:** `backend`
5. Adicione as variáveis de ambiente (Settings → Variables):

```env
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=gere_aqui_um_segredo_forte_com_32_chars_minimo
ANTHROPIC_API_KEY=sk-ant-...

APIFY_API_KEY=
RESEND_API_KEY=
FROM_EMAIL=noreply@atlasimob.app.br

EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=realestate

NODE_ENV=production
PORT=3001
FRONTEND_URL=https://atlasimob.app.br
API_URL=https://api.atlasimob.app.br
```

6. O Railway detecta `railway.toml` automaticamente e inicia o deploy
7. Após o deploy, anote a URL gerada: `https://atlas-api.up.railway.app`

### Gerar JWT_SECRET seguro
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 3. Frontend — Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte seu GitHub
2. Clique **Add New → Project** e importe o repositório do Atlas
3. Em **Configure Project:**
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
   - **Node.js Version:** 20.x
4. Adicione as variáveis de ambiente:

```env
NEXT_PUBLIC_API_URL=https://api.atlasimob.app.br
NEXT_PUBLIC_APP_URL=https://atlasimob.app.br
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

5. Clique **Deploy**

> Antes de ter o domínio próprio, use a URL temporária do Vercel (`atlas-xxx.vercel.app`) e coloque no `NEXT_PUBLIC_API_URL` a URL do Railway.

---

## 4. Domínio — atlasimob.app.br

### Frontend (Vercel)
1. No Vercel: **Project → Settings → Domains → Add**
2. Digite `atlasimob.app.br` e clique **Add**
3. O Vercel mostrará dois registros DNS para configurar

### Backend (Railway)
1. No Railway: **Service → Settings → Domains → Custom Domain**
2. Digite `api.atlasimob.app.br` e clique **Add**
3. O Railway mostrará um registro CNAME

### Configurar DNS no Registro.br
1. Acesse [registro.br](https://registro.br) → Entre na sua conta → Gerencie `atlasimob.app.br`
2. Vá em **DNS** → **Editar Zona DNS**
3. Adicione os registros conforme Vercel e Railway instruírem. Exemplo típico:

```
Tipo    Nome                    Valor
A       @                       76.76.21.21    (Vercel)
CNAME   www                     cname.vercel-dns.com
CNAME   api                     xxx.railway.app
```

4. Salve e aguarde propagação (5–60 minutos)
5. O SSL é provisionado automaticamente pelo Vercel/Railway (Let's Encrypt)

---

## 5. Analytics

### Google Analytics 4
1. Acesse [analytics.google.com](https://analytics.google.com)
2. Crie uma propriedade chamada `Atlas - Inteligência Imobiliária`
3. Plataforma: **Web** → URL: `https://atlasimob.app.br`
4. Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)
5. No Vercel: adicione `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`

### PostHog
1. Acesse [posthog.com](https://posthog.com) (gratuito até 1M eventos/mês)
2. Crie organização `Atlas`
3. Crie projeto `Atlas Production`
4. Copie **Project API Key** (formato: `phc_...`)
5. No Vercel: adicione `NEXT_PUBLIC_POSTHOG_KEY=phc_...`

---

## 6. Primeiro usuário admin

Após o deploy estar online, crie o primeiro usuário:

```bash
curl -X POST https://api.atlasimob.app.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin Atlas","email":"seu@email.com","password":"senha_forte_aqui"}'
```

Depois, no **SQL Editor do Neon**, promova a conta para admin:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'seu@email.com';
```

---

## 7. Checklist pré-lançamento

### Infraestrutura
- [ ] Neon: banco criado, migration aplicada (`0001_initial.sql`)
- [ ] Railway: backend deployado, health check em `/health` retornando 200
- [ ] Vercel: frontend deployado, build sem erros
- [ ] Domínio `atlasimob.app.br` → Vercel (SSL ativo)
- [ ] Subdomínio `api.atlasimob.app.br` → Railway (SSL ativo)

### Variáveis de ambiente
- [ ] `DATABASE_PROVIDER=postgresql` no Railway
- [ ] `DATABASE_URL` com connection string do Neon no Railway
- [ ] `JWT_SECRET` forte (48+ chars) no Railway
- [ ] `ANTHROPIC_API_KEY` no Railway
- [ ] `NEXT_PUBLIC_API_URL` apontando para Railway no Vercel
- [ ] `NEXT_PUBLIC_GA_ID` no Vercel
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` no Vercel

### Funcionalidades
- [ ] Login funcionando em produção
- [ ] Deal do Dia acessível sem login
- [ ] Waitlist salvando cadastros no Neon
- [ ] Open Graph do Deal do Dia correto (teste: [opengraph.xyz](https://www.opengraph.xyz))
- [ ] Google Analytics recebendo eventos (GA4 Realtime View)
- [ ] PostHog capturando sessões
- [ ] Push notification testada no Chrome

---

## Comandos úteis

```bash
# Backend local
cd backend && npm run dev

# Frontend local
cd frontend && npm run dev

# Build frontend para produção
cd frontend && npm run build

# Aplicar migrations manualmente (se necessário)
cd backend && DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Ver logs Railway via CLI
npm install -g @railway/cli
railway login
railway logs

# Gerar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Sequência recomendada de execução

```
1. Neon: criar projeto + copiar connection string
2. Neon: rodar migration SQL no SQL Editor
3. Railway: criar projeto + configurar variáveis + deploy
4. Testar: https://xxx.up.railway.app/health → deve retornar {"status":"ok"}
5. Vercel: criar projeto + configurar variáveis + deploy
6. Testar: abrir a URL Vercel no browser → landing page deve carregar
7. Criar usuário admin via curl
8. DNS: apontar domínio para Vercel e Railway
9. Analytics: configurar GA4 e PostHog
10. Lançar 🚀
```
