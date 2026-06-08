#!/usr/bin/env python3
"""Process a Read-tool chunk file and write/append to extract."""
import re
import sys
from pathlib import Path

out_path = Path(sys.argv[1])
mode = sys.argv[2]  # w or a
first = sys.argv[3] == "1"
chunk_path = Path(sys.argv[4])

pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

lines_out = []
for line in chunk_path.read_text(encoding="utf-8").splitlines():
    m = pat.match(line)
    content = m.group(1) if m else line
    if first and disclaimer in content:
        content = content.replace(disclaimer, "").replace("。。", "。")
    lines_out.append(content)

with out_path.open(mode, encoding="utf-8", newline="\n") as f:
    if mode == "a" and lines_out:
        f.write("\n".join(lines_out) + "\n")
    else:
        f.write("\n".join(lines_out))
        if lines_out:
            f.write("\n")

print(f"{mode} {len(lines_out)} lines -> {out_path.name}")
