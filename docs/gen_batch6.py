#!/usr/bin/env python3
"""
Batch 6: Process developer2gwy (考公/体制内) + sciguide (科研指北).
"""
import os, re, random

BASE = os.path.dirname(__file__)
OUT_DIR = os.path.join(BASE, "..", "backend", "internal", "yantuseed")

NICK_A = [
    "柿子","芒果","西瓜","橙子","栗子","蘑菇","饼干","薯片","布丁","椰子",
    "松鼠","草莓","蓝莓","核桃","板栗","花卷","豆包","苹果","海星","蜗牛",
    "雪糕","泡芙","奶酪","银杏","桂花","豆沙","花生","鲸鱼","企鹅","河马",
    "仓鼠","青蛙","锦鲤","兔兔","蜻蜓","萤火虫","麻雀","鸽子","海豚","蝴蝶",
    "刺猬","瓢虫","章鱼","水母","葡萄","蜜桃","芋圆","抹茶","拿铁","可可",
]
NICK_B = [
    "不吃宵夜","在学习","要毕业了","今天早睡","打工中","爱吃辣","骑单车",
    "看日落","不熬夜","刷题中","去散步","喝牛奶","想放假","在跑步","读论文",
    "考试周","在赶DDL","吃早餐","晒太阳","泡咖啡","背单词","去爬山","上岸了",
    "在发呆","写代码","逛公园","煮火锅","做饭中","打篮球","追番中","练瑜伽",
    "种花中","遛弯了","喝绿茶","吃火锅","学画画","看星星","写论文","做实验",
]
NICK_PRE = [
    "奔跑的","安静的","快乐的","勤劳的","认真的","飞翔的","努力的","温柔的",
    "阳光的","自在的","元气的","慵懒的","机灵的","淡定的","坚定的","勇敢的",
]
NICK_SUF = [
    "er","ya","ii","oo","z","x","_v","3","7","9","zzz",
    "哈","呀","鸭","吖","酱","君","大王","小号","__",
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
        else:        n = random.choice(NICK_PRE) + random.choice(NICK_A)
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
    text = re.sub(r'(?:QQ|qq|微信|wechat)[号码：:\s]*\d{5,}', '[联系方式已隐藏]', text)
    return text.strip()

def escape_go(s):
    return s.replace('\\', '\\\\').replace('`', '` + "`" + `')


# === developer2gwy ===
D2G_SKIP = {'nav', 'question', 'img', 'images'}

def scan_d2g():
    root = os.path.join(BASE, "developer2gwy")
    profiles = []

    # Main README as one agent
    readme = read_md(os.path.join(root, "README.md"))
    if len(readme) > 1000:
        nick = gen_nick()
        body = strip_images(readme)
        body = anonymize(body)
        profiles.append({
            "nick": nick, "email": gen_email(),
            "school": "程序员转公务员", "major": "公考指南",
            "title": "考公指南 | 程序员公务员考试最佳实践",
            "body": body,
            "short_bio": "程序员转公务员完整指南，涵盖考公概述、备考方法、体制内生活等方方面面。",
            "original_author": "",
        })

    # doc/ articles
    doc_root = os.path.join(root, "doc")
    for fn in sorted(os.listdir(doc_root)):
        if not fn.endswith('.md'):
            continue
        fp = os.path.join(doc_root, fn)
        if not os.path.isfile(fp):
            continue
        text = read_md(fp)
        if len(text.strip()) < 800:
            continue

        nick = gen_nick()
        body = strip_images(text)
        body = anonymize(body)
        title_raw = os.path.splitext(fn)[0]
        profiles.append({
            "nick": nick, "email": gen_email(),
            "school": "程序员转公务员", "major": "公考/体制内",
            "title": f"考公指南 | {title_raw[:40]}",
            "body": body,
            "short_bio": f"关于「{title_raw[:30]}」的详细分享与经验，帮助了解考公和体制内的真实情况。",
            "original_author": "",
        })

    # doc/nav/ articles
    nav_root = os.path.join(doc_root, "nav")
    if os.path.isdir(nav_root):
        for fn in sorted(os.listdir(nav_root)):
            if not fn.endswith('.md'):
                continue
            fp = os.path.join(nav_root, fn)
            text = read_md(fp)
            if len(text.strip()) < 800:
                continue
            nick = gen_nick()
            body = strip_images(text)
            body = anonymize(body)
            title_raw = os.path.splitext(fn)[0]
            profiles.append({
                "nick": nick, "email": gen_email(),
                "school": "程序员转公务员", "major": "公考/体制内",
                "title": f"考公指南 | {title_raw[:40]}",
                "body": body,
                "short_bio": f"关于「{title_raw[:30]}」的详细介绍，帮助规划公考和体制内职业路径。",
                "original_author": "",
            })

    # doc/question/ articles
    q_root = os.path.join(doc_root, "question")
    if os.path.isdir(q_root):
        for fn in sorted(os.listdir(q_root)):
            if not fn.endswith('.md'):
                continue
            fp = os.path.join(q_root, fn)
            text = read_md(fp)
            if len(text.strip()) < 800:
                continue
            nick = gen_nick()
            body = strip_images(text)
            body = anonymize(body)
            title_raw = os.path.splitext(fn)[0]
            profiles.append({
                "nick": nick, "email": gen_email(),
                "school": "程序员转公务员", "major": "公考/体制内",
                "title": f"考公问答 | {title_raw[:40]}",
                "body": body,
                "short_bio": f"解答常见公考疑问：{title_raw[:30]}。",
                "original_author": "",
            })

    return profiles


# === sciguide ===
SCIGUIDE_CHAPTERS = {
    '02-know.Rmd': ('科研认知', '科研入门的基本认知，包括研究范式、科研素养、学术规范等核心概念。'),
    '03-xianzhuang.Rmd': ('科研现状', '学术界的现状分析，包括科研评价体系、发表文化、学术市场等深度讨论。'),
    '04-siwei.Rmd': ('科研思维', '科研方法论与批判性思维，包括假设检验、实验设计、因果推断等。'),
    '05-shiyan.Rmd': ('实验方法', '实验设计与执行的实用指南，涵盖对照实验、采样方法、实验记录等。'),
    '06-shuju.Rmd': ('数据分析', '科研数据的处理与分析方法，包括统计分析、可视化、可重复研究等。'),
    '07-wenxian.Rmd': ('文献综述', '文献检索、阅读、管理与综述写作的系统方法。'),
    '08-shenghuo.Rmd': ('科研生活', '研究生/博士生的生活指南，包括导师关系、时间管理、心理健康等。'),
    '09-zhuanhang.Rmd': ('就业转行', '博士毕业后的职业发展，包括学术界与工业界的选择、求职策略、职业转型等。'),
}

def scan_sciguide():
    root = os.path.join(BASE, "sciguide")
    profiles = []

    for fn, (title, desc) in SCIGUIDE_CHAPTERS.items():
        fp = os.path.join(root, fn)
        if not os.path.isfile(fp):
            continue
        text = read_md(fp)
        if len(text.strip()) < 1000:
            continue

        # Truncate very long chapters to ~15K chars for agent body
        if len(text) > 15000:
            text = text[:15000] + "\n\n...(内容较长，已截取前半部分，完整内容请参阅《现代科研指北》原文)..."

        nick = gen_nick()
        body = strip_images(text)
        body = anonymize(body)
        profiles.append({
            "nick": nick, "email": gen_email(),
            "school": "学术科研", "major": title,
            "title": f"科研指北 | {title}",
            "body": body,
            "short_bio": desc[:120],
            "original_author": "yufree",
        })

    return profiles


def write_go(filename, var_name, prefix, profiles, long_bio, audience, education,
             major_label, knowledge_cat, knowledge_tags, expertise_base, sample_qs,
             welcome_msg):
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
        lines.append(f'\t\tWelcomeMessage:    `{escape_go(welcome_msg)}`,')
        lines.append(f'\t\tEducation:         {prefix}Education,')
        lines.append(f'\t\tMajorLabel:        {prefix}MajorLabel,')
        lines.append(f'\t\tKnowledgeCategory: {prefix}KnowledgeCat,')
        lines.append(f'\t\tKnowledgeTags:     {prefix}KnowledgeTags,')
        sq = ", ".join(f'`{escape_go(q)}`' for q in sample_qs)
        lines.append(f'\t\tSampleQuestions: []string{{{sq}}},')
        et = list(expertise_base)
        if p.get("major"):
            et.append(p["major"])
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
    # developer2gwy
    print("=== Scanning developer2gwy ===")
    d2g = scan_d2g()
    print(f"  developer2gwy: {len(d2g)} articles")

    write_go("profiles_d2g.go", "d2gProfiles", "d2g", d2g,
             "本文来自开源项目 developer2gwy（程序员转公务员指南），著作权属原作者；以下为考公/体制内经验分享，仅供参考。",
             "考虑从互联网/IT转型到体制内的程序员，以及正在备考公务员的同学。",
             "本科/硕士（已上岸或在职）",
             "考公方向",
             "考公体制内经验",
             ["考公", "公务员", "体制内", "行测", "申论", "面试", "选调生", "事业编"],
             ["公务员考试", "体制内工作"],
             ["程序员转公务员难吗？", "公务员考试怎么准备？", "体制内工作是什么样的？", "公务员工资待遇如何？"],
             "你好，欢迎问我关于考公、公务员和体制内工作的问题。")

    # sciguide
    print("=== Scanning sciguide ===")
    sci = scan_sciguide()
    print(f"  sciguide: {len(sci)} chapters")

    write_go("profiles_sciguide.go", "sciguideProfiles", "sciguide", sci,
             "本文来自《现代科研指北》（sciguide），著作权属原作者 yufree；以下为科研方法与学术职业指导，仅供参考。",
             "在读研究生、博士生，以及考虑学术职业或从学术界转行的人。",
             "博士/硕士（在读或已毕业）",
             "科研方向",
             "科研学术指导",
             ["科研", "学术", "博士", "硕士", "论文", "实验", "就业", "转行"],
             ["学术科研", "职业发展"],
             ["读博值得吗？", "怎么选导师？", "博士毕业后怎么找工作？", "如何高效阅读文献？"],
             "你好，欢迎问我关于科研方法、学术生涯和职业发展的问题。")

    all_profiles = d2g + sci
    emails_path = os.path.join(BASE, "batch6_emails.txt")
    with open(emails_path, 'w', encoding='utf-8') as f:
        f.write(f"\t// 考公体制内 + 科研指北系列（{len(all_profiles)} 条）\n")
        for p in all_profiles:
            f.write(f'\t"{p["email"]}",\n')

    print(f"\nEmail fragment: {emails_path}")
    print(f"Total new agents: {len(all_profiles)} (seq 1001 to {1000 + len(all_profiles)})")
    print("Done!")


if __name__ == "__main__":
    main()
