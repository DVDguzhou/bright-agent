#!/usr/bin/env python3
"""Strip Read-tool prefixes and write .part files for 慵懒的锦鲤7."""
import re
import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent
LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")
SKIP_META = re.compile(r"^\.\.\.\s+\d+\s+lines not shown\s+\.\.\.\s*$")

CHUNKS = [
    (1, 1, 400),
    (2, 401, 400),
    (3, 801, 400),
    (4, 1201, 400),
    (5, 1601, 400),
    (6, 2001, 400),
    (7, 2401, 400),
    (8, 2801, 400),
    (9, 3201, 500),
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
    print(f"Stripped {len(lines)} lines")
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
