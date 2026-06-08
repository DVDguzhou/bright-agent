#!/usr/bin/env python3
"""Capture Read-tool slices into .part files via stdin (line-number prefixed ok)."""
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent
PREFIX = re.compile(r"^\s*\d+\|(.*)$")
SKIP = re.compile(r"^\.\.\. \d+ lines not shown \.\.\.$")


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
    if len(sys.argv) < 3:
        print("usage: _write_parts.py <part_no> <start_line>", file=sys.stderr)
        sys.exit(1)
    part_no, start = int(sys.argv[1]), int(sys.argv[2])
    lines = strip_raw(sys.stdin.read())
    path = OUT / f"{part_no}.part"
    content = "\n".join(lines) + ("\n" if lines else "")
    path.write_text(content, encoding="utf-8", newline="\n")
    print(f"wrote {path.name}: {len(lines)} lines from line {start}")


if __name__ == "__main__":
    main()
