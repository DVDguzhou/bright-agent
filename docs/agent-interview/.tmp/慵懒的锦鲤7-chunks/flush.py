#!/usr/bin/env python3
"""Combine 慵懒的锦鲤7 .part chunks to extract file."""
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(r"d:\regr")
CHUNK_DIR = Path(__file__).resolve().parent
DEST = REPO / "docs" / "agent-interview" / "慵懒的锦鲤7-extract.md"
COMBINE = REPO / "scripts" / "combine_chunks.py"


def main() -> None:
    parts = sorted(CHUNK_DIR.glob("*.part"), key=lambda p: int(p.stem))
    if not parts:
        print("No .part files", file=sys.stderr)
        sys.exit(1)
    subprocess.run([sys.executable, str(COMBINE), str(CHUNK_DIR), str(DEST)], check=True)
    lines = DEST.read_text(encoding="utf-8").splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(lines)}\tentries={entries}")


if __name__ == "__main__":
    main()
