#!/usr/bin/env python3
"""Merge Read-tool chunk files into extract markdown."""
import re
import sys

out_path = sys.argv[1]
chunk_paths = sys.argv[2:]
pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

all_lines = []
for i, cp in enumerate(chunk_paths):
    with open(cp, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n\r")
            m = pat.match(line)
            content = m.group(1) if m else line
            if i == 0 and disclaimer in content:
                content = content.replace(disclaimer, "").replace("。。", "。")
            all_lines.append(content)

with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(all_lines))
    if all_lines:
        f.write("\n")

print(f"Wrote {len(all_lines)} lines to {out_path}")
