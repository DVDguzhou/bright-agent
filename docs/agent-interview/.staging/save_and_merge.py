#!/usr/bin/env python3
"""Save raw Read-tool chunk and/or merge all parts into extract."""
import re
import sys
from pathlib import Path

BASE = Path(r"d:\regr\docs\agent-interview")
STAGING = BASE / ".staging"
SKIP = ("> 供 GPT", "只基于下列真实材料加工，勿编造")
PREFIX = re.compile(r"^\s*\d+\|(.*)$")


def strip_chunk(text: str, first: bool) -> str:
    out = []
    for line in text.splitlines():
        m = PREFIX.match(line)
        content = m.group(1) if m else line
        if first and any(s in content for s in SKIP):
            if "> 供 GPT" in content:
                continue
            content = content.replace("只基于下列真实材料加工，勿编造", "").strip()
            if content.startswith("。"):
                content = content[1:].strip()
        out.append(content)
    return "\n".join(out) + ("\n" if out else "")


def merge(name: str) -> dict:
    part_dir = STAGING / name
    parts = sorted(part_dir.glob("part*.md"), key=lambda p: int(p.stem.replace("part", "")))
    if not parts:
        raise FileNotFoundError(f"No parts in {part_dir}")
    extract = BASE / f"{name}-extract.md"
    chunks = [strip_chunk(p.read_text(encoding="utf-8"), i == 0) for i, p in enumerate(parts)]
    extract.write_text("".join(chunks), encoding="utf-8", newline="\n")
    text = extract.read_text(encoding="utf-8")
    entries = len(re.findall(r"^## \d+\.", text, re.M))
    return {"lines": len(text.splitlines()), "entries": entries, "path": str(extract)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: save_and_merge.py <name>")
        sys.exit(1)
    r = merge(sys.argv[1])
    print(f"OK {sys.argv[1]}: lines={r['lines']} entries={r['entries']}")
