# -*- coding: utf-8 -*-
"""Patch WelcomeMessage in all podcast profile Go files from podcast_welcome_messages.json."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JSON = Path(__file__).resolve().parent / "podcast_welcome_messages.json"
GO_FILES = [
    ROOT / "backend/internal/yantuseed/profiles_buzhi_podcast.go",
    ROOT / "backend/internal/yantuseed/profiles_xiabanle_podcast.go",
    ROOT / "backend/internal/yantuseed/profiles_xiaozhaofei_podcast.go",
    ROOT / "backend/internal/yantuseed/profiles_minituixiu_podcast.go",
]


def go_str(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .replace("\n", "\\n")
    )


def patch_file(path: Path, welcomes: dict[str, str]) -> int:
    text = path.read_text(encoding="utf-8")
    updated = 0
    for name, welcome in welcomes.items():
        pattern = (
            rf'(DisplayName:\s+"{re.escape(name)}"[\s\S]*?'
            rf'WelcomeMessage:\s+)"[^"]*"'
        )
        repl = rf'\1"{go_str(welcome)}"'
        new_text, n = re.subn(pattern, repl, text, count=1)
        if n:
            text = new_text
            updated += 1
        else:
            print(f"[warn] not found in {path.name}: {name}")
    path.write_text(text, encoding="utf-8")
    return updated


def main() -> None:
    welcomes = json.loads(JSON.read_text(encoding="utf-8"))
    total = 0
    for go in GO_FILES:
        n = patch_file(go, welcomes)
        print(f"{go.name}: {n} updated")
        total += n
    print(f"done, total={total}, expected={len(welcomes)}")


if __name__ == "__main__":
    main()
