# -*- coding: utf-8 -*-
"""User-facing SampleQuestions for 《校招飞》 agents."""
from __future__ import annotations

import re
from pathlib import Path

GO = Path(__file__).resolve().parents[2] / "backend/internal/yantuseed/profiles_xiaozhaofei_podcast.go"

SAMPLE_QUESTIONS: dict[str, list[str]] = {
    "红总大厂运营": [
        "计算机专业怎么进大厂做运营？",
        "双一流背景校招有什么优势？",
        "运营岗面试要准备什么？",
        "怎么从学生思维转到职场？",
        "大厂运营日常做什么？",
    ],
    "职高字节AI": [
        "职高专升本怎么进字节？",
        "AI数据运营岗位做什么？",
        "学历一般怎么逆袭大厂？",
        "北京求职有哪些坑？",
        "非名校怎么写简历？",
    ],
    "武大新闻秋招": [
        "新闻学专业秋招怎么选方向？",
        "武大本硕校招经验是什么？",
        "文科生怎么拿互联网offer？",
        "秋招时间线怎么规划？",
        "本硕连读对校招有帮助吗？",
    ],
    "理想转美团HR": [
        "双非本硕怎么转HR？",
        "从汽车销售转互联网可能吗？",
        "美团HR校招怎么准备？",
        "跨行求职怎么讲故事？",
        "理想汽车经历怎么写进简历？",
    ],
    "产运offer五连斩": [
        "英本澳硕怎么拿大厂产运offer？",
        "产运五连斩怎么做到的？",
        "留学背景校招有什么优势？",
        "怎么同时拿多个offer？",
        "产运和运营有什么区别？",
    ],
    "腾讯面11次": [
        "腾讯秋招为什么能面11次？",
        "多次面试怎么保持状态？",
        "腾讯校招流程是怎样的？",
        "面试挂了很多次怎么办？",
        "怎么提高大厂面试通过率？",
    ],
    "芯片offer收割": [
        "双非本硕怎么拿芯片offer？",
        "半导体校招怎么准备？",
        "芯片行业哪些公司在招？",
        "工科校招怎么海投？",
        "多个芯片offer怎么选？",
    ],
    "英语本硕秋招": [
        "英语专业本硕怎么校招？",
        "双一流英语生有哪些出路？",
        "文科秋招怎么选行业？",
        "英语背景能进互联网吗？",
        "秋招实习经历怎么积累？",
    ],
    "博士AI收割机": [
        "中科院博士怎么拿AI顶级offer？",
        "博士校招和硕士有什么不同？",
        "AI方向博士去工业界还是学术界？",
        "顶级offer怎么谈薪？",
        "博士期间怎么为校招做准备？",
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
