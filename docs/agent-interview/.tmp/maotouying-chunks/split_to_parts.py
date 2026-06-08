#!/usr/bin/env python3
"""Split numbered Read output into .part files for combine_chunks.py."""
import re
import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent
LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")
SKIP_META = re.compile(r"^\.\.\.\s+\d+\s+lines not shown\s+\.\.\.\s*$")

CHUNKS = [
    (0, 1, 400),
    (1, 401, 400),
    (2, 801, 400),
    (3, 1201, 400),
    (4, 1601, 400),
    (5, 2001, 400),
    (6, 2401, 400),
]


def strip_numbered(text: str) -> list[str]:
    out: list[str] = []
    for line in text.splitlines():
        s = line.rstrip("\r\n")
        if SKIP_META.match(s.strip()):
            continue
        m = LINE_PREFIX.match(s)
        out.append(m.group(1) if m else s)
    return out


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    raw = src.read_text(encoding="utf-8") if src and src.exists() else sys.stdin.read()
    lines = strip_numbered(raw)
    total = len(lines)
    print(f"Stripped {total} lines")
    for part_no, start, limit in CHUNKS:
        chunk = lines[start - 1 : start - 1 + limit]
        path = OUT_DIR / f"{part_no}.part"
        content = "\n".join(chunk)
        if content:
            content += "\n"
        path.write_text(content, encoding="utf-8", newline="\n")
        print(f"{path.name}: {len(chunk)} lines")


if __name__ == "__main__":
    main()
