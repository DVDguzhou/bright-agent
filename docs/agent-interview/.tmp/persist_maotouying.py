#!/usr/bin/env python3
"""Persist 猫头鹰x去爬山 buffer from numbered .part chunk files."""
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(r"d:\regr")
CHUNK_DIR = REPO / "docs" / "agent-interview" / ".tmp" / "猫头鹰x去爬山-chunks"
DEST = REPO / "docs" / "agent-interview" / "猫头鹰x去爬山-extract.md"
COMBINE = REPO / "scripts" / "combine_chunks.py"

if __name__ == "__main__":
    if not CHUNK_DIR.exists() or not any(CHUNK_DIR.glob("*.part")):
        print("No chunk files found", file=sys.stderr)
        sys.exit(1)
    subprocess.run(
        [sys.executable, str(COMBINE), str(CHUNK_DIR), str(DEST)],
        check=True,
    )
    pat = re.compile(r"^## \d+\.")
    lines = DEST.read_text(encoding="utf-8").splitlines()
    entries = sum(1 for ln in lines if pat.match(ln))
    print(f"lines={len(lines)}\tentries={entries}")
