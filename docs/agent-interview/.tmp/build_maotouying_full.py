#!/usr/bin/env python3
"""Build full 猫头鹰x去爬山 extract from partial raw + tail part."""
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(r"d:\regr")
TMP = REPO / "docs" / "agent-interview" / ".tmp"
CHUNK_DIR = TMP / "maotouying-chunks"
DEST = REPO / "docs" / "agent-interview" / "猫头鹰x去爬山-extract.md"
COMBINE = REPO / "scripts" / "combine_chunks.py"

# Tail is already complete in 6.part (lines 2401-2767)
TAIL = CHUNK_DIR / "6.part"


def read_buffer_slices() -> list[str]:
    """Read buffer in 400-line slices via editor file API path."""
    src = DEST
    # Use numbered slices written by agent to slice files
    slices = sorted(TMP.glob("maotouying.slice*.txt"), key=lambda p: int(p.stem.replace("maotouying.slice", "")))
    if slices:
        return [p.read_text(encoding="utf-8") for p in slices]
    # Fallback: head raw + tail part only (partial)
    head = (TMP / "maotouying.raw.txt").read_text(encoding="utf-8") if (TMP / "maotouying.raw.txt").exists() else ""
    return [head] if head else []


def strip_block(text: str) -> str:
    pat = re.compile(r"^\s*\d+\|(.*)$")
    skip = re.compile(r"^\.\.\.\s+\d+\s+lines not shown\s+\.\.\.\s*$")
    out = []
    for line in text.splitlines():
        s = line.rstrip("\r\n")
        if skip.match(s.strip()):
            continue
        m = pat.match(s)
        out.append(m.group(1) if m else s)
    return "\n".join(out)


def main() -> None:
    parts_text: list[str] = []
    head_path = TMP / "maotouying.raw.txt"
    if head_path.exists():
        parts_text.append(strip_block(head_path.read_text(encoding="utf-8")))

    for sp in sorted(TMP.glob("maotouying.slice*.txt"), key=lambda p: int(p.stem.replace("maotouying.slice", ""))):
        parts_text.append(strip_block(sp.read_text(encoding="utf-8")))

    if TAIL.exists():
        parts_text.append(TAIL.read_text(encoding="utf-8").rstrip("\n"))

    if not parts_text:
        print("No content parts", file=sys.stderr)
        sys.exit(1)

    full = "\n".join(t for t in parts_text if t)
    if not full.endswith("\n"):
        full += "\n"
    DEST.write_text(full, encoding="utf-8", newline="\n")
    lines = full.splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(lines)}\tentries={entries}")


if __name__ == "__main__":
    main()
