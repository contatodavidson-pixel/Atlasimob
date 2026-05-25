# Guia de Deploy — Hetzner VPS

## 1. Provisionar Servidor

Recomendado: **Hetzner CX31** (4 vCPU, 8GB RAM, 80GB SSD) — ~€12/mês

```bash
# Após criar o servidor, conecte via SSH
ssh root@IP_DO_SERVIDOR

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y

# Adicionar usuário ao grupo docker
usermod -aG docker $USER
```

## 2. Clonar o projeto

```bash
git clone https://github.com/seu-usuario/realestate-ai.git
cd realestate-ai

# Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Preencha todas as variáveis
```

## 3. Configurar DNS

No seu provedor de DNS, crie os seguintes registros A:
- `seudominio.com` → IP_DO_SERVIDOR
- `n8n.seudominio.com` → IP_DO_SERVIDOR

Aguarde propagação (5-30 minutos).

## 4. Obter certificados SSL

```bash
apt install certbot -y

# Pare o nginx se estiver rodando
docker-compose stop nginx

# Obter certificados
certbot certonly --standalone \
  -d seudominio.com \
  -d www.seudominio.com \
  -d n8n.seudominio.com \
  --email seu@email.com \
  --agree-tos

# Copiar certificados
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/seudominio.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/seudominio.com/privkey.pem nginx/ssl/
```

## 5. Configurar nginx.conf

Edite `nginx/nginx.conf` e substitua `seudominio.com` pelo seu domínio real.

## 6. Deploy

```bash
# Build e iniciar todos os serviços
docker-compose up -d --build

# Aguardar banco inicializar (~30s)
sleep 30

# Executar migrations
docker-compose exec backend npx prisma migrate deploy

# Verificar se tudo está rodando
docker-compose ps
```

## 7. Criar usuário admin

```bash
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@seudominio.com',
      password: await bcrypt.hash('SuaSenhaSegura123!', 12),
      role: 'ADMIN'
    }
  });
  console.log('Admin criado:', user.email);
  await prisma.\$disconnect();
}
main();
"
```

## 8. Configurar renovação automática do SSL

```bash
crontab -e
# Adicionar linha:
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/seudominio.com/*.pem /root/realestate-ai/nginx/ssl/ && docker-compose -f /root/realestate-ai/docker-compose.yml restart nginx
```

## 9. Configurar Telegram Bot

1. Abra o Telegram e fale com @BotFather
2. Envie `/newbot`
3. Escolha um nome: `RealEstate AI`
4. Escolha um username: `realestateai_seu_bot`
5. Copie o token e adicione ao `.env` como `TELEGRAM_BOT_TOKEN`
6. Reinicie o backend: `docker-compose restart backend`

## 10. Verificar funcionamento

```bash
# Health check da API
curl https://seudominio.com/api/health

# Logs em tempo real
docker-compose logs -f --tail=50

# Status dos containers
docker-compose ps
```

## Monitoramento

```bash
# Ver uso de recursos
docker stats --no-stream

# Espaço em disco
df -h

# Logs de erro
docker-compose logs backend | grep ERROR
```

## Firewall (UFW)

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```
