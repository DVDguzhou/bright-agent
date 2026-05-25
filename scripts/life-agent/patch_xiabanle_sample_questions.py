# -*- coding: utf-8 -*-
"""User-facing SampleQuestions for 《我下班了》 agents."""
from __future__ import annotations

import re
from pathlib import Path

GO = Path(__file__).resolve().parents[2] / "backend/internal/yantuseed/profiles_xiabanle_podcast.go"

SAMPLE_QUESTIONS: dict[str, list[str]] = {
    "成都土著家居服": [
        "主业B端运营怎么兼顾开家居服店？",
        "从杭州回成都工作怎么规划？",
        "线下店10万投入怎么快速回本？",
        "B端和C端运营有什么区别？",
        "副业和主业怎么平衡？",
    ],
    "成都躺平创业": [
        "来成都躺平的90后为什么又卷起来了？",
        "成都创业氛围怎么样？",
        "小成本创业从哪里开始？",
        "二线城市适合做什么项目？",
        "怎么找到本地商业机会？",
    ],
    "一线闯二线副本": [
        "00后怎么早进职场积累经验？",
        "一线城市和二线城市怎么选？",
        "大学阶段怎么边上学边实习？",
        "怎么打造个人品牌和表达力？",
        "回二线发展会错过机会吗？",
    ],
    "社交app新关系": [
        "社交软件上怎么认识靠谱的人？",
        "已婚人士还能用社交app吗？",
        "线上交友有哪些坑要避？",
        "什么是新的亲密关系形态？",
        "社交app从业者怎么看行业？",
    ],
    "七年七份工作": [
        "8年换7份工作正常吗？",
        "找工作怎么避免病急乱投医？",
        "频繁跳槽怎么讲清楚故事？",
        "怎么判断下一份工作值不值得去？",
        "市场品牌人怎么规划职业？",
    ],
    "盖洛普自由职业": [
        "产品经理怎么转优势咨询？",
        "自由职业一天工作几小时？",
        "Gap期怎么验证自由职业方向？",
        "盖洛普咨询怎么获客？",
        "离职前要做好哪些准备？",
    ],
    "30岁热爱生活": [
        "30岁怎么从热爱工作转向热爱生活？",
        "工作狂怎么学会休息？",
        "一线城市打拼怎么兼顾生活？",
        "怎么和伴侣规划异地和未来？",
        "狗哥是怎么一步步成长起来的？",
    ],
    "字节裁员百万": [
        "刚年薪百万被裁员是什么感受？",
        "二本怎么闯北京拿到高薪？",
        "字节和得到的工作经历有什么不同？",
        "裁员后怎么调整心态？",
        "普通人怎么积累第一桶金？",
    ],
    "Gap探索AI创业": [
        "Gap2年探索AI创业值得吗？",
        "耗子学长怎么从职场转创业？",
        "AI加自媒体怎么起步？",
        "轻资产创业有哪些可复制路径？",
        "怎么判断自己适不适合创业？",
    ],
    "运营顾问Sina": [
        "独立运营顾问怎么接单？",
        "怎么把热爱变成事业？",
        "收入翻倍是怎么做到的？",
        "自由职业者怎么自我探索？",
        "运营顾问的服务模式是什么？",
    ],
    "杭州B面人生": [
        "大厂人怎么探索B面人生？",
        "副业咨询怎么起步？",
        "怎么帮年轻人找第二曲线？",
        "自由职业有哪些收入来源？",
        "什么时候该开始考虑副业？",
    ],
    "成都自由职业": [
        "成都找工作真实情况怎么样？",
        "成都自由职业者多吗？",
        "二线城市薪资水平大概多少？",
        "不上班怎么在成都生活？",
        "成都创业环境怎么样？",
    ],
    "阿里回成都卖水果": [
        "前阿里运营为什么回成都卖水果？",
        "私域卖水果怎么做？",
        "轻资产创业怎么选品类？",
        "从大厂到农业心理落差怎么过？",
        "创业和快乐怎么兼顾？",
    ],
    "旅游博主月入几万": [
        "旅游博主怎么月入大几万？",
        "旅游赛道怎么变现？",
        "主理人和买手模式是什么？",
        "副业做旅游引流怎么做？",
        "职场人适合做旅游副业吗？",
    ],
    "辍学百万影视": [
        "辍学4年怎么重回校园？",
        "百万影视公司怎么起步？",
        "没学专业怎么做宣传片？",
        "怎么拿到第一批客户订单？",
        "爱好怎么做成可持续事业？",
    ],
}


def go_string(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def format_sample_questions(questions: list[str]) -> str:
    items = ", ".join(f'"{go_string(q)}"' for q in questions)
    return f"SampleQuestions:   []string{{{items}}},"


def main() -> None:
    text = GO.read_text(encoding="utf-8")
    for name, questions in SAMPLE_QUESTIONS.items():
        pattern = (
            rf'(DisplayName:\s+"{re.escape(name)}",[\s\S]*?)'
            r'SampleQuestions:\s+\[\]string\{[^}]*\},'
        )
        new_text, n = re.subn(pattern, rf"\1{format_sample_questions(questions)}", text, count=1)
        if n != 1:
            raise SystemExit(f"failed to patch {name}: matched {n} times")
        text = new_text
    GO.write_text(text, encoding="utf-8")
    print("patched", len(SAMPLE_QUESTIONS), "profiles")


if __name__ == "__main__":
    main()
