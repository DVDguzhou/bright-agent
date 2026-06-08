#!/usr/bin/env python3
"""Merge numbered .part chunk files (Read-tool format) into destination."""
import glob
import os
import re
import sys

LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")


def strip_lines(text: str) -> list[str]:
    out = []
    for line in text.splitlines():
        m = LINE_PREFIX.match(line)
        out.append(m.group(1) if m else line)
    return out


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: persist_read_chunks.py <chunk_dir> <dest_file>", file=sys.stderr)
        sys.exit(1)
    chunk_dir, dest_file = sys.argv[1], sys.argv[2]
    paths = sorted(
        glob.glob(os.path.join(chunk_dir, "*.part")),
        key=lambda p: int(os.path.splitext(os.path.basename(p))[0]),
    )
    if not paths:
        print(f"no *.part files in {chunk_dir}", file=sys.stderr)
        sys.exit(1)
    all_lines: list[str] = []
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            all_lines.extend(strip_lines(f.read()))
    with open(dest_file, "w", encoding="utf-8", newline="\n") as out:
        out.write("\n".join(all_lines))
        if all_lines:
            out.write("\n")
    print(f"Wrote {len(all_lines)} lines to {dest_file}")


if __name__ == "__main__":
    main()
