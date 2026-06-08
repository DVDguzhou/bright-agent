#!/usr/bin/env python3
"""Read source file in 800-line chunks and write to extract (handles editor-synced paths)."""
from __future__ import annotations

import argparse
import os
import re
import sys

CHUNK = 800
SKIP = ("> 供 GPT", "只基于下列真实材料加工，勿编造")
ENTRY = re.compile(r"^##\s+\d+\.")


def should_skip(line: str, first: bool) -> bool:
    return first and any(s in line for s in SKIP)


def flush(src: str, dest: str) -> tuple[int, int]:
    if not os.path.exists(src):
        print(f"MISSING: {src}", file=sys.stderr)
        sys.exit(1)
    with open(src, encoding="utf-8") as f:
        lines = f.read().splitlines()
    total = len(lines)
    if total == 0:
        print(f"EMPTY: {src}", file=sys.stderr)
        sys.exit(1)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    first_line = True
    written = 0
    with open(dest, "w", encoding="utf-8", newline="\n") as out:
        for i in range(0, total, CHUNK):
            chunk = lines[i : i + CHUNK]
            if first_line:
                chunk = [ln for ln in chunk if not should_skip(ln, True)]
                first_line = False
            text = "\n".join(chunk)
            if chunk:
                text += "\n"
            out.write(text)
            written += len(chunk)
            print(f"  chunk {i // CHUNK + 1}: {len(chunk)} lines")
    entries = sum(1 for ln in lines if ENTRY.match(ln))
    print(f"OK {os.path.basename(dest)}: {written} lines, {entries} entries")
    return written, entries


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("dest")
    args = p.parse_args()
    flush(args.src, args.dest)


if __name__ == "__main__":
    main()
