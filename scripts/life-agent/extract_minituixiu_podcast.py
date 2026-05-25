# -*- coding: utf-8 -*-
"""Extract guest/host transcript from 《迷你退休》 docx files."""
from __future__ import annotations

import json
import re
from pathlib import Path

from docx import Document

DOWNLOADS = Path(r"c:\Users\Caiqing\Downloads")
OUT = Path(__file__).resolve().parent / "minituixiu_episodes.json"

# guest sp = 逐字稿发言人编号；另一编号为主持人程小咩
EPISODES = [
    {"ep": "01", "find": ["越想赚钱"], "guest": "杨德佳", "aliases": ["德加", "DJ"], "sp": 1,
     "title": "为什么我们越想赚钱，反而离自由越远？", "display": "越想越不自由"},
    {"ep": "02", "find": ["心理咨询师"], "guest": "李恩", "aliases": ["黎恩"], "sp": 2,
     "title": "心理咨询师收入真相：为什么他能全国旅居，别人却挣扎在温饱线？", "display": "心理师全国旅居"},
    {"ep": "03", "find": ["成功的大人"], "guest": "佩轩", "aliases": [], "sp": 2,
     "title": "我终于承认：自己并不想成为成功的大人", "display": "不想成功的大人",
     "note": "佩轩采访程小咩，嘉宾内容为发言人2"},
    {"ep": "04", "find": ["碎片时间"], "guest": "糖糖", "aliases": [], "sp": 2,
     "title": "职场人利用碎片时间做社群，她用副业给自己涨薪几千", "display": "碎片时间社群"},
    {"ep": "05", "find": ["10种副业"], "guest": "橙子", "aliases": [], "sp": 2,
     "title": "试过10种副业后发现，最赚钱的都做过这一步", "display": "副业关键一步",
     "note": "橙子提问程小咩，嘉宾内容为发言人2"},
    {"ep": "06", "find": ["一人公司"], "guest": "KV", "aliases": ["Kivi"], "sp": 2,
     "title": "3个月跑通一人公司，她从大厂运营到数字游民", "display": "KV数字游民"},
    {"ep": "07", "find": ["AI电商"], "guest": "阿龙", "aliases": [], "sp": 1,
     "title": "AI电商月入过万后，他为什么要重新做个人IP？", "display": "AI电商转IP"},
    {"ep": "08", "find": ["破圈真相"], "guest": "千儿", "aliases": ["谦儿", "李浩天"], "sp": 1,
     "title": "上班族破圈真相：你的贵人不一定是长辈，反而可能是同龄人", "display": "同龄人贵人"},
    {"ep": "09", "find": ["占星"], "guest": "JK老师", "aliases": [], "sp": 1,
     "title": "不想卷职场后，他靠占星实现每天工作1小时", "display": "占星1小时工作"},
    {"ep": "10", "find": ["24小时"], "guest": "渺渺", "aliases": ["淼淼"], "sp": 1,
     "title": "不想继续上班后，她开了一家24小时替自己赚钱的店", "display": "24h自动赚钱店",
     "note": "开头转写曾混发言人，已按发言人1取嘉宾主内容"},
    {"ep": "11", "find": ["办公室困住"], "guest": "Allen", "aliases": [], "sp": 1,
     "title": "不想被办公室困住后，他开始一边旅行一边赚钱", "display": "旅行边赚Allen"},
    {"ep": "12", "find": ["AI写真"], "guest": "布噜", "aliases": ["不撸"], "sp": 2,
     "title": "不想露脸做副业？她靠AI写真建立了一份被动收入", "display": "AI写真被动收入"},
]


def find_file(keys: list[str]) -> Path | None:
    for fn in DOWNLOADS.iterdir():
        if fn.suffix != ".docx":
            continue
        name = fn.name
        if all(k in name for k in keys):
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
        f"节目：播客《迷你退休》·{ep['title']}",
        f"嘉宾：{ep['guest']}{alias}",
        "主持人：程小咩",
    ]
    if ep.get("note"):
        parts.append(f"说明：{ep['note']}")
    parts += ["", "【嘉宾分享】", guest.strip()]
    if host.strip():
        parts += ["", "【主持人程小咩追问与补充（供理解语境）】", host.strip()[:8000]]
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
            print("MISSING", ep["ep"], ep["find"])
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
        print(ep["ep"], ep["display"], profiles[-1]["guest_len"], profiles[-1]["host_len"])

    OUT.write_text(json.dumps(profiles, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", len(profiles), "->", OUT)


if __name__ == "__main__":
    main()
