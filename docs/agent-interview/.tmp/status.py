#!/usr/bin/env python3
import re
from pathlib import Path

base = Path(r"d:\regr\docs\agent-interview")
names = [
    "慵懒的锦鲤7", "猫头鹰x去爬山", "芒果学画画", "蚂蚁做饭中",
    "西瓜oo喝绿茶", "豆奶_红豆", "鲸鱼ya在跑步",
]
for name in names:
    for suffix in ("-extract.md", "-merged.md"):
        p = base / f"{name}{suffix}"
        if not p.exists():
            print(f"{name}{suffix}\tMISSING")
            continue
        t = p.read_text(encoding="utf-8")
        entries = len(re.findall(r"^## \d+\.", t, re.M))
        print(f"{name}{suffix}\t{len(t.splitlines())}\t{entries}")
