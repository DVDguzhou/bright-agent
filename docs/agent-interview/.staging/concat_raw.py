#!/usr/bin/env python3
"""Concatenate numbered raw chunk files into extract."""
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

def concat(name: str, parts: list[str]) -> int:
    out = INTERVIEW / f"{name}-extract.md"
    total = 0
    for i, part in enumerate(parts, 1):
        p = STAGING / part
        if not p.exists():
            print(f"MISSING {p}", file=sys.stderr)
            sys.exit(1)
        lines = strip_numbered(p.read_text(encoding="utf-8"))
        if i == 1:
            lines = [ln for ln in lines if not any(s in ln for s in SKIP)]
        text = "\n".join(lines)
        if lines:
            text += "\n"
        if i == 1:
            out.write_text(text, encoding="utf-8", newline="\n")
        else:
            with out.open("a", encoding="utf-8", newline="\n") as f:
                f.write(text)
        total += len(lines)
        print(f"  part {i}: {len(lines)} lines")
    print(f"OK {out.name}: {total} lines")
    return total

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: concat_raw.py <name> <part1> [part2 ...]")
        sys.exit(1)
    concat(sys.argv[1], sys.argv[2:])
