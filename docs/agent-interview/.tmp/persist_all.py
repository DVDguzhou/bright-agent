#!/usr/bin/env python3
"""Persist extract files from numbered chunk files in .tmp."""
import re
import sys
from pathlib import Path

BASE = Path(r"d:\regr\docs\agent-interview")
TMP = BASE / ".tmp"
pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

FILES = [
    ("西瓜oo喝绿茶-extract.md", 2),
    ("蚂蚁做饭中-extract.md", 3),
    ("慵懒的锦鲤7-extract.md", 4),
    ("猫头鹰x去爬山-extract.md", 3),
    ("鲸鱼ya在跑步-extract.md", 3),
    ("芒果学画画-extract.md", 4),
    ("豆奶_红豆-extract.md", 9),
]


def merge_one(name: str, chunk_count: int) -> tuple[int, int]:
    stem = name.replace("-extract.md", "")
    all_lines = []
    for i in range(1, chunk_count + 1):
        cp = TMP / f"{stem}.raw{i}.txt"
        if not cp.exists():
            raise FileNotFoundError(cp)
        with cp.open(encoding="utf-8") as f:
            for line in f:
                line = line.rstrip("\n\r")
                m = pat.match(line)
                content = m.group(1) if m else line
                if i == 1 and disclaimer in content:
                    content = content.replace(disclaimer, "").replace("。。", "。")
                all_lines.append(content)
    out = BASE / name
    with out.open("w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(all_lines))
        if all_lines:
            f.write("\n")
    entries = sum(1 for ln in all_lines if re.match(r"^## \d+\.", ln))
    return len(all_lines), entries


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    for name, n in FILES:
        if target and name != target and stem := name.replace("-extract.md", ""):
            if target not in (name, stem):
                continue
        lines, entries = merge_one(name, n)
        print(f"{name}\tlines={lines}\tentries={entries}")
