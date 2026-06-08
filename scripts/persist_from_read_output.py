#!/usr/bin/env python3
"""Persist markdown by stripping Read-tool line prefixes from stdin or file."""
import argparse
import re
import sys

LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")
META_PREFIX = re.compile(r"^file://")


def strip_text(text: str) -> str:
    lines = []
    for line in text.splitlines():
        if META_PREFIX.match(line):
            continue
        m = LINE_PREFIX.match(line)
        lines.append(m.group(1) if m else line)
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dest")
    parser.add_argument("--input", "-i", help="input file; default stdin")
    args = parser.parse_args()

    if args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = sys.stdin.read()

    content = strip_text(raw)
    if content and not content.endswith("\n"):
        content += "\n"

    with open(args.dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

    lines = content.splitlines()
    entries = sum(1 for line in lines if re.match(r"^##\s+\d+\.", line))
    print(f"lines={len(lines)} entries={entries}")


if __name__ == "__main__":
    main()
