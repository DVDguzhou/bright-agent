#!/usr/bin/env bash
# 发现页质量门槛：把标题/简介被脱敏污染的「非精选」Agent 下架（published=false）。
# 精选不受影响。dry-run 默认，-apply 写库并生成回滚清单。
#
# 用法（仓库根目录或任意目录）：
#   bash scripts/gate-broken-copy.sh                              # dry-run 预览
#   bash scripts/gate-broken-copy.sh -apply                       # 下架 + 写回滚清单
#   bash scripts/gate-broken-copy.sh -restore gate-hidden-XXXX.txt -apply  # 回滚（清单在 backend/ 下）

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

go run ./cmd/gate-broken-copy "$@"
