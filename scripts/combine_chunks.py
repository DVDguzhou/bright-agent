#!/usr/bin/env python3
"""Combine numbered chunk files into one destination file."""
import glob
import os
import re
import sys

LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")


def strip_lines(text: str) -> str:
    lines = text.splitlines()
    out = []
    for line in lines:
        m = LINE_PREFIX.match(line)
        out.append(m.group(1) if m else line)
    return "\n".join(out)


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: combine_chunks.py <chunk_dir> <dest_file>", file=sys.stderr)
        sys.exit(1)
    chunk_dir, dest_file = sys.argv[1], sys.argv[2]
    paths = sorted(
        glob.glob(os.path.join(chunk_dir, "*.part")),
        key=lambda p: int(os.path.splitext(os.path.basename(p))[0]),
    )
    with open(dest_file, "w", encoding="utf-8", newline="\n") as out:
        for i, path in enumerate(paths):
            with open(path, "r", encoding="utf-8") as f:
                content = strip_lines(f.read())
            if i > 0 and content and not content.startswith("\n"):
                out.write("\n")
            out.write(content)
            if content and not content.endswith("\n"):
                out.write("\n")


if __name__ == "__main__":
    main()
