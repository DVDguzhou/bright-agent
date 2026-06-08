#!/usr/bin/env python3
"""Strip Read-tool prefixes, split into 400-line .part files, combine to dest."""
import glob
import os
import re
import subprocess
import sys

CHUNK_DIR = os.path.join(os.path.dirname(__file__), "whale-chunks")
RAW = os.path.join(os.path.dirname(__file__), "whale-buffer.raw")
DEST = os.path.join(os.path.dirname(__file__), "..", "鲸鱼ya在跑步-extract.md")
COMBINE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "scripts", "combine_chunks.py")
CHUNK_SIZE = 400
pat = re.compile(r"^\s*\d+\|(.*)$")

if not os.path.isfile(RAW):
    print(f"ERROR: missing {RAW}", file=sys.stderr)
    sys.exit(1)

lines = []
with open(RAW, encoding="utf-8") as f:
    for line in f:
        line = line.rstrip("\n\r")
        m = pat.match(line)
        lines.append(m.group(1) if m else line)

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
print(f"parts={len(lines) // CHUNK_SIZE + (1 if len(lines) % CHUNK_SIZE else 0)} lines={len(lines)} entries={entries}")
