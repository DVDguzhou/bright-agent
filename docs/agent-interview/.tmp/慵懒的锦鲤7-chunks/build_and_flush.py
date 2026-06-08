#!/usr/bin/env python3
"""Build .part files from numbered stdin chunks and flush to extract."""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = Path(r"d:\regr")
APPEND = REPO / "scripts" / "append_chunk.py"
COMBINE = REPO / "scripts" / "combine_chunks.py"
DEST = REPO / "docs" / "agent-interview" / "慵懒的锦鲤7-extract.md"
STAGING = HERE / "staging_full.txt"


def main() -> None:
    stdin_dir = HERE / "stdin"
    if not stdin_dir.exists():
        print("Missing stdin dir", file=sys.stderr)
        sys.exit(1)
    files = sorted(stdin_dir.glob("*.txt"), key=lambda p: int(p.stem))
    if not files:
        print("No stdin/*.txt", file=sys.stderr)
        sys.exit(1)
    STAGING.unlink(missing_ok=True)
    for i, f in enumerate(files):
        mode = "write" if i == 0 else "append"
        subprocess.run(
            [sys.executable, str(APPEND), str(f), str(STAGING), mode],
            check=True,
        )
    subprocess.run(
        [sys.executable, str(HERE / "split_to_parts.py"), str(STAGING)],
        check=True,
    )
    subprocess.run(
        [sys.executable, str(COMBINE), str(HERE), str(DEST)],
        check=True,
    )
    import re

    lines = DEST.read_text(encoding="utf-8").splitlines()
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"OK lines={len(lines)} entries={entries}")


if __name__ == "__main__":
    main()
