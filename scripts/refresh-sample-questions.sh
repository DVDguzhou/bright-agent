#!/usr/bin/env bash
# 用最新生成器重算并覆盖非精选 Agent 的 sample_questions（编辑精选 jingpin 跳过）。
# 默认 dry-run；-apply 写库并备份旧值。在有数据库连接的机器（服务器）上跑。
#
# 用法：
#   bash scripts/refresh-sample-questions.sh         # dry-run 预览
#   bash scripts/refresh-sample-questions.sh -apply  # 写库 + 备份

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

go run ./cmd/refresh-sample-questions "$@"
