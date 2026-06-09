#!/usr/bin/env bash
# 移除「飞跃手册」「研途榜样」两个来源字样的所有出现（档案门面字段 + 知识库）。
# 默认 dry-run；-apply 写库并备份档案改动。在有数据库连接的机器（服务器）上跑。
#
# 用法（仓库根目录或任意目录）：
#   bash scripts/strip-source-labels.sh         # dry-run 预览
#   bash scripts/strip-source-labels.sh -apply  # 写库 + 备份

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

go run ./cmd/strip-source-labels "$@"
