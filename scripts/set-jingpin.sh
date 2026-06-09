#!/usr/bin/env bash
# 把「编辑精选」的 12 个精品 Agent 归入 jingpin 合集（前端 /c/jingpin 即读这个 key）。
# 之前一直没有脚本填充 jingpin，导致编辑精选页是空的。
#
# 语义提醒：featured_collection 是单值列，归入 jingpin 会把这些 Agent 从原合集
# （chuangye/qiuzhi/liuxue 等）移出；featured_rank 按下面给定顺序 1..12。
#
# 用法（在仓库根目录或任意目录）：
#   bash scripts/set-jingpin.sh        # dry-run 预览（确认 12 个昵称都能找到）
#   bash scripts/set-jingpin.sh -apply # 写库

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

# 顺序对应首屏文案「上岸 → 留学 → 实习/求职 → 创业」
NAMES="凌晨四点半,豆奶_红豆,海星_麻薯,西瓜oo喝绿茶,猫头鹰x去爬山,鲸鱼ya在跑步,蚂蚁做饭中,从计算机转运营的红总,专升本进AI数据岗的学长,从理想销售转招聘的Jeff,开过24小时棋牌室的渺渺,用AI做图文带货的阿龙"

if [[ "${1:-}" == "-apply" ]]; then
  go run ./cmd/set-featured -collection jingpin -names "$NAMES" -apply
else
  go run ./cmd/set-featured -collection jingpin -names "$NAMES"
  echo ""
  echo "[dry-run] 未写库。确认 12 个昵称都命中后：bash scripts/set-jingpin.sh -apply"
fi
