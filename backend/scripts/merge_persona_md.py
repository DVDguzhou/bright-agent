#!/usr/bin/env python3
"""Merge *-extract.md narrative entries into *-merged.md (same rules as import-persona)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

NARRATIVE_EXPLICIT = re.compile(r"^##\s+\d+\.\s+标题[：:]\s*(.+)$")
NARRATIVE_PIPE = re.compile(r"^##\s+\d{1,2}｜\s*(.+)$")
NARRATIVE_BARE = re.compile(r"^##\s+\d{1,2}\s*$")
SUB_TITLE = re.compile(r"^###\s+标题[：:]\s*(.+)$")

RAW_HEADINGS = {
    "Agent 元信息", "背景", "基本背景", "申请情况", "申请流程与结果",
    "申请流程", "申请结果", "申请心得", "准备工作", "实习机会",
    "就读体验", "经历分享&总结", "经历分享", "联系方式",
    "所获荣誉", "明确方向，经验分享", "留学新篇章",
    "01 基本背景", "02 申请时间线", "03 准备工作", "04 实习机会", "05 就读体验",
    "去哪里", "语言考试", "申请", "就业", "总结",
}


def strip_preamble(text: str) -> str:
    out: list[str] = []
    for ln in text.splitlines():
        t = ln.strip()
        if t.startswith("> 供 GPT") or "只基于下列真实材料加工" in t:
            continue
        if t.startswith(">") and "勿编造" in t:
            continue
        out.append(ln)
    return "\n".join(out)


def has_narrative_mode(lines: list[str]) -> bool:
    for ln in lines:
        s = ln.strip()
        if NARRATIVE_EXPLICIT.match(s) or NARRATIVE_PIPE.match(s) or NARRATIVE_BARE.match(s):
            return True
    return False


def is_meta_stop(t: str) -> bool:
    if not t:
        return False
    if t.startswith(("**归属线", "### 归属线", "**🔴", "### 🔴")):
        return True
    if t.startswith(("事实/虚构说明", "事实/虚构", "**事实/虚构", "真实依据：", "虚构部分：")):
        return True
    if t.startswith(("# 本批自评", "# 最终自评", "# 【自评】", "# 人物行为模式")):
        return True
    if t.startswith("下面是 **第") or (t.startswith("下面是 **") and "批" in t):
        return True
    if t.startswith(("**本批整体虚构比例", "**整体虚构比例")):
        return True
    if t.startswith(("* 原文真有", "* 推演扩写", "* 凭空编造", "* 扩写/推演", "* 推断/扩写")):
        return True
    return False


def clean_body(raw: str) -> str:
    lines = raw.splitlines()
    out: list[str] = []
    i = 0
    while i < len(lines):
        t = lines[i].strip()
        if t == "---":
            i += 1
            continue
        if is_meta_stop(t):
            break
        if t in ("**回答：**", "**正文：**", "### 正文：") or t.startswith("### 标题："):
            i += 1
            continue
        if t.startswith("**追问补充：**"):
            extra = t.removeprefix("**追问补充：**").strip()
            if extra:
                out.append(extra)
            i += 1
            continue
        if t.startswith("**适合 AI 学长"):
            i += 1
            while i < len(lines):
                tt = lines[i].strip()
                if is_meta_stop(tt):
                    break
                if tt and tt != "---":
                    out.append(lines[i])
                i += 1
            continue
        out.append(lines[i])
        i += 1
    return "\n".join(out).strip()


def is_raw_heading(rest: str) -> bool:
    rest = rest.strip("* ")
    if rest in RAW_HEADINGS:
        return True
    if rest.startswith("0") and " " in rest:
        for p in ("基本背景", "申请", "准备", "实习", "就读", "经验", "总结"):
            if p in rest:
                return True
    return False


def title_from_subheading(buf: list[str]) -> str:
    for ln in buf:
        m = SUB_TITLE.match(ln.strip())
        if m:
            return m.group(1).strip()
    return ""


def heading_title(line: str, narrative_only: bool) -> str | None:
    s = line.strip()
    if not s.startswith("## "):
        return None
    m = NARRATIVE_EXPLICIT.match(s)
    if m:
        return m.group(1).strip()
    m = NARRATIVE_PIPE.match(s)
    if m:
        return m.group(1).strip()
    if NARRATIVE_BARE.match(s):
        return ""
    if narrative_only:
        return None
    rest = s[3:].strip()
    if is_raw_heading(rest) or rest.startswith("当前进度"):
        return None
    return rest


def parse(text: str) -> list[tuple[str, str]]:
    text = strip_preamble(text.replace("\r\n", "\n"))
    lines = text.split("\n")
    narrative_only = has_narrative_mode(lines)
    items: list[tuple[str, str]] = []
    cur_title: str | None = None
    buf: list[str] = []

    def flush() -> None:
        nonlocal cur_title, buf
        if cur_title is None:
            return
        title = cur_title or title_from_subheading(buf)
        body = clean_body("\n".join(buf))
        if title and len(body) >= 20:
            items.append((title, body))
        cur_title = None
        buf = []

    for ln in lines:
        t = heading_title(ln, narrative_only)
        if t is not None:
            flush()
            cur_title = t
            continue
        if cur_title is not None:
            buf.append(ln)
    flush()
    return items


def write_merged(path: Path, name: str, source: Path, items: list[tuple[str, str]]) -> None:
    lines = [
        f"# {name} · 合并知识库",
        "",
        f"> 由 {source.name} 合并：{len(items)} 条叙事知识条目，已剔除批次小结与内部标注。",
        "",
    ]
    for title, body in items:
        lines.extend([f"## {title}", "", body, ""])
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    if len(sys.argv) != 4:
        print("usage: merge_persona_md.py <extract.md> <display_name> <merged.md>", file=sys.stderr)
        sys.exit(1)
    extract, name, merged = map(Path, sys.argv[1:4])
    items = parse(extract.read_text(encoding="utf-8"))
    write_merged(merged, name, extract, items)
    print(f"merged {len(items)} entries -> {merged}")


if __name__ == "__main__":
    main()
