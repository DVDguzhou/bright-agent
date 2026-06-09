#!/usr/bin/env bash
# 清理精选 Agent 文案：修正脱敏注入的乱码/空格 + 批量删除自动生成的垃圾示例问题。
# 默认 dry-run，加 -apply 才写库。在「有数据库连接」的机器（你的服务器）上运行。
#
# 用法（在仓库根目录或任意目录）：
#   bash scripts/clean-featured-copy.sh         # dry-run 预览每一处改动
#   bash scripts/clean-featured-copy.sh -apply  # 确认无误后写库

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

go run ./cmd/clean-featured-copy "$@"
