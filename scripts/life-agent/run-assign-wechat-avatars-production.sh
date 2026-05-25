#!/bin/sh
# 在生产服务器（~/regr）批量分配微信风格头像。
# 通过一次性 golang 容器执行，写入 backend 的 Docker volume（与线上一致）。
#
# 用法：
#   sh scripts/life-agent/run-assign-wechat-avatars-production.sh
#   sh scripts/life-agent/run-assign-wechat-avatars-production.sh --apply
#   LIMIT=10 sh scripts/life-agent/run-assign-wechat-avatars-production.sh --apply

set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
GO_IMAGE="${GO_BUILDER_IMAGE:-docker.m.daocloud.io/library/golang:1.22-alpine}"
VOLUME_NAME="${BACKEND_COVER_VOLUME:-regr_backend_cover_uploads}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "missing $COMPOSE_FILE" >&2
  exit 1
fi

# 确保 volume 存在（与 compose 项目名 regr 一致）
docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1 || docker volume create "$VOLUME_NAME" >/dev/null

ENV_FILE_ARGS=""
if [ -f .env ]; then
  ENV_FILE_ARGS="--env-file .env"
fi

docker run --rm \
  $ENV_FILE_ARGS \
  -e GOPROXY="${GOPROXY:-https://goproxy.cn,direct}" \
  -e GOSUMDB="${GOSUMDB:-sum.golang.google.cn}" \
  -e LIFE_AGENT_COVER_DIR=/covers \
  -e LIMIT="${LIMIT:-}" \
  -v "$ROOT/backend:/src" \
  -v "$VOLUME_NAME:/covers" \
  -w /src \
  "$GO_IMAGE" \
  sh -c "go run ./scripts/assign_wechat_avatars.go $*"

echo ""
echo "Restart backend to ensure cover cache is fresh:"
echo "  docker compose -f $COMPOSE_FILE restart backend"
