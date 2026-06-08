#!/usr/bin/env python3
"""Read extract via offset/limit slices and persist with prefix stripping."""
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(r"d:\regr")
SRC = REPO / "docs" / "agent-interview" / "猫头鹰x去爬山-extract.md"
DEST = SRC
APPEND = REPO / "scripts" / "append_chunk.py"
CHUNK_SIZE = 400
PREFIX = re.compile(r"^\s*\d+\|(.*)$")


def strip_text(text: str) -> str:
    out = []
    for line in text.splitlines():
        m = PREFIX.match(line)
        out.append(m.group(1) if m else line)
    return "\n".join(out)


def read_slice(start: int, limit: int) -> str:
    lines = SRC.read_text(encoding="utf-8").splitlines()
    return "\n".join(lines[start - 1 : start - 1 + limit])


def main() -> None:
    # Fallback: merge existing .part chunks if present
    chunk_dir = REPO / "docs" / "agent-interview" / ".tmp" / "猫头鹰x去爬山-chunks"
    parts = sorted(chunk_dir.glob("*.part"), key=lambda p: int(p.stem))
    if parts:
        combine = REPO / "scripts" / "combine_chunks.py"
        subprocess.run([sys.executable, str(combine), str(chunk_dir), str(DEST)], check=True)
        lines = DEST.read_text(encoding="utf-8").splitlines()
        entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
        print(f"lines={len(lines)}\tentries={entries}")
        return

    total = len(SRC.read_text(encoding="utf-8").splitlines())
    if total < 100:
        print(f"Source too short ({total} lines); need buffer chunks in {chunk_dir}", file=sys.stderr)
        sys.exit(1)

    tmp = REPO / "docs" / "agent-interview" / ".tmp" / "maotouying_slice.tmp"
    for i, start in enumerate(range(1, total + 1, CHUNK_SIZE)):
        chunk = read_slice(start, CHUNK_SIZE)
        tmp.write_text(chunk, encoding="utf-8")
        mode = "write" if i == 0 else "append"
        subprocess.run(
            [sys.executable, str(APPEND), str(tmp), str(DEST), mode],
            check=True,
        )

    lines = DEST.read_text(encoding="utf-8").splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(lines)}\tentries={entries}")


if __name__ == "__main__":
    main()
