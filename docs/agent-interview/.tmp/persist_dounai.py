#!/usr/bin/env python3
"""Merge numbered .part chunk files into extract markdown."""
import glob
import os
import re
import sys

LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")
DISCLAIMER = "只基于下列真实材料加工，勿编造"


def strip_line(line: str) -> str:
    m = LINE_PREFIX.match(line)
    return m.group(1) if m else line


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: persist_dounai.py <chunk_dir> <dest_file>", file=sys.stderr)
        sys.exit(1)
    chunk_dir, dest_file = sys.argv[1], sys.argv[2]
    paths = sorted(
        glob.glob(os.path.join(chunk_dir, "*.part")),
        key=lambda p: int(os.path.splitext(os.path.basename(p))[0]),
    )
    if not paths:
        print(f"no .part files in {chunk_dir}", file=sys.stderr)
        sys.exit(1)
    all_lines: list[str] = []
    for i, path in enumerate(paths):
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.rstrip("\n\r")
                content = strip_line(line)
                if i == 0 and DISCLAIMER in content:
                    content = content.replace(DISCLAIMER, "").replace("。。", "。")
                all_lines.append(content)
    with open(dest_file, "w", encoding="utf-8", newline="\n") as out:
        out.write("\n".join(all_lines))
        if all_lines:
            out.write("\n")
    entries = sum(1 for ln in all_lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(all_lines)} entries={entries} chunks={len(paths)}")
