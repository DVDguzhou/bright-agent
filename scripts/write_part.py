#!/usr/bin/env python3
import sys
from pathlib import Path

idx = int(sys.argv[1])
out = Path(r"d:\regr\docs\agent-interview\.tmp\慵懒的锦鲤7-chunks") / f"{idx}.part"
out.parent.mkdir(parents=True, exist_ok=True)
data = sys.stdin.buffer.read().decode("utf-8")
out.write_text(data, encoding="utf-8", newline="\n")
print(len(data.splitlines()))
