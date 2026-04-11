#!/usr/bin/env python3
"""
Batch 7: Process OPB v2 (一人企业方法论).
"""
import os, re, random

BASE = os.path.dirname(__file__)
OUT_DIR = os.path.join(BASE, "..", "backend", "internal", "yantuseed")

NICK_A = [
    "闪电","极光","星辰","光年","原子","量子","矩阵","银河","信号","像素",
    "指针","线程","容器","沙箱","镜像","集群","节点","网关","缓存","索引",
    "快照","切片","哈希","链表","堆栈","拓扑","脉冲","频率","波长","深空",
]
NICK_B = [
    "搞副业","做产品","写代码","在创业","做独立开发","搞自媒体","做电商",
    "做SaaS","搞开源","做课程","写书中","做咨询","搞运营","做设计",
    "做投资","搞内容","做工具","在摸索","做MVP","搞增长","做变现",
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
        s = random.randint(0, 2)
        if s == 0:   n = random.choice(NICK_A) + random.choice(NICK_B)
        elif s == 1: n = random.choice(NICK_A) + str(random.randint(0,99))
        else:        n = random.choice(NICK_A) + "_" + random.choice(NICK_A)
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
    for enc in ['utf-8', 'utf-8-sig', 'gbk']:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            continue
    return ""

def strip_images(text):
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', text)
    text = re.sub(r'<img[^>]*>', '', text, flags=re.IGNORECASE)
    return text.strip()

def escape_go(s):
    return s.replace('\\', '\\\\').replace('`', '` + "`" + `')

TITLE_MAP = {
    'define-opb.md': '一人企业的定义',
    'one-person-enterprise-does-not-equal-one-person-business.md': '一人企业≠个体户',
    'race-track-selection-for-opb.md': '一人企业赛道选择',
    'non-competition-strategy.md': '非竞争策略',
    'structured-advantage.md': '结构化优势',
    'discovery-of-by-product-advantages.md': '副产品优势的发现',
    'why-scalability-is-possible.md': '为什么规模化是可能的',
    'why-thinking-big-is-possible.md': '为什么做大是可能的',
    'start-from-side-project.md': '从副业开始',
    'managing-and-utilizing-uncertaint.md': '管理和利用不确定性',
    'building-software-products-or-services-from-scratch.md': '从零构建软件产品或服务',
    'assets-and-passive-income.md': '资产与被动收入',
    'snowballing-and-chain-propagation.md': '滚雪球与链式传播',
    'content-pool-and-automation-capability.md': '内容池与自动化能力',
    'infrastructure-user-pool-reach-capability.md': '基建·用户池·触达能力',
    'product-pool-and-payment-capability.md': '产品池与支付能力',
    'crowdsourcing-capability.md': '众包能力',
    'setup-a-one-person-business-infrastructure.md': '搭建一人企业基建',
    'what-is-the-ideal-one-person-business-infrastructure.md': '理想的一人企业基建',
    'opb-canvas-and-opb-report.md': '一人企业画布与报告',
    'opb-methodology-new-version-and-author.md': '方法论新版与作者介绍',
}

SHORT_MAP = {
    'define-opb.md': '什么是一人企业？以个体或个人品牌为主导的业务体定义与误区澄清。',
    'one-person-enterprise-does-not-equal-one-person-business.md': '一人企业与个体户的本质区别，理解规模化与可复制性。',
    'race-track-selection-for-opb.md': '如何为一人企业选择赛道，避免红海竞争，找到适合的细分市场。',
    'non-competition-strategy.md': '一人企业的非竞争策略：避开巨头，找到差异化的生存空间。',
    'structured-advantage.md': '如何构建结构化优势，让一人企业拥有可持续的竞争壁垒。',
    'discovery-of-by-product-advantages.md': '发现副产品优势：将工作中的副产品转化为商业价值。',
    'why-scalability-is-possible.md': '一人企业规模化的可能性：技术杠杆与自动化的力量。',
    'why-thinking-big-is-possible.md': '一人企业做大的可能性：超越收入天花板的思维方式。',
    'start-from-side-project.md': '从副业起步的策略：如何在保持主业的同时启动一人企业。',
    'managing-and-utilizing-uncertaint.md': '管理不确定性：在未知中找到机会并降低风险。',
    'building-software-products-or-services-from-scratch.md': '从零开始构建软件产品或服务的完整流程与方法论。',
    'assets-and-passive-income.md': '资产与被动收入：如何构建可持续的收入来源。',
    'snowballing-and-chain-propagation.md': '滚雪球效应与链式传播：低成本获客与增长策略。',
    'content-pool-and-automation-capability.md': '内容池与自动化能力：构建持续产出的内容体系。',
    'infrastructure-user-pool-reach-capability.md': '用户池与触达能力：构建私域流量与用户关系。',
    'product-pool-and-payment-capability.md': '产品池与支付能力：多产品矩阵与商业闭环。',
    'crowdsourcing-capability.md': '众包能力：如何借助外部力量扩展一人企业的边界。',
    'setup-a-one-person-business-infrastructure.md': '实操：搭建一人企业基建的具体步骤与工具选择。',
    'what-is-the-ideal-one-person-business-infrastructure.md': '理想基建架构：用户池、产品池、内容池的完美组合。',
    'opb-canvas-and-opb-report.md': '一人企业画布工具：系统化梳理你的商业模式。',
    'opb-methodology-new-version-and-author.md': '方法论的迭代历程与作者 EasyChen 的创业故事。',
}

SKIP = {'README.md', 'SUMMARY.md'}

def scan_opb():
    root = os.path.join(BASE, "OPB2", "src")
    profiles = []
    for fn in sorted(os.listdir(root)):
        if fn in SKIP or not fn.endswith('.md'):
            continue
        fp = os.path.join(root, fn)
        if not os.path.isfile(fp):
            continue
        text = read_md(fp)
        if len(text.strip()) < 1000:
            continue

        if len(text) > 15000:
            text = text[:15000] + "\n\n...(内容较长，已截取前半部分，完整内容请参阅《一人企业方法论》原文)..."

        nick = gen_nick()
        body = strip_images(text)
        title = TITLE_MAP.get(fn, os.path.splitext(fn)[0])
        short = SHORT_MAP.get(fn, f"关于{title}的详细分享。")
        profiles.append({
            "nick": nick, "email": gen_email(),
            "school": "独立创业", "major": "一人企业",
            "title": f"一人企业方法论 | {title}",
            "body": body,
            "short_bio": short[:120],
            "original_author": "easychen",
        })
    return profiles

def write_go(filename, var_name, prefix, profiles):
    long_bio = "本文来自《一人企业方法论》v2（easychen），著作权属原作者；以下为一人企业/独立创业方法论，仅供参考。"
    audience = "想做副业、独立开发、自媒体或一人企业的程序员和创业者。"
    education = "自学/本科/硕士（在职或自由职业）"
    major_label = "创业方向"
    knowledge_cat = "创业方法论"
    knowledge_tags = ["一人企业", "独立开发", "副业", "创业", "被动收入", "SaaS", "个人品牌", "自媒体"]
    expertise_base = ["独立创业", "一人企业"]
    sample_qs = [
        "一人企业怎么起步？", "如何找到适合的副业方向？",
        "独立开发怎么变现？", "如何构建被动收入？",
    ]
    welcome_msg = "你好，欢迎问我关于一人企业、独立开发、副业和创业的问题。"

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
        lines.append(f'\t\tMajorLine:         `{escape_go(p["major"])}`,')
        lines.append(f'\t\tArticleTitle:      `{escape_go(p["title"])}`,')
        lines.append(f'\t\tLongBioPrefix:     {prefix}LongBioPrefix,')
        lines.append(f'\t\tShortBio:          `{escape_go(p["short_bio"])}`,')
        lines.append(f'\t\tAudience:          {prefix}Audience,')
        lines.append(f'\t\tWelcomeMessage:    `{escape_go(welcome_msg)}`,')
        lines.append(f'\t\tEducation:         {prefix}Education,')
        lines.append(f'\t\tMajorLabel:        {prefix}MajorLabel,')
        lines.append(f'\t\tKnowledgeCategory: {prefix}KnowledgeCat,')
        lines.append(f'\t\tKnowledgeTags:     {prefix}KnowledgeTags,')
        sq = ", ".join(f'`{escape_go(q)}`' for q in sample_qs)
        lines.append(f'\t\tSampleQuestions: []string{{{sq}}},')
        et = list(expertise_base) + [p["major"]]
        et_str = ", ".join(f'`{escape_go(t)}`' for t in et)
        lines.append(f'\t\tExpertiseTags: []string{{{et_str}}},')
        if p.get("original_author"):
            lines.append(f'\t\tOriginalAuthor: `{escape_go(p["original_author"])}`,')
        lines.append(f'\t\tKnowledgeBody: `{escape_go(p["body"])}`,')
        lines.append("\t},")

    lines.append("}\n")
    out = os.path.join(OUT_DIR, filename)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  Written {out} ({len(profiles)} profiles)")

def main():
    print("=== Scanning OPB v2 ===")
    opb = scan_opb()
    print(f"  OPB v2: {len(opb)} articles")

    write_go("profiles_opb.go", "opbProfiles", "opb", opb)

    emails_path = os.path.join(BASE, "batch7_emails.txt")
    with open(emails_path, 'w', encoding='utf-8') as f:
        f.write(f"\t// 一人企业方法论系列（{len(opb)} 条）\n")
        for p in opb:
            f.write(f'\t"{p["email"]}",\n')

    print(f"\nEmail fragment: {emails_path}")
    print(f"Total new agents: {len(opb)} (seq 1028 to {1027 + len(opb)})")
    print("Done!")

if __name__ == "__main__":
    main()
