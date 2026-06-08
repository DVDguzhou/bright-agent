#!/usr/bin/env python3
"""Persist full extract from Read-tool raw capture (line-number prefixed)."""
import re
import sys
from pathlib import Path

PREFIX = re.compile(r"^\s*\d+\|(.*)$")
SKIP = re.compile(r"^\.\.\. \d+ lines not shown \.\.\.$")
DEST = Path(r"d:\regr\docs\agent-interview\西瓜oo喝绿茶-extract.md")


def strip_raw(text: str) -> list[str]:
    out = []
    for line in text.splitlines():
        s = line.strip()
        if SKIP.match(s):
            continue
        m = PREFIX.match(line)
        out.append(m.group(1) if m else line)
    return out


def main() -> None:
    raw_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if raw_path and raw_path.exists():
        text = raw_path.read_text(encoding="utf-8")
    else:
        text = sys.stdin.read()
    lines = strip_raw(text)
    content = "\n".join(lines) + "\n"
    DEST.write_text(content, encoding="utf-8", newline="\n")
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"{DEST.name} | {len(lines)} | {entries} | success")


if __name__ == "__main__":
    main()
