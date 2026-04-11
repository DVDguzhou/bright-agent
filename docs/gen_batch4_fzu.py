#!/usr/bin/env python3
"""
Batch 4: Process FZU (福州大学) markdown articles → Go profile files.
Two sections: postgraduate (升学) and change-major (转专业).
"""
import os, re, random

BASE = os.path.dirname(__file__)
OUT_DIR = os.path.join(BASE, "..", "backend", "internal", "yantuseed")

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
    "披萨","三明治","可颂","贝果","曲奇","马卡龙","提拉米苏","芝士","肉松","海苔",
]
NICK_B = [
    "不吃宵夜","在学习","要毕业了","的碎碎念","今天早睡","打工中","爱吃辣",
    "骑单车","看日落","在图书馆","不熬夜","刷题中","去散步","喝牛奶","想放假",
    "在跑步","读论文","画画中","考试周","在赶DDL","吃早餐","晒太阳","泡咖啡",
    "背单词","去爬山","修电脑","整理笔记","搬砖中","看电影","弹吉他","摸鱼了",
    "在发呆","写代码","逛公园","煮火锅","做饭中","打篮球","追番中","练瑜伽",
    "种花中","遛弯了","喝绿茶","吃火锅","学画画","捏泥巴","下象棋","听播客",
    "看星星","喂猫中","织毛衣","吹口琴","练书法","折纸鹤","放风筝","钓鱼中",
    "打羽毛球","跳绳中","逛超市","烤面包","做蛋糕","拼拼图","看漫画","听雨声",
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

def anonymize(text, nick):
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}', '[邮箱已隐藏]', text)
    text = re.sub(r'(?:QQ|qq|微信|wechat)[号码：:\s（(]*\d{5,}', '[联系方式已隐藏]', text)
    text = re.sub(r'(?:我的QQ|加我QQ|联系QQ)[^0-9]*(\d{5,})', '[联系方式已隐藏]', text)
    return text.strip()

def escape_go(s):
    return s.replace('\\', '\\\\').replace('`', '` + "`" + `')

SKIP = {'readme.md','index.md','about.md','contribute-guide.md'}

DEPT_CN = {
    'cs': '计算机', 'chemistry': '化学', 'chinese-literature': '中文',
    'economy': '经济', 'electric': '电气', 'foreign': '外语',
    'law': '法学', 'math': '数学', 'mechanical-engineering': '机械',
    'physics': '物理', 'source': '',
}

DEST_CN = {
    'buaa': '北京航空航天大学', 'fdu': '复旦大学', 'fzu': '福州大学',
    'hnu': '湖南大学', 'pku': '北京大学', 'thu': '清华大学',
    'tongji': '同济大学', 'ustc': '中国科学技术大学', 'xmu': '厦门大学',
}

def scan_fzu():
    root = os.path.join(BASE, "FZU-Run", "docs")
    profiles = []

    # postgraduate section
    pg_root = os.path.join(root, "postgraduate")
    if os.path.isdir(pg_root):
        for dirpath, _, fns in os.walk(pg_root):
            dest_key = os.path.basename(dirpath)
            if dest_key == 'postgraduate':
                continue
            dest_cn = DEST_CN.get(dest_key, dest_key)
            for fn in sorted(fns):
                if fn.lower() in SKIP or not fn.endswith('.md'):
                    continue
                text = read_md(os.path.join(dirpath, fn))
                if len(text.strip()) < 300:
                    continue
                # extract info from content
                h1m = re.search(r'^#\s+(.+?)$', text, re.MULTILINE)
                title_line = h1m.group(1).strip() if h1m else ""
                # try to find major/background from first few lines
                major = ""
                for pat in [r'来自.*?(\w+学院)', r'专业[：:]\s*(\S+)', r'(\w+)专业']:
                    mm = re.search(pat, text[:500])
                    if mm:
                        major = mm.group(1)
                        break
                # extract score
                score = ""
                sm = re.search(r'(\d{3})\s*分.*?上岸|以\s*(\d{3})\s*分', text[:500])
                if sm:
                    score = (sm.group(1) or sm.group(2)) + "分"
                # extract path type
                path_type = "考研"
                if any(k in text[:300] for k in ['保研', '推免', '夏令营']):
                    path_type = "保研"

                nick = gen_nick()
                body = strip_images(text)
                body = anonymize(body, nick)
                dest_short = dest_cn if dest_cn else "研究生升学"
                short = f"福州大学{major}，{path_type}至{dest_short}，分享{path_type}经验与备考心得。"
                profiles.append({
                    "nick": nick, "email": gen_email(), "school": "福州大学",
                    "major": major, "score": score, "dest": dest_cn,
                    "title": f"福大飞跃手册 | {path_type}至{dest_short}",
                    "body": body, "short_bio": short[:120],
                    "original_author": "", "category": path_type,
                })

    # change-major section
    cm_root = os.path.join(root, "change-major")
    if os.path.isdir(cm_root):
        for dirpath, _, fns in os.walk(cm_root):
            dept_key = os.path.basename(dirpath)
            if dept_key in ('change-major', 'source', 'cases'):
                continue
            dept_cn = DEPT_CN.get(dept_key, dept_key)
            if not dept_cn:
                continue
            for fn in sorted(fns):
                if fn.lower() in SKIP or not fn.endswith('.md'):
                    continue
                text = read_md(os.path.join(dirpath, fn))
                if len(text.strip()) < 300:
                    continue
                nick = gen_nick()
                body = strip_images(text)
                body = anonymize(body, nick)
                short = f"福州大学转专业至{dept_cn}，分享转专业经验、备考方法与注意事项。"
                profiles.append({
                    "nick": nick, "email": gen_email(), "school": "福州大学",
                    "major": dept_cn, "score": "", "dest": f"转{dept_cn}",
                    "title": f"福大飞跃手册 | 转专业至{dept_cn}",
                    "body": body, "short_bio": short[:120],
                    "original_author": "", "category": "转专业",
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
        if p.get("score"):
            lines.append(f'\t\tScoreLine:         `{escape_go(p["score"])}`,')
        lines.append(f'\t\tArticleTitle:      `{escape_go(p["title"])}`,')
        lines.append(f'\t\tLongBioPrefix:     {prefix}LongBioPrefix,')
        lines.append(f'\t\tShortBio:          `{escape_go(p["short_bio"])}`,')
        lines.append(f'\t\tAudience:          {prefix}Audience,')
        lines.append(f'\t\tWelcomeMessage:    `你好，欢迎问我关于升学深造、转专业和备考的问题。`,')
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
    print("=== Scanning FZU ===")
    fzu = scan_fzu()
    print(f"  FZU: {len(fzu)} articles")

    pg = [p for p in fzu if p["category"] != "转专业"]
    cm = [p for p in fzu if p["category"] == "转专业"]
    print(f"    postgraduate: {len(pg)}, change-major: {len(cm)}")

    # Split into 2 files
    write_go("profiles_fzu_feyue_1.go", "fzuFeyueProfiles1", "fzuFeyue",
             fzu[:len(fzu)//2],
             "本文来自福州大学飞跃手册（FZU-Run），著作权属原作者；以下为升学/转专业经验，仅供参考。",
             "正在准备考研、保研或转专业的同学，尤其是211院校背景。",
             "硕士研究生（已录取或就读）", "专业方向", "升学转专业经验",
             ["考研","保研","转专业","经验贴","福州大学"], ["升学深造","福州大学"],
             ["福大考研到985难度大吗？","转专业到计算机需要什么准备？","408和自命题怎么选？"])
    write_go("profiles_fzu_feyue_2.go", "fzuFeyueProfiles2", "fzuFeyue2",
             fzu[len(fzu)//2:],
             "本文来自福州大学飞跃手册（FZU-Run），著作权属原作者；以下为升学/转专业经验，仅供参考。",
             "正在准备考研、保研或转专业的同学，尤其是211院校背景。",
             "硕士研究生（已录取或就读）", "专业方向", "升学转专业经验",
             ["考研","保研","转专业","经验贴","福州大学"], ["升学深造","福州大学"],
             ["福大考研到985难度大吗？","转专业到计算机需要什么准备？","408和自命题怎么选？"])

    emails_path = os.path.join(BASE, "batch4_emails.txt")
    with open(emails_path, 'w', encoding='utf-8') as f:
        f.write(f"\t// 福州大学飞跃手册系列（{len(fzu)} 条）\n")
        for p in fzu:
            f.write(f'\t"{p["email"]}",\n')

    print(f"\nEmail fragment: {emails_path}")
    print(f"Total new agents: {len(fzu)} (seq 807 to {806 + len(fzu)})")
    print("Done!")

if __name__ == "__main__":
    main()
