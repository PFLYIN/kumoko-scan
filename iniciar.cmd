@echo off
rem Sobe o Kumoko Scan e abre o site no navegador. Basta dar dois cliques.
cd /d "%~dp0"
docker info >nul 2>&1
if errorlevel 1 (
  echo Abra o Docker Desktop, espere ele iniciar e rode este arquivo de novo.
  pause
  exit /b 1
)
if not exist .env (
  echo Criando .env a partir do .env.example...
  copy .env.example .env >nul
)
docker compose up -d --build --wait
if errorlevel 1 (
  echo.
  echo Algum container nao subiu. Veja o motivo com: docker compose logs
  pause
  exit /b 1
)
start "" https://localhost:8443
