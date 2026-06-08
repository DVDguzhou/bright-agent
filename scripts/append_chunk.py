#!/usr/bin/env python3
"""Strip Read-tool line prefixes and append chunk to destination file."""
import re
import sys

LINE_PREFIX = re.compile(r"^\s*\d+\|(.*)$")


def strip_lines(text: str) -> str:
    lines = text.splitlines()
    out = []
    for line in lines:
        m = LINE_PREFIX.match(line)
        out.append(m.group(1) if m else line)
    return "\n".join(out)


def main() -> None:
    if len(sys.argv) < 4:
        print("usage: append_chunk.py <chunk_file> <dest_file> <write|append>", file=sys.stderr)
        sys.exit(1)
    chunk_file, dest_file, mode = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(chunk_file, "r", encoding="utf-8") as f:
        content = strip_lines(f.read())
    if not content.endswith("\n"):
        content += "\n"
    flag = "w" if mode == "write" else "a"
    with open(dest_file, flag, encoding="utf-8", newline="\n") as f:
        f.write(content)


if __name__ == "__main__":
    main()
