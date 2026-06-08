#!/usr/bin/env python3
"""Merge staging parts into extract markdown."""
import re
import sys
from pathlib import Path

BASE = Path(r"d:\regr\docs\agent-interview")
STAGING = BASE / ".staging"
DISCLAIMER = "只基于下列真实材料加工，勿编造"
GPT_LINE = re.compile(r"^>\s*供\s*GPT")


def clean_first(text: str) -> str:
    lines = []
    for line in text.splitlines():
        if GPT_LINE.match(line):
            continue
        if DISCLAIMER in line:
            line = line.replace(DISCLAIMER, "").replace("。。", "。").strip()
            if line in (">", ""):
                continue
            if line.startswith(">") and "import-persona" in line:
                continue
        lines.append(line)
    return "\n".join(lines)


def merge(name: str) -> tuple[int, int]:
    staging = STAGING / name
    parts = sorted(staging.glob("part*.md"), key=lambda p: int(p.stem.replace("part", "")))
    if not parts:
        raise SystemExit(f"no parts in {staging}")
    chunks = []
    for i, p in enumerate(parts):
        text = p.read_text(encoding="utf-8")
        chunks.append(clean_first(text) if i == 0 else text.rstrip("\n"))
    body = "\n".join(chunks) + "\n"
    out = BASE / f"{name}-extract.md"
    out.write_text(body, encoding="utf-8", newline="\n")
    lines = body.splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    return len(lines), entries


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        n, e = merge(arg)
        print(f"OK\t{arg}\tlines={n}\tentries={e}")
