@echo off
chcp 65001 >nul
echo.
echo ============================================
echo  RealEstate AI - Iniciando em modo Dev
echo ============================================
echo.
echo Abrindo backend e frontend em janelas separadas...
echo.

:: Backend na porta 3001
start "RealEstate AI - Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: Aguarda 5 segundos para o backend inicializar
timeout /t 5 /nobreak >nul

:: Frontend na porta 3000
start "RealEstate AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo Backend:  http://localhost:3001/health
echo Frontend: http://localhost:3000
echo.
echo Abrindo o navegador...
start http://localhost:3000

pause
