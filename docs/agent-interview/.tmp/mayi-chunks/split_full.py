#!/usr/bin/env python3
"""Split full.md into 6 .part files by line offsets."""
from pathlib import Path

OUT = Path(__file__).resolve().parent
FULL = OUT / "full.md"
CHUNKS = [(1, 1, 400), (2, 401, 400), (3, 801, 400), (4, 1201, 400), (5, 1601, 400), (6, 2001, 400)]

def main() -> None:
    if not FULL.exists():
        raise SystemExit(f"Missing {FULL}")
    lines = FULL.read_text(encoding="utf-8").splitlines()
    print(f"full.md: {len(lines)} lines")
    for part_no, start, limit in CHUNKS:
        chunk = lines[start - 1 : start - 1 + limit]
        path = OUT / f"{part_no}.part"
        text = "\n".join(chunk)
        if text:
            text += "\n"
        path.write_text(text, encoding="utf-8", newline="\n")
        print(f"{path.name}: {len(chunk)} lines, {path.stat().st_size} bytes, exists={path.exists()}")

if __name__ == "__main__":
    main()
