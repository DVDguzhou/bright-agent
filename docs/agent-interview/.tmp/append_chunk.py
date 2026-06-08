#!/usr/bin/env python3
"""Strip Read-tool line numbers and append to extract file."""
import re
import sys

out_path = sys.argv[1]
mode = sys.argv[2]  # w or a
first_chunk = sys.argv[3] == "1" if len(sys.argv) > 3 else False
pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

lines_out = []
for line in sys.stdin:
    line = line.rstrip("\n\r")
    m = pat.match(line)
    content = m.group(1) if m else line
    if first_chunk and disclaimer in content:
        content = content.replace(disclaimer, "").replace("。。", "。")
    lines_out.append(content)

with open(out_path, mode, encoding="utf-8", newline="\n") as f:
    if mode == "a" and lines_out:
        f.write("\n".join(lines_out) + "\n")
    else:
        f.write("\n".join(lines_out))
        if lines_out:
            f.write("\n")
