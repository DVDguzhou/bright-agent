package yantuseed

// 飞跃手册 2021「境外升学」篇节选（留学申请经验）。

var maoYuHao = Profile{
	DisplayName:   "毛毛雨别再下",
	OriginalAuthor: "毛雨豪",
	School:        "苏黎世联邦理工学院 ETH Zurich",
	MajorLine:     "计算机科学硕士 MSCS",
	ScoreLine:     "托福104，GRE 161+170+4，本科数金 GPA 3.94/4",
	ArticleTitle:  "飞跃手册2021 | 毛毛雨别再下 CS MSc @ ETH Zurich（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "计算机", "瑞士", "硕士", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"申美国 CS PhD 全拒可能和方向敏感有关吗？",
		"暑研和推荐信怎么规划？",
		"ETH 直博被降 MS 还要不要去？",
	},
	Source: `浙江大学飞跃手册`,
	KnowledgeBody: `申请简介
本科专业：数金，Overall/Major GPA 3.94/4
申请方向：CS，最终去向 MSCS@ETHz
托福 104，GRE 161+170+4

申请结果（节选）
Applied：ETH 直博、Cambridge、美国多所 EECS PhD 等
Offer：CS MSc@ETHz；AML Doctorate@Cambridge（short-list interview，未参加）
美国 PhD 多校无面试拒信

推荐信：两封科研强推（浙大计院导师、CISPA 暑研导师），一封学业强推（专业课成绩突出）。

申请经验
和同方向同学一起申请便于交流。可半 DIY 中介改文书简历，但不必全包。疫情打乱语言考试节奏：GRE、托福家考与线下重考结合，成绩“够用”即可。
大一曾打算申 data science；后进入计院安全实验室做 AI 安全。大二暑假起跟组科研，完成一作论文（申请季前顶会拒稿重投）。暑研在导师访问实验室时获得邀请（另套 MIT、ETH 老师无回复）。暑研 remote 期间独立做神经网络后门攻防，导师在选校、投稿节奏上帮助很大。
主申 AI 安全（文书曾写 robust ML）。因学费考虑多申 PhD；ETH 直博可能降录 MS，最终被降转；因瑞士补贴、MS 成本低，选择 ETH。

选校策略（编者原述）：冲刺 CS 四大（CMU、MIT、UCB 等）+ ETH 直博 + Cambridge 等；结果美国院校多无面试拒信，欧洲有积极回复。编者提示：当年 PhD 整体偏难，MS 相对好申；敏感方向是否影响美国录取需学弟学妹自行评估。

其他建议
时间安排自信则不推荐全包中介。GRE 可不报班，熟急救词汇+官方指南即可。托福多练口语，易成短板。`,
}

var zhouKaiWen = Profile{
	DisplayName:   "Kevin在改版",
	OriginalAuthor: "周凯文",
	School:        "加州大学圣克鲁兹分校 UCSC",
	MajorLine:     "计算机科学博士 Ph.D.",
	ScoreLine:     "托福104，GRE 321，统计本科 GPA 约 3.89/4",
	ArticleTitle:  "飞跃手册2021 | Kevin在改版 CS Ph.D. @ UCSC（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "计算机", "博士", "美国", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"AI PhD 申请背景大概怎么排序？",
		"套磁和海外科研推荐信有多重要？",
		"要不要找留学中介？",
	},
	Source: `浙江大学飞跃手册`,
	KnowledgeBody: `申请简介
本科专业：统计学，Overall GPA 3.89/4，Major GPA 3.96/4
最终去向：UCSC CS Ph.D.，托福 104，GRE 321

申请结果（节选）
广申美国 CS PhD；Offer 含 Virginia Tech、UCSC、ASU 等；部分学校面试后录取或拒信。

奖项与推荐：校奖、建模与竞赛；VT 科研推、数学建模课推、NLP 课程推等。

申请经验
大二下决定出国，倾向 AI/ML。曾加入计院实验室但方向偏工程、产出有限；建议找导师时确认方向与能否参与高 novelty、可发文项目，SRTP 等可对接计院、数据科学中心、数院 ML 方向老师。
课程上申 AI PhD 常见需要 C++、数据结构、离散数学等；入门可选本校 AI 相关课。GT 不宜拖到大三暑假才解决，建议大一大二暑假至少搞定托福或 GRE 之一。
疫情下暑研多线上。编者曾在 UIUC 线上暑研但产出与交流不足，未拿到推；后在 VT 教授组内持续有进展、沟通多，获强推，对 UCSC 等录取帮助大。

背景重要性（编者观点，AI PhD）：connection（合作过、海外强推、有海外联系的科研推等）> paper（水刊作用有限，顶会一作更有帮助，但非唯一）> GPA > GT。数学背景申理论/统计 ML、optimization、data mining 等方向可能更有优势。

选校：主要按 csranking 等与导师 match 度选校套磁。选择 UCSC 考虑导师方向广度、业界联系、对学生支持、地理位置等。

强烈不推荐依赖中介：套磁信质量一般、SOP 甚至有拼写语法错误；信息可从一亩三分地、留学群、飞跃手册、项目官网获取。SOP 可参考公开范文、Grammarly、同学互改或靠谱文书修改服务。

其他：转专业要早准备；多与同方向同学互通进度。`,
}

var liXiangTian = Profile{
	DisplayName:   "天天想赖床",
	OriginalAuthor: "李向天",
	School:        "加州大学圣迭戈分校 UCSD",
	MajorLine:     "机器学习与数据科学 MLDS",
	ScoreLine:     "托福106（口语21），GRE V152+Q170+AW4.0，信计 GPA 约 3.80/3.90",
	ArticleTitle:  "飞跃手册2021 | 天天想赖床 MLDS @ UCSD（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "数据科学", "计算机视觉", "硕士", "美国", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"转 CS 申研科研路线怎么铺？",
		"托福和 GRE 要刷到多少？",
		"交换经历对决心出国有多大帮助？",
	},
	Source: `浙江大学飞跃手册`,
	KnowledgeBody: `申请简介
本科专业：信计，Overall GPA 3.80，Major GPA 3.90，Rank 约 15%
最终去向：UCSD MLDS；另有 MSCS@UC Merced、USC CS37(AI track) 等 offer
托福 106（S21），GRE V152+Q170+AW4.0

科研与背景
CCNT、CAD&CG 实验室经历；UC Merced 远程暑研；申请时有论文在投；UCB 交换一学期。推荐信：海外科研推、校内科研与课程推。套磁 PhD/研究型 MS 多无回复。

优势：暑研跟 UC Merced CV 方向教授，项目投 CVPR（后拒稿）仍有加成。劣势：疫情小年、选校偏“彩票”、部分数学课 GPA 一般、系统课较少。

申请经验
大二上常微分后决定转 CS；课程集中在数据结构算法、机器学习、计算机视觉，对系统/硬件类课程接触少。校内科研偏打基础；CV 方向暑研竞争激烈，建议先有校内经历。
远程暑研每周 meeting 短，主要靠自觉；写稿投稿压力大，但是完整科研训练。语言：托福多考几次才过线；不少项目当年弱化 GRE，编者 GRE 准备有限，仅少数学校寄送。认为 T100+G320 可过线，T105+G325 覆盖多数；不必过度刷分，时间给软背景更值。

转专业：参考手册与学长学姐；找工向多修 CS 课、刷题、实习；科研向找靠谱师兄师姐带路，明确每段科研目标。建议大二大三出国交换体验教学与科研（编者伯克利交换后更坚定出国）。

编者结语：自己的申请并非一路“飞跃”，更像翻山；不必只盯着山顶，过程也值得认真对待。`,
}

var xuJing = Profile{
	DisplayName:   "璟_小灯泡",
	OriginalAuthor: "许璟",
	School:        "哈佛大学 Harvard",
	MajorLine:     "数据科学硕士 MSDS",
	ScoreLine:     "托福93，信计 GPA 约 3.97/92 百分制",
	ArticleTitle:  "飞跃手册2021 | 璟_小灯泡 MSDS @ Harvard（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "数据科学", "统计", "硕士", "美国", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"托福不够高怎么规划申请？",
		"硕士申请一定要套磁吗？",
		"大三前要不要定读硕还是读博？",
	},
	Source: `浙江大学飞跃手册`,
	KnowledgeBody: `申请简介
本科专业：信息与计算科学，Overall GPA 3.97（四分制）/92.0（百分制），Major GPA 3.98
申请方向：统计、应数、数据科学、运筹等硕士为主，兼有部分 PhD 项目
最终去向：哈佛大学 MSDS，托福 93

申请结果（节选）
Offer/AD：Harvard、UChicago、UCB、NYU、UW（降硕）、Cambridge、IC、NUS 等
Rejected：MIT、Yale、Stanford、Duke、Cornell、UCLA、CMU、UMich 等

奖项：省政府奖学金、校奖、数学竞赛等。推荐信三封国内、一封国外；UChicago 暑研经历。

申请经验
最大阻碍是英语成绩，外加疫情与政治因素；编者遗憾托福未冲到更高分。建议大三前把托福、GRE 考到目标，大四上留足时间选校与打磨材料。

其他建议
大一大二不必过度焦虑，多了解专业，明确读硕还是读博（编者大三才最终确定）。积极争取科研，尤其是 SRTP，有助于经历与推荐信。不必盲目套磁：若能长期在浙大做出扎实成果，对很多硕士项目已足够；套磁耗时且可能无果，优先用好身边资源。无论保研、出国还是考研，选定后要坚持。`,
}

var chenLongTeng = Profile{
	DisplayName:   "龙腾四海小号",
	OriginalAuthor: "陈龙腾",
	School:        "巴黎综合理工学院 École Polytechnique",
	MajorLine:     "工程师项目 Ingénieur（数学与复几何方向）",
	ArticleTitle:  "飞跃手册2021 | 龙腾四海小号 @ École Polytechnique（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "数学", "法国", "工程师学校", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"浙大与巴黎综合理工合作项目怎么考？",
		"没有科研经历也能申欧洲名校吗？",
		"纯数方向如何保持热情？",
	},
	Source: `浙江大学飞跃手册`,
	KnowledgeBody: `申请简介
本科专业：数学与应用数学
最终去向：École Polytechnique 工程师项目
在盛为民老师微分几何课上了解到学院与巴黎综合理工双学位合作，参加入学竞考并通过。笔试与面试约 30%/70%，科目侧重数学与物理；数学权重高。编者本科物理一般，但通过考试积累了兴趣；成绩也影响后续校设奖学金。

心路历程
拿到 offer 后一周内决定：法国仍是重要数学中心之一，巴黎综合理工在欧洲声誉高，故接受录取。无额外复杂纠结。

其他想对学弟学妹说的话
数学系尤其是志在纯数的同学，应源于热爱数学本身，而非仅外在功利；理想主义者在人类发展中不可或缺。愿大家保持少年时想成为数学家、科学家的心境并持续努力。`,
}

var xiaRuiZhe = Profile{
	DisplayName:   "夏夏_rz",
	OriginalAuthor: "夏瑞哲",
	School:        "香港科技大学 HKUST",
	MajorLine:     "应用数学博士 Ph.D.",
	ScoreLine:     "托福100，数应 GPA 4.50/4.52，Rank 5/111",
	ArticleTitle:  "飞跃手册2021 | 夏夏_rz Applied Math Ph.D. @ HKUST（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "香港", "博士", "应用数学", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"港校暑期科研怎么申请？",
		"港科大应用数学与港大港中文怎么选？",
		"国奖和港府奖学金要注意什么截止日？",
	},
	Source: `浙江大学飞跃手册`,
	KnowledgeBody: `申请简介
本科专业：数学与应用数学，Overall GPA 4.50，Major GPA 4.52，Rank 5/111
最终去向：HKUST 应用数学 Ph.D.，托福 100
仅申请 HKUST，获 Offer。推荐信：李松、翟健、郭正初等老师。

申请经验
原考虑美、港、新；大三因签证与疫情缩小到香港（港大、港科大、港中文）。比较校园与系所方向后，因大三下参加港科大暑期科研、与导师方向契合，只填报港科大。

暑期科研：每年约 2–3 月在香港高校官网公布（非仅依赖校内项目）。材料通常含申请表、成绩单，建议附简历。线上面试多为中文；常见问题包括科研经历（可适度包装勿夸大）、学过的高阶数学课、地缘政治类问题（随时间变化）、对港校与美国的取舍等。最后需填报意向导师，实际分配可能与填报不一致。

面试后约一两周通知；若与导师合作顺利，暑研结束前可能询问是否愿意入读。有国奖者可关注港府奖学金（编者提及截止约 12 月 1 日，以当年官网为准）。

GPA 仍是敲门砖：或靠数学专业课突出，或靠其他课程拉高（编者对两条路径有描述，继续深学数学者宜以前者为主）。

其他想对学弟学妹说的话
当你有足够多的付出时，你才有资格去比运气。`,
}

// zjuFeyue2021ProfilesAbroad 境外升学篇节选（6 人）。
var zjuFeyue2021ProfilesAbroad = []Profile{
	maoYuHao,
	zhouKaiWen,
	liXiangTian,
	xuJing,
	chenLongTeng,
	xiaRuiZhe,
}
