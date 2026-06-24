#!/bin/sh
# 部署清晰版「凌晨四点半」封面到生产（更新 public 静态资源并重建 frontend）。
#
# 在生产服务器 ~/regr 目录下运行：
#   sh scripts/life-agent/deploy-nightowl-cover-production.sh
#
# 完成后 Timelord / 凌晨四点半 等可改回自托管路径：
#   /life-agent-cover-presets/nightowl-cat.png

set -eu

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "missing $COMPOSE_FILE" >&2
  exit 1
fi

echo "==> git pull"
git pull

PRESET="$ROOT/public/life-agent-cover-presets/nightowl-cat.png"
if [ ! -f "$PRESET" ]; then
  echo "missing $PRESET — 请先 push 含清晰封面的代码" >&2
  exit 1
fi

echo "==> rebuild frontend ($COMPOSE_FILE)"
docker compose -f "$COMPOSE_FILE" up -d --build frontend

echo ""
echo "OK. 静态封面已更新：/life-agent-cover-presets/nightowl-cat.png"
echo "可选：将 DB 封面 URL 改回自托管路径（backend 目录）："
echo '  go run ./cmd/set-user-cover-from-file -cover-url "/life-agent-cover-presets/nightowl-cat.png" -target-email tmxiand@gmail.com -also-agent "凌晨四点半" -apply'
