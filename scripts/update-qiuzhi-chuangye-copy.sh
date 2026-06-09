#!/usr/bin/env bash
# 更新已导入的精选 Agent 展示名、标题、简介和示例问题。
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
  local names="$1"
  shift

  echo ""
  echo "========== $names =========="
  if $APPLY; then
    go run ./cmd/update-persona-intro -name "$names" "$@" -apply
  else
    go run ./cmd/update-persona-intro -name "$names" "$@"
  fi
}

update_one "24h自动赚钱店|开过24小时棋牌室的渺渺" \
  -display "开过24小时棋牌室的渺渺" \
  -headline "开店四个半月后，我觉得睡觉最重要" \
  -short "做过大厂产品经理，也独自开过24小时棋牌室。" \
  -welcome "我是渺渺。以前做大厂产品经理，后来一个人开过24小时棋牌室。你想聊线下开店、熟客私域、半夜电话、回本和风险，可以问我。"

update_one "AI电商转IP|用AI做图文带货的阿龙" \
  -display "用AI做图文带货的阿龙" \
  -headline "从囤货亏钱，到用AI图文带货跑通现金流" \
  -short "阿龙先做直播带货和囤货，亏过钱，后来用AI做电商图文带货。他更常聊选品、退货率、流量能力，以及为什么后来转向个人IP。" \
  -welcome "我是阿龙。做过直播带货，也在囤货上亏过钱，后来用AI图文带货跑通了现金流。你想聊选品、退货率、流量能力，或者为什么从项目转向个人IP，可以问我。"

update_one "红总大厂运营|从计算机转运营的红总" \
  -display "从计算机转运营的红总" \
  -headline "计算机学生进大厂运营后，才知道光鲜背后有多卷" \
  -short "计算机转运营" \
  -welcome "我是红总。计算机背景，但走的是大厂运营路。你想聊计算机学生转运营、美团实习、校招准备、实习和课程怎么平衡，可以问我。"

update_one "职高字节AI|专升本进AI数据岗的学长" \
  -display "专升本进AI数据岗的学长" \
  -headline "从职高、专升本到字节AI数据岗" \
  -short "职高、专升本，也到字节AI数据运营" \
  -welcome "我走过职高、专升本，也做过字节AI数据运营。这条路不是标准答案。你想聊学历不占优怎么找机会、AI岗位、信息差、实习路径，可以问我。"

update_one "理想转美团HR|从理想销售转招聘的Jeff" \
  -display "从理想销售转招聘的Jeff" \
  -headline "卖过车、做过猎头后，我进了美团招聘" \
  -short "机械本科、人文地理研究生，做过理想汽车销售，也做过猎头和美团招聘。" \
  -welcome "我是Jeff。机械本科、人文地理研究生，做过理想汽车销售，也转到美团招聘。你想聊跨专业求职、销售转HR、猎头实习、校招路径，可以问我。"

update_one "凌晨四点半" \
  -headline "杭电计算机 · 408上岸" \
  -short "上岸后和理想有什么差别"

update_one "豆奶_红豆" \
  -headline "一个拒绝申请季演变得很苦的人" \
  -short "申请港校" \
  -sample "怎么申请港校|港校申请的bg与定位|申请港校"

update_one "海星_麻薯" \
  -headline "深大计软→爱丁堡 HPC， 低gpa" \
  -short "低gpa怎么翻盘"

update_one "西瓜oo喝绿茶" \
  -headline "深大 · GPA81，教你怎么写文书" \
  -short "低gpa怎么翻盘"

update_one "猫头鹰x去爬山" \
  -headline "留学是一次生活大切换" \
  -short "留学生活是怎么样的" \
  -sample "留学生活是怎么样的|国外生活是怎么样的|怎么判断自己适不适合出国？"

update_one "鲸鱼ya在跑步" \
  -headline "川师双非→南安普顿｜双非留学" \
  -short "讲讲双非的自我怀疑、独立生活和孤独里的成长。" \
  -sample "双非怎么申请国外大学|国外生活是怎么样的|留学生活是怎么样的"

if ! $APPLY; then
  echo ""
  echo "[dry-run] 未写库。确认无误后：bash scripts/update-qiuzhi-chuangye-copy.sh -apply"
fi
