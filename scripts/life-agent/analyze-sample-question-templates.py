#!/usr/bin/env python3
"""List bulk sample-question templates in yantuseed and questions missing from Go generic map."""
import ast
import os
import re
from collections import Counter, defaultdict

ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "internal", "yantuseed")
GO_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "internal", "lifeagent", "sample_questions.go")

def load_generic_from_go():
    text = open(GO_FILE, encoding="utf-8").read()
    return set(re.findall(r'"([^"]+)":\s*true', text))

def parse_sample_sets():
    sets = Counter()
    school_by_set = defaultdict(Counter)
    shortbio_samples = defaultdict(list)
    for fn in sorted(os.listdir(ROOT)):
        if not fn.endswith(".go"):
            continue
        text = open(os.path.join(ROOT, fn), encoding="utf-8").read()
        for block in re.finditer(
            r"DisplayName:\s*`([^`]*)`[\s\S]*?ShortBio:\s*`([^`]*)`[\s\S]*?SampleQuestions:\s*\[\]string\{([^}]+)\}",
            text,
        ):
            name, short, sq_raw = block.group(1), block.group(2), block.group(3)
            qs = tuple(re.findall(r"`([^`]*)`", sq_raw))
            if not qs:
                continue
            sets[qs] += 1
            school = ""
            if "，" in short:
                school = short.split("，", 1)[0].strip()
            elif "," in short:
                school = short.split(",", 1)[0].strip()
            if school:
                school_by_set[qs][school] += 1
            if len(shortbio_samples[qs]) < 3:
                shortbio_samples[qs].append((name, short[:80]))
    return sets, school_by_set, shortbio_samples

def main():
    generic = load_generic_from_go()
    sets, school_by_set, shortbio_samples = parse_sample_sets()
    all_qs = Counter()
    for qs, n in sets.items():
        for q in qs:
            all_qs[q] += n
    missing = [q for q, n in all_qs.most_common() if q not in generic and n >= 3]
    print(f"template sets (count>=2): {sum(1 for n in sets.values() if n >= 2)}")
    print(f"profiles using shared templates: {sum(n for qs,n in sets.items() if n >= 2)}")
    print(f"\nTop bulk templates (count, schools, questions):")
    for qs, n in sets.most_common(25):
        if n < 5:
            continue
        schools = school_by_set[qs].most_common(3)
        school_hint = ", ".join(f"{s}({c})" for s, c in schools)
        print(f"\n  x{n}  [{school_hint}]")
        print(f"    {qs}")
        if shortbio_samples[qs]:
            print(f"    e.g. {shortbio_samples[qs][0]}")
    if missing:
        print(f"\nQuestions used 3+ times but NOT in genericSampleQuestions ({len(missing)}):")
        for q in missing[:40]:
            print(f"  - {q} ({all_qs[q]} profiles)")

if __name__ == "__main__":
    main()
