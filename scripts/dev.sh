#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

# 可通过环境变量覆盖
MYSQL_PASSWORD="${MYSQL_PASSWORD:-huliwei1}"
API_BACKEND_URL="${API_BACKEND_URL:-http://localhost:8081}"
PORT="${PORT:-8081}"
SESSION_SECRET="${SESSION_SECRET:-dev-secret}"
SESSION_COOKIE="${SESSION_COOKIE:-agent_fiverr_session}"
DATABASE_URL="${DATABASE_URL:-root:${MYSQL_PASSWORD}@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "\n[dev.sh] stopping backend (pid=$BACKEND_PID)..."
    kill "$BACKEND_PID" || true
  fi
}
trap cleanup EXIT INT TERM

echo "[dev.sh] starting mysql service..."
brew services start mysql >/dev/null || true

echo "[dev.sh] ensuring database exists..."
mysql -u root "-p${MYSQL_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS agent_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "[dev.sh] backend go mod tidy..."
(
  cd "$BACKEND_DIR"
  go mod tidy >/dev/null
)

echo "[dev.sh] seeding backend data..."
(
  cd "$BACKEND_DIR"
  DATABASE_URL="$DATABASE_URL" go run ./scripts/seed.go >/dev/null
)

echo "[dev.sh] starting backend on :$PORT ..."
(
  cd "$BACKEND_DIR"
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$SESSION_SECRET" \
  SESSION_COOKIE="$SESSION_COOKIE" \
  PORT="$PORT" \
  go run .
) &
BACKEND_PID=$!

sleep 1
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo "[dev.sh] backend failed to start"
  exit 1
fi

echo "[dev.sh] starting frontend (API_BACKEND_URL=$API_BACKEND_URL)..."
cd "$ROOT_DIR"
API_BACKEND_URL="$API_BACKEND_URL" npm run dev
