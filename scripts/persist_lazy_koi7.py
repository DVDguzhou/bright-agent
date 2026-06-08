#!/usr/bin/env python3
"""Persist 慵懒的锦鲤7-extract.md from numbered .part chunk files."""
import re
import subprocess
import sys
from pathlib import Path

CHUNK_DIR = Path(r"d:\regr\docs\agent-interview\.tmp\慵懒的锦鲤7-chunks")
DEST = Path(r"d:\regr\docs\agent-interview\慵懒的锦鲤7-extract.md")
COMBINE = Path(r"d:\regr\scripts\combine_chunks.py")

pat = re.compile(r"^\s*\d+\|(.*)$")


def strip_file(src: Path, dst: Path) -> int:
    lines = []
    with src.open(encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n\r")
            m = pat.match(line)
            lines.append(m.group(1) if m else line)
    with dst.open("w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))
        if lines:
            f.write("\n")
    return len(lines)


def main() -> None:
    CHUNK_DIR.mkdir(parents=True, exist_ok=True)
    parts = sorted(CHUNK_DIR.glob("*.part"), key=lambda p: int(p.stem))
    if not parts:
        print("no .part files in", CHUNK_DIR, file=sys.stderr)
        sys.exit(1)
    subprocess.check_call([sys.executable, str(COMBINE), str(CHUNK_DIR), str(DEST)])
    text = DEST.read_text(encoding="utf-8")
    lines = text.splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(lines)} entries={entries}")


if __name__ == "__main__":
    main()
