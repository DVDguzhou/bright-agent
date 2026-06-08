#!/usr/bin/env python3
"""Merge Read-tool chunk files: strip line prefixes and skip ellipsis lines."""
import glob
import os
import re
import sys

LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")
SKIP = re.compile(r"^\.\.\. \d+ lines not shown \.\.\.$")


def strip_file(path: str) -> str:
    out = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f.read().splitlines():
            s = line.strip()
            if SKIP.match(s):
                continue
            m = LINE_PREFIX.match(line)
            out.append(m.group(1) if m else line)
    return "\n".join(out)


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: merge_read_chunks.py <chunk_glob> <dest_file>", file=sys.stderr)
        sys.exit(1)
    pattern, dest = sys.argv[1], sys.argv[2]
    paths = sorted(glob.glob(pattern), key=lambda p: int(re.search(r"(\d+)", os.path.basename(p)).group(1)))
    parts = [strip_file(p) for p in paths]
    content = "\n".join(parts)
    if not content.endswith("\n"):
        content += "\n"
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print(f"merged {len(paths)} chunks -> {dest}")


if __name__ == "__main__":
    main()
