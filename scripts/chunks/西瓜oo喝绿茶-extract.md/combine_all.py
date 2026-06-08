#!/usr/bin/env python3
"""Combine seg*.part + 5.part into final extract file."""
import glob
import re
from pathlib import Path

CHUNK_DIR = Path(r"d:\regr\scripts\chunks\西瓜oo喝绿茶-extract.md")
DEST = Path(r"d:\regr\docs\agent-interview\西瓜oo喝绿茶-extract.md")


def main() -> None:
    segs = sorted(CHUNK_DIR.glob("seg*.part"), key=lambda p: p.name)
    parts = segs + [CHUNK_DIR / "5.part"]
    lines: list[str] = []
    for p in parts:
        if not p.exists():
            raise FileNotFoundError(p)
        text = p.read_text(encoding="utf-8")
        chunk_lines = text.splitlines()
        if lines and chunk_lines and lines[-1] == chunk_lines[0] == "":
            chunk_lines = chunk_lines[1:]
        lines.extend(chunk_lines)
    content = "\n".join(lines) + "\n"
    DEST.write_text(content, encoding="utf-8", newline="\n")
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"{DEST.name} | {len(lines)} | {entries} | success")


if __name__ == "__main__":
    main()
