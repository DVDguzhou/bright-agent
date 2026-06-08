#!/usr/bin/env python3
"""Merge raw chunk files into extract, strip line numbers and disclaimer."""
import re
import sys
from pathlib import Path

pat = re.compile(r"^\s*\d+\|(.*)$")
disclaimer = "只基于下列真实材料加工，勿编造"


def strip_lines(text: str, first: bool) -> list[str]:
    out = []
    for line in text.splitlines():
        m = pat.match(line)
        content = m.group(1) if m else line
        if first and disclaimer in content:
            content = content.replace(disclaimer, "").replace("。。", "。")
        out.append(content)
    return out


def merge(out_path: Path, chunk_paths: list[Path]) -> tuple[int, int]:
    all_lines: list[str] = []
    for i, cp in enumerate(chunk_paths):
        text = cp.read_text(encoding="utf-8")
        all_lines.extend(strip_lines(text, i == 0))
    with out_path.open("w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(all_lines))
        if all_lines:
            f.write("\n")
    entries = sum(1 for ln in all_lines if re.match(r"^## \d+\.", ln))
    return len(all_lines), entries


if __name__ == "__main__":
    out = Path(sys.argv[1])
    chunks = [Path(p) for p in sys.argv[2:]]
    lines, entries = merge(out, chunks)
    print(f"WROTE {out.name} lines={lines} entries={entries}")
