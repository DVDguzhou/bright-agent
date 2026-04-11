#!/usr/bin/env python3
"""
Read GDUT and SICNU markdown articles and generate Go profile source files,
email list entries, and documentation table rows.
"""
import os, re, random, hashlib, json

GDUT_DIR = r"c:\Users\Caiqing\Desktop\regr\docs\GDUT-Manual\往届面经"
SICNU_DIR = r"c:\Users\Caiqing\Desktop\regr\docs\SICNU-Wiki\docs\D升学就业篇"
SICNU_ALUMNI = r"c:\Users\Caiqing\Desktop\regr\docs\SICNU-Wiki\docs\E毕业校友篇\国内升研"
OUT_DIR = r"c:\Users\Caiqing\Desktop\regr\backend\internal\yantuseed"

# --- Nickname pool ---
NICK_PARTS_A = [
    "小熊", "阿狸", "饺子", "芒果", "西瓜", "柿子", "橙子", "栗子",
    "蘑菇", "饼干", "薯片", "布丁", "椰子", "松鼠", "草莓", "蓝莓",
    "核桃", "板栗", "花卷", "豆包", "苹果", "鹿茸", "海星", "蜗牛",
    "雪糕", "泡芙", "奶酪", "银杏", "桂花", "豆沙", "花生", "鲸鱼",
    "企鹅", "河马", "猫头鹰", "仓鼠", "青蛙", "锦鲤", "兔兔", "蜻蜓",
    "萤火虫", "麻雀", "鸽子", "海豚", "蝴蝶", "蚂蚁", "刺猬", "瓢虫",
    "章鱼", "水母", "葡萄", "蜜桃", "芋圆", "抹茶", "拿铁", "可可",
    "豆奶", "麦芽", "薄荷", "红薯", "山楂", "柠檬", "杨梅", "龙眼",
    "荔枝", "菠萝", "石榴", "樱桃",
]
NICK_PARTS_B = [
    "不吃宵夜", "在学习", "要毕业了", "的碎碎念", "今天早睡",
    "打工中", "爱吃辣", "骑单车", "看日落", "在图书馆",
    "不熬夜", "刷题中", "去散步", "喝牛奶", "想放假",
    "在跑步", "读论文", "画画中", "考试周", "在赶DDL",
    "吃早餐", "晒太阳", "泡咖啡", "背单词", "去爬山",
    "修电脑", "整理笔记", "搬砖中", "看电影", "弹吉他",
    "摸鱼了", "在发呆", "写代码", "逛公园", "煮火锅",
]

NICK_PREFIX = [
    "奔跑的", "迷路的", "安静的", "快乐的", "勤劳的", "认真的",
    "沉默的", "飞翔的", "努力的", "温柔的", "阳光的", "自在的",
]
NICK_SUFFIX = [
    "er", "ya", "ii", "oo", "__", "z", "x", "_v", "3", "7", "9",
    "zzz", "_0", "哈", "呀", "鸭", "吖",
]

used_nicks = set()

def gen_nick():
    for _ in range(500):
        style = random.randint(0, 3)
        if style == 0:
            n = random.choice(NICK_PARTS_A) + random.choice(NICK_PARTS_B)
        elif style == 1:
            n = random.choice(NICK_PREFIX) + random.choice(NICK_PARTS_A) + random.choice(NICK_SUFFIX)
        elif style == 2:
            n = random.choice(NICK_PARTS_A) + random.choice(NICK_SUFFIX) + random.choice(NICK_PARTS_B)
        else:
            n = random.choice(NICK_PARTS_A) + "_" + random.choice(NICK_PARTS_A)
        if n not in used_nicks:
            used_nicks.add(n)
            return n
    raise RuntimeError("cannot gen unique nick")

# --- Email pool ---
EMAIL_WORDS = [
    "pine", "rose", "mint", "sage", "dusk", "glow", "reef", "glen",
    "cove", "peak", "dune", "vale", "moss", "fern", "bark", "leaf",
    "twig", "root", "seed", "petal", "bloom", "frost", "haze", "mist",
    "tide", "wave", "storm", "creek", "brook", "lake", "pond", "rain",
    "snow", "star", "moon", "sun", "dawn", "noon", "eve", "coil",
    "bolt", "gear", "chip", "pixel", "node", "link", "path", "loop",
    "byte", "flux", "core", "grid", "beam", "ray", "arc", "orb",
    "hex", "dot", "bit", "log", "map", "key", "tag", "cap", "fox",
    "elk", "owl", "jay", "wren", "crow", "swan", "dove", "lark",
    "bass", "carp", "pike", "mole", "hare", "lynx", "vole",
]

used_emails = set()

def gen_email():
    for _ in range(500):
        w1 = random.choice(EMAIL_WORDS)
        w2 = random.choice(EMAIL_WORDS)
        num = random.randint(0, 99)
        sep = random.choice(["_", ""])
        email = f"{w1}{sep}{w2}{num:02d}@163.com"
        if email not in used_emails and len(email) <= 25:
            used_emails.add(email)
            return email
    raise RuntimeError("cannot gen unique email")

def strip_images(text):
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', text)
    text = re.sub(r'<img[^>]*>', '', text)
    return text.strip()

def anonymize_body(text, real_name, nick):
    if not real_name:
        return text
    text = re.sub(r'^#\s*\d+级.*?' + re.escape(real_name) + r'.*$', '', text, flags=re.MULTILINE)
    text = text.replace(real_name, nick)
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}', '[邮箱已隐藏]', text)
    return text.strip()

def escape_go(s):
    return s.replace('\\', '\\\\').replace('`', '` + "`" + `')

def read_md(path):
    for enc in ['utf-8', 'utf-8-sig', 'gbk', 'gb18030']:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            continue
    return ""

def extract_destination(text, filename):
    patterns = [
        r'保研(?:至|到|院校[：:]?\s*)([^\n,，。、]+)',
        r'最终去向[：:]?\s*\*?\*?([^\n*,，。]+)',
        r'保研结果[：:]?\s*([^\n,，。]+)',
        r'去向[：:]?\s*\*?\*?([^\n*,，。]+)',
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group(1).strip()[:40]
    fn_match = re.search(r'-([^-]+)\.md$', filename)
    if fn_match:
        dest = fn_match.group(1)
        if any(k in dest for k in ['大学', '学院', '研究所']):
            return dest
    return ""

# ============================
# Process GDUT
# ============================
gdut_profiles = []
gdut_skip = {"README.md", "面经介绍.md"}

for fn in sorted(os.listdir(GDUT_DIR)):
    if fn in gdut_skip or not fn.endswith('.md'):
        continue
    if '分享' not in fn:
        continue
    path = os.path.join(GDUT_DIR, fn)
    content = read_md(path)
    if not content.strip():
        continue

    alias_match = re.match(r'([^的]+)的分享', fn)
    alias = alias_match.group(1) if alias_match else fn.replace('.md','')

    major = ""
    if '计科' in content or '计算机科学与技术' in content:
        major = "计算机科学与技术"
    elif '网络工程' in content:
        major = "网络工程"
    elif '数据科学' in content:
        major = "数据科学与大数据技术"
    else:
        major = "计算机相关"

    dest = extract_destination(content, fn)
    score = ""
    rk_m = re.search(r'(?:rk|排名)[：:]?\s*(\d+/\d+)', content, re.IGNORECASE)
    if rk_m:
        score = f"排名 {rk_m.group(1)}"

    body = strip_images(content)
    body = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}', '[邮箱已隐藏]', body)
    nick = gen_nick()
    email = gen_email()

    dest_short = dest if dest else "保研上岸"
    short_bio = f"来自广东工业大学{major}专业，{dest_short}，分享夏令营与预推免面试经验。"

    gdut_profiles.append({
        "nick": nick,
        "email": email,
        "school": "广东工业大学",
        "major": major,
        "score": score,
        "dest": dest,
        "title": f"广东工业大学保研手册 | {major}保研经验",
        "body": body,
        "short_bio": short_bio,
        "alias": alias,
        "original_author": alias,
        "grade": "19级" if "19级" in fn else ("20级" if "20级" in fn else ""),
    })

# ============================
# Process SICNU
# ============================
sicnu_profiles = []
seen_names = set()

def parse_sicnu_filename(fn):
    m = re.match(r'(\d+级?)-(.+?)(?:专业)?-([^-]+?)(?:-(.+))?\.md$', fn)
    if m:
        return m.group(1), m.group(2), m.group(3), m.group(4) or ""
    m2 = re.match(r'(\d+级?)研究生-(.+?)-([^-]+?)(?:-(.+))?\.md$', fn)
    if m2:
        return m2.group(1)+"研究生", m2.group(2), m2.group(3), m2.group(4) or ""
    m3 = re.match(r'(\d+级?)-(.+?)-([^-]+?)(?:-(.+))?\.md$', fn)
    if m3:
        return m3.group(1), m3.group(2), m3.group(3), m3.group(4) or ""
    return "", "", "", ""

def walk_sicnu(base_dir, is_alumni=False):
    results = []
    for root, dirs, files in os.walk(base_dir):
        for fn in sorted(files):
            if not fn.endswith('.md'):
                continue
            if 'README' in fn or '经验分享模板' in fn:
                continue
            path = os.path.join(root, fn)
            content = read_md(path)
            if not content.strip():
                continue

            college = os.path.basename(root)
            grade, major, name, dest_fn = parse_sicnu_filename(fn)

            if name in seen_names:
                continue
            seen_names.add(name)

            dest = extract_destination(content, fn)
            if not dest and dest_fn:
                dest = dest_fn

            nick = gen_nick()
            email = gen_email()
            body = strip_images(content)
            body = anonymize_body(body, name, nick)

            dest_short = dest if dest else "升学深造"
            short_bio = f"四川师范大学{major}专业，{dest_short}，分享学业规划、竞赛科研与保研历程。"

            results.append({
                "nick": nick,
                "email": email,
                "school": "四川师范大学",
                "major": major,
                "score": "",
                "dest": dest,
                "college": college,
                "title": f"四川师范大学升学经验 | {college}{major}",
                "body": body,
                "short_bio": short_bio,
                "name": name,
                "original_author": name,
                "grade": grade,
            })
    return results

sicnu_profiles = walk_sicnu(SICNU_DIR)
sicnu_profiles += walk_sicnu(SICNU_ALUMNI, is_alumni=True)

print(f"GDUT articles: {len(gdut_profiles)}")
print(f"SICNU articles: {len(sicnu_profiles)}")
print(f"Total: {len(gdut_profiles) + len(sicnu_profiles)}")

# ============================
# Generate Go files
# ============================

def write_go_profiles(filename, var_name, prefix, profiles, long_bio_prefix, audience, education, major_label, knowledge_cat, knowledge_tags, expertise_base):
    lines = []
    lines.append("package yantuseed\n")
    lines.append(f'const {prefix}LongBioPrefix = `{escape_go(long_bio_prefix)}`\n')
    lines.append("const (")
    lines.append(f'\t{prefix}Audience       = `{escape_go(audience)}`')
    lines.append(f'\t{prefix}Education      = `{escape_go(education)}`')
    lines.append(f'\t{prefix}MajorLabel     = `{escape_go(major_label)}`')
    lines.append(f'\t{prefix}KnowledgeCat   = `{escape_go(knowledge_cat)}`')
    lines.append(")\n")
    lines.append(f"var {prefix}KnowledgeTags = []string{{{', '.join(repr(t).replace(chr(39), chr(34)) for t in knowledge_tags)}}}\n")
    lines.append(f"var {var_name} = []Profile{{")

    for p in profiles:
        body_escaped = escape_go(p["body"])
        title_escaped = escape_go(p["title"])
        short_escaped = escape_go(p["short_bio"])
        nick_escaped = escape_go(p["nick"])

        sample_qs = []
        if "广东工业大学" in p["school"]:
            sample_qs = [
                "广工保研到985的难度大吗？",
                "夏令营和预推免哪个更容易拿offer？",
                "双非背景怎么提升保研竞争力？",
            ]
        else:
            sample_qs = [
                "川师保研需要什么条件？",
                "怎么平衡学习和学生工作？",
                "如何在双非院校准备升学深造？",
            ]

        expertise = list(expertise_base)
        if p.get("major"):
            expertise.append(p["major"])

        lines.append("\t{")
        lines.append(f'\t\tDisplayName:       `{nick_escaped}`,')
        lines.append(f'\t\tSchool:            `{escape_go(p["school"])}`,')
        if p.get("major"):
            lines.append(f'\t\tMajorLine:         `{escape_go(p["major"])}`,')
        if p.get("score"):
            lines.append(f'\t\tScoreLine:         `{escape_go(p["score"])}`,')
        lines.append(f'\t\tArticleTitle:      `{title_escaped}`,')
        lines.append(f'\t\tLongBioPrefix:     {prefix}LongBioPrefix,')
        lines.append(f'\t\tShortBio:          `{short_escaped}`,')
        lines.append(f'\t\tAudience:          {prefix}Audience,')
        lines.append(f'\t\tWelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,')
        lines.append(f'\t\tEducation:         {prefix}Education,')
        lines.append(f'\t\tMajorLabel:        {prefix}MajorLabel,')
        lines.append(f'\t\tKnowledgeCategory: {prefix}KnowledgeCat,')
        lines.append(f'\t\tKnowledgeTags:     {prefix}KnowledgeTags,')

        sq_str = ", ".join(f'`{escape_go(q)}`' for q in sample_qs)
        lines.append(f'\t\tSampleQuestions: []string{{{sq_str}}},')

        et_str = ", ".join(f'`{escape_go(t)}`' for t in expertise)
        lines.append(f'\t\tExpertiseTags: []string{{{et_str}}},')

        orig = p.get("original_author", "")
        if orig:
            lines.append(f'\t\tOriginalAuthor: `{escape_go(orig)}`,')
        lines.append(f'\t\tKnowledgeBody: `{body_escaped}`,')
        lines.append("\t},")

    lines.append("}")
    lines.append("")

    out_path = os.path.join(OUT_DIR, filename)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Written {out_path} ({len(profiles)} profiles)")

# GDUT
write_go_profiles(
    "profiles_gdut_feyue.go",
    "gdutFeyueProfiles",
    "gdutFeyue",
    gdut_profiles,
    long_bio_prefix="本文来自广东工业大学计算机学院保研经验分享，著作权属原作者；以下为保研/推免经验，仅供参考。",
    audience="正在准备保研或推免的同学，尤其是双非计算机背景。",
    education="硕士/博士研究生（已录取或就读）",
    major_label="保研方向",
    knowledge_cat="保研推免经验",
    knowledge_tags=["保研", "推免", "经验贴", "计算机"],
    expertise_base=["保研", "推免", "广东工业大学", "计算机"],
)

# SICNU - split into two files
half = len(sicnu_profiles) // 2
sicnu_1 = sicnu_profiles[:half]
sicnu_2 = sicnu_profiles[half:]

write_go_profiles(
    "profiles_sicnu_feyue_1.go",
    "sicnuFeyueProfiles1",
    "sicnuFeyue",
    sicnu_1,
    long_bio_prefix="本文来自四川师范大学升学就业经验Wiki，著作权属原作者；以下为升学深造经验，仅供参考。",
    audience="正在准备保研、考研或升学深造的同学，尤其是师范类院校背景。",
    education="硕士研究生（已录取或就读）",
    major_label="专业方向",
    knowledge_cat="升学深造经验",
    knowledge_tags=["保研", "升学", "经验贴", "师范"],
    expertise_base=["保研", "升学深造", "四川师范大学"],
)

write_go_profiles(
    "profiles_sicnu_feyue_2.go",
    "sicnuFeyueProfiles2",
    "sicnuFeyue2",
    sicnu_2,
    long_bio_prefix="本文来自四川师范大学升学就业经验Wiki，著作权属原作者；以下为升学深造经验，仅供参考。",
    audience="正在准备保研、考研或升学深造的同学，尤其是师范类院校背景。",
    education="硕士研究生（已录取或就读）",
    major_label="专业方向",
    knowledge_cat="升学深造经验",
    knowledge_tags=["保研", "升学", "经验贴", "师范"],
    expertise_base=["保研", "升学深造", "四川师范大学"],
)

# ============================
# Generate email list and docs
# ============================
all_profiles = gdut_profiles + sicnu_profiles
emails_lines = []
doc_lines = []

for i, p in enumerate(all_profiles):
    emails_lines.append(f'\t"{p["email"]}",')
    seq = 262 + i  # continue from existing 261
    source = "广工保研手册" if "广东工业大学" in p["school"] else "川师升学Wiki"
    doc_lines.append(f'| {seq} | {p["nick"]} | {source} | yantu-import@demo.com | {p["email"]} | YantuLa2026! |')

# Write emails fragment
emails_path = os.path.join(os.path.dirname(__file__), "new_emails.txt")
with open(emails_path, 'w', encoding='utf-8') as f:
    f.write("// 广工保研手册系列（{0} 条）\n".format(len(gdut_profiles)))
    for p in gdut_profiles:
        f.write(f'\t"{p["email"]}",\n')
    f.write("// 川师升学 Wiki 系列（{0} 条）\n".format(len(sicnu_profiles)))
    for p in sicnu_profiles:
        f.write(f'\t"{p["email"]}",\n')

# Write docs fragment
docs_path = os.path.join(os.path.dirname(__file__), "new_docs.txt")
with open(docs_path, 'w', encoding='utf-8') as f:
    f.write("## 广东工业大学保研手册系列（{0} 条）\n\n".format(len(gdut_profiles)))
    f.write("来源：广东工业大学计算机学院保研经验分享。\n")
    f.write("档案文件：`backend/internal/yantuseed/profiles_gdut_feyue.go`\n\n")
    f.write("| 序号 | 人生 Agent 显示名 | 原归属来源 | 原归属账号 | 新登录邮箱 | 初始密码 |\n")
    f.write("|-----|------------------|-----------|------------|------------|----------|\n")
    for i, p in enumerate(gdut_profiles):
        seq = 262 + i
        f.write(f'| {seq} | {p["nick"]} | 广工保研手册 | yantu-import@demo.com | {p["email"]} | YantuLa2026! |\n')

    f.write(f"\n## 四川师范大学升学就业经验 Wiki 系列（{len(sicnu_profiles)} 条）\n\n")
    f.write("来源：四川师范大学SICNU-Application/wiki-SICNU项目。\n")
    f.write("档案文件：`backend/internal/yantuseed/profiles_sicnu_feyue_1.go` / `profiles_sicnu_feyue_2.go`\n\n")
    f.write("| 序号 | 人生 Agent 显示名 | 原归属来源 | 原归属账号 | 新登录邮箱 | 初始密码 |\n")
    f.write("|-----|------------------|-----------|------------|------------|----------|\n")
    for i, p in enumerate(sicnu_profiles):
        seq = 262 + len(gdut_profiles) + i
        f.write(f'| {seq} | {p["nick"]} | 川师升学Wiki | yantu-import@demo.com | {p["email"]} | YantuLa2026! |\n')

print(f"\nEmail fragment: {emails_path}")
print(f"Docs fragment: {docs_path}")
print("Done!")
