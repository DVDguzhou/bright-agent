#!/usr/bin/env python3
"""Strip Read-tool line numbers; write or append extract chunks."""
import re
import sys
from pathlib import Path

raw_path = Path(sys.argv[1])
out_path = Path(sys.argv[2])
mode = sys.argv[3]  # w | a
first_chunk = len(sys.argv) > 4 and sys.argv[4] == "1"

pat = re.compile(r"^\s*\d+\|(.*)$")
skip_substrings = (
    "> 供 GPT",
    "只基于下列真实材料加工，勿编造",
)

lines_out = []
for line in raw_path.read_text(encoding="utf-8").splitlines():
    m = pat.match(line)
    content = m.group(1) if m else line
    if first_chunk and any(s in content for s in skip_substrings):
        continue
    lines_out.append(content)

text = "\n".join(lines_out)
if lines_out:
    text += "\n"

with open(out_path, mode, encoding="utf-8", newline="\n") as f:
    f.write(text)

print(f"{mode} {out_path}: {len(lines_out)} lines")
