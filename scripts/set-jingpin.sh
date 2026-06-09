#!/usr/bin/env bash
# 把「编辑精选」的精品 Agent 归入 jingpin 合集（前端 /c/jingpin 即读这个 key）。
#
# 做法：先清空 jingpin（去掉旧成员和撞号的 rank），再按下面 NAMES 的顺序重排 rank=1..N。
# 这样 jingpin 的成员和顺序完全由 NAMES 决定，干净且可重复跑。
#
# 语义提醒：featured_collection 是单值列，归入 jingpin 会把这些 Agent 从原合集移出。
#
# 用法（在仓库根目录或任意目录）：
#   bash scripts/set-jingpin.sh        # dry-run 预览（确认昵称都能找到）
#   bash scripts/set-jingpin.sh -apply # 写库（先 clear 再 set）

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

# 顺序：上岸 → 留学 → 求职 → 创业。
# 爱丁堡HPC 去重后保留「慵懒的锦鲤7」（不再用 海星_麻薯）；保留留学方向的「芒果学画画」。
NAMES="凌晨四点半,豆奶_红豆,慵懒的锦鲤7,西瓜oo喝绿茶,猫头鹰x去爬山,鲸鱼ya在跑步,蚂蚁做饭中,芒果学画画,从计算机转运营的红总,专升本进AI数据岗的学长,从理想销售转招聘的Jeff,开过24小时棋牌室的渺渺,用AI做图文带货的阿龙"

if [[ "${1:-}" == "-apply" ]]; then
  echo "========== ① 清空 jingpin =========="
  go run ./cmd/set-featured -collection jingpin -clear -apply
  echo ""
  echo "========== ② 按最终名单重排 rank=1..13 =========="
  go run ./cmd/set-featured -collection jingpin -names "$NAMES" -apply
else
  echo "========== dry-run：-apply 时会先清空 jingpin 再按下列顺序重排 =========="
  go run ./cmd/set-featured -collection jingpin -names "$NAMES"
  echo ""
  echo "[dry-run] 未写库。确认 13 个昵称都命中后：bash scripts/set-jingpin.sh -apply"
fi
