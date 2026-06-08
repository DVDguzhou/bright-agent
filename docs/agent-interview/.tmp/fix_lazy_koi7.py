#!/usr/bin/env python3
"""Fix truncated 慵懒的锦鲤7-extract.md and append slice files."""
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(r"d:\regr")
DEST = REPO / "docs/agent-interview/慵懒的锦鲤7-extract.md"
SLICES = REPO / "docs/agent-interview/.tmp/慵懒的锦鲤7-slices"
APPEND = REPO / "scripts/append_chunk.py"
COMBINE = REPO / "scripts/combine_chunks.py"
CHUNK_DIR = REPO / "docs/agent-interview/.tmp/慵懒的锦鲤7-chunks"


def main() -> None:
    # If full .part files exist, combine them
    parts = sorted(CHUNK_DIR.glob("*.part"), key=lambda p: int(p.stem))
    if parts:
        subprocess.run([sys.executable, str(COMBINE), str(CHUNK_DIR), str(DEST)], check=True)
    else:
        # Truncate broken tail and append numbered slices
        lines = DEST.read_text(encoding="utf-8").splitlines()
        if len(lines) > 395:
            DEST.write_text("\n".join(lines[:395]) + "\n", encoding="utf-8", newline="\n")
        slice_files = sorted(SLICES.glob("*.txt"), key=lambda p: int(p.stem))
        if not slice_files:
            print("NO_SLICES", file=sys.stderr)
            sys.exit(1)
        for sf in slice_files:
            subprocess.run(
                [sys.executable, str(APPEND), str(sf), str(DEST), "append"],
                check=True,
            )

    text = DEST.read_text(encoding="utf-8").splitlines()
    entries = sum(1 for ln in text if re.match(r"^## \d+\.", ln))
    print(f"lines={len(text)}\tentries={entries}")


if __name__ == "__main__":
    main()
