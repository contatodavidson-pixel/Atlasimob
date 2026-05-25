#!/bin/bash
# Script de deploy automático para Hetzner VPS
# Execute UMA VEZ no servidor após o primeiro SSH

set -e
echo ""
echo "=========================================="
echo " RealEstate AI - Deploy Automático Hetzner"
echo "=========================================="
echo ""

# ---- Variáveis — edite antes de rodar ----
DOMAIN="seudominio.com.br"
EMAIL="seu@email.com"
REPO_URL="https://github.com/seu-usuario/realestate-ai.git"
APP_DIR="/opt/realestate-ai"
# ------------------------------------------

# 1. Atualizar sistema
echo "[1/8] Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar Docker
echo "[2/8] Instalando Docker..."
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y
systemctl enable docker
systemctl start docker

# 3. Instalar Certbot para SSL
echo "[3/8] Instalando Certbot..."
apt install certbot -y

# 4. Instalar UFW e configurar firewall
echo "[4/8] Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 5. Clonar o repositório
echo "[5/8] Clonando repositório..."
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"

# 6. Criar .env de produção
echo "[6/8] Criando .env de produção..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "IMPORTANTE: Edite o arquivo .env antes de continuar!"
    echo "Execute: nano $APP_DIR/.env"
    echo ""
    echo "Pressione Enter após configurar o .env..."
    read
fi

# 7. Obter certificado SSL (para antes de subir nginx)
echo "[7/8] Obtendo certificado SSL..."
certbot certonly --standalone \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "n8n.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive || echo "Aviso: SSL falhou, verifique se o DNS está apontando para este servidor"

# Copiar certificados para o nginx
mkdir -p "$APP_DIR/nginx/ssl"
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$APP_DIR/nginx/ssl/"
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$APP_DIR/nginx/ssl/"
fi

# Atualizar nginx.conf com o domínio real
sed -i "s/seudominio.com/$DOMAIN/g" "$APP_DIR/nginx/nginx.conf"

# 8. Build e subir os containers
echo "[8/8] Iniciando containers Docker..."
cd "$APP_DIR"
docker compose up -d --build

# Aguardar banco inicializar
echo "Aguardando banco de dados inicializar (30s)..."
sleep 30

# Rodar migrations
docker compose exec -T backend npx prisma migrate deploy || \
docker compose exec -T backend npx prisma db push

# Criar usuário admin
echo ""
echo "Criando usuário admin..."
read -p "Email do admin: " ADMIN_EMAIL
read -s -p "Senha do admin: " ADMIN_PASS
echo ""

docker compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
bcrypt.hash('$ADMIN_PASS', 12).then(hash =>
  prisma.user.create({
    data: { name: 'Admin', email: '$ADMIN_EMAIL', password: hash, role: 'ADMIN' }
  })
).then(u => { console.log('Admin criado:', u.email); process.exit(0); })
.catch(e => { console.error(e); process.exit(1); });
"

# Configurar renovação automática do SSL
echo "Configurando renovação automática do SSL..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/*.pem $APP_DIR/nginx/ssl/ && docker compose -f $APP_DIR/docker-compose.yml restart nginx") | crontab -

echo ""
echo "=========================================="
echo " DEPLOY CONCLUÍDO!"
echo "=========================================="
echo ""
echo " Site:    https://$DOMAIN"
echo " n8n:     https://n8n.$DOMAIN"
echo " Health:  https://$DOMAIN/api/health"
echo ""
echo "Para ver logs: docker compose -f $APP_DIR/docker-compose.yml logs -f"
echo ""
