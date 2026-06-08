#!/usr/bin/env python3
import re
from pathlib import Path

INTERVIEW = Path(r"d:\regr\docs\agent-interview")
NAMES = [
    "慵懒的锦鲤7", "猫头鹰x去爬山", "芒果学画画", "蚂蚁做饭中",
    "西瓜oo喝绿茶", "豆奶_红豆", "鲸鱼ya在跑步",
]

print("file\tlines_on_disk\tentry_count_merged\tmerged_path")
for name in NAMES:
    extract = INTERVIEW / f"{name}-extract.md"
    merged = INTERVIEW / f"{name}-merged.md"
    el = len(extract.read_text(encoding="utf-8").splitlines()) if extract.exists() else 0
    if not merged.exists():
        print(f"{name}\t{el}\tMISSING\t-")
        continue
    mt = merged.read_text(encoding="utf-8")
    ml = len(mt.splitlines())
    m = re.search(r"(\d+)\s*条叙事知识条目", mt)
    if m:
        entries = int(m.group(1))
    else:
        entries = sum(1 for ln in mt.splitlines() if ln.startswith("## ") and "合并知识库" not in ln and "·" not in ln[:20])
    print(f"{name}\t{el}\t{entries}\t{merged}")
