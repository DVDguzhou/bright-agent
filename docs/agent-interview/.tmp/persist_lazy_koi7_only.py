#!/usr/bin/env python3
"""Persist only 慵懒的锦鲤7-extract.md from raw chunks."""
import re
from pathlib import Path

BASE = Path(r"d:\regr\docs\agent-interview")
TMP = BASE / ".tmp"
OUT = BASE / "慵懒的锦鲤7-extract.md"
STEM = "慵懒的锦鲤7"
N_CHUNKS = 9
pat = re.compile(r"^\s*\d+\|(.*)$")


def main() -> None:
    all_lines: list[str] = []
    for i in range(1, N_CHUNKS + 1):
        cp = TMP / f"{STEM}.raw{i}.txt"
        if not cp.exists():
            raise SystemExit(f"missing {cp}")
        for line in cp.read_text(encoding="utf-8").splitlines():
            m = pat.match(line)
            all_lines.append(m.group(1) if m else line)
    OUT.write_text("\n".join(all_lines) + ("\n" if all_lines else ""), encoding="utf-8", newline="\n")
    entries = sum(1 for ln in all_lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(all_lines)}\tentries={entries}")


if __name__ == "__main__":
    main()
