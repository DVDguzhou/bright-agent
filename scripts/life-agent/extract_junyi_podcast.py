# -*- coding: utf-8 -*-
"""Extract guest/host transcript from 君怡播客 docx files."""
import json
import os
import re
from pathlib import Path

from docx import Document

DOWNLOADS = Path(r"c:\Users\Caiqing\Downloads")
OUT_DIR = Path(__file__).resolve().parent / "_podcast_extract"

EPISODES = [
    {"ep": "01", "pat": "EP01", "guest": "一楠", "aliases": ["依兰"], "sp": 1, "title": "杀死乖乖女思维"},
    {"ep": "04", "pat": "EP04", "guest": "董淇", "aliases": ["董永琪"], "sp": 2, "title": "高考失利保研山大"},
    {"ep": "05", "pat": "EP05", "guest": "琼月", "aliases": ["张琼月", "Summer"], "sp": 2, "title": "国家级运动员跨考北师大"},
    {"ep": "06", "pat": "EP06", "guest": "温特", "aliases": [], "sp": 1, "title": "保研上交多边形战士"},
    {"ep": "07", "pat": "EP07", "guest": "肘子", "aliases": [], "sp": 2, "title": "高考后赚几十万"},
    {"ep": "08", "pat": "EP08", "guest": "路阳", "aliases": ["杨哥"], "sp": 2, "title": "校园兼职到乡村振兴创业"},
    {"ep": "09", "pat": "EP09", "guest": "林老师", "aliases": [], "sp": 1, "title": "留学信息差"},
    {"ep": "10", "pat": "EP10", "guest": "伊岚", "aliases": ["依兰"], "sp": 2, "title": "强者思维规划人生"},
    {"ep": "11", "pat": "EP11", "guest": "伊岚", "aliases": ["依兰"], "sp": 2, "title": "学历贬值学习升值"},
    {"ep": "12", "pat": "EP12", "guest": "廖翔", "aliases": ["廖湘"], "sp": 1, "title": "高考复读逆袭3万名"},
    {"ep": "13", "pat": "EP13", "guest": "万万", "aliases": ["万思雨"], "sp": 2, "title": "大四赚20万放弃保研"},
    {"ep": "14", "pat": "EP14", "guest": "方迪迪", "aliases": ["笔笔", "BB"], "sp": 1, "title": "爆款小红书23岁年入百万"},
    {"ep": "15", "pat": "EP15", "guest": "金哥", "aliases": ["荆轲"], "sp": 1, "title": "双非二本欧陆top商学院"},
    {"ep": "19", "pat": "EP19", "guest": "君怡", "aliases": [], "sp": 1, "title": "砸碎精英滤镜", "solo": True},
    {"ep": "20", "pat": "EP20", "guest": "子豪", "aliases": [], "sp": 1, "title": "算法工程师副业月入过万"},
    {"ep": "21", "pat": "EP21", "guest": "李琪", "aliases": ["雨琪"], "sp": 1, "title": "创赛小白到市单位实习"},
    {"ep": "22", "pat": "EP22", "guest": "韦宣", "aliases": ["韦轩"], "sp": 1, "title": "30+奖项到联合国offer"},
    {"ep": "23", "pat": "EP23", "guest": "月白", "aliases": ["山月白"], "sp": 1, "title": "四川小镇到闯入阿里"},
    {"ep": "24", "pat": "EP24", "guest": "全疆", "aliases": ["陈江"], "sp": 2, "title": "从二本到小米"},
    {"ep": "25", "pat": "EP25", "guest": "石辉", "aliases": ["世辉", "阿辉"], "sp": 1, "title": "南海舰队到Web3顾问"},
    {"ep": "26", "pat": "EP26", "guest": "志浩", "aliases": [], "sp": 1, "title": "口吃少年到央视舞台"},
    {"ep": "27", "pat": "E27", "guest": "林老师", "aliases": [], "sp": 1, "title": "大学生年入5万轻创业"},
    {"ep": "28", "pat": "EP28", "guest": "佳莹", "aliases": ["Jilin"], "sp": 2, "title": "大二独游北欧5国"},
]

DISPLAY_NAMES = {
    "01": "一楠不要了",
    "04": "董淇祛魅打野",
    "05": "琼月旷野跑",
    "06": "温特多边形",
    "07": "肘子西部突围",
    "08": "路阳乡村振兴",
    "09": "林老师聊留学",
    "10": "伊岚强者思维",
    "11": "伊岚学习升值",
    "12": "廖翔榨干翻盘",
    "13": "万万放弃保研",
    "14": "迪迪小红书百万",
    "15": "金哥欧陆商科",
    "19": "君怡砸滤镜",
    "20": "子豪算法副业",
    "21": "雨琪创赛破局",
    "22": "韦宣联合国路",
    "23": "月白阿里破局",
    "24": "全疆小米逆袭",
    "25": "石辉Web3顾问",
    "26": "志浩央视实验",
    "27": "林老师轻创业",
    "28": "佳莹北欧独行",
}


def find_file(pat: str) -> Path | None:
    for fn in DOWNLOADS.iterdir():
        if fn.suffix == ".docx" and pat in fn.name:
            return fn
    return None


def parse_docx(path: Path) -> tuple[str, dict[int, list[str]]]:
    doc = Document(str(path))
    speaker_re = re.compile(r"^发言人(\d+)\s+\d{2}:\d{2}\s*$")
    current = 0
    buckets: dict[int, list[str]] = {1: [], 2: []}
    meta_title = ""
    for p in doc.paragraphs:
        t = p.text.strip()
        if not t:
            continue
        m = speaker_re.match(t)
        if m:
            current = int(m.group(1))
            continue
        if current in buckets:
            buckets[current].append(t)
        elif not meta_title and not re.match(r"^\d{4}", t):
            meta_title = t
    return meta_title, buckets


def first_sentence(text: str, max_len: int = 120) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return ""
    for sep in "。！？\n":
        idx = text.find(sep)
        if 20 < idx < max_len:
            return text[: idx + 1]
    return text[:max_len] + ("…" if len(text) > max_len else "")


def build_knowledge(ep: dict, meta: str, guest: str, host: str) -> str:
    parts = [
        f"节目：《不止大学》播客 EP{ep['ep']}《{ep['title']}》",
        f"嘉宾：{ep['guest']}" + (f"（{' / '.join(ep['aliases'])}）" if ep["aliases"] else ""),
        f"主持人：君怡",
        "",
        "【嘉宾分享】",
        guest.strip(),
        "",
        "【主持人追问与补充（供理解语境）】",
        host.strip()[:6000],
    ]
    return "\n".join(parts).strip()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    profiles = []
    for ep in EPISODES:
        path = find_file(ep["pat"])
        if not path:
            print("MISSING", ep["pat"])
            continue
        meta, buckets = parse_docx(path)
        guest_sp = ep["sp"]
        host_sp = 2 if guest_sp == 1 else 1
        guest_text = "\n".join(buckets.get(guest_sp, []))
        host_text = "\n".join(buckets.get(host_sp, []))
        if ep.get("solo"):
            guest_text = "\n".join(buckets.get(1, []) + buckets.get(2, []))
            host_text = ""

        display = DISPLAY_NAMES[ep["ep"]]
        short = first_sentence(guest_text, 140) or ep["title"]
        profile = {
            **ep,
            "display_name": display,
            "meta": meta,
            "short_bio": short,
            "guest_len": len(guest_text),
            "host_len": len(host_text),
            "knowledge_body": build_knowledge(ep, meta, guest_text, host_text),
        }
        profiles.append(profile)
        out = OUT_DIR / f"EP{ep['ep']}.json"
        out.write_text(json.dumps(profile, ensure_ascii=False, indent=2), encoding="utf-8")
        print(ep["ep"], display, profile["guest_len"], profile["host_len"])

    (OUT_DIR / "all_profiles.json").write_text(
        json.dumps(profiles, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("profiles", len(profiles))


if __name__ == "__main__":
    main()
