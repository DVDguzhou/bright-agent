#!/usr/bin/env python3
"""Write stdin/*.txt from slice content files passed as arguments."""
import sys
from pathlib import Path

STDIN_DIR = Path(__file__).resolve().parent / "stdin"
STDIN_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    for i, arg in enumerate(sys.argv[1:], 1):
        src = Path(arg)
        dst = STDIN_DIR / f"{i}.txt"
        dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-8", newline="\n")
        print(f"wrote {dst} ({len(dst.read_text(encoding='utf-8').splitlines())} lines)")


if __name__ == "__main__":
    main()
