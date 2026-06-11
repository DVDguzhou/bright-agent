#!/bin/sh
# 把本地图片文件设为指定 Agent 的封面（生产 Docker 环境）。
#
# 在生产服务器 ~/regr 目录下运行：
#
#   sh scripts/life-agent/set-agent-cover-production.sh "凌晨四点半" ./weixin.jpg
#   sh scripts/life-agent/set-agent-cover-production.sh "凌晨四点半" ./weixin.jpg --apply

set -eu

AGENT_NAME="${1:-}"
IMG_PATH="${2:-}"
APPLY="${3:-}"

if [ -z "$AGENT_NAME" ] || [ -z "$IMG_PATH" ]; then
  echo "用法: $0 <显示名> <图片路径> [--apply]" >&2
  exit 1
fi

IMG_ABS="$(cd "$(dirname "$IMG_PATH")" && pwd)/$(basename "$IMG_PATH")"
# 保留原始扩展名，挂载到容器内 /tmp/input.<ext>
IMG_EXT="${IMG_PATH##*.}"
CONTAINER_IMG="/tmp/input.${IMG_EXT}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
GO_IMAGE="${GO_BUILDER_IMAGE:-docker.m.daocloud.io/library/golang:1.22-alpine}"
VOLUME_NAME="${BACKEND_COVER_VOLUME:-regr_backend_cover_uploads}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "missing $COMPOSE_FILE" >&2
  exit 1
fi

docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1 || docker volume create "$VOLUME_NAME" >/dev/null

ENV_FILE_ARGS=""
if [ -f .env ]; then
  ENV_FILE_ARGS="--env-file .env"
fi

APPLY_FLAG=""
if [ "$APPLY" = "--apply" ]; then
  APPLY_FLAG="-apply"
fi

docker run --rm \
  $ENV_FILE_ARGS \
  -e GOPROXY="${GOPROXY:-https://goproxy.cn,direct}" \
  -e GOSUMDB="${GOSUMDB:-sum.golang.google.cn}" \
  -e LIFE_AGENT_COVER_DIR=/covers \
  -v "$ROOT/backend:/src" \
  -v "$VOLUME_NAME:/covers" \
  -v "$IMG_ABS:$CONTAINER_IMG:ro" \
  -w /src \
  "$GO_IMAGE" \
  sh -c "go run ./cmd/set-agent-cover -name '$AGENT_NAME' -file '$CONTAINER_IMG' $APPLY_FLAG"

echo ""
echo "如需刷新缓存，重启 backend："
echo "  docker compose -f $COMPOSE_FILE restart backend"
