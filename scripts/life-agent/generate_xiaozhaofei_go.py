# -*- coding: utf-8 -*-
"""Generate profiles_xiaozhaofei_podcast.go from xiaozhaofei_episodes.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JSON = Path(__file__).resolve().parent / "xiaozhaofei_episodes.json"
GO = ROOT / "backend/internal/yantuseed/profiles_xiaozhaofei_podcast.go"

EXPERTISE = {
    "01": ["校招飞", "播客", "大厂运营", "校招", "互联网"],
    "02": ["校招飞", "播客", "字节", "AI", "校招", "专升本"],
    "03": ["校招飞", "播客", "秋招", "新闻学", "校招"],
    "04": ["校招飞", "播客", "HR", "校招", "转行"],
    "05": ["校招飞", "播客", "产运", "秋招", "留学"],
    "06": ["校招飞", "播客", "腾讯", "秋招", "面试"],
    "07": ["校招飞", "播客", "芯片", "半导体", "校招"],
    "08": ["校招飞", "播客", "秋招", "英语", "校招"],
    "09": ["校招飞", "播客", "AI", "博士", "校招"],
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
    blocks = []
    for p in profiles:
        vol = p["vol"]
        title = f"校招飞 vol.{vol} | {p['title']}"
        welcome = (
            f"你好，我是{p['display']}，来自《校招飞》vol.{vol}。"
            f"欢迎问我关于「{p['title'][:24]}…」相关的问题。"
        )
        tags = EXPERTISE.get(vol, ["校招飞", "播客", "校招"])
        blocks.append(
            f"""\t{{
\t\tDisplayName:       "{go_str(p['display'])}",
\t\tOriginalAuthor:    "{go_str(p['guest'])}",
\t\tSchool:            "",
\t\tArticleTitle:      "{go_str(title)}",
\t\tLongBioPrefix:     xiaozhaofeiPodcastLongBioPrefix,
\t\tShortBio:          "{go_str(p['short_bio'])}",
\t\tAudience:          xiaozhaofeiPodcastAudience,
\t\tWelcomeMessage:    "{go_str(welcome)}",
\t\tEducation:         xiaozhaofeiPodcastEducation,
\t\tMajorLabel:        xiaozhaofeiPodcastMajorLabel,
\t\tKnowledgeCategory: xiaozhaofeiPodcastKnowledgeCat,
\t\tKnowledgeTags:     xiaozhaofeiPodcastKnowledgeTags,
\t\tSampleQuestions:   {go_strings([])},
\t\tExpertiseTags:     {go_strings(tags)},
\t\tSource:            "校招飞播客",
\t\tKnowledgeBody:     "{go_str(p['knowledge_body'])}",
\t}},"""
        )

    content = f"""package yantuseed

// 《校招飞》播客访谈系列（{len(profiles)} 期），嘉宾内容取自逐字稿对应发言人（1 或 2），另一发言人为主持人追问与补充。
// 来源：校招飞播客；档案文件：profiles_xiaozhaofei_podcast.go

const xiaozhaofeiPodcastLongBioPrefix = "内容来自播客《校招飞》访谈逐字稿整理，嘉宾为主发言人内容，主持人提问与对话脉络供参考；仅供校招与求职参考，不代表节目官方立场。"

const (
\txiaozhaofeiPodcastAudience       = "在校大学生、应届生与准备秋招春招的求职者。"
\txiaozhaofeiPodcastEducation      = "校招求职经验（访谈嘉宾）"
\txiaozhaofeiPodcastMajorLabel     = "校招求职"
\txiaozhaofeiPodcastKnowledgeCat   = "校招飞访谈"
)

var xiaozhaofeiPodcastKnowledgeTags = []string{{"校招飞", "播客", "校招", "秋招", "求职"}}

var xiaozhaofeiPodcastProfiles = []Profile{{
{chr(10).join(blocks)}
}}
"""
    GO.write_text(content, encoding="utf-8")
    print("wrote", GO, "profiles:", len(profiles))


if __name__ == "__main__":
    main()
