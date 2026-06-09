#!/usr/bin/env bash
# 求职 / 创业 5 个 Agent：从 kb-ready 完整清洗版导入知识库并设置合集。
#
# 用法（在仓库根目录或任意目录）：
#   bash scripts/import-qiuzhi-chuangye.sh           # dry-run 预览条数
#   bash scripts/import-qiuzhi-chuangye.sh -apply    # 写库 + set-featured
#
# 知识源文件（勿用 *-extract.md）：
#   docs/agent-interview/qiuzhi-chuangye-extract/kb-ready/*-知识库入库版.md
# 汇总参考（不导入）：求职创业访谈-真实知识库入库版.md

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KB="$ROOT/docs/agent-interview/qiuzhi-chuangye-extract/kb-ready"
cd "$ROOT/backend"

APPLY=false
if [[ "${1:-}" == "-apply" ]]; then
  APPLY=true
fi

import_one() {
  local file="$1"
  local name="$2"
  shift 2
  echo ""
  echo "========== $name =========="
  if $APPLY; then
    go run ./cmd/import-persona -file "$file" -name "$name" "$@" -apply
  else
    go run ./cmd/import-persona -file "$file" -name "$name" "$@"
  fi
}

# --- 创业 chuangye ---
import_one "$KB/24h自动赚钱店-知识库入库版.md" "24h自动赚钱店" \
  -category "创业经验" -tags "开店,无人店,小红书,副业,实体店" -source "迷你退休播客"

import_one "$KB/AI电商转IP-知识库入库版.md" "AI电商转IP" \
  -category "创业经验" -tags "AI电商,直播带货,个人IP,选品,图文" -source "访谈·创业"

# --- 求职 qiuzhi ---
import_one "$KB/红总大厂运营-知识库入库版.md" "红总大厂运营" \
  -category "求职经验" -tags "大厂,运营,实习,美团,秋招" -source "访谈·求职"

import_one "$KB/职高字节AI-知识库入库版.md" "职高字节AI" \
  -category "求职经验" -tags "字节,AI,职高,实习,逆袭" -source "访谈·求职"

import_one "$KB/理想转美团HR-知识库入库版.md" "理想转美团HR" \
  -category "求职经验" -tags "HR,美团,理想汽车,转行,面试" -source "访谈·求职"

if $APPLY; then
  echo ""
  echo "========== set-featured chuangye =========="
  go run ./cmd/set-featured -collection chuangye \
    -names "24h自动赚钱店,AI电商转IP" -apply
  echo ""
  echo "========== set-featured qiuzhi =========="
  go run ./cmd/set-featured -collection qiuzhi \
    -names "红总大厂运营,职高字节AI,理想转美团HR" -apply
else
  echo ""
  echo "[dry-run] 未写库。确认条数无误后：bash scripts/import-qiuzhi-chuangye.sh -apply"
fi
