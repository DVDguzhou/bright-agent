#!/usr/bin/env bash
# 只读审计已发布 Agent 的门面文案：标出占位符/markdown残渣/脱敏残渣。
# 用来评估「卡片/详情页乱码」规模，不改任何数据。在有数据库连接的机器（服务器）上跑。
#
# 用法（仓库根目录或任意目录）：
#   bash scripts/audit-copy.sh            # 全部已发布
#   bash scripts/audit-copy.sh -featured  # 只看精选
#   bash scripts/audit-copy.sh -limit 0   # 明细不截断

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

go run ./cmd/audit-copy "$@"
