#!/usr/bin/env python3
import re
import subprocess
from pathlib import Path

ROOT = Path(r"d:\regr")
BACKEND = ROOT / "backend"
INTERVIEW = ROOT / "docs" / "agent-interview"

PERSONAS = [
    "慵懒的锦鲤7", "猫头鹰x去爬山", "芒果学画画", "蚂蚁做饭中",
    "西瓜oo喝绿茶", "豆奶_红豆", "鲸鱼ya在跑步",
]

ENTRY_PAT = re.compile(r"^##\s*\d+[\.\｜\|]?")


def count_entries(text: str) -> int:
    return sum(1 for ln in text.splitlines() if ENTRY_PAT.match(ln))


def main() -> None:
    for name in PERSONAS:
        extract = INTERVIEW / f"{name}-extract.md"
        merged = INTERVIEW / f"{name}-merged.md"
        cmd = [
            "go", "run", "./cmd/import-persona",
            "-file", str(extract),
            "-name", name,
            "-merge-out", str(merged),
        ]
        print("===", name, "===")
        r = subprocess.run(
            cmd, cwd=BACKEND, capture_output=True, text=True, encoding="utf-8", errors="replace"
        )
        if r.returncode != 0:
            print("FAIL", r.stderr or r.stdout)
            continue
        lines = len(merged.read_text(encoding="utf-8").splitlines()) if merged.exists() else 0
        entries = count_entries(merged.read_text(encoding="utf-8")) if merged.exists() else 0
        print(f"RESULT\t{name}\textract_lines={len(extract.read_text(encoding='utf-8').splitlines())}\tmerged_lines={lines}\tmerged_entries={entries}")


if __name__ == "__main__":
    main()
