#!/usr/bin/env python3
"""Persist editor buffer by reading file in chunks (works when buffer synced or on disk)."""
import re
import sys
from pathlib import Path

CHUNK = 400
LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")
DISCLAIMER = "只基于下列真实材料加工，勿编造"


def strip_line(line: str) -> str:
    m = LINE_PREFIX.match(line)
    return m.group(1) if m else line


def read_all(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    out: list[str] = []
    for i, line in enumerate(lines):
        content = strip_line(line)
        if i == 0 and DISCLAIMER in content:
            content = content.replace(DISCLAIMER, "").replace("。。", "。")
        out.append(content)
    return out


def main() -> None:
    if len(sys.argv) < 2:
        print("usage: read_buffer_persist.py <dest_file>", file=sys.stderr)
        sys.exit(1)
    dest = Path(sys.argv[1])
    # If file missing, nothing to read from disk
    if not dest.exists():
        print(f"missing: {dest}", file=sys.stderr)
        sys.exit(1)
    lines = read_all(dest)
    dest.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8", newline="\n")
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"lines={len(lines)} entries={entries}")


if __name__ == "__main__":
    main()
