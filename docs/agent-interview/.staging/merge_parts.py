#!/usr/bin/env python3
"""Merge part files into extract, stripping Read-tool line prefixes."""
import re
import sys
from pathlib import Path

BASE = Path(r"d:\regr\docs\agent-interview")
STAGING = BASE / ".staging"
SKIP_LINES = ("> 供 GPT", "只基于下列真实材料加工，勿编造")
PREFIX = re.compile(r"^\s*\d+\|(.*)$")


def strip_text(text: str, first: bool) -> str:
    out = []
    for line in text.splitlines():
        m = PREFIX.match(line)
        content = m.group(1) if m else line
        if first and any(s in content for s in SKIP_LINES):
            if "> 供 GPT" in content:
                continue
            content = content.replace("只基于下列真实材料加工，勿编造", "").replace("。。", "。")
        out.append(content)
    return "\n".join(out) + ("\n" if out else "")


def merge(name: str, parts: list[Path]) -> dict:
    extract = BASE / f"{name}-extract.md"
    chunks = []
    for i, part in enumerate(parts):
        if not part.exists():
            raise FileNotFoundError(part)
        chunks.append(strip_text(part.read_text(encoding="utf-8"), i == 0))
    extract.write_text("".join(chunks), encoding="utf-8", newline="\n")
    text = extract.read_text(encoding="utf-8")
    entries = len(re.findall(r"^## \d+\.", text, re.M))
    return {"lines": len(text.splitlines()), "entries": entries, "path": str(extract)}


if __name__ == "__main__":
    name = sys.argv[1]
    part_dir = STAGING / name
    parts = sorted(part_dir.glob("part*.md"), key=lambda p: int(p.stem.replace("part", "")))
    if not parts:
        print(f"No parts in {part_dir}", file=sys.stderr)
        sys.exit(1)
    r = merge(name, parts)
    print(f"OK {name}: lines={r['lines']} entries={r['entries']}")
