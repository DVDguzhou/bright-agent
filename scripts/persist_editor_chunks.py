#!/usr/bin/env python3
"""Merge staged chunk files into *-extract.md (first chunk overwrites, rest append)."""
from __future__ import annotations

import argparse
import glob
import os
import re
import sys

LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")
SKIP = ("> 供 GPT", "只基于下列真实材料加工，勿编造")


def strip_lines(text: str) -> list[str]:
    out: list[str] = []
    for line in text.splitlines():
        m = LINE_PREFIX.match(line)
        out.append(m.group(1) if m else line)
    return out


def should_skip(line: str, first_chunk: bool) -> bool:
    return first_chunk and any(s in line for s in SKIP)


def merge(name: str, interview_dir: str, staging_dir: str) -> tuple[int, int]:
    extract = os.path.join(interview_dir, f"{name}-extract.md")
    pattern = os.path.join(staging_dir, f"{name}-part*.md")
    parts = sorted(
        glob.glob(pattern),
        key=lambda p: int(re.search(r"part(\d+)", p).group(1)),  # type: ignore[union-attr]
    )
    if not parts:
        print(f"no parts for {name}", file=sys.stderr)
        sys.exit(1)

    total_lines = 0
    for i, path in enumerate(parts):
        lines = strip_lines(open(path, encoding="utf-8").read())
        lines = [ln for ln in lines if not should_skip(ln, i == 0)]
        text = "\n".join(lines)
        if lines:
            text += "\n"
        if i == 0:
            with open(extract, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
        else:
            with open(extract, "a", encoding="utf-8", newline="\n") as f:
                f.write(text)
        total_lines += len(lines)
        print(f"  {os.path.basename(path)}: {len(lines)} lines")

    with open(extract, encoding="utf-8") as f:
        all_lines = f.read().splitlines()
    entries = sum(1 for ln in all_lines if re.match(r"^##\s+\d+\.", ln))
    print(f"OK {name}-extract.md: {len(all_lines)} lines, {entries} entries")
    return len(all_lines), entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("name", help="persona base name, e.g. 慵懒的锦鲤7")
    parser.add_argument(
        "--interview",
        default=os.path.join(os.path.dirname(__file__), "..", "docs", "agent-interview"),
    )
    parser.add_argument(
        "--staging",
        default=os.path.join(
            os.path.dirname(__file__), "..", "docs", "agent-interview", ".staging"
        ),
    )
    args = parser.parse_args()
    merge(args.name, os.path.normpath(args.interview), os.path.normpath(args.staging))


if __name__ == "__main__":
    main()
