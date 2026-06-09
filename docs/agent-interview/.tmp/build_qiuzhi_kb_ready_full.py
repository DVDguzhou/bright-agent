from pathlib import Path
import re

base = Path(r"D:\regr\docs\agent-interview\qiuzhi-chuangye-extract")
out_dir = base / "kb-ready"
out_dir.mkdir(exist_ok=True)

files = [
    ("24h自动赚钱店", "24h自动赚钱店-extract.md", "24h自动赚钱店-知识库入库版.md"),
    ("AI电商转IP", "AI电商转IP-extract.md", "AI电商转IP-知识库入库版.md"),
    ("红总大厂运营", "红总大厂运营-extract.md", "红总大厂运营-知识库入库版.md"),
    ("职高字节AI", "职高字节AI-extract.md", "职高字节AI-知识库入库版.md"),
    ("理想转美团HR", "理想转美团HR-extract.md", "理想转美团HR-知识库入库版.md"),
]

RULES = """---

## 入库清洗规则

- 本文件按源文件逐字稿/知识条目清洗生成，尽量保留原始材料密度。
- 已移除 `虚构标注`、`自评`、`凭空编的部分`、虚构比例评估等内部审稿内容。
- 样例问题可用于检索入口，但问题本身不作为事实依据。
- 回答时只基于本文可追溯内容；没有出现的事实、数字、流程、公司内部规则，不补写。
"""

RED_FLAG_PATTERNS = (
    "### 🔴虚构标注",
    "**🔴虚构标注",
    "### 【自评】",
    "**【自评】",
    "【自评】",
)

SELF_REVIEW_HEADING = re.compile(
    r"^(#{1,3})\s+.*(自评|总自评|总体自评|整体自评|人物行为模式推断|理科生读传媒|额外题)"
    r"|^(#{1,3})\s+.*(总收尾|完整行为模式画像)"
)


def strip_preamble(text: str) -> str:
    lines = []
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("> 供 GPT") or "import-persona 导入" in s:
            continue
        if "只基于下列真实材料加工" in s or "勿编造" in s:
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def remove_review_blocks(text: str) -> str:
    lines = text.splitlines()
    out = []
    skip_mode = None
    for line in lines:
        s = line.strip()
        if any(s.startswith(p) for p in RED_FLAG_PATTERNS):
            skip_mode = "review"
            continue
        if SELF_REVIEW_HEADING.match(s):
            skip_mode = "self"
            continue
        if skip_mode == "review":
            if re.match(r"^##\s+\d+\.", s) or re.match(r"^#\s+", s):
                skip_mode = None
            else:
                continue
        elif skip_mode == "self":
            if s.startswith("# ") and not SELF_REVIEW_HEADING.match(s):
                skip_mode = None
            else:
                continue
        if not skip_mode:
            out.append(line)
    return "\n".join(out)


def remove_loose_review_lines(text: str) -> str:
    bad_bits = [
        "凭空编的部分",
        "虚构比例",
        "整体虚构",
        "本批整体虚构",
        "扛不住",
        "能扛住",
        "原文真有的部分",
        "基于原文推断的部分",
        "推断/扩写",
        "推演扩写",
        "虚构标注",
        "自评",
        "人物行为模式推断",
        "理科生读传媒",
        "总收尾",
        "完整行为模式画像",
    ]
    lines = []
    for line in text.splitlines():
        if any(bit in line for bit in bad_bits):
            continue
        lines.append(line)
    return "\n".join(lines)


def dedupe_numbered_sections(text: str) -> str:
    matches = list(re.finditer(r"(?m)^##\s+\d+\.\s+(.+)$", text))
    if not matches:
        return text
    prefix = text[: matches[0].start()].rstrip()
    parts = [prefix] if prefix else []
    seen = set()
    for idx, match in enumerate(matches):
        title = match.group(1).strip()
        start = match.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        section = text[start:end].strip()
        if title in seen:
            continue
        seen.add(title)
        parts.append(section)
    return "\n\n".join(parts).strip()


def normalize_heading(name: str, source_name: str, body: str) -> str:
    body = strip_preamble(body)
    body = re.sub(r"^#\s+.*?\n+", "", body, count=1, flags=re.S)
    header = (
        f"# {name} · 知识库入库版（完整清洗）\n\n"
        f"> 来源文件：`{source_name}`。\n"
        "> 目标：每个源文件各自形成一份可入库知识文件；保留真实材料，剔除虚假/自评/内部标注。\n"
    )
    return f"{header}\n{body.strip()}\n\n{RULES}\n"


def main() -> None:
    for name, source_name, out_name in files:
        src = base / source_name
        text = src.read_text(encoding="utf-8").replace("\r\n", "\n")
        cleaned = remove_review_blocks(text)
        cleaned = remove_loose_review_lines(cleaned)
        if source_name == "职高字节AI-extract.md":
            cleaned = dedupe_numbered_sections(cleaned)
        final = normalize_heading(name, source_name, cleaned)
        (out_dir / out_name).write_text(final, encoding="utf-8")
        print(out_name, len(final))


if __name__ == "__main__":
    main()
