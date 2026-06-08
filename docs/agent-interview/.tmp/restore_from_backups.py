#!/usr/bin/env python3
"""Restore extract markdown from Cursor editor backups."""
import re
from pathlib import Path

BACKUP_DIR = Path(
    r"C:\Users\Caiqing\AppData\Roaming\Cursor\Backups"
    r"\94bd9d528b6eb60afe4faa06610f3924\file"
)
DEST_DIR = Path(r"d:\regr\docs\agent-interview")
DISCLAIMER = "只基于下列真实材料加工，勿编造"
GPT_PREFIX = "> 供 GPT"


def clean_first_chunk(text: str) -> str:
    lines = []
    for line in text.splitlines():
        if line.startswith(GPT_PREFIX):
            continue
        if DISCLAIMER in line:
            line = line.replace(DISCLAIMER, "").replace("。。", "。")
            if line.strip() in (">", ""):
                continue
            if "> 供 GPT" in line or "import-persona" in line and line.strip().startswith(">"):
                continue
        lines.append(line)
    return "\n".join(lines) + "\n"


def identify(path: Path) -> str | None:
    head = path.read_text(encoding="utf-8", errors="replace")[:800]
    m = re.search(r"#\s*(.+?)\s*·\s*提取知识库", head)
    return m.group(1).strip() if m else None


def main() -> None:
    mapping: dict[str, Path] = {}
    for p in BACKUP_DIR.iterdir():
        if not p.is_file():
            continue
        name = identify(p)
        if name:
            mapping[name] = p

    expected = [
        "慵懒的锦鲤7", "猫头鹰x去爬山", "芒果学画画", "蚂蚁做饭中",
        "西瓜oo喝绿茶", "豆奶_红豆", "鲸鱼ya在跑步",
    ]
    for name in expected:
        src = mapping.get(name)
        if not src:
            print(f"MISSING backup for {name}")
            continue
        text = src.read_text(encoding="utf-8")
        text = clean_first_chunk(text)
        dest = DEST_DIR / f"{name}-extract.md"
        dest.write_text(text, encoding="utf-8", newline="\n")
        entries = sum(1 for ln in text.splitlines() if re.match(r"^## \d+\.", ln))
        print(f"OK\t{name}\tlines={len(text.splitlines())}\tentries={entries}\t{dest}")


if __name__ == "__main__":
    main()
