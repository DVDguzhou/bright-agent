#!/usr/bin/env python3
"""Extract whale extract buffer from current subagent transcript."""
import json
import re
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\Caiqing\.cursor\projects\d-regr\agent-transcripts"
    r"\a214d3a2-ecab-4c07-b907-3e84facc74e7\subagents"
    r"\57ef2c0e-9acd-4be1-b29c-1b547861bb02.jsonl"
)
DEST = Path(r"d:\regr\docs\agent-interview\鲸鱼ya在跑步-extract.md")
TARGET = "鲸鱼ya在跑步-extract.md"
pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

best = ""
best_lines = 0

with TRANSCRIPT.open(encoding="utf-8") as f:
    for line in f:
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        content = None
        if isinstance(obj, dict):
            if obj.get("type") == "tool_result":
                content = obj.get("content", "")
            elif obj.get("role") == "tool":
                c = obj.get("content", "")
                if isinstance(c, list):
                    content = "\n".join(
                        x.get("text", "") if isinstance(x, dict) else str(x) for x in c
                    )
                else:
                    content = str(c)
        if not content or TARGET not in content:
            continue
        if "全部问题覆盖状态" not in content and "涉及具体课程名" not in content:
            continue
        n = content.count("\n") + 1
        if n > best_lines:
            best = content
            best_lines = n

if not best:
    raise SystemExit("No whale buffer found in transcript")

out_lines = []
for i, line in enumerate(best.splitlines()):
    m = pat.match(line)
    text = m.group(1) if m else line
    if i == 0 and disclaimer in text:
        text = text.replace(disclaimer, "").replace("。。", "。")
    out_lines.append(text)

DEST.write_text("\n".join(out_lines) + "\n", encoding="utf-8", newline="\n")
entries = sum(1 for ln in out_lines if re.match(r"^## \d+\.", ln))
print(f"lines={len(out_lines)} entries={entries}")
