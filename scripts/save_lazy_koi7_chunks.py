#!/usr/bin/env python3
"""Save Read-tool chunks to .part files (stdin: lines with optional N| prefix)."""
import re
import sys
from pathlib import Path

pat = re.compile(r"^\s*\d+\|(.*)$")
out_dir = Path(r"d:\regr\docs\agent-interview\.tmp\慵懒的锦鲤7-chunks")
out_dir.mkdir(parents=True, exist_ok=True)

chunk_idx = int(sys.argv[1])
text = sys.stdin.read()
lines = []
for line in text.splitlines():
    line = line.rstrip("\r")
    m = pat.match(line)
    lines.append(m.group(1) if m else line)

out = out_dir / f"{chunk_idx}.part"
with out.open("w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines))
    if lines:
        f.write("\n")
print(f"wrote {out} ({len(lines)} lines)")
