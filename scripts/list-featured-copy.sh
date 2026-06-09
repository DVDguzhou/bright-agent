#!/usr/bin/env bash
# 只读列出精选 Agent 的门面文案：标题 / 简介 / 欢迎语 / 示例问题。
# 纯查询，不写任何字段。在「有数据库连接」的机器（如你的服务器）上运行。
#
# 用法（在仓库根目录或任意目录）：
#   bash scripts/list-featured-copy.sh                       # 全部精选 Agent（人读）
#   bash scripts/list-featured-copy.sh -collection chuangye  # 只看某合集
#   bash scripts/list-featured-copy.sh -names "凌晨四点半,豆奶_红豆"
#   bash scripts/list-featured-copy.sh -json > featured.json # 导出 JSON

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

go run ./cmd/list-featured-copy "$@"
