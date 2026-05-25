# -*- coding: utf-8 -*-
"""Generate profiles_xiabanle_podcast.go from xiabanle_episodes.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JSON = Path(__file__).resolve().parent / "xiabanle_episodes.json"
WELCOMES = Path(__file__).resolve().parent / "podcast_welcome_messages.json"
GO = ROOT / "backend/internal/yantuseed/profiles_xiabanle_podcast.go"

EXPERTISE = {
    "03": ["我下班了", "播客", "副业", "城市选择", "轻资产创业"],
    "04": ["我下班了", "播客", "创业", "成都", "轻资产创业"],
    "05": ["我下班了", "播客", "城市选择", "轻资产创业"],
    "06": ["我下班了", "播客", "亲密关系", "轻资产创业"],
    "07": ["我下班了", "播客", "职业探索", "轻资产创业"],
    "08": ["我下班了", "播客", "自由职业", "优势咨询", "轻资产创业"],
    "09": ["我下班了", "播客", "工作生活平衡", "轻资产创业"],
    "10": ["我下班了", "播客", "互联网", "裁员", "轻资产创业"],
    "11": ["我下班了", "播客", "创业", "AI", "自媒体", "轻资产创业"],
    "12": ["我下班了", "播客", "运营", "轻资产创业"],
    "13": ["我下班了", "播客", "自由职业", "轻资产创业"],
    "14": ["我下班了", "播客", "成都", "自由职业", "轻资产创业"],
    "15": ["我下班了", "播客", "创业", "轻资产创业"],
    "16": ["我下班了", "播客", "副业", "旅游", "轻资产创业"],
    "17": ["我下班了", "播客", "创业", "影视", "轻资产创业"],
}


def go_str(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .replace("\n", "\\n")
    )


def go_strings(items: list[str]) -> str:
    return "[]string{" + ", ".join(f'"{go_str(x)}"' for x in items) + "}"


def main() -> None:
    profiles = json.loads(JSON.read_text(encoding="utf-8"))
    welcomes = json.loads(WELCOMES.read_text(encoding="utf-8"))
    blocks = []
    for p in profiles:
        ep = p["ep"]
        title = f"我下班了 EP{ep} | {p['title']}"
        welcome = welcomes.get(p["display"], f"我是{p['display']}。欢迎直接问我这期节目里聊到的经历和方法。")
        tags = EXPERTISE.get(ep, ["我下班了", "播客", "轻资产创业"])
        sq_placeholder = go_strings([])  # patched by patch_xiabanle_sample_questions.py
        blocks.append(
            f"""\t{{
\t\tDisplayName:       "{go_str(p['display'])}",
\t\tOriginalAuthor:    "{go_str(p['guest'])}",
\t\tSchool:            "",
\t\tArticleTitle:      "{go_str(title)}",
\t\tLongBioPrefix:     xiabanlePodcastLongBioPrefix,
\t\tShortBio:          "{go_str(p['short_bio'])}",
\t\tAudience:          xiabanlePodcastAudience,
\t\tWelcomeMessage:    "{go_str(welcome)}",
\t\tEducation:         xiabanlePodcastEducation,
\t\tMajorLabel:        xiabanlePodcastMajorLabel,
\t\tKnowledgeCategory: xiabanlePodcastKnowledgeCat,
\t\tKnowledgeTags:     xiabanlePodcastKnowledgeTags,
\t\tSampleQuestions:   {sq_placeholder},
\t\tExpertiseTags:     {go_strings(tags)},
\t\tSource:            "我下班了播客",
\t\tKnowledgeBody:     "{go_str(p['knowledge_body'])}",
\t}},"""
        )

    content = f"""package yantuseed

// 《我下班了》播客访谈系列（{len(profiles)} 期），嘉宾内容取自逐字稿对应发言人（1 或 2），另一发言人为主持人阿拉的追问与补充。
// 来源：我下班了播客；档案文件：profiles_xiabanle_podcast.go

const xiabanlePodcastLongBioPrefix = "内容来自播客《我下班了》访谈逐字稿整理，嘉宾为主发言人内容，主持人阿拉的提问与对话脉络供参考；仅供成长参考，不代表节目官方立场。"

const (
\txiabanlePodcastAudience       = "想探索副业、自由职业与轻资产创业的青年与职场人。"
\txiabanlePodcastEducation      = "非典型职业路径（访谈嘉宾）"
\txiabanlePodcastMajorLabel     = "副业创业"
\txiabanlePodcastKnowledgeCat   = "我下班了访谈"
)

var xiabanlePodcastKnowledgeTags = []string{{"我下班了", "播客", "轻资产创业", "自由职业", "副业"}}

var xiabanlePodcastProfiles = []Profile{{
{chr(10).join(blocks)}
}}
"""
    GO.write_text(content, encoding="utf-8")
    print("wrote", GO, "profiles:", len(profiles))


if __name__ == "__main__":
    main()
