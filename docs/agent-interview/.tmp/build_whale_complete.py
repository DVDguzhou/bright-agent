#!/usr/bin/env python3
"""Build whale extract from 4 numbered .part chunks."""
import glob
import os
import re
import sys

CHUNK_DIR = os.path.join(os.path.dirname(__file__), "whale-chunks")
DEST = os.path.join(os.path.dirname(__file__), "..", "鲸鱼ya在跑步-extract.md")
pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

paths = sorted(glob.glob(os.path.join(CHUNK_DIR, "*.part")), key=lambda p: int(os.path.splitext(os.path.basename(p))[0]))
if len(paths) < 4:
    print(f"ERROR: need 4 parts, found {len(paths)}: {paths}", file=sys.stderr)
    sys.exit(1)

all_lines = []
for i, path in enumerate(paths):
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n\r")
            m = pat.match(line)
            content = m.group(1) if m else line
            if i == 0 and disclaimer in content:
                content = content.replace(disclaimer, "").replace("。。", "。")
            all_lines.append(content)

with open(DEST, "w", encoding="utf-8", newline="\n") as out:
    out.write("\n".join(all_lines))
    if all_lines:
        out.write("\n")

entries = sum(1 for ln in all_lines if re.match(r"^## \d+\.", ln))
print(f"lines={len(all_lines)} entries={entries}")
