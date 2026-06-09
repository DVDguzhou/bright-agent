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
import_one "$KB/24h自动赚钱店-知识库入库版.md" "开过24小时棋牌室的渺渺" \
  -headline "开店四个半月后，她先算睡眠、风险和回本" \
  -short "渺渺做过大厂产品经理，也独自开过24小时棋牌室。她讲的是选址、私域、熟客、半夜电话，还有为什么赚钱也未必值得继续。" \
  -category "创业经验" -tags "开店,无人店,小红书,副业,实体店" -source "迷你退休播客"

import_one "$KB/AI电商转IP-知识库入库版.md" "用AI做图文带货的阿龙" \
  -headline "从囤货亏钱，到用AI图文带货跑通现金流" \
  -short "阿龙先做直播带货和囤货，亏过钱，后来用AI做电商图文带货。他更常聊选品、退货率、流量能力，以及为什么后来转向个人IP。" \
  -category "创业经验" -tags "AI电商,直播带货,个人IP,选品,图文" -source "访谈·创业"

# --- 求职 qiuzhi ---
import_one "$KB/红总大厂运营-知识库入库版.md" "从计算机转运营的红总" \
  -headline "计算机学生进大厂运营后，才知道光鲜背后有多卷" \
  -short "红总是计算机背景，却走了运营路。她聊第一份美团实习怎么来、课程和实习怎么平衡，也会讲大厂运营的压力和真实日常。" \
  -category "求职经验" -tags "大厂,运营,实习,美团,秋招" -source "访谈·求职"

import_one "$KB/职高字节AI-知识库入库版.md" "专升本进AI数据岗的学长" \
  -headline "从职高、专升本到字节AI数据岗，他讲的是信息差和求教" \
  -short "他不是标准履历出身，走过职高、专升本，也进过字节AI数据运营。适合问学历不占优时怎么找机会、补信息差、开口求助。" \
  -category "求职经验" -tags "字节,AI,职高,实习,逆袭" -source "访谈·求职"

import_one "$KB/理想转美团HR-知识库入库版.md" "从理想销售转招聘的Jeff" \
  -headline "卖过车、做过猎头后，他进了美团招聘" \
  -short "Jeff机械本科、人文地理研究生，做过理想汽车销售，也做过猎头和美团招聘。他适合聊跨专业、销售转HR、校友资源和面试沟通。" \
  -category "求职经验" -tags "HR,美团,理想汽车,转行,面试" -source "访谈·求职"

if $APPLY; then
  echo ""
  echo "========== set-featured chuangye =========="
  go run ./cmd/set-featured -collection chuangye \
    -names "开过24小时棋牌室的渺渺,用AI做图文带货的阿龙" -apply
  echo ""
  echo "========== set-featured qiuzhi =========="
  go run ./cmd/set-featured -collection qiuzhi \
    -names "从计算机转运营的红总,专升本进AI数据岗的学长,从理想销售转招聘的Jeff" -apply
else
  echo ""
  echo "[dry-run] 未写库。确认条数无误后：bash scripts/import-qiuzhi-chuangye.sh -apply"
fi
