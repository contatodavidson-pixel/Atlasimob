@echo off
chcp 65001 >nul
echo.
echo ============================================
echo  Setup Dev com SQLite (sem PostgreSQL)
echo ============================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale em: https://nodejs.org
    pause & exit /b 1
)

:: Usar schema SQLite para dev
echo [1/5] Configurando schema SQLite para desenvolvimento...
copy /y backend\prisma\schema.dev.prisma backend\prisma\schema.prisma

:: Criar .env local para SQLite
echo [2/5] Criando .env para desenvolvimento local...
(
echo # Banco SQLite local (sem instalacao)
echo DATABASE_URL=file:./prisma/dev.db
echo.
echo # JWT - mude para producao
echo JWT_SECRET=dev-secret-local-apenas-para-desenvolvimento-2025
echo.
echo # Claude AI - adicione sua chave
echo ANTHROPIC_API_KEY=cole_sua_chave_anthropic_aqui
echo.
echo # URLs locais
echo API_URL=http://localhost:3001
echo APP_URL=http://localhost:3000
echo FRONTEND_URL=http://localhost:3000
echo.
echo # Deixar em branco para dev local
echo APIFY_API_KEY=
echo RESEND_API_KEY=
echo FROM_EMAIL=
echo EVOLUTION_API_URL=
echo EVOLUTION_API_KEY=
echo EVOLUTION_INSTANCE=realestate
echo N8N_USER=admin
echo N8N_PASSWORD=admin
echo N8N_HOST=localhost
echo N8N_WEBHOOK_URL=
) > backend\.env

:: Copiar para raiz tambem
copy backend\.env .env >nul

echo [3/5] Instalando dependencias do backend...
cd backend
call npm install
if %errorlevel% neq 0 (echo [ERRO] npm install backend falhou & cd .. & pause & exit /b 1)

echo [4/5] Criando banco de dados SQLite...
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (echo [ERRO] Prisma db push falhou & cd .. & pause & exit /b 1)

echo [5/5] Instalando dependencias do frontend (Next.js 15)...
cd ..\frontend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (echo [ERRO] npm install frontend falhou & cd .. & pause & exit /b 1)

cd ..

echo.
echo ============================================
echo  PRONTO! Agora adicione sua chave Anthropic
echo ============================================
echo.
echo Editando o .env do backend...
notepad backend\.env
echo.
echo Apos salvar o .env, rode: start-dev.bat
echo.
pause
