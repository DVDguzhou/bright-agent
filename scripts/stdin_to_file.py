#!/usr/bin/env python3
"""Write stdin to file (append or write)."""
import sys

def main() -> None:
    if len(sys.argv) < 3:
        print("usage: stdin_to_file.py <dest> <w|a>", file=sys.stderr)
        sys.exit(1)
    dest, mode = sys.argv[1], sys.argv[2]
    content = sys.stdin.read()
    if not content:
        return
    flag = "w" if mode == "w" else "a"
    with open(dest, flag, encoding="utf-8", newline="\n") as f:
        if mode == "a" and content and not content.startswith("\n"):
            try:
                with open(dest, encoding="utf-8") as check:
                    if check.read():
                        f.write("\n")
            except OSError:
                pass
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")

if __name__ == "__main__":
    main()
