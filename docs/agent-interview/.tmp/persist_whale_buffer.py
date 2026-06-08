#!/usr/bin/env python3
"""Persist whale extract from numbered .part chunks using combine_chunks logic."""
import glob
import os
import re
import sys

LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")
CHUNK_DIR = os.path.join(os.path.dirname(__file__), "whale-chunks")
DEST = os.path.join(os.path.dirname(__file__), "..", "鲸鱼ya在跑步-extract.md")


def strip_lines(text: str) -> str:
    lines = text.splitlines()
    out = []
    for line in lines:
        m = LINE_PREFIX.match(line)
        out.append(m.group(1) if m else line)
    return "\n".join(out)


def main() -> None:
    paths = sorted(
        glob.glob(os.path.join(CHUNK_DIR, "*.part")),
        key=lambda p: int(os.path.splitext(os.path.basename(p))[0]),
    )
    if not paths:
        print("No chunk files found", file=sys.stderr)
        sys.exit(1)
    with open(DEST, "w", encoding="utf-8", newline="\n") as out:
        for i, path in enumerate(paths):
            with open(path, "r", encoding="utf-8") as f:
                content = strip_lines(f.read())
            if i > 0 and content and not content.startswith("\n"):
                out.write("\n")
            out.write(content)
            if content and not content.endswith("\n"):
                out.write("\n")
    with open(DEST, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(lines)} entries={entries}")


if __name__ == "__main__":
    main()
