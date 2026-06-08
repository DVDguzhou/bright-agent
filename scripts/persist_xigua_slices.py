#!/usr/bin/env python3
"""Assemble 西瓜oo喝绿茶 extract from numbered Read slices via append_chunk."""
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(r"d:\regr")
SRC = REPO / "docs" / "agent-interview" / "西瓜oo喝绿茶-extract.md"
CHUNK_DIR = REPO / "scripts" / "chunks" / "西瓜oo喝绿茶-extract.md"
APPEND = REPO / "scripts" / "append_chunk.py"
TMP = CHUNK_DIR / "_slice.tmp"
SLICES = [(1, 400), (401, 400), (801, 400), (1201, 400), (1601, 400)]


def strip_numbered(text: str) -> str:
    pat = re.compile(r"^\s*\d+\|(.*)$")
    skip = re.compile(r"^\.\.\. \d+ lines not shown \.\.\.$")
    out = []
    for line in text.splitlines():
        s = line.strip()
        if skip.match(s):
            continue
        m = pat.match(line)
        out.append(m.group(1) if m else line)
    return "\n".join(out) + "\n"


def read_slice(start: int, limit: int) -> str:
    lines = SRC.read_text(encoding="utf-8").splitlines()
    # Read tool returns editor buffer; if disk is short, this won't work for middle slices.
    chunk = lines[start - 1 : start - 1 + limit]
    return "\n".join(chunk) + ("\n" if chunk else "")


def main() -> None:
    all_lines: list[str] = []
    for i, (start, limit) in enumerate(SLICES):
        part = CHUNK_DIR / f"{i + 1}.part"
        if part.exists() and part.stat().st_size > 100:
            text = part.read_text(encoding="utf-8")
        else:
            text = read_slice(start, limit)
            part.write_text(text, encoding="utf-8", newline="\n")
        all_lines.extend(text.splitlines())
    content = "\n".join(all_lines) + "\n"
    SRC.write_text(content, encoding="utf-8", newline="\n")
    entries = sum(1 for ln in all_lines if re.match(r"^## \d+\.", ln))
    print(f"{SRC.name} | {len(all_lines)} | {entries} | success")


if __name__ == "__main__":
    main()
