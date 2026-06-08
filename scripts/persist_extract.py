#!/usr/bin/env python3
"""Persist a markdown extract by combining numbered chunk files."""
import argparse
import glob
import os
import re
import sys

LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")


def strip_text(text: str) -> str:
    lines = text.splitlines()
    out = []
    for line in lines:
        m = LINE_PREFIX.match(line)
        out.append(m.group(1) if m else line)
    return "\n".join(out)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dest")
    parser.add_argument("chunk_dir")
    args = parser.parse_args()

    paths = sorted(
        glob.glob(os.path.join(args.chunk_dir, "*.part")),
        key=lambda p: int(os.path.splitext(os.path.basename(p))[0]),
    )
    if not paths:
        print("no chunk files found", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(args.dest), exist_ok=True)
    with open(args.dest, "w", encoding="utf-8", newline="\n") as out:
        for i, path in enumerate(paths):
            with open(path, "r", encoding="utf-8") as f:
                content = strip_text(f.read())
            if i > 0 and content:
                out.write("\n")
            out.write(content)
            if content and not content.endswith("\n"):
                out.write("\n")

    with open(args.dest, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()
    entries = sum(1 for line in lines if re.match(r"^##\s+\d+\.", line))
    print(f"lines={len(lines)} entries={entries}")


if __name__ == "__main__":
    main()
