#!/usr/bin/env python3
"""Merge numbered chunk files into extract markdown."""
import re
import sys
from pathlib import Path

BASE = Path(r"d:\regr\docs\agent-interview")
TMP = BASE / ".tmp" / "chunks"
pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"

FILES = {
    "慵懒的锦鲤7-extract.md": 4,
    "猫头鹰x去爬山-extract.md": 3,
    "芒果学画画-extract.md": 4,
    "蚂蚁做饭中-extract.md": 3,
    "西瓜oo喝绿茶-extract.md": 2,
    "豆奶_红豆-extract.md": 9,
    "鲸鱼ya在跑步-extract.md": 3,
}


def strip_line(line: str, first: bool) -> str:
    m = pat.match(line)
    content = m.group(1) if m else line
    if first and disclaimer in content:
        content = content.replace(disclaimer, "").replace("。。", "。")
    return content


def merge_one(name: str, n_chunks: int) -> tuple[int, int]:
    stem = name.replace("-extract.md", "")
    all_lines: list[str] = []
    for i in range(1, n_chunks + 1):
        cp = TMP / f"{stem}.part{i}.txt"
        if not cp.exists():
            raise FileNotFoundError(cp)
        for line in cp.read_text(encoding="utf-8").splitlines():
            all_lines.append(strip_line(line, i == 1))
    out = BASE / name
    out.write_text("\n".join(all_lines) + ("\n" if all_lines else ""), encoding="utf-8", newline="\n")
    entries = sum(1 for ln in all_lines if re.match(r"^## \d+\.", ln))
    return len(all_lines), entries


def main() -> None:
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(FILES.keys())
    for name in targets:
        n = FILES[name]
        lines, entries = merge_one(name, n)
        print(f"{name}\t{lines}\t{entries}")


if __name__ == "__main__":
    main()
