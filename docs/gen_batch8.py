#!/usr/bin/env python3
"""
Batch 8: Process multiple repos to generate 452+ agents.
Repos: SCUT-Fly, CS-BAOYAN-2024, SCU-Fly, THU-Fly, NKU-CS,
       CSU-App, UESTC-Fly, howto-money, SurviveSJTU,
       CS-BAOYAN-Wiki, Run-Philosophy
"""
import os, re, random, json

BASE = os.path.dirname(__file__)
OUT_DIR = os.path.join(BASE, "..", "backend", "internal", "yantuseed")

NICK_A = [
    "柿子","芒果","西瓜","橙子","栗子","蘑菇","饼干","薯片","布丁","椰子",
    "松鼠","草莓","蓝莓","核桃","板栗","花卷","豆包","苹果","海星","蜗牛",
    "雪糕","泡芙","奶酪","银杏","桂花","豆沙","花生","鲸鱼","企鹅","河马",
    "仓鼠","青蛙","锦鲤","兔兔","蜻蜓","萤火虫","麻雀","鸽子","海豚","蝴蝶",
    "刺猬","瓢虫","章鱼","水母","葡萄","蜜桃","芋圆","抹茶","拿铁","可可",
    "樱桃","番茄","柠檬","荔枝","榴莲","菠萝","石榴","杨梅","红豆","绿豆",
    "珍珠","奶茶","果冻","马卡龙","可颂","年糕","汤圆","饺子","包子","馒头",
    "烧饼","煎饼","春卷","凉皮","冰棍","雪花","棉花糖","太妃糖","牛轧糖","蛋挞",
]
NICK_B = [
    "不吃宵夜","在学习","要毕业了","今天早睡","打工中","爱吃辣","骑单车",
    "看日落","不熬夜","刷题中","去散步","喝牛奶","想放假","在跑步","读论文",
    "考试周","在赶DDL","吃早餐","晒太阳","泡咖啡","背单词","去爬山","上岸了",
    "在发呆","写代码","逛公园","煮火锅","做饭中","打篮球","追番中","练瑜伽",
    "种花中","遛弯了","喝绿茶","吃火锅","学画画","看星星","写论文","做实验",
    "跑步去","看电影","弹吉他","听播客","画水彩","做面包","养多肉","拍照片",
    "在冲浪","去徒步","泡温泉","在摸鱼","考证中","实习中","在搬砖","做PPT",
]
NICK_PRE = [
    "奔跑的","安静的","快乐的","勤劳的","认真的","飞翔的","努力的","温柔的",
    "阳光的","自在的","元气的","慵懒的","机灵的","淡定的","坚定的","勇敢的",
    "活泼的","热情的","清新的","灵动的","洒脱的","俏皮的","甜甜的","暖暖的",
]
NICK_SUF = [
    "er","ya","ii","oo","z","x","_v","3","7","9","zzz",
    "哈","呀","鸭","吖","酱","君","大王","小号","__","wow","go",
    "lab","pro","cc","kk","dd","bb","nn","mm","pp","tt","ss","ff",
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
    "fig","ash","elm","oak","yew","ivy","rye","oat","hop","dew","gem",
    "tin","copper","brass","steel","slate","amber","coral","ivory","pearl","sage",
]

used_nicks = set()
used_emails = set()

def gen_nick():
    for _ in range(8000):
        s = random.randint(0, 4)
        if s == 0:   n = random.choice(NICK_A) + random.choice(NICK_B)
        elif s == 1: n = random.choice(NICK_PRE) + random.choice(NICK_A) + random.choice(NICK_SUF)
        elif s == 2: n = random.choice(NICK_A) + random.choice(NICK_SUF)
        elif s == 3: n = random.choice(NICK_PRE) + random.choice(NICK_A)
        else:        n = random.choice(NICK_A) + random.choice(NICK_A)
        if n not in used_nicks:
            used_nicks.add(n)
            return n
    raise RuntimeError("nick exhausted")

def gen_email():
    for _ in range(8000):
        w1, w2 = random.choice(EMAIL_WORDS), random.choice(EMAIL_WORDS)
        num = random.randint(0, 99)
        sep = random.choice(["_", ""])
        e = f"{w1}{sep}{w2}{num:02d}@163.com"
        if e not in used_emails and len(e) <= 25:
            used_emails.add(e)
            return e
    raise RuntimeError("email exhausted")

def read_md(path):
    for enc in ['utf-8', 'utf-8-sig', 'gbk', 'gb18030', 'latin-1']:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            continue
    return ""

def strip_images(text):
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', text)
    text = re.sub(r'<img[^>]*/?>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<div[^>]*>\s*</div>', '', text)
    text = re.sub(r'<p\s[^>]*>[^<]*</p>', '', text)
    text = re.sub(r'<iframe[^>]*>[^<]*</iframe>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    return text.strip()

def anonymize(text):
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}', '[邮箱已隐藏]', text)
    text = re.sub(r'(?:QQ|qq|微信|wechat)[号码：:\s]*\d{5,}', '[联系方式已隐藏]', text)
    text = re.sub(r'1[3-9]\d{9}', '[电话已隐藏]', text)
    return text.strip()

def escape_go(s):
    return s.replace('\\', '\\\\').replace('`', '` + "`" + `')

def extract_title(text, filename):
    m = re.search(r'^#\s+(.+)', text, re.MULTILINE)
    if m:
        title = m.group(1).strip()
        title = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', title)
        title = re.sub(r'[*_`#]', '', title).strip()
        if len(title) > 3:
            return title[:60]
    base = os.path.splitext(filename)[0]
    base = re.sub(r'[-_]', ' ', base).strip()
    if len(base) > 2:
        return base[:60]
    return filename

def extract_frontmatter_field(text, field):
    m = re.match(r'^---\s*\n(.*?)\n---', text, re.DOTALL)
    if m:
        fm = m.group(1)
        p = re.search(rf'^{field}:\s*(.+)', fm, re.MULTILINE)
        if p:
            val = p.group(1).strip().strip('"').strip("'")
            return val
    return ""


# ============================================
# Scanning functions per repo
# ============================================

SKIP_FILES = {'README.md', 'SUMMARY.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
              'LICENSE.md', 'index.md', 'sidebar.md', '_sidebar.md',
              'Archive备份.md', 'CodeOfConduct.md', 'template.md'}
SKIP_DIRS = {'.git', 'node_modules', 'img', 'images', 'assets', 'pics',
             'figures', 'public', 'static', '.vitepress', '__pycache__',
             '.github', '.gitbook'}

def scan_repo_generic(root, school, major_default, title_prefix, short_bio_tpl,
                      min_bytes=800, max_body=15000, skip_readme=True,
                      extra_skip_dirs=None, extra_skip_files=None):
    profiles = []
    skip_d = SKIP_DIRS | (extra_skip_dirs or set())
    skip_f = SKIP_FILES | (extra_skip_files or set())
    if not skip_readme:
        skip_f -= {'README.md'}

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in skip_d]
        for fn in sorted(filenames):
            if not fn.endswith('.md'):
                continue
            if fn in skip_f:
                continue
            fp = os.path.join(dirpath, fn)
            text = read_md(fp)
            clean = strip_images(text)
            if len(clean.strip()) < min_bytes:
                continue

            title = extract_title(text, fn)
            author = extract_frontmatter_field(text, 'author')

            body = anonymize(clean)
            if len(body) > max_body:
                body = body[:max_body] + "\n\n...(内容较长，已截取前半部分)..."

            nick = gen_nick()
            short_bio = short_bio_tpl.format(title=title[:30])
            profiles.append({
                "nick": nick, "email": gen_email(),
                "school": school, "major": major_default,
                "title": f"{title_prefix}{title[:50]}",
                "body": body,
                "short_bio": short_bio[:120],
                "original_author": author,
            })
    return profiles


def scan_scut():
    root = os.path.join(BASE, "SCUT-Fly", "docs")
    if not os.path.isdir(root):
        root = os.path.join(BASE, "SCUT-Fly")
    return scan_repo_generic(root, "华南理工大学", "保研/留学",
        "华南理工飞跃 | ", "来自华南理工大学飞跃手册：{title}。",
        extra_skip_dirs={'intro','guide','.vitepress'})

def scan_csbaoyan():
    profiles = []
    root1 = os.path.join(BASE, "CS-BAOYAN-2024", "docs")
    if not os.path.isdir(root1):
        root1 = os.path.join(BASE, "CS-BAOYAN-2024")
    p1 = scan_repo_generic(root1, "计算机保研", "保研/夏令营",
        "保研经验 | ", "来自CS-BAOYAN的保研经验分享：{title}。",
        extra_skip_dirs={'template'})
    profiles.extend(p1)

    root2 = os.path.join(BASE, "CS-BAOYAN-Wiki", "src", "content", "docs")
    if not os.path.isdir(root2):
        root2 = os.path.join(BASE, "CS-BAOYAN-Wiki")
    p2 = scan_repo_generic(root2, "计算机保研", "保研/夏令营",
        "保研指南 | ", "来自CS-BAOYAN Wiki的保研信息与指南：{title}。",
        extra_skip_dirs={'template'})
    profiles.extend(p2)
    return profiles

def scan_scu():
    root = os.path.join(BASE, "SCU-Fly")
    return scan_repo_generic(root, "四川大学", "保研/留学/考研",
        "四川大学飞跃 | ", "来自四川大学飞跃手册：{title}。",
        min_bytes=500, extra_skip_dirs={'intro','.vitepress','src'})

def scan_thu():
    root = os.path.join(BASE, "THU-Fly", "docs")
    if not os.path.isdir(root):
        root = os.path.join(BASE, "THU-Fly")
    return scan_repo_generic(root, "清华大学", "留学申请",
        "清华飞跃 | ", "来自清华大学飞跃手册：{title}。",
        min_bytes=500, extra_skip_dirs={'intro','.vitepress'})

def scan_nku():
    root = os.path.join(BASE, "NKU-CS")
    profiles = []
    courses_root = os.path.join(root, "courses")
    if os.path.isdir(courses_root):
        p = scan_repo_generic(courses_root, "南开大学", "计算机课程",
            "南开课程经验 | ", "来自南开大学计算机学院的课程学习经验：{title}。")
        profiles.extend(p)
    courses_law = os.path.join(root, "courses_law")
    if os.path.isdir(courses_law):
        p = scan_repo_generic(courses_law, "南开大学", "网安/法学课程",
            "南开课程经验 | ", "来自南开大学网安/法学专业的课程学习经验：{title}。")
        profiles.extend(p)
    courses_ma = os.path.join(root, "courses_maphd")
    if os.path.isdir(courses_ma):
        p = scan_repo_generic(courses_ma, "南开大学", "研究生课程",
            "南开研究生课程 | ", "来自南开大学研究生课程经验分享：{title}。")
        profiles.extend(p)
    exp_root = os.path.join(root, "experiences")
    if os.path.isdir(exp_root):
        p = scan_repo_generic(exp_root, "南开大学", "保研/考研/就业",
            "南开经验 | ", "来自南开大学的个人经验分享：{title}。")
        profiles.extend(p)
    return profiles

def scan_csu_uestc():
    profiles = []
    csu = os.path.join(BASE, "CSU-App")
    p1 = scan_repo_generic(csu, "中南大学", "保研/考研",
        "中南大学 | ", "来自中南大学飞跃手册：{title}。")
    profiles.extend(p1)

    uestc = os.path.join(BASE, "UESTC-Fly")
    p2 = scan_repo_generic(uestc, "电子科技大学", "保研/留学",
        "电子科大飞跃 | ", "来自电子科技大学飞跃手册：{title}。")
    profiles.extend(p2)
    return profiles

def scan_money():
    root = os.path.join(BASE, "howto-money")
    return scan_repo_generic(root, "副业赚钱", "程序员副业",
        "副业指南 | ", "关于副业赚钱和变现的实用指南：{title}。",
        skip_readme=False)

def scan_sjtu():
    root = os.path.join(BASE, "SurviveSJTU")
    profiles = scan_repo_generic(root, "上海交通大学", "大学生存指南",
        "上交生存 | ", "来自上海交通大学生存手册：{title}。",
        extra_skip_dirs={'xu'})
    seen_bodies = set()
    deduped = []
    for p in profiles:
        sig = p["body"][:200]
        if sig not in seen_bodies:
            seen_bodies.add(sig)
            deduped.append(p)
    return deduped

def scan_cssl():
    root = os.path.join(BASE, "cs-self-learning", "docs")
    if not os.path.isdir(root):
        root = os.path.join(BASE, "cs-self-learning")
    profiles = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        rel = os.path.relpath(dirpath, root)

        for fn in sorted(filenames):
            if not fn.endswith('.md') or fn in SKIP_FILES:
                continue
            fp = os.path.join(dirpath, fn)
            text = read_md(fp)
            clean = strip_images(text)
            if len(clean.strip()) < 600:
                continue

            title = extract_title(text, fn)
            author = extract_frontmatter_field(text, 'author')
            body = anonymize(clean)
            if len(body) > 15000:
                body = body[:15000] + "\n\n...(内容较长，已截取前半部分)..."

            category = rel.split(os.sep)[0] if rel != '.' else "计算机自学"
            if category == '.':
                category = "计算机自学"

            nick = gen_nick()
            profiles.append({
                "nick": nick, "email": gen_email(),
                "school": "CS自学指南", "major": category,
                "title": f"CS自学 | {title[:50]}",
                "body": body,
                "short_bio": f"来自北大CS自学指南的课程推荐与学习经验：{title[:30]}。"[:120],
                "original_author": author if author else "",
            })
    return profiles


def scan_run():
    root = os.path.join(BASE, "Run-Philosophy")
    practical_dirs = {
        '润学方法论', '润学实例', '润学感悟', '哲学概念',
        '人口问题相关', '经济问题相关', '经济与投资',
        '润学之衙学基础', '对润学的报道',
    }
    profiles = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        rel = os.path.relpath(dirpath, root)
        top_dir = rel.split(os.sep)[0] if rel != '.' else ''

        if top_dir and top_dir not in practical_dirs:
            if rel == '.':
                pass
            else:
                continue

        for fn in sorted(filenames):
            if not fn.endswith('.md') or fn in SKIP_FILES:
                continue
            fp = os.path.join(dirpath, fn)
            text = read_md(fp)
            clean = strip_images(text)
            if len(clean.strip()) < 800:
                continue

            title = extract_title(text, fn)
            body = anonymize(clean)
            if len(body) > 15000:
                body = body[:15000] + "\n\n...(内容较长，已截取前半部分)..."

            if top_dir in ('润学方法论', '润学实例'):
                school_val = "海外生活规划"
                major_val = "留学/移民"
                prefix = "海外规划 | "
                bio = f"关于海外生活规划的实用指南：{title[:30]}。"
            elif top_dir == '润学感悟':
                school_val = "人生感悟"
                major_val = "生活规划"
                prefix = "人生感悟 | "
                bio = f"关于人生选择与规划的思考：{title[:30]}。"
            elif top_dir in ('经济问题相关', '经济与投资'):
                school_val = "经济观察"
                major_val = "经济/投资"
                prefix = "经济观察 | "
                bio = f"关于经济形势与投资理财的分析：{title[:30]}。"
            elif top_dir == '哲学概念':
                school_val = "思想哲学"
                major_val = "社会思考"
                prefix = "思想随笔 | "
                bio = f"关于社会与人生的深度思考：{title[:30]}。"
            else:
                school_val = "人生规划"
                major_val = "综合"
                prefix = "人生规划 | "
                bio = f"关于人生规划与选择的分享：{title[:30]}。"

            profiles.append({
                "nick": gen_nick(), "email": gen_email(),
                "school": school_val, "major": major_val,
                "title": f"{prefix}{title[:50]}",
                "body": body,
                "short_bio": bio[:120],
                "original_author": "",
            })
    return profiles


# ============================================
# Go file writer
# ============================================

def write_go(filename, var_name, prefix, profiles, long_bio, audience, education,
             major_label, knowledge_cat, knowledge_tags, expertise_base, sample_qs,
             welcome_msg, source=""):
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
        if source:
            lines.append(f'\t\tSource: `{escape_go(source)}`,')
        lines.append(f'\t\tKnowledgeBody: `{escape_go(p["body"])}`,')
        lines.append("\t},")

    lines.append("}\n")
    out = os.path.join(OUT_DIR, filename)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"  Written {out} ({len(profiles)} profiles)")


def write_go_split(base_name, var_prefix, const_prefix, profiles, long_bio, audience,
                   education, major_label, knowledge_cat, knowledge_tags, expertise_base,
                   sample_qs, welcome_msg, source="", chunk_size=120):
    if len(profiles) <= chunk_size:
        write_go(f"{base_name}.go", f"{var_prefix}Profiles", const_prefix, profiles,
                 long_bio, audience, education, major_label, knowledge_cat,
                 knowledge_tags, expertise_base, sample_qs, welcome_msg, source=source)
        return [f"{var_prefix}Profiles"]
    chunks = []
    for i in range(0, len(profiles), chunk_size):
        idx = i // chunk_size + 1
        chunk = profiles[i:i+chunk_size]
        var_name = f"{var_prefix}Profiles{idx}"
        fn = f"{base_name}_{idx}.go"
        cp = const_prefix if idx == 1 else None
        if cp:
            write_go(fn, var_name, const_prefix, chunk, long_bio, audience,
                     education, major_label, knowledge_cat, knowledge_tags,
                     expertise_base, sample_qs, welcome_msg, source=source)
        else:
            lines = ["package yantuseed\n"]
            lines.append(f"var {var_name} = []Profile{{")
            for p in chunk:
                lines.append("\t{")
                lines.append(f'\t\tDisplayName:       `{escape_go(p["nick"])}`,')
                lines.append(f'\t\tSchool:            `{escape_go(p["school"])}`,')
                if p.get("major"):
                    lines.append(f'\t\tMajorLine:         `{escape_go(p["major"])}`,')
                lines.append(f'\t\tArticleTitle:      `{escape_go(p["title"])}`,')
                lines.append(f'\t\tLongBioPrefix:     {const_prefix}LongBioPrefix,')
                lines.append(f'\t\tShortBio:          `{escape_go(p["short_bio"])}`,')
                lines.append(f'\t\tAudience:          {const_prefix}Audience,')
                lines.append(f'\t\tWelcomeMessage:    `{escape_go(welcome_msg)}`,')
                lines.append(f'\t\tEducation:         {const_prefix}Education,')
                lines.append(f'\t\tMajorLabel:        {const_prefix}MajorLabel,')
                lines.append(f'\t\tKnowledgeCategory: {const_prefix}KnowledgeCat,')
                lines.append(f'\t\tKnowledgeTags:     {const_prefix}KnowledgeTags,')
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
                if source:
                    lines.append(f'\t\tSource: `{escape_go(source)}`,')
                lines.append(f'\t\tKnowledgeBody: `{escape_go(p["body"])}`,')
                lines.append("\t},")
            lines.append("}\n")
            out = os.path.join(OUT_DIR, fn)
            with open(out, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
            print(f"  Written {out} ({len(chunk)} profiles)")
        chunks.append(var_name)
    return chunks


def main():
    random.seed(2026_04_10_08)
    all_emails = []

    # 1. SCUT
    print("=== SCUT-Fly ===")
    scut = scan_scut()
    print(f"  {len(scut)} articles")
    write_go("profiles_scut_fly.go", "scutFlyProfiles", "scutFly", scut,
             "本文来自华南理工大学飞跃手册，著作权属原作者；以下为保研/留学经验分享。",
             "华南理工大学在读或应届学生，考虑保研、留学或就业。",
             "本科/硕士（在读或已录取）", "保研/留学方向",
             "华南理工飞跃经验", ["保研","留学","华南理工","飞跃手册","考研"],
             ["保研","留学","华南理工"],
             ["华南理工保研难吗？","出国留学怎么准备？","华南理工就业怎么样？"],
             "你好，欢迎问我关于华南理工大学升学和就业的问题。",
             source="华南理工大学飞跃手册")
    all_emails.extend(p["email"] for p in scut)

    # 2. CS-BAOYAN
    print("=== CS-BAOYAN ===")
    baoyan = scan_csbaoyan()
    print(f"  {len(baoyan)} articles")
    write_go("profiles_csbaoyan.go", "csBaoyanProfiles", "csBaoyan", baoyan,
             "本文来自CS-BAOYAN（计算机保研交流群），著作权属原作者；以下为保研经验分享。",
             "计算机相关专业的保研同学。", "本科（即将保研或已保研）",
             "保研方向", "计算机保研经验",
             ["保研","夏令营","计算机","面试","推免"],
             ["保研","CS","夏令营"],
             ["保研夏令营怎么准备？","计算机保研面试考什么？","如何选导师？"],
             "你好，欢迎问我关于计算机保研和夏令营的问题。",
             source="CS-BAOYAN计算机保研")
    all_emails.extend(p["email"] for p in baoyan)

    # 3. SCU
    print("=== SCU-Fly ===")
    scu = scan_scu()
    print(f"  {len(scu)} articles")
    write_go("profiles_scu_fly.go", "scuFlyProfiles", "scuFly", scu,
             "本文来自四川大学飞跃手册，著作权属原作者；以下为升学就业经验分享。",
             "四川大学在读或应届学生，考虑保研、考研、留学或就业。",
             "本科/硕士（在读或已录取）", "保研/留学/考研方向",
             "四川大学飞跃经验", ["保研","留学","四川大学","飞跃手册","考研","就业"],
             ["保研","留学","四川大学"],
             ["四川大学保研怎么样？","川大出国容易吗？","川大就业前景如何？"],
             "你好，欢迎问我关于四川大学升学和就业的问题。",
             source="四川大学飞跃手册")
    all_emails.extend(p["email"] for p in scu)

    # 4. THU
    print("=== THU-Fly ===")
    thu = scan_thu()
    print(f"  {len(thu)} articles")
    write_go("profiles_thu_fly.go", "thuFlyProfiles", "thuFly", thu,
             "本文来自清华大学飞跃手册，著作权属原作者；以下为留学申请经验分享。",
             "清华大学或其他高校的学生，考虑出国留学深造。",
             "本科/硕士（在读或已录取）", "留学申请方向",
             "清华飞跃经验", ["留学","清华大学","飞跃手册","PhD","申请","出国"],
             ["留学","清华","PhD申请"],
             ["清华出国读PhD怎么准备？","怎么选留学方向？","留学申请时间线？"],
             "你好，欢迎问我关于清华大学留学申请的问题。",
             source="清华大学飞跃手册")
    all_emails.extend(p["email"] for p in thu)

    # 5. NKU
    print("=== NKU-CS ===")
    nku = scan_nku()
    print(f"  {len(nku)} articles")
    nku_vars = write_go_split("profiles_nku_cs", "nkuCs", "nkuCs", nku,
             "本文来自南开大学计算机学院经验指北（NKUCS.ICU），著作权属原作者；以下为课程学习与升学经验分享。",
             "南开大学或其他高校计算机相关专业的学生。",
             "本科/硕士（在读）", "计算机方向",
             "南开CS课程与经验", ["南开大学","计算机","课程","经验","保研","考研"],
             ["计算机","南开大学","课程学习"],
             ["南开计算机怎么样？","这门课难不难？","南开CS保研情况？"],
             "你好，欢迎问我关于南开大学计算机专业的课程和升学问题。",
             source="南开大学NKUCS.ICU")
    all_emails.extend(p["email"] for p in nku)

    # 6. CSU + UESTC
    print("=== CSU + UESTC ===")
    csu_uestc = scan_csu_uestc()
    print(f"  {len(csu_uestc)} articles")
    write_go("profiles_csu_uestc.go", "csuUestcProfiles", "csuUestc", csu_uestc,
             "本文来自中南大学/电子科技大学飞跃手册，著作权属原作者；以下为升学就业经验分享。",
             "中南大学或电子科技大学在读或应届学生。",
             "本科/硕士（在读或已录取）", "保研/留学方向",
             "985高校飞跃经验", ["保研","留学","中南大学","电子科技大学","飞跃手册"],
             ["保研","留学","985高校"],
             ["保研怎么准备？","这所大学出国怎么样？","就业前景如何？"],
             "你好，欢迎问我关于升学和就业的问题。",
             source="中南大学/电子科大飞跃手册")
    all_emails.extend(p["email"] for p in csu_uestc)

    # 7. howto-money
    print("=== howto-money ===")
    money = scan_money()
    print(f"  {len(money)} articles")
    write_go("profiles_howto_money.go", "howtoMoneyProfiles", "howtoMoney", money,
             "本文来自开源项目 howto-make-more-money，著作权属原作者；以下为副业赚钱方法分享。",
             "希望在主业之外发展副业、增加收入的职场人和学生。",
             "本科/硕士/在职（有技术背景）", "副业赚钱方向",
             "副业赚钱经验", ["副业","赚钱","变现","程序员","自由职业","收入"],
             ["副业","赚钱","变现"],
             ["程序员怎么搞副业？","有什么好的赚钱方法？","副业能赚多少？"],
             "你好，欢迎问我关于副业赚钱和技术变现的问题。",
             source="howto-make-more-money")
    all_emails.extend(p["email"] for p in money)

    # 8. SurviveSJTU
    print("=== SurviveSJTU ===")
    sjtu = scan_sjtu()
    print(f"  {len(sjtu)} articles")
    sjtu_vars = write_go_split("profiles_survive_sjtu", "surviveSjtu", "surviveSjtu", sjtu,
             "本文来自上海交通大学生存手册，著作权属原作者；以下为大学学习与生活经验分享。",
             "上海交通大学或其他高校的在读学生。",
             "本科/硕士（在读）", "大学生存指南",
             "上交生存经验", ["上海交通大学","大学生活","学习","保研","考研","出国","选课"],
             ["大学学习","上交","生存指南"],
             ["上交生存有什么建议？","怎么选课比较好？","大学应该怎么规划？"],
             "你好，欢迎问我关于上海交通大学学习和生活的问题。",
             source="上海交通大学生存手册")
    all_emails.extend(p["email"] for p in sjtu)

    # 9. Run-Philosophy
    print("=== Run-Philosophy ===")
    run = scan_run()
    print(f"  {len(run)} articles")
    run_vars = write_go_split("profiles_run", "runPhil", "runPhil", run,
             "本文来自互联网开源社区，著作权属原作者；以下为海外生活规划与人生思考分享。",
             "考虑出国留学、海外工作或移民的人群，以及对人生规划有思考的读者。",
             "本科/硕士/在职", "人生规划方向",
             "人生规划与思考", ["留学","移民","海外","人生","规划","经济","哲学"],
             ["人生规划","海外生活","社会思考"],
             ["出国留学值得吗？","如何规划人生方向？","海外生活是什么样的？"],
             "你好，欢迎问我关于人生规划、海外生活和社会观察的问题。",
             source="Run-Philosophy润学")
    all_emails.extend(p["email"] for p in run)

    # 10. CS Self-Learning
    print("=== cs-self-learning ===")
    cssl = scan_cssl()
    print(f"  {len(cssl)} articles")
    cssl_vars = write_go_split("profiles_cssl", "cssl", "cssl", cssl,
             "本文来自北大CS自学指南（cs-self-learning），著作权属原作者；以下为计算机课程推荐与学习路线分享。",
             "计算机相关专业学生或自学编程的同学，希望系统学习CS核心课程。",
             "本科/硕士/自学（在读或规划中）", "计算机自学方向",
             "CS自学课程推荐", ["计算机","自学","课程","编程","算法","系统","AI","深度学习"],
             ["计算机自学","课程推荐","编程学习"],
             ["计算机自学怎么入门？","有哪些好的CS公开课？","怎么系统学习计算机？","AI方向学什么课？"],
             "你好，欢迎问我关于计算机自学路线和课程推荐的问题。",
             source="北大CS自学指南")
    all_emails.extend(p["email"] for p in cssl)

    # Summary
    total = len(scut) + len(baoyan) + len(scu) + len(thu) + len(nku) + \
            len(csu_uestc) + len(money) + len(sjtu) + len(run) + len(cssl)
    print(f"\n{'='*50}")
    print(f"Total new agents: {total}")
    print(f"  SCUT: {len(scut)}")
    print(f"  CS-BAOYAN: {len(baoyan)}")
    print(f"  SCU: {len(scu)}")
    print(f"  THU: {len(thu)}")
    print(f"  NKU: {len(nku)}")
    print(f"  CSU+UESTC: {len(csu_uestc)}")
    print(f"  howto-money: {len(money)}")
    print(f"  SurviveSJTU: {len(sjtu)}")
    print(f"  Run: {len(run)}")
    print(f"  CS-SelfLearn: {len(cssl)}")

    emails_path = os.path.join(BASE, "batch8_emails.txt")
    with open(emails_path, 'w', encoding='utf-8') as f:
        f.write(f"\t// Batch 8: 多源合集（{total} 条）\n")
        for e in all_emails:
            f.write(f'\t"{e}",\n')
    print(f"\nEmail fragment: {emails_path}")

    vars_path = os.path.join(BASE, "batch8_vars.txt")
    with open(vars_path, 'w', encoding='utf-8') as f:
        all_vars = ["scutFlyProfiles", "csBaoyanProfiles", "scuFlyProfiles",
                     "thuFlyProfiles"] + nku_vars + ["csuUestcProfiles",
                     "howtoMoneyProfiles"] + sjtu_vars + run_vars + cssl_vars
        for v in all_vars:
            f.write(f'len({v}) + ')
        f.write('\n')
        for v in all_vars:
            f.write(f'out = append(out, {v}...)\n')
    print(f"Vars fragment: {vars_path}")
    print("Done!")


if __name__ == "__main__":
    main()
