#!/usr/bin/env python3
"""Extract chunked Read-tool results for an extract file from agent transcripts."""
import json
import re
import sys
from pathlib import Path

TRANSCRIPT_DIR = Path(r"C:\Users\Caiqing\.cursor\projects\d-regr\agent-transcripts")
TARGET = "西瓜oo喝绿茶-extract.md"
DEST = Path(r"d:\regr\docs\agent-interview") / TARGET
PREFIX = re.compile(r"^\s*(\d+)\|(.*)$")
SKIP = re.compile(r"^\.\.\. \d+ lines not shown \.\.\.$")
CHUNK_DIR = Path(r"d:\regr\scripts\chunks\西瓜oo喝绿茶-extract.md")


def strip_chunk(text: str) -> dict[int, str]:
    lines: dict[int, str] = {}
    for raw in text.splitlines():
        s = raw.strip()
        if SKIP.match(s):
            continue
        m = PREFIX.match(raw)
        if m:
            lines[int(m.group(1))] = m.group(2)
    return lines


def collect_from_jsonl(path: Path) -> dict[int, str]:
    merged: dict[int, str] = {}
    try:
        data = path.read_text(encoding="utf-8")
    except OSError:
        return merged
    for line in data.splitlines():
        if TARGET not in line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue

        def walk(o):
            if isinstance(o, str):
                if "# 西瓜oo喝绿茶" in o or "西瓜oo喝绿茶-extract" in o:
                    merged.update(strip_chunk(o))
            elif isinstance(o, dict):
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)

        walk(obj)
    return merged


def main() -> None:
    all_lines: dict[int, str] = {}
    for jsonl in TRANSCRIPT_DIR.rglob("*.jsonl"):
        chunk = collect_from_jsonl(jsonl)
        if chunk:
            all_lines.update(chunk)

    if not all_lines:
        print("FAIL: no Read chunks found in transcripts", file=sys.stderr)
        sys.exit(1)

    max_line = max(all_lines)
    ordered = [all_lines[i] for i in range(1, max_line + 1) if i in all_lines]
    missing = [i for i in range(1, max_line + 1) if i not in all_lines]
    if missing:
        print(f"WARN: missing line numbers: {len(missing)} gaps", file=sys.stderr)

    content = "\n".join(ordered) + "\n"
    DEST.write_text(content, encoding="utf-8", newline="\n")

    entries = sum(1 for ln in ordered if re.match(r"^## \d+\.", ln))
    print(f"{TARGET} | {len(ordered)} | {entries} | success")


if __name__ == "__main__":
    main()
