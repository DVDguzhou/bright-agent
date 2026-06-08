#!/usr/bin/env python3
"""Merge .part chunk files and verify 慵懒的锦鲤7-extract.md."""
import re
import subprocess
import sys
from pathlib import Path

CHUNK_DIR = Path(r"d:\regr\docs\agent-interview\.tmp\慵懒的锦鲤7-chunks")
DEST = Path(r"d:\regr\docs\agent-interview\慵懒的锦鲤7-extract.md")
COMBINE = Path(r"d:\regr\scripts\combine_chunks.py")


def main() -> None:
    parts = sorted(CHUNK_DIR.glob("*.part"), key=lambda p: int(p.stem))
    if not parts:
        print("ERROR: no part files", file=sys.stderr)
        sys.exit(1)
    subprocess.check_call([sys.executable, str(COMBINE), str(CHUNK_DIR), str(DEST)])
    lines = DEST.read_text(encoding="utf-8").splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"OK lines={len(lines)} entries={entries}")


if __name__ == "__main__":
    main()
