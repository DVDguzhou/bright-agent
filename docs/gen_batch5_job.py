#!/usr/bin/env python3
"""
Batch 5: Process programming-play repo (求职/秋招/实习/职场经验).
Sections: 读者秋招分享, 我的秋招, 秋招打法, 实习打法, offer抉择打法, 职场打法, 补招春招打法, 考研就业打法
"""
import os, re, random

BASE = os.path.dirname(__file__)
OUT_DIR = os.path.join(BASE, "..", "backend", "internal", "yantuseed")

NICK_A = [
    "闪电","麒麟","北极星","流星","彗星","极光","星云","黑洞","脉冲","量子",
    "矩阵","银河","深空","星辰","暗物质","光年","原子","夸克","引力","频率",
    "波长","信号","像素","内存","指针","栈溢出","递归","迭代","线程","协程",
    "容器","沙箱","镜像","集群","节点","网关","端口","路由","缓存","索引",
    "快照","切片","分片","哈希","链表","堆栈","二叉树","红黑树","图论","拓扑",
]
NICK_B = [
    "在刷题","写代码","在面试","拿offer","在实习","改简历","投简历","等通知",
    "学算法","做项目","看源码","背八股","练手速","写博客","调bug","过笔试",
    "去上班","加班中","在摸鱼","写周报","做复盘","搞架构","学新技","读文档",
    "跑测试","提PR","看面经","约HR","等开奖","去入职","谈薪资","选offer",
]
NICK_PRE = [
    "全栈","后端","前端","算法","运维","测试","嵌入式","AI","云原生","大数据",
    "安全","移动端","桌面端","底层","架构","分布式",
]
NICK_SUF = [
    "er","_dev","_coder","pro","guru","ninja","master","geek","hacker",
    "boy","girl","dog","cat","fox","hawk","wolf","bear","lion","eagle",
]
EMAIL_WORDS = [
    "pine","rose","mint","sage","dusk","glow","reef","glen","cove","peak",
    "dune","vale","moss","fern","bark","leaf","twig","root","seed","petal",
    "bloom","frost","haze","mist","tide","wave","storm","creek","brook","lake",
    "pond","rain","snow","star","moon","sun","dawn","noon","eve","coil",
    "bolt","gear","chip","pixel","node","link","path","loop","byte","flux",
    "core","grid","beam","ray","arc","orb","hex","dot","bit","log","map",
    "key","tag","cap","fox","elk","owl","jay","wren","crow","swan","dove",
    "lark","bass","carp","pike","mole","hare","lynx","vole","plum","jade",
    "clay","zinc","onyx","opal","ruby","silk","lace","wax","iron","gold",
]

used_nicks = set()
used_emails = set()

def gen_nick():
    for _ in range(5000):
        s = random.randint(0, 3)
        if s == 0:   n = random.choice(NICK_A) + random.choice(NICK_B)
        elif s == 1: n = random.choice(NICK_PRE) + random.choice(NICK_A) + random.choice(NICK_SUF)
        elif s == 2: n = random.choice(NICK_A) + random.choice(NICK_SUF)
        else:        n = random.choice(NICK_PRE) + "_" + random.choice(NICK_A)
        if n not in used_nicks:
            used_nicks.add(n)
            return n
    raise RuntimeError("nick exhausted")

def gen_email():
    for _ in range(5000):
        w1, w2 = random.choice(EMAIL_WORDS), random.choice(EMAIL_WORDS)
        num = random.randint(0, 99)
        sep = random.choice(["_", ""])
        e = f"{w1}{sep}{w2}{num:02d}@163.com"
        if e not in used_emails and len(e) <= 25:
            used_emails.add(e)
            return e
    raise RuntimeError("email exhausted")

def read_md(path):
    for enc in ['utf-8', 'utf-8-sig', 'gbk', 'gb18030']:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            continue
    return ""

def strip_images(text):
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', text)
    text = re.sub(r'<img[^>]*>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<div[^>]*>\s*</div>', '', text)
    text = re.sub(r'<p[^>]*>[^<]*</p>', '', text)
    return text.strip()

def anonymize(text):
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}', '[邮箱已隐藏]', text)
    text = re.sub(r'(?:QQ|qq|微信|wechat|WeChat)[号码：:\s]*\d{5,}', '[联系方式已隐藏]', text)
    text = re.sub(r'(?:手机|电话|tel|TEL)[号码：:\s]*\d{11}', '[联系方式已隐藏]', text)
    return text.strip()

def escape_go(s):
    return s.replace('\\', '\\\\').replace('`', '` + "`" + `')

def extract_title(filename):
    name = os.path.splitext(filename)[0]
    name = name.replace('_', '，')
    return name

def extract_category_from_path(rel_path):
    parts = rel_path.replace('\\', '/').split('/')
    if '读者秋招分享' in parts:
        idx = parts.index('读者秋招分享')
        if idx + 1 < len(parts) - 1:
            sub = parts[idx + 1]
            return f"秋招经验·{sub}"
        return "秋招经验"
    if '我的秋招' in parts:
        return "秋招经验·作者亲历"
    if '实习打法' in parts:
        return "实习求职"
    if '秋招打法' in parts:
        return "秋招策略"
    if 'offer抉择打法' in parts:
        return "Offer选择"
    if '职场打法' in parts:
        return "职场成长"
    if '补招春招打法' in parts:
        return "春招补招"
    if '考研就业打法' in parts:
        return "考研就业"
    return "求职经验"

def extract_direction(rel_path, text):
    parts = rel_path.replace('\\', '/').split('/')
    for p in parts:
        if p in ('CPP', 'C++'):
            return 'C/C++后端'
        if p == 'Java':
            return 'Java后端'
        if '前端' in p:
            return '前端/测开/安卓'
        if '算法' in p:
            return '算法岗'
    if any(k in text[:500] for k in ['C++', 'C/C++', 'cpp', 'Linux C']):
        return 'C/C++后端'
    if any(k in text[:500] for k in ['Java', 'java', 'Spring']):
        return 'Java后端'
    if any(k in text[:500] for k in ['前端', 'Vue', 'React', 'JavaScript']):
        return '前端'
    if any(k in text[:500] for k in ['算法', 'AI', '深度学习', '机器学习']):
        return '算法岗'
    return '互联网'

def extract_school_bg(text):
    for pat in [r'(双非[一本]*)', r'(二本)', r'(985)', r'(211)', r'(专科)', r'(三本)']:
        m = re.search(pat, text[:800])
        if m:
            return m.group(1)
    return ""

def extract_offers(text):
    offers = set()
    for pat in [r'(腾讯|阿里|百度|字节|头条|美团|京东|华为|网易|小米|拼多多|快手|滴滴|旷视|商汤|深信服|猫眼|海康)']:
        for m in re.finditer(pat, text):
            offers.add(m.group(1))
    return list(offers)[:5]

def gen_short_bio(title, direction, school_bg, offers, category):
    parts = []
    if school_bg:
        parts.append(school_bg + "背景")
    parts.append(direction + "方向")
    if offers:
        parts.append("拿下" + "、".join(offers[:3]) + "等offer")
    if '策略' in category or '打法' in category:
        parts.append("分享求职策略与经验")
    elif '实习' in category:
        parts.append("分享实习求职经验")
    elif '职场' in category:
        parts.append("分享职场成长经验")
    else:
        parts.append("分享秋招/春招求职历程")
    return "，".join(parts) + "。"

def scan_articles():
    root = os.path.join(BASE, "programming-play", "article")
    dirs_to_scan = [
        '读者秋招分享', '我的秋招',
        '秋招打法', '实习打法', 'offer抉择打法',
        '职场打法', '补招春招打法', '考研就业打法',
    ]
    profiles = []

    for d in dirs_to_scan:
        dd = os.path.join(root, d)
        if not os.path.isdir(dd):
            continue
        for dirpath, _, fns in os.walk(dd):
            for fn in sorted(fns):
                if not fn.endswith('.md'):
                    continue
                fp = os.path.join(dirpath, fn)
                text = read_md(fp)
                if len(text.strip()) < 500:
                    continue

                rel = os.path.relpath(fp, root)
                title = extract_title(fn)
                category = extract_category_from_path(rel)
                direction = extract_direction(rel, text)
                school_bg = extract_school_bg(text)
                offers = extract_offers(text)

                nick = gen_nick()
                body = strip_images(text)
                body = anonymize(body)
                short_bio = gen_short_bio(title, direction, school_bg, offers, category)

                profiles.append({
                    "nick": nick,
                    "email": gen_email(),
                    "school": school_bg if school_bg else "互联网求职",
                    "major": direction,
                    "title": f"求职经验 | {title[:40]}",
                    "body": body,
                    "short_bio": short_bio[:120],
                    "original_author": "",
                    "category": category,
                    "offers": offers,
                })

    return profiles

def write_go(filename, var_name, prefix, profiles, long_bio, audience, education,
             major_label, knowledge_cat, knowledge_tags, expertise_base, sample_qs):
    lines = ["package yantuseed\n"]
    lines.append(f'const {prefix}LongBioPrefix = `{escape_go(long_bio)}`\n')
    lines.append("const (")
    lines.append(f'\t{prefix}Audience       = `{escape_go(audience)}`')
    lines.append(f'\t{prefix}Education      = `{escape_go(education)}`')
    lines.append(f'\t{prefix}MajorLabel     = `{escape_go(major_label)}`')
    lines.append(f'\t{prefix}KnowledgeCat   = `{escape_go(knowledge_cat)}`')
    lines.append(")\n")
    tag_str = ", ".join(f'"{t}"' for t in knowledge_tags)
    lines.append(f"var {prefix}KnowledgeTags = []string{{{tag_str}}}\n")
    lines.append(f"var {var_name} = []Profile{{")

    for p in profiles:
        lines.append("\t{")
        lines.append(f'\t\tDisplayName:       `{escape_go(p["nick"])}`,')
        lines.append(f'\t\tSchool:            `{escape_go(p["school"])}`,')
        if p.get("major"):
            lines.append(f'\t\tMajorLine:         `{escape_go(p["major"])}`,')
        lines.append(f'\t\tArticleTitle:      `{escape_go(p["title"])}`,')
        lines.append(f'\t\tLongBioPrefix:     {prefix}LongBioPrefix,')
        lines.append(f'\t\tShortBio:          `{escape_go(p["short_bio"])}`,')
        lines.append(f'\t\tAudience:          {prefix}Audience,')
        lines.append(f'\t\tWelcomeMessage:    `你好，欢迎问我关于求职、秋招、面试和职场的问题。`,')
        lines.append(f'\t\tEducation:         {prefix}Education,')
        lines.append(f'\t\tMajorLabel:        {prefix}MajorLabel,')
        lines.append(f'\t\tKnowledgeCategory: {prefix}KnowledgeCat,')
        lines.append(f'\t\tKnowledgeTags:     {prefix}KnowledgeTags,')
        sq = ", ".join(f'`{escape_go(q)}`' for q in sample_qs)
        lines.append(f'\t\tSampleQuestions: []string{{{sq}}},')
        et = list(expertise_base)
        if p.get("major"):
            et.append(p["major"])
        if p.get("offers"):
            et.extend(p["offers"][:2])
        et_str = ", ".join(f'`{escape_go(t)}`' for t in et)
        lines.append(f'\t\tExpertiseTags: []string{{{et_str}}},')
        orig = p.get("original_author", "")
        if orig:
            lines.append(f'\t\tOriginalAuthor: `{escape_go(orig)}`,')
        lines.append(f'\t\tKnowledgeBody: `{escape_go(p["body"])}`,')
        lines.append("\t},")

    lines.append("}\n")
    out = os.path.join(OUT_DIR, filename)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  Written {out} ({len(profiles)} profiles)")

def main():
    print("=== Scanning programming-play ===")
    all_profiles = scan_articles()
    print(f"  Total articles: {len(all_profiles)}")

    cats = {}
    for p in all_profiles:
        c = p["category"].split("·")[0]
        cats[c] = cats.get(c, 0) + 1
    for c, n in sorted(cats.items()):
        print(f"    {c}: {n}")

    mid = len(all_profiles) // 2
    p1 = all_profiles[:mid]
    p2 = all_profiles[mid:]

    common_args = dict(
        long_bio="本文来自互联网求职经验分享合集（programming-play），著作权属原作者；以下为秋招/求职/职场经验分享，仅供参考。",
        audience="正在准备秋招、春招、实习或校招的计算机/互联网方向同学。",
        education="本科/硕士（已就业或在读）",
        major_label="技术方向",
        knowledge_cat="求职就业经验",
        knowledge_tags=["秋招", "春招", "校招", "求职", "面试", "互联网", "大厂", "offer"],
        expertise_base=["求职面试", "互联网校招"],
        sample_qs=[
            "双非背景如何拿大厂offer？",
            "秋招时间线怎么安排？",
            "技术面试怎么准备？",
            "如何选择offer？",
        ],
    )

    write_go("profiles_job_exp_1.go", "jobExpProfiles1", "jobExp",
             p1, **common_args)
    write_go("profiles_job_exp_2.go", "jobExpProfiles2", "jobExp2",
             p2, **common_args)

    emails_path = os.path.join(BASE, "batch5_emails.txt")
    with open(emails_path, 'w', encoding='utf-8') as f:
        f.write(f"\t// 互联网求职经验系列（{len(all_profiles)} 条）\n")
        for p in all_profiles:
            f.write(f'\t"{p["email"]}",\n')

    print(f"\nEmail fragment: {emails_path}")
    print(f"Total new agents: {len(all_profiles)} (seq 919 to {918 + len(all_profiles)})")
    print("Done!")

if __name__ == "__main__":
    main()
