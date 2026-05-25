# -*- coding: utf-8 -*-
"""User-facing SampleQuestions for 《迷你退休》 agents."""
from __future__ import annotations

import re
from pathlib import Path

GO = Path(__file__).resolve().parents[2] / "backend/internal/yantuseed/profiles_minituixiu_podcast.go"

SAMPLE_QUESTIONS: dict[str, list[str]] = {
    "越想越不自由": [
        "为什么越想赚钱反而离自由越远？",
        "德加是怎么理解金钱和自由的？",
        "赚钱和自由可以兼得吗？",
        "怎么建立健康的金钱观？",
        "副业是为了自由还是为了钱？",
    ],
    "心理师全国旅居": [
        "心理咨询师怎么实现全国旅居？",
        "心理师收入真实情况怎么样？",
        "线上咨询怎么获客？",
        "从温饱到旅居要经历什么？",
        "适合做心理咨询副业吗？",
    ],
    "不想成功的大人": [
        "不想成为成功的大人是什么意思？",
        "怎么重新定义成功？",
        "佩轩是怎么看职场成长的？",
        "承认不想卷需要勇气吗？",
        "普通人怎么找到自己的生活节奏？",
    ],
    "碎片时间社群": [
        "职场人怎么用碎片时间做社群？",
        "社群副业怎么给自己涨薪？",
        "糖糖的社群是怎么运营的？",
        "副业社群从0怎么起步？",
        "上班之余做社群来得及吗？",
    ],
    "副业关键一步": [
        "试过10种副业后最关键的一步是什么？",
        "哪种副业最容易赚到钱？",
        "副业失败常见原因有哪些？",
        "怎么判断副业值不值得做？",
        "橙子踩过哪些副业坑？",
    ],
    "KV数字游民": [
        "3个月怎么跑通一人公司？",
        "从大厂运营到数字游民怎么过渡？",
        "数字游民需要准备什么？",
        "一人公司怎么选方向？",
        "KV是怎么离开大厂的？",
    ],
    "AI电商转IP": [
        "AI电商月入过万后为什么还要做个人IP？",
        "阿龙的AI电商是怎么做的？",
        "电商和个人IP怎么结合？",
        "副业做AI电商可行吗？",
        "从带货转IP要补什么能力？",
    ],
    "同龄人贵人": [
        "职场上贵人为什么可能是同龄人？",
        "怎么破圈认识同辈资源？",
        "千儿是怎么拓展人脉的？",
        "上班族怎么找到贵人为自己指路？",
        "破圈需要刻意经营吗？",
    ],
    "占星1小时工作": [
        "靠占星每天工作1小时可能吗？",
        "JK老师是怎么不卷职场的？",
        "占星副业怎么起步？",
        "不想上班有哪些替代路径？",
        "玄学类副业靠谱吗？",
    ],
    "24h自动赚钱店": [
        "24小时替自己赚钱的店怎么做？",
        "渺渺是怎么不开店也赚钱的？",
        "被动收入小店要投入多少？",
        "不想继续上班开店可行吗？",
        "自动化店铺怎么选品类？",
    ],
    "旅行边赚Allen": [
        "怎么一边旅行一边赚钱？",
        "Allen是怎么逃离办公室的？",
        "数字游民旅行收入从哪来？",
        "边旅行边工作要准备什么？",
        "不想坐班有哪些远程机会？",
    ],
    "AI写真被动收入": [
        "不露脸怎么做AI写真副业？",
        "布噜的被动收入怎么建立的？",
        "AI写真需要哪些工具？",
        "被动收入副业要持续维护吗？",
        "不想露脸还有哪些AI副业？",
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
