#!/usr/bin/env python3
"""Extract Read-tool file content from agent transcript and persist extracts."""
import json
import re
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\Caiqing\.cursor\projects\d-regr\agent-transcripts"
    r"\a57a05e1-93c6-42cc-9f46-9f8d0a14b8c8\a57a05e1-93c6-42cc-9f46-9f8d0a14b8c8.jsonl"
)
BASE = Path(r"d:\regr\docs\agent-interview")
disclaimer = "只基于下列真实材料加工，勿编造"
pat = re.compile(r"^\s*\d+\|(.*)$")

FILES = [
    "西瓜oo喝绿茶-extract.md",
    "蚂蚁做饭中-extract.md",
    "慵懒的锦鲤7-extract.md",
    "猫头鹰x去爬山-extract.md",
    "芒果学画画-extract.md",
    "豆奶_红豆-extract.md",
    "鲸鱼ya在跑步-extract.md",
]

# Collect latest read content per file from transcript tool results
latest: dict[str, str] = {}


def strip_content(text: str, first: bool) -> str:
    lines = []
    for line in text.splitlines():
        m = pat.match(line)
        content = m.group(1) if m else line
        if first and disclaimer in content:
            content = content.replace(disclaimer, "").replace("。。", "。")
        lines.append(content)
    return "\n".join(lines) + ("\n" if lines else "")


if not TRANSCRIPT.exists():
    print(f"Transcript not found: {TRANSCRIPT}")
    raise SystemExit(1)

with TRANSCRIPT.open(encoding="utf-8") as f:
    for line in f:
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        # Tool results may be in various formats
        content = None
        if isinstance(obj, dict):
            if obj.get("type") == "tool_result" and "content" in obj:
                content = obj["content"]
            elif "tool_result" in obj:
                content = obj["tool_result"]
            elif obj.get("role") == "tool":
                content = obj.get("content", "")
        if not content or not isinstance(content, str):
            continue
        for fname in FILES:
            marker = fname.replace("-extract.md", "")
            if marker in content and "## 1." in content or "## Agent" in content:
                if len(content) > len(latest.get(fname, "")):
                    latest[fname] = content

print(f"Found {len(latest)} files in transcript")
for fname in FILES:
    if fname not in latest:
        print(f"MISSING {fname}")
        continue
    out = BASE / fname
    cleaned = strip_content(latest[fname], True)
    out.write_text(cleaned, encoding="utf-8", newline="\n")
    entries = sum(1 for ln in cleaned.splitlines() if re.match(r"^## \d+\.", ln))
    print(f"OK {fname} lines={len(cleaned.splitlines())} entries={entries}")
