#!/usr/bin/env bash
# deploy.sh — envia o código da VPS The Archive
# Uso: ./deploy.sh
# Pré-requisito: ter acesso SSH configurado para root@social.balbonilab.com

set -euo pipefail

SSH_TARGET="root@social.balbonilab.com"
REMOTE_DIR="/var/www/mayra-social"
GITHUB_REPO="https://github.com/mayrabalbonimbn-max/the-archive-by-balboni.git"
PM2_APP="mayra-social-api"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   The Archive — Deploy para produção     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Push para o GitHub antes de tudo ──────────────────────
echo "→ Enviando código para o GitHub..."
git push origin main
echo "  ✓ GitHub atualizado"
echo ""

# ── 2. Deploy na VPS via SSH ──────────────────────────────────
echo "→ Conectando na VPS ($SSH_TARGET)..."
echo ""

ssh -t "$SSH_TARGET" bash <<REMOTE
set -euo pipefail

cd "$REMOTE_DIR"

echo "→ Verificando repositório git..."
if [ ! -d ".git" ]; then
  echo "  Repositório não inicializado. Clonando do GitHub..."
  git clone "$GITHUB_REPO" .
else
  echo "  ✓ Repositório encontrado"
  echo "→ Atualizando código (git pull)..."
  git fetch origin
  git reset --hard origin/main
  echo "  ✓ Código atualizado"
fi

echo ""
echo "→ Instalando dependências do frontend..."
npm install --silent
echo "  ✓ npm install (raiz)"

echo ""
echo "→ Buildando o frontend..."
npm run build
echo "  ✓ Build gerado em dist/"

echo ""
echo "→ Instalando dependências do backend..."
cd backend
npm install --silent
cd ..
echo "  ✓ npm install (backend)"

echo ""
echo "→ Reiniciando o PM2..."
if pm2 list | grep -q "$PM2_APP"; then
  pm2 restart "$PM2_APP"
else
  echo "  App não encontrado no PM2. Iniciando pela primeira vez..."
  pm2 start ecosystem.config.cjs --env production
  pm2 save
fi

echo ""
echo "→ Verificando saúde da API..."
sleep 2
curl -sf http://localhost:4016/api/health && echo "  ✓ API respondendo" || echo "  ⚠ API não respondeu — verifique pm2 logs $PM2_APP"

echo ""
echo "══════════════════════════════════════════"
echo " ✓ Deploy concluído!"
echo "══════════════════════════════════════════"
REMOTE
