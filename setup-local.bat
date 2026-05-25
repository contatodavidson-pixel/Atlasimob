@echo off
chcp 65001 >nul
echo.
echo ============================================
echo  RealEstate AI - Setup Local (Windows)
echo ============================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Instale em: https://nodejs.org  (versao 20 LTS)
    echo Apos instalar, feche e reabra este terminal e rode novamente.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node --version

:: Verificar se .env existe
if not exist ".env" (
    echo.
    echo [AVISO] Arquivo .env nao encontrado. Copiando do exemplo...
    copy .env.example .env
    echo.
    echo IMPORTANTE: Edite o arquivo .env com suas chaves antes de continuar!
    echo Abrir .env agora? (S/N)
    set /p OPEN_ENV=
    if /i "%OPEN_ENV%"=="S" notepad .env
    echo.
    echo Pressione qualquer tecla apos preencher o .env...
    pause >nul
)

:: Instalar dependencias do backend
echo.
echo [1/4] Instalando dependencias do backend...
cd backend
call npm install
if %errorlevel% neq 0 (echo [ERRO] Falha ao instalar backend & pause & exit /b 1)

:: Gerar Prisma client
echo.
echo [2/4] Configurando banco de dados...
call npx prisma generate
if %errorlevel% neq 0 (echo [ERRO] Falha no Prisma generate & pause & exit /b 1)

:: Instalar dependencias do frontend
echo.
echo [3/4] Instalando dependencias do frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (echo [ERRO] Falha ao instalar frontend & pause & exit /b 1)

cd ..

echo.
echo ============================================
echo  Setup concluido!
echo ============================================
echo.
echo Para rodar o sistema, use um dos comandos:
echo.
echo   Backend:   cd backend ^&^& npm run dev
echo   Frontend:  cd frontend ^&^& npm run dev
echo.
echo Ou use o arquivo: start-dev.bat
echo.
pause
