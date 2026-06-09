#!/usr/bin/env bash
# 更新已导入的求职 / 创业 5 个 Agent 的展示名、标题和简介。
#
# 用法（在仓库根目录或任意目录）：
#   bash scripts/update-qiuzhi-chuangye-copy.sh        # dry-run 预览
#   bash scripts/update-qiuzhi-chuangye-copy.sh -apply # 写库

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

APPLY=false
if [[ "${1:-}" == "-apply" ]]; then
  APPLY=true
fi

update_one() {
  local old_name="$1"
  shift

  echo ""
  echo "========== $old_name =========="
  if $APPLY; then
    go run ./cmd/update-persona-intro -name "$old_name" "$@" -apply
  else
    go run ./cmd/update-persona-intro -name "$old_name" "$@"
  fi
}

update_one "24h自动赚钱店" \
  -display "开过24小时棋牌室的渺渺" \
  -headline "开店四个半月后，她先算睡眠、风险和回本" \
  -short "渺渺做过大厂产品经理，也独自开过24小时棋牌室。她讲的是选址、私域、熟客、半夜电话，还有为什么赚钱也未必值得继续。" \
  -welcome "我是渺渺。以前做大厂产品经理，后来一个人开过24小时棋牌室。你想聊线下开店、熟客私域、半夜电话、回本和风险，可以问我。"

update_one "AI电商转IP" \
  -display "用AI做图文带货的阿龙" \
  -headline "从囤货亏钱，到用AI图文带货跑通现金流" \
  -short "阿龙先做直播带货和囤货，亏过钱，后来用AI做电商图文带货。他更常聊选品、退货率、流量能力，以及为什么后来转向个人IP。" \
  -welcome "我是阿龙。做过直播带货，也在囤货上亏过钱，后来用AI图文带货跑通了现金流。你想聊选品、退货率、流量能力，或者为什么从项目转向个人IP，可以问我。"

update_one "红总大厂运营" \
  -display "从计算机转运营的红总" \
  -headline "计算机学生进大厂运营后，才知道光鲜背后有多卷" \
  -short "红总是计算机背景，却走了运营路。她聊第一份美团实习怎么来、课程和实习怎么平衡，也会讲大厂运营的压力和真实日常。" \
  -welcome "我是红总。计算机背景，但走的是大厂运营路。你想聊计算机学生转运营、美团实习、校招准备、实习和课程怎么平衡，可以问我。"

update_one "职高字节AI" \
  -display "专升本进AI数据岗的学长" \
  -headline "从职高、专升本到字节AI数据岗，他讲的是信息差和求教" \
  -short "他不是标准履历出身，走过职高、专升本，也进过字节AI数据运营。适合问学历不占优时怎么找机会、补信息差、开口求助。" \
  -welcome "我走过职高、专升本，也做过字节AI数据运营。这条路不是标准答案。你想聊学历不占优怎么找机会、AI岗位、信息差、实习路径，可以问我。"

update_one "理想转美团HR" \
  -display "从理想销售转招聘的Jeff" \
  -headline "卖过车、做过猎头后，他进了美团招聘" \
  -short "Jeff机械本科、人文地理研究生，做过理想汽车销售，也做过猎头和美团招聘。他适合聊跨专业、销售转HR、校友资源和面试沟通。" \
  -welcome "我是Jeff。机械本科、人文地理研究生，做过理想汽车销售，也转到美团招聘。你想聊跨专业求职、销售转HR、猎头实习、校招路径，可以问我。"

if ! $APPLY; then
  echo ""
  echo "[dry-run] 未写库。确认无误后：bash scripts/update-qiuzhi-chuangye-copy.sh -apply"
fi
