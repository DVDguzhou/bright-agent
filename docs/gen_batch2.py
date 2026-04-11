#!/usr/bin/env python3
"""
Batch 2: Process AHU, SHU, HNU, SJTU, SDU markdown articles → Go profile files.
Reuses nick/email generation from gen_profiles.py patterns.
"""
import os, re, random, yaml

BASE = os.path.dirname(__file__)
OUT_DIR = os.path.join(BASE, "..", "backend", "internal", "yantuseed")

# ── Nick / email generation (same pools as gen_profiles.py) ──────────────────

NICK_A = [
    "小熊","阿狸","饺子","芒果","西瓜","柿子","橙子","栗子","蘑菇","饼干",
    "薯片","布丁","椰子","松鼠","草莓","蓝莓","核桃","板栗","花卷","豆包",
    "苹果","鹿茸","海星","蜗牛","雪糕","泡芙","奶酪","银杏","桂花","豆沙",
    "花生","鲸鱼","企鹅","河马","猫头鹰","仓鼠","青蛙","锦鲤","兔兔","蜻蜓",
    "萤火虫","麻雀","鸽子","海豚","蝴蝶","蚂蚁","刺猬","瓢虫","章鱼","水母",
    "葡萄","蜜桃","芋圆","抹茶","拿铁","可可","豆奶","麦芽","薄荷","红薯",
    "山楂","柠檬","杨梅","龙眼","荔枝","菠萝","石榴","樱桃","核桃","板栗",
    "柚子","椰果","红豆","绿豆","黑芝麻","燕麦","桃子","梨子","香蕉","火龙果",
    "百香果","芒果干","蔓越莓","蓝莓酱","酸奶","奶茶","咖啡","热可可","冰淇淋",
    "果冻","棉花糖","巧克力","太妃糖","牛轧糖","薯条","汉堡","寿司","拉面",
]
NICK_B = [
    "不吃宵夜","在学习","要毕业了","的碎碎念","今天早睡","打工中","爱吃辣",
    "骑单车","看日落","在图书馆","不熬夜","刷题中","去散步","喝牛奶","想放假",
    "在跑步","读论文","画画中","考试周","在赶DDL","吃早餐","晒太阳","泡咖啡",
    "背单词","去爬山","修电脑","整理笔记","搬砖中","看电影","弹吉他","摸鱼了",
    "在发呆","写代码","逛公园","煮火锅","做饭中","打篮球","追番中","练瑜伽",
    "种花中","遛弯了","喝绿茶","吃火锅","学画画","捏泥巴","下象棋","听播客",
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
    for _ in range(2000):
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
    for _ in range(2000):
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
        r'最终[去录].*?[：:]\s*\*?\*?([^\n*,，。]{2,30})',
        r'保研结果.*?[：:>]\s*\*?\*?([^\n*,，。]{2,30})',
        r'录取学校[：:]\s*\*?\*?([^\n*,，。]{2,30})',
        r'去向[：:]\s*\*?\*?([^\n*,，。]{2,30})',
    ]:
        m = re.search(pat, text[:2000])
        if m:
            return m.group(1).strip()[:40]
    return ""

SKIP_FILES = {'README.md','_sidebar.md','_navbar.md','_coverpage.md','index.md',
              '.gitkeep','SUMMARY.md','init.md','test.md','如何进行经验分享.md'}

# ── Repo-specific scanners ───────────────────────────────────────────────────

def scan_ahu():
    """安徽大学 - plain md, H1: # 年级-专业-姓名-去向"""
    root = os.path.join(BASE, "AHU-Inherit", "docs", "升学就业")
    profiles = []
    for dirpath, _, fns in os.walk(root):
        college = os.path.basename(dirpath)
        for fn in sorted(fns):
            if fn in SKIP_FILES or not fn.endswith('.md'):
                continue
            text = read_md(os.path.join(dirpath, fn))
            if len(text.strip()) < 200:
                continue
            h1 = ""
            h1m = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
            if h1m:
                h1 = h1m.group(1).strip()
            # parse H1 or filename: 17-应化-刘洪平-中国科学技术大学
            parts = re.split(r'[-–—]', h1 if h1 else fn.replace('.md',''))
            name = parts[2].strip() if len(parts) >= 3 else ""
            grade = parts[0].strip() if parts else ""
            major = parts[1].strip() if len(parts) >= 2 else ""
            dest = parts[3].strip() if len(parts) >= 4 else extract_dest(text)
            if not name or len(name) > 10:
                name = ""
            nick = gen_nick()
            body = strip_images(text)
            body = anonymize(body, name, nick)
            dest_short = dest if dest else "深造上岸"
            short = f"安徽大学{college}{major}专业，{dest_short}，分享保研/升学经验与备考心得。"
            profiles.append({
                "nick": nick, "email": gen_email(), "school": "安徽大学",
                "major": major, "score": "", "dest": dest,
                "title": f"安徽大学飞跃手册 | {college}{major}",
                "body": body, "short_bio": short[:120],
                "original_author": name, "college": college,
            })
    return profiles

def scan_shu():
    """上海大学 - Hugo frontmatter with author field"""
    root = os.path.join(BASE, "SHU-Fly", "content", "posts")
    profiles = []
    for fn in sorted(os.listdir(root)):
        if fn in SKIP_FILES or not fn.endswith('.md'):
            continue
        fp = os.path.join(root, fn)
        if os.path.isdir(fp):
            continue
        text = read_md(fp)
        if len(text.strip()) < 300:
            continue
        # Parse Hugo frontmatter
        author = ""
        title = ""
        cats = []
        tags = []
        body = text
        if text.startswith("---"):
            fm_end = text.find("---", 3)
            if fm_end > 0:
                fm_raw = text[3:fm_end].strip()
                body = text[fm_end+3:].strip()
                try:
                    fm = yaml.safe_load(fm_raw)
                    if isinstance(fm, dict):
                        author = str(fm.get("author", ""))
                        title = str(fm.get("title", ""))
                        cats = fm.get("categories", []) or []
                        tags = fm.get("tags", []) or []
                except:
                    pass
        if not author:
            # try filename: 17-丁芷晴-应数-保研-清深物流.md
            fn_parts = re.split(r'[-–—]', fn.replace('.md', ''))
            if len(fn_parts) >= 2:
                for p in fn_parts[1:3]:
                    if re.search(r'[\u4e00-\u9fff]{2,4}$', p.strip()):
                        author = p.strip()
                        break
        if not author:
            continue
        # Extract major from tags or filename
        major = ""
        for t in tags:
            if any(k in str(t) for k in ['专业','工程','科学','数学','计算机','物理','化学','经济','管理','法学','新闻','外语','CS','EE','通信']):
                major = str(t)
                break
        if not major:
            fn_parts = re.split(r'[-–—]', fn.replace('.md', ''))
            if len(fn_parts) >= 3:
                major = fn_parts[2].strip() if len(fn_parts[2]) > 1 else ""
        cat_str = cats[0] if cats else ""
        dest = extract_dest(body)
        if not dest:
            for t in tags:
                t_str = str(t)
                if any(k in t_str for k in ['大学','University','MIT','清华','北大','复旦','浙大','交大','UCLA','CMU','NUS']):
                    dest = t_str
                    break
        nick = gen_nick()
        body_clean = strip_images(body)
        body_clean = anonymize(body_clean, author, nick)
        dest_short = dest if dest else cat_str if cat_str else "深造"
        short = f"上海大学{major}专业，{dest_short}，分享{cat_str}经验与个人历程。"
        profiles.append({
            "nick": nick, "email": gen_email(), "school": "上海大学",
            "major": major, "score": "", "dest": dest,
            "title": f"上海大学飞跃手册 | {major}{cat_str}经验",
            "body": body_clean, "short_bio": short[:120],
            "original_author": author, "category": cat_str,
        })
    return profiles

def scan_hnu():
    """海南大学 - plain md, H1: # 届-专业-作者-路径-@学校"""
    root = os.path.join(BASE, "HNU-Application", "docs", "personal-summary")
    profiles = []
    for dirpath, _, fns in os.walk(root):
        college_code = os.path.basename(dirpath)
        for fn in sorted(fns):
            if fn in SKIP_FILES or not fn.endswith('.md'):
                continue
            text = read_md(os.path.join(dirpath, fn))
            if len(text.strip()) < 200:
                continue
            # parse filename: 18-计算机科学与技术-HWH-保研-@uestc.md
            fn_clean = fn.replace('.md', '')
            parts = re.split(r'[-–—]', fn_clean)
            grade = parts[0].strip() if parts else ""
            major = parts[1].strip() if len(parts) >= 2 else ""
            author = parts[2].strip() if len(parts) >= 3 else ""
            path_type = parts[3].strip() if len(parts) >= 4 else ""
            dest = ""
            for p in parts:
                if '@' in p:
                    dest = p.replace('@', '').strip()
                    break
            if not dest:
                dest = extract_dest(text)
            nick = gen_nick()
            body = strip_images(text)
            body = anonymize(body, author, nick)
            dest_short = dest.upper() if dest else path_type if path_type else "深造上岸"
            short = f"海南大学{major}专业，{dest_short}，分享{path_type}经验与备考心得。"
            profiles.append({
                "nick": nick, "email": gen_email(), "school": "海南大学",
                "major": major, "score": "", "dest": dest,
                "title": f"海南大学飞跃手册 | {major}{path_type}",
                "body": body, "short_bio": short[:120],
                "original_author": author,
            })
    return profiles

def scan_sjtu():
    """上海交通大学 - H1 or filename: [region]-year-name"""
    profiles = []
    for subdir in ["grad-application", "oversea-program"]:
        root = os.path.join(BASE, "SJTU-Application", "docs", subdir)
        if not os.path.isdir(root):
            continue
        for dirpath, _, fns in os.walk(root):
            dept = os.path.basename(dirpath)
            for fn in sorted(fns):
                if fn in SKIP_FILES or not fn.endswith('.md'):
                    continue
                text = read_md(os.path.join(dirpath, fn))
                if len(text.strip()) < 300:
                    continue
                h1 = ""
                h1m = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
                if h1m:
                    h1 = h1m.group(1).strip()
                # try H1: # [US]-16-陈颖 PhD in Chemistry @ Rice
                author = ""
                m = re.search(r'[-—]\d{2}[-—]([^\s\-—]+)', h1)
                if m:
                    candidate = m.group(1).strip()
                    if re.search(r'[\u4e00-\u9fff]', candidate):
                        author = candidate
                if not author:
                    # try filename slug
                    slug = fn.replace('.md','')
                    m2 = re.search(r'[-—]\d{2}[-—]([a-z]+)', slug, re.I)
                    if m2:
                        author = m2.group(1)
                if not author:
                    # try first line for name
                    first_line = text.strip().split('\n')[0]
                    m3 = re.search(r'([\u4e00-\u9fff]{2,4})\s+\d{4}级', first_line)
                    if m3:
                        author = m3.group(1)
                if not author:
                    author = fn.replace('.md','')
                dest = ""
                dm = re.search(r'@\s*(.+?)$', h1)
                if dm:
                    dest = dm.group(1).strip()
                if not dest:
                    dest = extract_dest(text)
                major_label = dept.replace('-', ' ').title() if dept != subdir else ""
                nick = gen_nick()
                body = strip_images(text)
                body = anonymize(body, author if re.search(r'[\u4e00-\u9fff]', author) else "", nick)
                dest_short = dest if dest else "深造/留学"
                short = f"上海交通大学{major_label}，{dest_short}，分享申请与升学经验。"
                profiles.append({
                    "nick": nick, "email": gen_email(), "school": "上海交通大学",
                    "major": major_label, "score": "", "dest": dest,
                    "title": f"上交飞跃手册 | {major_label} {dest_short}",
                    "body": body, "short_bio": short[:120],
                    "original_author": author,
                })
    return profiles

def scan_sdu():
    """山东大学 - similar to SJTU"""
    profiles = []
    for subdir in ["grad-application", "oversea-program"]:
        root = os.path.join(BASE, "SDU-Application", "docs", subdir)
        if not os.path.isdir(root):
            continue
        for dirpath, _, fns in os.walk(root):
            dept = os.path.basename(dirpath)
            for fn in sorted(fns):
                if fn in SKIP_FILES or not fn.endswith('.md'):
                    continue
                text = read_md(os.path.join(dirpath, fn))
                if len(text.strip()) < 300:
                    continue
                h1 = ""
                h1m = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
                if h1m:
                    h1 = h1m.group(1).strip()
                author = ""
                m = re.search(r'[-—]\d{2}[-—]([^\s\-—]+)', h1)
                if m:
                    candidate = m.group(1).strip()
                    if re.search(r'[\u4e00-\u9fff]', candidate):
                        author = candidate
                if not author:
                    slug = fn.replace('.md','')
                    m2 = re.search(r'[-—]\d{2}[-—]([a-z]+)', slug, re.I)
                    if m2:
                        author = m2.group(1)
                if not author:
                    author = fn.replace('.md','')
                dest = ""
                dm = re.search(r'@\s*(.+?)$', h1)
                if dm:
                    dest = dm.group(1).strip()
                if not dest:
                    dest = extract_dest(text)
                major_label = dept.replace('-', ' ').title() if dept != subdir else ""
                nick = gen_nick()
                body = strip_images(text)
                body = anonymize(body, author if re.search(r'[\u4e00-\u9fff]', author) else "", nick)
                dest_short = dest if dest else "深造/留学"
                short = f"山东大学{major_label}，{dest_short}，分享申请与升学经验。"
                profiles.append({
                    "nick": nick, "email": gen_email(), "school": "山东大学",
                    "major": major_label, "score": "", "dest": dest,
                    "title": f"山大飞跃手册 | {major_label} {dest_short}",
                    "body": body, "short_bio": short[:120],
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
        if p.get("score"):
            lines.append(f'\t\tScoreLine:         `{escape_go(p["score"])}`,')
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
    print("=== Scanning AHU ===")
    ahu = scan_ahu()
    print(f"  AHU: {len(ahu)} articles")

    print("=== Scanning SHU ===")
    shu = scan_shu()
    print(f"  SHU: {len(shu)} articles")

    print("=== Scanning HNU ===")
    hnu = scan_hnu()
    print(f"  HNU: {len(hnu)} articles")

    print("=== Scanning SJTU ===")
    sjtu = scan_sjtu()
    print(f"  SJTU: {len(sjtu)} articles")

    print("=== Scanning SDU ===")
    sdu = scan_sdu()
    print(f"  SDU: {len(sdu)} articles")

    total = len(ahu) + len(shu) + len(hnu) + len(sjtu) + len(sdu)
    print(f"\n=== Total: {total} new profiles ===\n")

    # Write Go files
    print("=== Writing Go files ===")

    # AHU: split into 2 files
    half = len(ahu) // 2
    write_go("profiles_ahu_feyue_1.go", "ahuFeyueProfiles1", "ahuFeyue",
             ahu[:half],
             "本文来自安徽大学飞跃手册，著作权属原作者；以下为升学深造经验，仅供参考。",
             "正在准备保研、考研或升学深造的同学，尤其是211院校背景。",
             "硕士/博士研究生（已录取或就读）", "专业方向", "升学深造经验",
             ["保研","升学","经验贴","安徽大学"], ["保研","升学深造","安徽大学"],
             ["安大保研到985的难度大吗？","夏令营和预推免哪个更容易？","211背景如何选择目标院校？"])
    write_go("profiles_ahu_feyue_2.go", "ahuFeyueProfiles2", "ahuFeyue2",
             ahu[half:],
             "本文来自安徽大学飞跃手册，著作权属原作者；以下为升学深造经验，仅供参考。",
             "正在准备保研、考研或升学深造的同学，尤其是211院校背景。",
             "硕士/博士研究生（已录取或就读）", "专业方向", "升学深造经验",
             ["保研","升学","经验贴","安徽大学"], ["保研","升学深造","安徽大学"],
             ["安大保研到985的难度大吗？","夏令营和预推免哪个更容易？","211背景如何选择目标院校？"])

    # SHU: split into 2-3 files
    third = len(shu) // 3
    write_go("profiles_shu_feyue_1.go", "shuFeyueProfiles1", "shuFeyue",
             shu[:third],
             "本文来自上海大学溯源手册（SHUFly），著作权属原作者；以下为升学/就业经验，仅供参考。",
             "正在准备保研、考研、出国或就业的同学，尤其是211院校背景。",
             "硕士/博士研究生（已录取或就读）", "专业方向", "升学就业经验",
             ["保研","考研","出国","就业","上海大学"], ["升学深造","上海大学"],
             ["上大保研需要什么条件？","考研和保研怎么选择？","如何平衡学业和实习？"])
    write_go("profiles_shu_feyue_2.go", "shuFeyueProfiles2", "shuFeyue2",
             shu[third:2*third],
             "本文来自上海大学溯源手册（SHUFly），著作权属原作者；以下为升学/就业经验，仅供参考。",
             "正在准备保研、考研、出国或就业的同学，尤其是211院校背景。",
             "硕士/博士研究生（已录取或就读）", "专业方向", "升学就业经验",
             ["保研","考研","出国","就业","上海大学"], ["升学深造","上海大学"],
             ["上大保研需要什么条件？","考研和保研怎么选择？","如何平衡学业和实习？"])
    write_go("profiles_shu_feyue_3.go", "shuFeyueProfiles3", "shuFeyue3",
             shu[2*third:],
             "本文来自上海大学溯源手册（SHUFly），著作权属原作者；以下为升学/就业经验，仅供参考。",
             "正在准备保研、考研、出国或就业的同学，尤其是211院校背景。",
             "硕士/博士研究生（已录取或就读）", "专业方向", "升学就业经验",
             ["保研","考研","出国","就业","上海大学"], ["升学深造","上海大学"],
             ["上大保研需要什么条件？","考研和保研怎么选择？","如何平衡学业和实习？"])

    # HNU
    write_go("profiles_hnu_feyue.go", "hnuFeyueProfiles", "hnuFeyue",
             hnu,
             "本文来自海南大学飞跃手册，著作权属原作者；以下为升学深造经验，仅供参考。",
             "正在准备保研、考研或留学的同学，尤其是211院校背景。",
             "硕士/博士研究生（已录取或就读）", "专业方向", "升学深造经验",
             ["保研","升学","经验贴","海南大学"], ["保研","升学深造","海南大学"],
             ["海大保研到985难度大吗？","如何准备夏令营面试？","211背景怎么提升竞争力？"])

    # SJTU
    write_go("profiles_sjtu_feyue.go", "sjtuFeyueProfiles", "sjtuFeyue",
             sjtu,
             "本文来自上海交通大学飞跃手册（SJTU-Application），著作权属原作者；以下为升学/留学经验，仅供参考。",
             "正在准备出国留学或深造的同学，尤其是985院校背景。",
             "硕士/博士研究生（已录取或就读）", "申请方向", "留学申请经验",
             ["出国留学","保研","经验贴","上海交通大学"], ["留学申请","上海交通大学"],
             ["交大申请北美PhD需要什么条件？","如何准备套磁和文书？","985背景如何选择目标学校？"])

    # SDU
    write_go("profiles_sdu_feyue.go", "sduFeyueProfiles", "sduFeyue",
             sdu,
             "本文来自山东大学飞跃手册，著作权属原作者；以下为升学/留学经验，仅供参考。",
             "正在准备出国留学或深造的同学，尤其是985院校背景。",
             "硕士/博士研究生（已录取或就读）", "申请方向", "留学申请经验",
             ["出国留学","保研","经验贴","山东大学"], ["留学申请","山东大学"],
             ["山大申请海外PhD需要什么条件？","如何准备GRE和托福？","985背景如何定位选校？"])

    # Write email + docs fragments
    all_profiles = ahu + shu + hnu + sjtu + sdu
    seq_start = 329  # continue from existing 328

    emails_path = os.path.join(BASE, "batch2_emails.txt")
    with open(emails_path, 'w', encoding='utf-8') as f:
        for src_name, src_profiles in [("安徽大学", ahu), ("上海大学", shu), ("海南大学", hnu), ("上海交通大学", sjtu), ("山东大学", sdu)]:
            f.write(f"\t// {src_name}飞跃手册系列（{len(src_profiles)} 条）\n")
            for p in src_profiles:
                f.write(f'\t"{p["email"]}",\n')

    docs_path = os.path.join(BASE, "batch2_docs.txt")
    with open(docs_path, 'w', encoding='utf-8') as f:
        seq = seq_start
        for src_name, src_profiles, src_label, go_files in [
            ("安徽大学", ahu, "安大飞跃手册", "profiles_ahu_feyue_1.go / profiles_ahu_feyue_2.go"),
            ("上海大学", shu, "上大飞跃手册", "profiles_shu_feyue_1/2/3.go"),
            ("海南大学", hnu, "海大飞跃手册", "profiles_hnu_feyue.go"),
            ("上海交通大学", sjtu, "上交飞跃手册", "profiles_sjtu_feyue.go"),
            ("山东大学", sdu, "山大飞跃手册", "profiles_sdu_feyue.go"),
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
