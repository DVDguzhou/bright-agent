#!/usr/bin/env python3
"""Batch persist extract files from raw chunk files."""
import re
from pathlib import Path

BASE = Path(r"d:\regr\docs\agent-interview")
TMP = BASE / ".tmp"
pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

FILES = [
    ("西瓜oo喝绿茶-extract.md", "西瓜oo喝绿茶", 2),
    ("蚂蚁做饭中-extract.md", "蚂蚁做饭中", 3),
    ("慵懒的锦鲤7-extract.md", "慵懒的锦鲤7", 4),
    ("猫头鹰x去爬山-extract.md", "猫头鹰x去爬山", 3),
    ("鲸鱼ya在跑步-extract.md", "鲸鱼ya在跑步", 3),
    ("芒果学画画-extract.md", "芒果学画画", 4),
    ("豆奶_红豆-extract.md", "豆奶_红豆", 9),
]


def merge_one(out_name: str, stem: str, n: int) -> tuple[int, int, bool]:
    all_lines = []
    for i in range(1, n + 1):
        cp = TMP / f"{stem}.raw{i}.txt"
        if not cp.exists():
            return 0, 0, False
        with cp.open(encoding="utf-8") as f:
            for line in f:
                line = line.rstrip("\n\r")
                m = pat.match(line)
                content = m.group(1) if m else line
                if i == 1 and disclaimer in content:
                    content = content.replace(disclaimer, "").replace("。。", "。")
                all_lines.append(content)
    out = BASE / out_name
    with out.open("w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(all_lines))
        if all_lines:
            f.write("\n")
    entries = sum(1 for ln in all_lines if re.match(r"^## \d+\.", ln))
    return len(all_lines), entries, True


if __name__ == "__main__":
    for out_name, stem, n in FILES:
        lines, entries, ok = merge_one(out_name, stem, n)
        if ok:
            print(f"OK\t{out_name}\tlines={lines}\tentries={entries}")
        else:
            print(f"MISSING\t{out_name}")
