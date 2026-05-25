# -*- coding: utf-8 -*-
"""Extract guest/host transcript from 《校招飞》 docx files."""
from __future__ import annotations

import json
import re
from pathlib import Path

from docx import Document

DOWNLOADS = Path(r"c:\Users\Caiqing\Downloads")
OUT = Path(__file__).resolve().parent / "xiaozhaofei_episodes.json"

EPISODES = [
    {"vol": "01", "find": ["vol.01"], "guest": "董红庄", "aliases": ["红总"], "sp": 2,
     "title": "双一流计算机学妹的大厂运营之路", "display": "红总大厂运营"},
    {"vol": "02", "find": ["vol.02"], "guest": "伟东", "aliases": [], "sp": 1,
     "title": "职高专升本勇闯北京字节AI数据运营岗位", "display": "职高字节AI"},
    {"vol": "03", "find": ["vol.03"], "guest": "燕婷", "aliases": [], "sp": 1,
     "title": "武汉大学新闻学本硕秋招offer之路", "display": "武大新闻秋招"},
    {"vol": "04", "find": ["vol.04"], "guest": "Jeffrey", "aliases": ["Jeff瑞"], "sp": 2,
     "title": "双非本硕理想汽车销售走向美团HR之路", "display": "理想转美团HR"},
    {"vol": "05", "find": ["vol.05"], "guest": "王同学", "aliases": [], "sp": 2,
     "title": "英本澳硕大厂产运offer五连斩", "display": "产运offer五连斩"},
    {"vol": "06", "find": ["vol.06"], "guest": "陈同学", "aliases": [], "sp": 2,
     "title": "腾讯秋招面了我11次", "display": "腾讯面11次"},
    {"vol": "07", "find": ["vol.07"], "guest": "哈维同学", "aliases": [], "sp": 2,
     "title": "双非本硕芯片offer拿手软", "display": "芯片offer收割"},
    {"vol": "08", "find": ["vol.08"], "guest": "小凡", "aliases": [], "sp": 2,
     "title": "双一流英语本硕秋招之路", "display": "英语本硕秋招"},
    {"vol": "09", "find": ["vol.09"], "guest": "文轩", "aliases": ["路"], "sp": 2,
     "title": "中科院博士AI顶级offer收割机", "display": "博士AI收割机"},
]


def find_file(keys: list[str]) -> Path | None:
    for fn in DOWNLOADS.iterdir():
        if fn.suffix != ".docx":
            continue
        if all(k.lower() in fn.name.lower() for k in keys):
            return fn
    return None


def parse_docx(path: Path) -> tuple[str, dict[int, list[str]]]:
    doc = Document(str(path))
    speaker_re = re.compile(r"^发言人(\d+)\s+\d{2}:\d{2}\s*$")
    current = 0
    buckets: dict[int, list[str]] = {1: [], 2: []}
    meta = ""
    for p in doc.paragraphs:
        t = p.text.strip()
        if not t:
            continue
        m = speaker_re.match(t)
        if m:
            current = int(m.group(1))
            continue
        if current in buckets:
            buckets[current].append(t)
        elif not meta and not re.match(r"^\d{4}", t):
            meta = t
    return meta, buckets


def build_knowledge(ep: dict, guest: str, host: str) -> str:
    alias = f"（{' / '.join(ep['aliases'])}）" if ep["aliases"] else ""
    parts = [
        f"节目：播客《校招飞》vol.{ep['vol']}《{ep['title']}》",
        f"嘉宾：{ep['guest']}{alias}",
        "主持人：（校招飞主播）",
        "",
        "【嘉宾分享】",
        guest.strip(),
    ]
    if host.strip():
        parts += ["", "【主持人追问与补充（供理解语境）】", host.strip()[:8000]]
    return "\n".join(parts).strip()


def first_sentence(text: str, max_len: int = 140) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return ""
    for sep in "。！？\n":
        idx = text.find(sep)
        if 20 < idx < max_len:
            return text[: idx + 1]
    return text[:max_len] + ("…" if len(text) > max_len else "")


def main() -> None:
    profiles = []
    for ep in EPISODES:
        path = find_file(ep["find"])
        if not path:
            print("MISSING", ep["vol"], ep["find"])
            continue
        meta, buckets = parse_docx(path)
        guest_sp = int(ep["sp"])
        host_sp = 2 if guest_sp == 1 else 1
        guest_text = "\n".join(buckets.get(guest_sp, []))
        host_text = "\n".join(buckets.get(host_sp, []))
        kb = build_knowledge(ep, guest_text, host_text)
        profiles.append({
            **ep,
            "path": str(path),
            "meta": meta,
            "short_bio": first_sentence(guest_text) or ep["title"],
            "knowledge_body": kb,
            "guest_len": len(guest_text),
            "host_len": len(host_text),
        })
        print(ep["vol"], ep["display"], profiles[-1]["guest_len"], profiles[-1]["host_len"])

    OUT.write_text(json.dumps(profiles, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", len(profiles), "->", OUT)


if __name__ == "__main__":
    main()
