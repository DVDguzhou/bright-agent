#!/usr/bin/env python3
"""Copy Cursor editor backups to extract files; strip disclaimer from line 3."""
import re
import shutil
from pathlib import Path

BASE = Path(r"d:\regr\docs\agent-interview")
BACKUP = Path(
    r"C:\Users\Caiqing\AppData\Roaming\Cursor\Backups"
    r"\94bd9d528b6eb60afe4faa06610f3924\file"
)
DISCLAIMER = "只基于下列真实材料加工，勿编造"

FILES = {
    "慵懒的锦鲤7-extract.md": BACKUP / "566e727c",
    "猫头鹰x去爬山-extract.md": BACKUP / "2c38585",
    "芒果学画画-extract.md": BACKUP / "-479703a8",
    "蚂蚁做饭中-extract.md": BACKUP / "6705e119",
    "西瓜oo喝绿茶-extract.md": BACKUP / "1cde52fd",
    "豆奶_红豆-extract.md": BACKUP / "-9e7bcdf",
    "鲸鱼ya在跑步-extract.md": BACKUP / "-50553bc",
}


def clean(lines: list[str]) -> list[str]:
    if lines and lines[0].startswith("file:///"):
        lines = lines[1:]
    while lines and not lines[0].strip():
        lines = lines[1:]
    out = []
    for i, line in enumerate(lines):
        if i < 5 and DISCLAIMER in line:
            line = line.replace(DISCLAIMER, "").replace("。。", "。")
            line = re.sub(r"\s+$", "", line)
        out.append(line)
    return out


def main() -> None:
    for name, src in FILES.items():
        if not src.exists():
            print(f"MISSING_SRC {name} {src}")
            continue
        dest = BASE / name
        text = src.read_text(encoding="utf-8")
        lines = clean(text.splitlines())
        dest.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8", newline="\n")
        entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
        print(f"{name}\t{len(lines)}\t{entries}")


if __name__ == "__main__":
    main()
