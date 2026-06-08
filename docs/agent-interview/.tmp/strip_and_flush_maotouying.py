#!/usr/bin/env python3
"""Strip Cursor metadata prefix and write clean UTF-8 extract."""
import re
from pathlib import Path

SRC = Path(r"d:\regr\docs\agent-interview\猫头鹰x去爬山-extract.md")
DEST = SRC
META = re.compile(r"^file:///.*?\n", re.DOTALL)
PREFIX = re.compile(r"^\s*\d+\|(.*)$")


def clean_text(raw: str) -> str:
    raw = META.sub("", raw, count=1)
    lines = []
    for line in raw.splitlines():
        m = PREFIX.match(line)
        lines.append(m.group(1) if m else line)
    return "\n".join(lines) + ("\n" if lines else "")


def main() -> None:
    text = SRC.read_text(encoding="utf-8", errors="replace")
    out = clean_text(text)
    DEST.write_text(out, encoding="utf-8", newline="\n")
    lines = out.splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(lines)}\tentries={entries}")


if __name__ == "__main__":
    main()
