#!/usr/bin/env bash
# 在服务器上拉取最新代码，但保留本机已改过的部署配置。
# 用法（在 ~/regr 目录）: bash scripts/pull-keep-server-config.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEEP_FILES=(
  ".env.production.example"
  "Dockerfile"
  "docker-compose.production.yml"
  "next.config.js"
  "src/lib/life-agent-covers.ts"
)

BACKUP_DIR="$(mktemp -d /tmp/regr-server-config.XXXXXX)"
cleanup() { rm -rf "$BACKUP_DIR"; }
trap cleanup EXIT

echo "==> 备份服务器配置到 $BACKUP_DIR"
for f in "${KEEP_FILES[@]}"; do
  if [[ -f "$f" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$f")"
    cp -a "$f" "$BACKUP_DIR/$f"
  fi
done

echo "==> 暂存 git 对这 5 个文件的跟踪改动，以便 pull"
git restore "${KEEP_FILES[@]}" 2>/dev/null || true

echo "==> git pull"
git pull

echo "==> 恢复服务器配置"
for f in "${KEEP_FILES[@]}"; do
  if [[ -f "$BACKUP_DIR/$f" ]]; then
    cp -a "$BACKUP_DIR/$f" "$f"
  fi
done

echo "==> 标记 skip-worktree（以后 pull 不再覆盖这些文件）"
for f in "${KEEP_FILES[@]}"; do
  git update-index --skip-worktree "$f" 2>/dev/null || true
done

echo "完成。当前保留的服务器配置："
for f in "${KEEP_FILES[@]}"; do
  echo "  - $f"
done
echo ""
echo "若需恢复跟踪仓库版本: git update-index --no-skip-worktree <文件>"
