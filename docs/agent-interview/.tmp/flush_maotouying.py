#!/usr/bin/env python3
"""Flush 猫头鹰x去爬山 buffer chunks to destination."""
import subprocess
import sys
from pathlib import Path

REPO = Path(r"d:\regr")
TMP = REPO / "docs" / "agent-interview" / ".tmp"
CHUNK_DIR = TMP / "猫头鹰x去爬山-chunks"
DEST = REPO / "docs" / "agent-interview" / "猫头鹰x去爬山-extract.md"
APPEND = REPO / "scripts" / "append_chunk.py"
COMBINE = REPO / "scripts" / "combine_chunks.py"


def main() -> None:
    parts = sorted(CHUNK_DIR.glob("*.part"), key=lambda p: int(p.stem))
    if not parts:
        print("No .part files", file=sys.stderr)
        sys.exit(1)
    if len(parts) == 1:
        subprocess.run(
            [sys.executable, str(APPEND), str(parts[0]), str(DEST), "write"],
            check=True,
        )
    else:
        subprocess.run(
            [sys.executable, str(COMBINE), str(CHUNK_DIR), str(DEST)],
            check=True,
        )
    import re

    lines = DEST.read_text(encoding="utf-8").splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(lines)}\tentries={entries}")


if __name__ == "__main__":
    main()
