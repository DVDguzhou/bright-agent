#!/usr/bin/env python3
"""Write .part files from Read-tool raw text files (line-number prefixed)."""
import re
import sys
from pathlib import Path

PREFIX = re.compile(r"^\s*\d+\|(.*)$")
SKIP = re.compile(r"^\.\.\. \d+ lines not shown \.\.\.$")


def strip_raw(text: str) -> str:
    out = []
    for line in text.splitlines():
        s = line.strip()
        if SKIP.match(s):
            continue
        m = PREFIX.match(line)
        out.append(m.group(1) if m else line)
    return "\n".join(out) + "\n"


def main() -> None:
    if len(sys.argv) < 4:
        print("usage: raw_to_part.py <raw_file> <part_file> <start_line> <end_line>", file=sys.stderr)
        sys.exit(1)
    raw_file, part_file, start, end = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    lines = {}
    for raw in Path(raw_file).read_text(encoding="utf-8").splitlines():
        s = raw.strip()
        if SKIP.match(s):
            continue
        m = PREFIX.match(raw)
        if m:
            lines[int(m.group(1))] = m.group(2)
    chunk = [lines[i] for i in range(start, end + 1) if i in lines]
    Path(part_file).write_text("\n".join(chunk) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {part_file}: {len(chunk)} lines")


if __name__ == "__main__":
    main()
