#!/usr/bin/env python3
"""Merge numbered raw chunks into extract.md files."""
import re
import sys
from pathlib import Path

STAGING = Path(__file__).parent
INTERVIEW = STAGING.parent

SKIP = ("> 供 GPT", "只基于下列真实材料加工，勿编造")

def strip_numbered(text: str) -> list[str]:
    pat = re.compile(r"^\s*\d+\|(.*)$")
    out = []
    for line in text.splitlines():
        m = pat.match(line)
        out.append(m.group(1) if m else line)
    return out

def should_skip(line: str, first_chunk: bool) -> bool:
    return first_chunk and any(s in line for s in SKIP)

def merge_persona(name: str, chunk_count: int) -> int:
    extract = INTERVIEW / f"{name}-extract.md"
    total = 0
    for i in range(1, chunk_count + 1):
        raw = STAGING / f"{name}-raw-{i}.txt"
        if not raw.exists():
            print(f"MISSING: {raw}", file=sys.stderr)
            sys.exit(1)
        lines = strip_numbered(raw.read_text(encoding="utf-8"))
        if i == 1:
            lines = [ln for ln in lines if not should_skip(ln, True)]
        text = "\n".join(lines)
        if lines:
            text += "\n"
        if i == 1:
            extract.write_text(text, encoding="utf-8", newline="\n")
        else:
            with extract.open("a", encoding="utf-8", newline="\n") as f:
                f.write(text)
        total += len(lines)
        print(f"  chunk {i}: {len(lines)} lines")
    print(f"OK {extract.name}: {total} lines total")
    return total

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: persist_all.py <name> <chunk_count>")
        sys.exit(1)
    merge_persona(sys.argv[1], int(sys.argv[2]))
