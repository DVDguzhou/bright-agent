#!/usr/bin/env python3
import json
from pathlib import Path

t = Path(
    r"C:\Users\Caiqing\.cursor\projects\d-regr\agent-transcripts"
    r"\a214d3a2-ecab-4c07-b907-3e84facc74e7\subagents"
    r"\57ef2c0e-9acd-4be1-b29c-1b547861bb02.jsonl"
)
types = set()
tool_count = 0
for line in t.open(encoding="utf-8"):
    try:
        o = json.loads(line)
    except json.JSONDecodeError:
        continue
    types.add(str(o.get("type") or o.get("role")))
    if o.get("type") == "tool_result" or o.get("role") == "tool":
        tool_count += 1
print("types:", types)
print("tool_count:", tool_count)
