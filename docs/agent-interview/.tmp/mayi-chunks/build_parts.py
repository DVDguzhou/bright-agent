#!/usr/bin/env python3
"""Build 6 .part files from numbered Read-tool chunk inputs."""
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent
PAT = re.compile(r"^\s*\d+\|(.*)$")
SKIP = re.compile(r"^\.\.\.\s+\d+\s+lines not shown\s+\.\.\.\s*$")
OFFSETS = [1, 401, 801, 1201, 1601, 2001]
LIMITS = [400, 400, 400, 400, 400, 400]


def strip_text(text: str) -> list[str]:
    out: list[str] = []
    for line in text.splitlines():
        s = line.rstrip("\r\n")
        if SKIP.match(s.strip()):
            continue
        m = PAT.match(s)
        out.append(m.group(1) if m else s)
    return out


def main() -> None:
    if len(sys.argv) > 1:
        sources = [Path(p) for p in sys.argv[1:]]
    else:
        sources = [OUT / f"{i}.in" for i in range(1, 7)]
    all_lines: list[str] = []
    for src in sources:
        if not src.exists():
            print(f"Missing {src}", file=sys.stderr)
            sys.exit(1)
        all_lines.extend(strip_text(src.read_text(encoding="utf-8")))
    print(f"Stripped {len(all_lines)} total lines")
    for part_no, start, limit in zip(range(1, 7), OFFSETS, LIMITS):
        chunk = all_lines[start - 1 : start - 1 + limit]
        path = OUT / f"{part_no}.part"
        text = "\n".join(chunk)
        if text:
            text += "\n"
        path.write_text(text, encoding="utf-8", newline="\n")
        print(f"{path.name}: {len(chunk)} lines, {path.stat().st_size} bytes, exists={path.exists()}")


if __name__ == "__main__":
    main()
