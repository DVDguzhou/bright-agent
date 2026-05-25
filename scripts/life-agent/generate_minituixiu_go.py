# -*- coding: utf-8 -*-
"""Generate profiles_minituixiu_podcast.go from minituixiu_episodes.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JSON = Path(__file__).resolve().parent / "minituixiu_episodes.json"
WELCOMES = Path(__file__).resolve().parent / "podcast_welcome_messages.json"
GO = ROOT / "backend/internal/yantuseed/profiles_minituixiu_podcast.go"

EXPERTISE = {
    "01": ["迷你退休", "播客", "金钱观", "自由", "副业"],
    "02": ["迷你退休", "播客", "心理咨询", "旅居", "副业"],
    "03": ["迷你退休", "播客", "成长", "自我认知"],
    "04": ["迷你退休", "播客", "社群", "副业", "职场"],
    "05": ["迷你退休", "播客", "副业", "轻创业"],
    "06": ["迷你退休", "播客", "数字游民", "一人公司", "运营"],
    "07": ["迷你退休", "播客", "AI电商", "个人IP", "副业"],
    "08": ["迷你退休", "播客", "破圈", "职场", "人脉"],
    "09": ["迷你退休", "播客", "占星", "自由职业", "副业"],
    "10": ["迷你退休", "播客", "开店", "被动收入", "副业"],
    "11": ["迷你退休", "播客", "数字游民", "旅行", "副业"],
    "12": ["迷你退休", "播客", "AI", "写真", "被动收入"],
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
        title = f"迷你退休 · {p['title']}"
        welcome = welcomes.get(p["display"], f"我是{p['display']}。欢迎直接问我这期节目里聊到的经历和方法。")
        tags = EXPERTISE.get(ep, ["迷你退休", "播客", "副业"])
        blocks.append(
            f"""\t{{
\t\tDisplayName:       "{go_str(p['display'])}",
\t\tOriginalAuthor:    "{go_str(p['guest'])}",
\t\tSchool:            "",
\t\tArticleTitle:      "{go_str(title)}",
\t\tLongBioPrefix:     minituixiuPodcastLongBioPrefix,
\t\tShortBio:          "{go_str(p['short_bio'])}",
\t\tAudience:          minituixiuPodcastAudience,
\t\tWelcomeMessage:    "{go_str(welcome)}",
\t\tEducation:         minituixiuPodcastEducation,
\t\tMajorLabel:        minituixiuPodcastMajorLabel,
\t\tKnowledgeCategory: minituixiuPodcastKnowledgeCat,
\t\tKnowledgeTags:     minituixiuPodcastKnowledgeTags,
\t\tSampleQuestions:   {go_strings([])},
\t\tExpertiseTags:     {go_strings(tags)},
\t\tSource:            "迷你退休播客",
\t\tKnowledgeBody:     "{go_str(p['knowledge_body'])}",
\t}},"""
        )

    content = f"""package yantuseed

// 《迷你退休》播客访谈系列（{len(profiles)} 期），嘉宾内容取自逐字稿对应发言人（1 或 2），另一发言人为主持人程小咩的追问与补充。
// 来源：迷你退休播客；档案文件：profiles_minituixiu_podcast.go

const minituixiuPodcastLongBioPrefix = "内容来自播客《迷你退休》访谈逐字稿整理，嘉宾为主发言人内容，主持人程小咩的提问与对话脉络供参考；仅供副业与生活方式参考，不代表节目官方立场。"

const (
\tminituixiuPodcastAudience       = "想探索副业、轻创业、数字游民与更灵活生活方式的职场人。"
\tminituixiuPodcastEducation      = "非典型职业路径（访谈嘉宾）"
\tminituixiuPodcastMajorLabel     = "迷你退休"
\tminituixiuPodcastKnowledgeCat   = "迷你退休访谈"
)

var minituixiuPodcastKnowledgeTags = []string{{"迷你退休", "播客", "副业", "自由职业", "数字游民"}}

var minituixiuPodcastProfiles = []Profile{{
{chr(10).join(blocks)}
}}
"""
    GO.write_text(content, encoding="utf-8")
    print("wrote", GO, "profiles:", len(profiles))


if __name__ == "__main__":
    main()
