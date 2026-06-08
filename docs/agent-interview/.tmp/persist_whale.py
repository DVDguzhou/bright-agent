#!/usr/bin/env python3
"""Persist whale extract: split buffer into .part files, combine_chunks, verify."""
import glob
import os
import re
import subprocess
import sys

BASE = os.path.dirname(__file__)
CHUNK_DIR = os.path.join(BASE, "whale-chunks")
RAW = os.path.join(BASE, "whale-buffer.raw")
DEST = os.path.join(BASE, "..", "鲸鱼ya在跑步-extract.md")
COMBINE = os.path.join(BASE, "..", "..", "..", "scripts", "combine_chunks.py")
CHUNK_SIZE = 400
pat = re.compile(r"^\s*\d+\|(.*)$")


def strip_lines(text: str) -> list[str]:
    out = []
    for line in text.splitlines():
        m = pat.match(line)
        out.append(m.group(1) if m else line)
    return out


def load_lines() -> list[str]:
    if os.path.isfile(RAW):
        return strip_lines(open(RAW, encoding="utf-8").read())
    parts = sorted(
        glob.glob(os.path.join(CHUNK_DIR, "*.part")),
        key=lambda p: int(os.path.splitext(os.path.basename(p))[0]),
    )
    if not parts:
        print("ERROR: no whale-buffer.raw and no whale-chunks/*.part", file=sys.stderr)
        sys.exit(1)
    lines: list[str] = []
    for path in parts:
        lines.extend(strip_lines(open(path, encoding="utf-8").read()))
    return lines


def main() -> None:
    lines = load_lines()
    os.makedirs(CHUNK_DIR, exist_ok=True)
    for old in glob.glob(os.path.join(CHUNK_DIR, "*.part")):
        os.remove(old)
    for i in range(0, len(lines), CHUNK_SIZE):
        n = i // CHUNK_SIZE + 1
        chunk = lines[i : i + CHUNK_SIZE]
        path = os.path.join(CHUNK_DIR, f"{n}.part")
        with open(path, "w", encoding="utf-8", newline="\n") as out:
            out.write("\n".join(chunk))
            if chunk:
                out.write("\n")
    subprocess.run([sys.executable, COMBINE, CHUNK_DIR, DEST], check=True)
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(lines)} entries={entries}")


if __name__ == "__main__":
    main()
