#!/usr/bin/env python3
"""
Batch 3: Process SZU, XJTLU, ECUST markdown articles → Go profile files.
"""
import os, re, random, yaml

BASE = os.path.dirname(__file__)
OUT_DIR = os.path.join(BASE, "..", "backend", "internal", "yantuseed")

# ── Nick / email generation ─────────────────────────────────────────────────

NICK_A = [
    "小熊","阿狸","饺子","芒果","西瓜","柿子","橙子","栗子","蘑菇","饼干",
    "薯片","布丁","椰子","松鼠","草莓","蓝莓","核桃","板栗","花卷","豆包",
    "苹果","鹿茸","海星","蜗牛","雪糕","泡芙","奶酪","银杏","桂花","豆沙",
    "花生","鲸鱼","企鹅","河马","猫头鹰","仓鼠","青蛙","锦鲤","兔兔","蜻蜓",
    "萤火虫","麻雀","鸽子","海豚","蝴蝶","蚂蚁","刺猬","瓢虫","章鱼","水母",
    "葡萄","蜜桃","芋圆","抹茶","拿铁","可可","豆奶","麦芽","薄荷","红薯",
    "山楂","柠檬","杨梅","龙眼","荔枝","菠萝","石榴","樱桃","柚子","椰果",
    "红豆","绿豆","黑芝麻","燕麦","桃子","梨子","香蕉","火龙果","百香果","芒果干",
    "蔓越莓","蓝莓酱","酸奶","奶茶","咖啡","热可可","冰淇淋","果冻","棉花糖",
    "巧克力","太妃糖","牛轧糖","薯条","汉堡","寿司","拉面","馄饨","烧饼","糯米",
    "豆腐","年糕","月饼","粽子","汤圆","麻薯","鸡蛋仔","铜锣烧","华夫饼","蛋挞",
]
NICK_B = [
    "不吃宵夜","在学习","要毕业了","的碎碎念","今天早睡","打工中","爱吃辣",
    "骑单车","看日落","在图书馆","不熬夜","刷题中","去散步","喝牛奶","想放假",
    "在跑步","读论文","画画中","考试周","在赶DDL","吃早餐","晒太阳","泡咖啡",
    "背单词","去爬山","修电脑","整理笔记","搬砖中","看电影","弹吉他","摸鱼了",
    "在发呆","写代码","逛公园","煮火锅","做饭中","打篮球","追番中","练瑜伽",
    "种花中","遛弯了","喝绿茶","吃火锅","学画画","捏泥巴","下象棋","听播客",
    "看星星","喂猫中","织毛衣","吹口琴","练书法","折纸鹤","放风筝","钓鱼中",
]
NICK_PRE = [
    "奔跑的","迷路的","安静的","快乐的","勤劳的","认真的","沉默的","飞翔的",
    "努力的","温柔的","阳光的","自在的","元气的","慵懒的","机灵的","淡定的",
]
NICK_SUF = [
    "er","ya","ii","oo","__","z","x","_v","3","7","9","zzz","_0",
    "哈","呀","鸭","吖","酱","君","大王","小号",
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
    for _ in range(3000):
        s = random.randint(0, 3)
        if s == 0:   n = random.choice(NICK_A) + random.choice(NICK_B)
        elif s == 1: n = random.choice(NICK_PRE) + random.choice(NICK_A) + random.choice(NICK_SUF)
        elif s == 2: n = random.choice(NICK_A) + random.choice(NICK_SUF) + random.choice(NICK_B)
        else:        n = random.choice(NICK_A) + "_" + random.choice(NICK_A)
        if n not in used_nicks:
            used_nicks.add(n)
            return n
    raise RuntimeError("nick exhausted")

def gen_email():
    for _ in range(3000):
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
    text = re.sub(r'<img[^>]*>', '', text)
    return text.strip()

def anonymize(text, real_name, nick):
    if not real_name or len(real_name) < 2:
        return text
    text = text.replace(real_name, nick)
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}', '[邮箱已隐藏]', text)
    text = re.sub(r'(?:QQ|qq|微信|wechat)[号码：:\s]*\d{5,}', '[联系方式已隐藏]', text)
    return text.strip()

def escape_go(s):
    return s.replace('\\', '\\\\').replace('`', '` + "`" + `')

def extract_dest(text):
    for pat in [
        r'最终[去录].*?[：:]\s*\*?\*?([^\n*,，。]{2,40})',
        r'去向[：:]\s*\*?\*?([^\n*,，。]{2,40})',
        r'录取学校[：:]\s*\*?\*?([^\n*,，。]{2,40})',
    ]:
        m = re.search(pat, text[:3000])
        if m:
            return m.group(1).strip()[:40]
    return ""

SKIP = {'readme.md','_sidebar.md','index.md','template.md','basic.md','about.md',
        'appendix.md','committee.md','friendlink.md','comingsoon.md','how-to-use.md',
        'how-to-contribute.md','what-is-it.md','about-us.md','useful-resources.md',
        'grad-application-template.md'}

CAT_CN = {'baoyan': '保研', 'kaoyan': '考研', 'liuxue': '留学', 'jiuye': '就业',
           'abroad': '留学', 'bao-yan': '保研', 'kao-yan': '考研', 'work': '就业'}

# ── SZU ──────────────────────────────────────────────────────────────────────

def scan_szu():
    """深圳大学 - H1: # 姓名 - 去向@方向<br>届次，院系，专业"""
    root = os.path.join(BASE, "SZU-docs", "docs")
    profiles = []
    for cat in ['baoyan', 'kaoyan', 'liuxue', 'jiuye']:
        cat_dir = os.path.join(root, cat)
        if not os.path.isdir(cat_dir):
            continue
        cat_cn = CAT_CN.get(cat, cat)
        for dirpath, _, fns in os.walk(cat_dir):
            for fn in sorted(fns):
                if fn.lower() in SKIP or not fn.endswith('.md'):
                    continue
                text = read_md(os.path.join(dirpath, fn))
                if len(text.strip()) < 300:
                    continue
                # H1: # 许宏浩 - 深大VCC优青组@CS<br>2023届，计软，软件工程(腾班)
                h1 = ""
                h1m = re.search(r'^#\s+(.+?)$', text, re.MULTILINE)
                if h1m:
                    h1 = h1m.group(1).strip()
                # extract name from H1 or filename
                author = ""
                m = re.match(r'([\u4e00-\u9fff]{2,4})\s*[-–—]', h1)
                if m:
                    author = m.group(1)
                if not author:
                    # try English name from H1: e.g. "ywh - ..."
                    m2 = re.match(r'(\w+)\s*[-–—]', h1)
                    if m2:
                        author = m2.group(1)
                if not author:
                    author = fn.replace('.md', '')
                # extract dest from H1
                dest = ""
                dm = re.search(r'[-–—]\s*(.+?)(?:<br>|$)', h1)
                if dm:
                    dest = dm.group(1).strip()[:50]
                if not dest:
                    dest = extract_dest(text)
                # department from path
                rel = os.path.relpath(dirpath, cat_dir)
                parts = rel.split(os.sep)
                dept = parts[0] if parts else ""
                # major from H1
                major = ""
                mm = re.search(r'(?:计软|计算机|软件|电子|信息|物理|经济|金融|管理|机电|自动化|光电|通信|数学|化学|生物|材料|法学|新闻)', h1 + text[:200])
                if mm:
                    major = mm.group(0)

                nick = gen_nick()
                body = strip_images(text)
                body = anonymize(body, author if re.search(r'[\u4e00-\u9fff]', author) else "", nick)
                dest_short = dest if dest else cat_cn + "上岸"
                short = f"深圳大学{dept}{major}，{dest_short}，分享{cat_cn}经验与备考心得。"
                profiles.append({
                    "nick": nick, "email": gen_email(), "school": "深圳大学",
                    "major": major, "score": "", "dest": dest,
                    "title": f"深大飞跃手册 | {dept} {cat_cn}",
                    "body": body, "short_bio": short[:120],
                    "original_author": author, "category": cat_cn,
                })
    return profiles

# ── XJTLU ────────────────────────────────────────────────────────────────────

def scan_xjtlu():
    """西交利物浦大学 - H1: # 17-Jingwen Zou-US, folder=dept"""
    root = os.path.join(BASE, "XJTLU-Wiki", "docs", "grad-application")
    profiles = []
    if not os.path.isdir(root):
        return profiles
    for dirpath, _, fns in os.walk(root):
        dept = ""
        rel_parts = os.path.relpath(dirpath, root).split(os.sep)
        if len(rel_parts) >= 1:
            dept = rel_parts[0].replace('-', ' ').title()
        if len(rel_parts) >= 2:
            major_folder = rel_parts[-1].replace('-', ' ').title()
        else:
            major_folder = ""
        for fn in sorted(fns):
            if fn.lower() in SKIP or fn.lower() == 'readme.md' or not fn.endswith('.md'):
                continue
            text = read_md(os.path.join(dirpath, fn))
            if len(text.strip()) < 300:
                continue
            h1 = ""
            h1m = re.search(r'^#\s+(.+?)$', text, re.MULTILINE)
            if h1m:
                h1 = h1m.group(1).strip()
            # parse filename: 17-jingwenzou-us.md or 16-coco-us,asia.md
            fn_clean = fn.replace('.md', '')
            fn_parts = re.split(r'[-–—]', fn_clean)
            author = fn_parts[1] if len(fn_parts) >= 2 else fn_clean
            dest_region = fn_parts[2] if len(fn_parts) >= 3 else ""

            nick = gen_nick()
            body = strip_images(text)
            body = anonymize(body, author if re.search(r'[\u4e00-\u9fff]', author) else "", nick)
            dest_short = dest_region.upper() if dest_region else "留学申请"
            short = f"西交利物浦大学{major_folder}，{dest_short}，分享留学申请经验。"
            profiles.append({
                "nick": nick, "email": gen_email(), "school": "西交利物浦大学",
                "major": major_folder, "score": "", "dest": dest_region,
                "title": f"XJTLU飞跃手册 | {major_folder} {dest_short}",
                "body": body, "short_bio": short[:120],
                "original_author": author,
            })
    # also check handbook.md and how2upload.md
    handbook = os.path.join(BASE, "XJTLU-Wiki", "docs", "handbook.md")
    if os.path.isfile(handbook):
        text = read_md(handbook)
        if len(text.strip()) >= 300 and any(k in text for k in ['留学','申请','offer','GPA']):
            nick = gen_nick()
            body = strip_images(text)
            profiles.append({
                "nick": nick, "email": gen_email(), "school": "西交利物浦大学",
                "major": "", "score": "", "dest": "",
                "title": "XJTLU飞跃手册 | 综合指南",
                "body": body, "short_bio": "西交利物浦大学留学综合指南，分享申请经验。",
                "original_author": "",
            })
    return profiles

# ── ECUST ────────────────────────────────────────────────────────────────────

ECUST_DEPT_CN = {
    'arts': '艺术学院', 'bioengineering': '生物工程学院', 'business': '商学院',
    'chem-engineering': '化工学院', 'chem-molecule': '化学与分子工程学院',
    'cise': '信息科学与工程学院', 'foreign': '外语学院', 'materials': '材料学院',
    'maths': '数学学院', 'mechanical-power': '机械与动力工程学院',
    'medicine': '药学院', 'physics': '物理学院',
    'resource-env-engineering': '资源与环境工程学院',
    'social-public-mgm': '社会与公共管理学院', 'other-schools': '其他学院',
}

def scan_ecust():
    """华东理工大学 - Docusaurus, frontmatter with tags, H1: # Alias (Year) : Major @ University"""
    root = os.path.join(BASE, "ECUST-Leap", "docs")
    profiles = []
    if not os.path.isdir(root):
        return profiles
    for dirpath, _, fns in os.walk(root):
        rel = os.path.relpath(dirpath, root)
        parts = rel.split(os.sep)
        if parts[0] == 'intro':
            continue
        dept_key = parts[0] if len(parts) >= 1 else ""
        dept_cn = ECUST_DEPT_CN.get(dept_key, dept_key)
        cat_key = parts[1] if len(parts) >= 2 else ""
        cat_cn = CAT_CN.get(cat_key, cat_key)
        for fn in sorted(fns):
            if fn.lower() in SKIP or not fn.endswith('.md'):
                continue
            text = read_md(os.path.join(dirpath, fn))
            if len(text.strip()) < 300:
                continue
            # parse frontmatter
            tags = []
            desc = ""
            body = text
            if text.startswith("---"):
                fm_end = text.find("---", 3)
                if fm_end > 0:
                    fm_raw = text[3:fm_end].strip()
                    body = text[fm_end+3:].strip()
                    try:
                        fm = yaml.safe_load(fm_raw)
                        if isinstance(fm, dict):
                            tags = fm.get("tags", []) or []
                            desc = str(fm.get("description", ""))
                    except:
                        pass
            # H1: # Hubble (2018) : 基础数学 @ 复旦大学
            h1 = ""
            h1m = re.search(r'^#\s+(.+?)$', body, re.MULTILINE)
            if h1m:
                h1 = h1m.group(1).strip()
            author = fn.replace('.md', '')
            major = ""
            dest = ""
            # parse H1
            hm = re.match(r'(.+?)\s*\(\d{4}\)\s*[：:]\s*(.+?)@\s*(.+)', h1)
            if hm:
                author = hm.group(1).strip()
                major = hm.group(2).strip()
                dest = hm.group(3).strip()
            elif h1:
                hm2 = re.match(r'(.+?)\s*[-–—]\s*(.+)', h1)
                if hm2:
                    author = hm2.group(1).strip()
                    dest = hm2.group(2).strip()
            if not major:
                for t in tags:
                    t_str = str(t)
                    if any(k in t_str for k in ['学院','数学','计算','物理','化学','工程','管理','经济','生物','材料','药','外语','艺术','法']):
                        major = t_str
                        break
            if not dest:
                for t in tags:
                    t_str = str(t)
                    if any(k in t_str for k in ['大学','University','MIT','清华','北大','复旦','交大','浙大','中科']):
                        dest = t_str
                        break
            if not dest:
                dest = extract_dest(body)

            nick = gen_nick()
            body_clean = strip_images(body)
            body_clean = anonymize(body_clean, author if re.search(r'[\u4e00-\u9fff]', author) else "", nick)
            dest_short = dest if dest else cat_cn + "上岸"
            short = f"华东理工大学{dept_cn}{major}，{dest_short}，分享{cat_cn}经验。"
            profiles.append({
                "nick": nick, "email": gen_email(), "school": "华东理工大学",
                "major": major, "score": "", "dest": dest,
                "title": f"华理飞跃手册 | {dept_cn} {cat_cn}",
                "body": body_clean, "short_bio": short[:120],
                "original_author": author,
            })
    return profiles

# ── Go file writer ───────────────────────────────────────────────────────────

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
        lines.append(f'\t\tWelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,')
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

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=== Scanning SZU ===")
    szu = scan_szu()
    print(f"  SZU: {len(szu)} articles")

    print("=== Scanning XJTLU ===")
    xjtlu = scan_xjtlu()
    print(f"  XJTLU: {len(xjtlu)} articles")

    print("=== Scanning ECUST ===")
    ecust = scan_ecust()
    print(f"  ECUST: {len(ecust)} articles")

    total = len(szu) + len(xjtlu) + len(ecust)
    print(f"\n=== Total: {total} new profiles ===\n")

    print("=== Writing Go files ===")

    # SZU
    write_go("profiles_szu_feyue.go", "szuFeyueProfiles", "szuFeyue",
             szu,
             "本文来自深圳大学飞跃手册，著作权属原作者；以下为升学深造/就业经验，仅供参考。",
             "正在准备保研、考研、留学或就业的同学，尤其是双非/双一流院校背景。",
             "硕士/博士研究生（已录取或就读）", "专业方向", "升学就业经验",
             ["保研","考研","留学","就业","深圳大学"], ["升学深造","深圳大学"],
             ["深大保研到985难度大吗？","双非背景如何提升竞争力？","考研和保研怎么选择？"])

    # XJTLU
    write_go("profiles_xjtlu_feyue.go", "xjtluFeyueProfiles", "xjtluFeyue",
             xjtlu,
             "本文来自西交利物浦大学飞跃手册，著作权属原作者；以下为留学申请经验，仅供参考。",
             "正在准备出国留学的同学，尤其是中外合办院校背景。",
             "硕士/博士研究生（已录取或就读）", "申请方向", "留学申请经验",
             ["留学","申请","经验贴","西交利物浦"], ["留学申请","西交利物浦大学"],
             ["XJTLU申请海外名校需要什么条件？","2+2和4+X怎么选？","如何准备GMAT/GRE？"])

    # ECUST
    write_go("profiles_ecust_feyue.go", "ecustFeyueProfiles", "ecustFeyue",
             ecust,
             "本文来自华东理工大学飞跃手册，著作权属原作者；以下为升学深造/就业经验，仅供参考。",
             "正在准备保研、考研、留学或就业的同学，尤其是211院校背景。",
             "硕士/博士研究生（已录取或就读）", "专业方向", "升学就业经验",
             ["保研","考研","留学","就业","华东理工大学"], ["升学深造","华东理工大学"],
             ["华理保研需要什么条件？","211背景如何选择目标院校？","考研和保研怎么选？"])

    # Write email + docs fragments
    all_profiles = szu + xjtlu + ecust
    seq_start = 688  # continue from existing 687

    emails_path = os.path.join(BASE, "batch3_emails.txt")
    with open(emails_path, 'w', encoding='utf-8') as f:
        for src_name, src_profiles in [("深圳大学", szu), ("西交利物浦大学", xjtlu), ("华东理工大学", ecust)]:
            f.write(f"\t// {src_name}飞跃手册系列（{len(src_profiles)} 条）\n")
            for p in src_profiles:
                f.write(f'\t"{p["email"]}",\n')

    docs_path = os.path.join(BASE, "batch3_docs.txt")
    with open(docs_path, 'w', encoding='utf-8') as f:
        seq = seq_start
        for src_name, src_profiles, src_label, go_files in [
            ("深圳大学", szu, "深大飞跃手册", "profiles_szu_feyue.go"),
            ("西交利物浦大学", xjtlu, "XJTLU飞跃手册", "profiles_xjtlu_feyue.go"),
            ("华东理工大学", ecust, "华理飞跃手册", "profiles_ecust_feyue.go"),
        ]:
            f.write(f"\n## {src_name}飞跃手册系列（{len(src_profiles)} 条）\n\n")
            f.write(f"来源：{src_name}飞跃手册GitHub仓库。\n")
            f.write(f"档案文件：`backend/internal/yantuseed/{go_files}`\n\n")
            f.write("| 序号 | 人生 Agent 显示名 | 原归属来源 | 原归属账号 | 新登录邮箱 | 初始密码 |\n")
            f.write("|-----|------------------|-----------|------------|------------|----------|\n")
            for p in src_profiles:
                f.write(f'| {seq} | {p["nick"]} | {src_label} | yantu-import@demo.com | {p["email"]} | YantuLa2026! |\n')
                seq += 1

    print(f"\nEmail fragment: {emails_path}")
    print(f"Docs fragment: {docs_path}")
    print(f"Total new agents: {total} (seq {seq_start} to {seq_start + total - 1})")
    print("Done!")

if __name__ == "__main__":
    main()
