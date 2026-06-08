#!/usr/bin/env python3
"""Extract 慵懒的锦鲤7-extract.md from agent transcript Read tool results."""
import json
import re
from pathlib import Path

TRANSCRIPT_DIRS = [
    Path(r"C:\Users\Caiqing\.cursor\projects\d-regr\agent-transcripts"),
]
TARGET = "慵懒的锦鲤7-extract.md"
MARKER = "慵懒的锦鲤7"
OUT = Path(r"d:\regr\docs\agent-interview") / TARGET
pat = re.compile(r"^\s*\d+\|(.*)$")


def strip_text(text: str) -> list[str]:
    lines = []
    for line in text.splitlines():
        m = pat.match(line)
        lines.append(m.group(1) if m else line)
    return lines


def score(text: str) -> int:
    if MARKER not in text:
        return 0
    s = 0
    if "## 96." in text:
        s += 100000
    if "# 最终自评" in text:
        s += 50000
    if "## 1." in text:
        s += 1000
    s += len(text)
    return s


def walk_jsonl(path: Path, best: dict[str, tuple[int, str]]) -> None:
    try:
        with path.open(encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                texts: list[str] = []
                if isinstance(obj, dict):
                    for key in ("content", "text", "message"):
                        v = obj.get(key)
                        if isinstance(v, str):
                            texts.append(v)
                        elif isinstance(v, dict) and "content" in v:
                            c = v["content"]
                            if isinstance(c, str):
                                texts.append(c)
                            elif isinstance(c, list):
                                for item in c:
                                    if isinstance(item, dict) and item.get("type") == "text":
                                        t = item.get("text", "")
                                        if isinstance(t, str):
                                            texts.append(t)
                    if obj.get("role") == "tool" and isinstance(obj.get("content"), str):
                        texts.append(obj["content"])
                for t in texts:
                    sc = score(t)
                    if sc > best.get(TARGET, (0, ""))[0]:
                        best[TARGET] = (sc, t)
    except OSError:
        pass


def main() -> None:
    best: dict[str, tuple[int, str]] = {}
    for root in TRANSCRIPT_DIRS:
        if not root.exists():
            continue
        for p in root.rglob("*.jsonl"):
            walk_jsonl(p, best)
    if TARGET not in best or best[TARGET][0] == 0:
        print("NOT_FOUND")
        return
    lines = strip_text(best[TARGET][1])
    OUT.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8", newline="\n")
    entries = sum(1 for ln in lines if re.match(r"^## \d+\.", ln))
    print(f"OK lines={len(lines)} entries={entries} score={best[TARGET][0]}")


if __name__ == "__main__":
    main()
