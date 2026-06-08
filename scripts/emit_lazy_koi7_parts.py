#!/usr/bin/env python3
"""Emit 慵懒的锦鲤7 chunk .part files from embedded gzip+base64 payload."""
import base64
import gzip
import re
from pathlib import Path

CHUNK_DIR = Path(r"d:\regr\docs\agent-interview\.tmp\慵懒的锦鲤7-chunks")
PAYLOAD = Path(__file__).with_name("lazy_koi7_payload.b64")


def main() -> None:
    raw = gzip.decompress(base64.b64decode(PAYLOAD.read_text(encoding="ascii")))
    text = raw.decode("utf-8")
    lines = text.splitlines()
    CHUNK_DIR.mkdir(parents=True, exist_ok=True)
    size = 400
    for i in range(0, len(lines), size):
        part = lines[i : i + size]
        n = i // size + 1
        out = CHUNK_DIR / f"{n}.part"
        out.write_text("\n".join(part) + ("\n" if part else ""), encoding="utf-8", newline="\n")
        print(f"wrote {out} ({len(part)} lines)")
    print(f"total {len(lines)} lines")


if __name__ == "__main__":
    main()
