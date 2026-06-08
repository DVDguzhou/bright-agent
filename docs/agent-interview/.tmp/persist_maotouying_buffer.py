#!/usr/bin/env python3
"""Extract 猫头鹰x去爬山 buffer from agent transcripts (longest Read result)."""
import json
import re
from pathlib import Path

TRANSCRIPT_ROOT = Path(
    r"C:\Users\Caiqing\.cursor\projects\d-regr\agent-transcripts"
)
DEST = Path(r"d:\regr\docs\agent-interview\猫头鹰x去爬山-extract.md")
TARGET = "猫头鹰x去爬山-extract.md"
MARKER = "累计写到 **95 条知识条目**"
pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

best = ""
best_lines = 0
best_src = ""


def extract_content(obj: dict) -> str | None:
    if obj.get("type") == "tool_result":
        return obj.get("content", "") or None
    if obj.get("role") == "tool":
        c = obj.get("content", "")
        if isinstance(c, list):
            return "\n".join(
                x.get("text", "") if isinstance(x, dict) else str(x) for x in c
            )
        return str(c) if c else None
    return None


for jsonl in TRANSCRIPT_ROOT.rglob("*.jsonl"):
    try:
        with jsonl.open(encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                content = extract_content(obj) if isinstance(obj, dict) else None
                if not content or TARGET not in content:
                    continue
                if MARKER not in content and "## 95." not in content:
                    if best_lines < 500 and "## 1." not in content:
                        continue
                n = content.count("\n") + 1
                if n > best_lines:
                    best = content
                    best_lines = n
                    best_src = str(jsonl)
    except OSError:
        continue

if not best or best_lines < 500:
    raise SystemExit(f"No sufficient buffer found (best={best_lines} lines)")

out_lines = []
for i, line in enumerate(best.splitlines()):
    m = pat.match(line)
    text = m.group(1) if m else line
    if i < 5 and disclaimer in text:
        text = text.replace(disclaimer, "").replace("。。", "。")
    out_lines.append(text)

DEST.write_text("\n".join(out_lines) + "\n", encoding="utf-8", newline="\n")
entries = sum(1 for ln in out_lines if re.match(r"^## \d+\.", ln))
print(f"source={best_src}")
print(f"lines={len(out_lines)}\tentries={entries}")
