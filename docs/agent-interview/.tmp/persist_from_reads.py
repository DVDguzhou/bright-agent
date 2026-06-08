#!/usr/bin/env python3
"""
Persist extract files by reading editor buffers through chunked Read API simulation.
Reads chunk files from .tmp/{stem}.raw*.txt (UTF-8, optional line-number prefix).
"""
import re
from pathlib import Path

BASE = Path(r"d:\regr\docs\agent-interview")
TMP = BASE / ".tmp"
pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

CONFIG = [
    ("西瓜oo喝绿茶-extract.md", "西瓜oo喝绿茶", 2),
    ("蚂蚁做饭中-extract.md", "蚂蚁做饭中", 3),
    ("慵懒的锦鲤7-extract.md", "慵懒的锦鲤7", 4),
    ("猫头鹰x去爬山-extract.md", "猫头鹰x去爬山", 3),
    ("鲸鱼ya在跑步-extract.md", "鲸鱼ya在跑步", 3),
    ("芒果学画画-extract.md", "芒果学画画", 4),
    ("豆奶_红豆-extract.md", "豆奶_红豆", 9),
]


def process_chunk(text: str, first: bool) -> list[str]:
    lines = []
    for line in text.splitlines():
        m = pat.match(line)
        content = m.group(1) if m else line
        if first and disclaimer in content:
            content = content.replace(disclaimer, "").replace("。。", "。")
        lines.append(content)
    return lines


def persist_one(out_name: str, stem: str, n_chunks: int) -> dict:
    all_lines: list[str] = []
    for i in range(1, n_chunks + 1):
        cp = TMP / f"{stem}.raw{i}.txt"
        if not cp.exists():
            return {"ok": False, "missing": str(cp)}
        all_lines.extend(process_chunk(cp.read_text(encoding="utf-8"), i == 1))
    out = BASE / out_name
    out.write_text("\n".join(all_lines) + ("\n" if all_lines else ""), encoding="utf-8", newline="\n")
    entries = sum(1 for ln in all_lines if re.match(r"^## \d+\.", ln))
    return {"ok": True, "lines": len(all_lines), "entries": entries}


if __name__ == "__main__":
    for out_name, stem, n in CONFIG:
        r = persist_one(out_name, stem, n)
        if r["ok"]:
            print(f"OK\t{out_name}\tlines={r['lines']}\tentries={r['entries']}")
        else:
            print(f"MISSING\t{out_name}\t{r['missing']}")
