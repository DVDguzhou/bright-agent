#!/usr/bin/env python3
"""Write 慵懒的锦鲤7.raw*.txt from numbered slice files in slices/."""
import shutil
from pathlib import Path

TMP = Path(r"d:\regr\docs\agent-interview\.tmp")
SLICES = TMP / "慵懒的锦鲤7-slices"
OUT_STEM = "慵懒的锦鲤7"


def main() -> None:
    if not SLICES.exists():
        raise SystemExit(f"missing {SLICES}")
    files = sorted(SLICES.glob("*.txt"), key=lambda p: int(p.stem))
    if not files:
        raise SystemExit("no slice files")
    for i, src in enumerate(files, 1):
        dst = TMP / f"{OUT_STEM}.raw{i}.txt"
        shutil.copy2(src, dst)
        n = len(dst.read_text(encoding="utf-8").splitlines())
        print(f"{dst.name}: {n} lines")


if __name__ == "__main__":
    main()
