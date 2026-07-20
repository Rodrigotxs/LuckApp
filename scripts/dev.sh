#!/usr/bin/env bash
# Sobe a stack inteira (Postgres + Redis + backend + frontend) e faz seed.
# Uso: bash scripts/dev.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🔎 Checando pré-requisitos..."
command -v node >/dev/null || { echo "❌ Node não encontrado"; exit 1; }
command -v docker >/dev/null || { echo "❌ Docker não encontrado"; exit 1; }

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "❌ Node 20+ obrigatório (você tem $(node -v))"
  exit 1
fi

echo "🐳 Subindo Postgres + Redis..."
docker compose up -d

echo "⏳ Aguardando Postgres ficar pronto..."
until docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
  sleep 1
done
echo "✅ Postgres pronto"

echo "📦 Backend: instalando deps + migrations + seed..."
cd "$ROOT/backend"
[ ! -d node_modules ] && npm install
npx prisma generate >/dev/null
npx prisma migrate deploy
npx prisma db seed || echo "⚠️ Seed falhou (talvez já rodado antes) — continuando"

echo "📦 Frontend: instalando deps..."
cd "$ROOT/frontend"
[ ! -d node_modules ] && npm install

echo ""
echo "🚀 Tudo pronto! Rode em dois terminais:"
echo ""
echo "  Terminal 1:  cd backend && npm run start:dev"
echo "  Terminal 2:  cd frontend && npm run dev"
echo ""
echo "Depois abra:  http://localhost:3000"
echo "Swagger:      http://localhost:3001/api/docs"
echo ""
echo "Login demo: demo@barbearialuck.com / 123456"
echo ""
echo "💡 Códigos OTP aparecem no LOG do backend (mock — não envia WhatsApp/email real)."
