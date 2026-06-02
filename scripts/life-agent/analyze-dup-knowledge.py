#!/usr/bin/env python3
"""Scan yantuseed Go files for duplicate KnowledgeBody content."""
import hashlib
import os
import re
from collections import defaultdict

ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "internal", "yantuseed")

bodies: dict[str, list[tuple[str, str]]] = defaultdict(list)

for fn in sorted(os.listdir(ROOT)):
    if not fn.endswith(".go"):
        continue
    path = os.path.join(ROOT, fn)
    text = open(path, encoding="utf-8").read()
    parts = re.split(r"(\t\{|\n\t\{)", text)
    for block in re.finditer(r"DisplayName:\s*`([^`]*)`[\s\S]*?KnowledgeBody:\s*`([\s\S]*?)`\s*,\s*\n\t\}", text):
        name, body = block.group(1), block.group(2)
        if len(body) < 100:
            continue
        h = hashlib.sha256(body.encode()).hexdigest()[:16]
        bodies[h].append((name, fn))

dups = {k: v for k, v in bodies.items() if len(v) > 1}
print(f"profiles with knowledge: {sum(len(v) for v in bodies.values())}")
print(f"unique knowledge hashes: {len(bodies)}")
print(f"duplicate knowledge groups: {len(dups)}")
total_dup_profiles = sum(len(v) - 1 for v in dups.values())
print(f"profiles that could be removed (seed): {total_dup_profiles}")
for h, items in sorted(dups.items(), key=lambda x: -len(x[1]))[:10]:
    print(f"\n[{h}] x{len(items)}")
    for name, fn in items[:5]:
        print(f"  - {name} ({fn})")
