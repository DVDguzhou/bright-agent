#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

# 加载 .env（如果存在）
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

# 可通过环境变量覆盖
MYSQL_PASSWORD="${MYSQL_PASSWORD:-huliwei1}"
API_BACKEND_URL="${API_BACKEND_URL:-http://localhost:8080}"
PORT="${PORT:-8080}"
SESSION_SECRET="${SESSION_SECRET:-dev-secret}"
SESSION_COOKIE="${SESSION_COOKIE:-agent_fiverr_session}"
DATABASE_URL="${DATABASE_URL:-root:${MYSQL_PASSWORD}@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"
OPENAI_MODEL="${OPENAI_MODEL:-}"
OPENAI_BASE_URL="${OPENAI_BASE_URL:-}"

# ---------- 子命令：backend ----------
if [[ "${1:-}" == "backend" ]]; then
  echo "🔧 [Backend] starting on :$PORT ..."
  cd "$BACKEND_DIR"
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$SESSION_SECRET" \
  SESSION_COOKIE="$SESSION_COOKIE" \
  PORT="$PORT" \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  OPENAI_MODEL="$OPENAI_MODEL" \
  OPENAI_BASE_URL="$OPENAI_BASE_URL" \
  go run .
  exit 0
fi

# ---------- 子命令：frontend ----------
if [[ "${1:-}" == "frontend" ]]; then
  echo "🌐 [Frontend] starting (API_BACKEND_URL=$API_BACKEND_URL) ..."
  cd "$ROOT_DIR"
  API_BACKEND_URL="$API_BACKEND_URL" npm run dev
  exit 0
fi

# ---------- 主入口：初始化 + 打开两个终端 ----------
echo "[dev.sh] killing existing processes on :8080 and :3000..."
lsof -i :8080 -t 2>/dev/null | xargs kill 2>/dev/null || true
lsof -i :3000 -t 2>/dev/null | xargs kill 2>/dev/null || true
sleep 1

echo "[dev.sh] starting mysql service..."
brew services start mysql >/dev/null || true

echo "[dev.sh] ensuring database exists..."
mysql -u root "-p${MYSQL_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS agent_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

echo "[dev.sh] backend go mod tidy..."
(cd "$BACKEND_DIR" && go mod tidy >/dev/null)

echo "[dev.sh] seeding backend data..."
(cd "$BACKEND_DIR" && DATABASE_URL="$DATABASE_URL" go run ./scripts/seed.go >/dev/null)

echo "[dev.sh] opening two terminals..."

# 打开终端 Tab 1: Backend
osascript -e "
tell application \"Terminal\"
  activate
  set backendTab to do script \"cd '$ROOT_DIR' && bash scripts/dev.sh backend\"
  set custom title of backendTab to \"Backend :$PORT\"
end tell
"

# 等后端先启动
sleep 3

# 打开终端 Tab 2: Frontend
osascript -e "
tell application \"Terminal\"
  activate
  set frontendTab to do script \"cd '$ROOT_DIR' && bash scripts/dev.sh frontend\"
  set custom title of frontendTab to \"Frontend :3000\"
end tell
"

echo "[dev.sh] ✅ 两个终端已打开："
echo "  Terminal 1 → Backend  :$PORT"
echo "  Terminal 2 → Frontend :3000"
echo ""
echo "关闭：在各终端按 Ctrl+C"
