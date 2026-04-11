package yantuseed

// 飞跃手册 2021「境外升学」补全 + 「院外受邀」金工方向（与 profiles_zju_feyue_2021_abroad 已有 6 人不重复）。

var miaoYiPing = Profile{
	DisplayName:   "亦平没披萨",
	OriginalAuthor: "苗亦平",
	School:        "牛津大学 University of Oxford",
	MajorLine:     "数学与计算机科学基础 MFoCS 硕士",
	ScoreLine:     "数应 Overall 3.87/87.34，托福108（口语23），GRE 320+3.5",
	ArticleTitle:  "飞跃手册2021 | 亦平没披萨 Math & Foundation of CS @ Oxford（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "数理逻辑", "牛津大学", "硕士", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"成绩不拔尖还能申逻辑/纯数吗？",
		"伯克利长学期交流怎么自己申请？",
		"PhD 全拒后硕士项目怎么选？",
	},
	KnowledgeBody: `申请简介
本科专业：数学与应用数学，Overall GPA 3.87/87.34，申请逻辑与纯数方向，最终去向牛津 MFoCS 硕士，托福 108（S23），GRE 320+3.5。
申请结果：Applied logic PhD@UCB，math PhD@UCLA/UW-Madison/Cornell，math MS@UW-Madison，logic MS@UvA，MFoCS@Oxford；硕士项目多 offer；北美 logic/math PhD 全拒。奖项：校三等奖学金。推荐信：阮火军（毕设）、王枫；UCB 两封（含集合论与 reading course 老师）。大三下在 UC Berkeley 交换（含暑期），无正式论文科研。

申请经验
出国早定但托福拖延；参考往届手册自行申 UCB Extension 类长学期项目（托福约 90）。在 UCB 上 Computability 课转向数理逻辑，课堂多提问虽口语磕绊仍有效；争取 reading course。申请季状态差曾考虑放弃或转商科，最终赶 ddl 提交；逻辑北美前十随机选校 + 欧洲两所强推学校。建议勿压 ddl、材料早发给老师；纯数方向中介帮助有限，问老师更可靠。PhD 受挫后选牛津含逻辑硕士项目；后文以哈利波特“魔杖选择巫师”类比研究路径。认为兴趣与时间投入比单纯刷均绩更重要；逻辑方向小众，国内外岗位少，可先看书与网课，尝试交流/暑研或联系哲学系资源。参考站点 settheory.net/world。`,
}

var zhangFa = Profile{
	DisplayName:   "法条啃不动",
	OriginalAuthor: "张法",
	School:        "香港科技大学 HKUST",
	MajorLine:     "数学博士（统计/机器学习向）",
	ScoreLine:     "数应 Overall 3.9/4.0（88.39/100），Rank 约10%，托福90",
	ArticleTitle:  "飞跃手册2021 | 法条啃不动 Math PhD@HKUST（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "香港", "博士", "统计", "机器学习", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"港校套磁和 committee 制有什么区别？",
		"从纯数转向统计机器学习要注意什么？",
		"申请季焦虑怎么调节？",
	},
	KnowledgeBody: `申请简介
本科专业：数学与应用数学，Overall GPA 3.9/4.0（88.39/100），Rank 约 10%，最终去向 HKUST 数学 Ph.D.（统计应用向），托福 90。Applied HKUST，Offer。推荐信：NCSU 教授、SRTP 导师。港三各套磁，港中文强 committee，港科强教授制；编者完成老师任务后获 offer。

申请经验
原申美国，疫情与政治因素改香港；感谢手册学长指引。套磁回复顺利，11 月初 offer，但过程伴随小学期、暑研、考试并行的高压与焦虑。建议定位合理、选校有梯度、相信过程。方向选择：纯数难，ML 应用广；本科 SRTP 接触金融数据后对数据敏感，选择统计机器学习向 PhD。读博前需确认愿意长期投入；推荐信、深入科研可在 GPA 达标后弥补差距。飞跃手册出现频率高的学校往往对浙大友好；同校 PhD 与 MS 难度可差两个层级。

其他想对学弟学妹说的话
开心最重要；兴趣占比要大；香港是值得考虑的留学地。（原手册末个人联系方式已删。）`,
}

var dengXiYue = Profile{
	DisplayName:   "翕跃十点半",
	OriginalAuthor: "邓汐悦",
	School:        "牛津大学 University of Oxford",
	MajorLine:     "统计学硕士 MSc Statistical Science",
	ScoreLine:     "统计 Overall 3.8，Major 3.92，雅思7.5，GRE 331+4",
	ArticleTitle:  "飞跃手册2021 | 翕跃十点半 MSc Statistical Science @ Oxford（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "统计", "金工", "牛津大学", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"金工申请为什么强调 C++？",
		"量化实习怎么选大私募还是小 fund？",
		"推荐信和 GPA、实习、标化怎么排序？",
	},
	KnowledgeBody: `申请简介
本科专业：统计学，Overall GPA 3.8，Major GPA 3.92，最终去向牛津统计学硕士 MSc in Statistical Science，雅思 7.5，GRE 331+4。混申大量统计与 MFE 项目；金工多拒，统计获 Oxford、UChicago MACSS（奖）、UChicago Stat（部分学费减免）等；哥大 MFE/MAFN 等 waiting list。SCI 一区一作；港大 2019 Fall 交换；多段券商、四大、私募量化实习。

申请经验
本科起想做量化，申请偏好金工>统计，结果金工“全聚德”较多。教训：金工极看重课程与经历匹配——C++ 必补（可 quantnet 网课）；随机过程、概率、数理统计、高代、数分成绩要硬；算法数据结构学了不亏。实习要有完整项目与可量化结果，便于推荐信写实盘/模拟表现；国外招生方对国内私募品牌不敏感，更看任务技术含量。标化建议大三暑假前搞定 GRE/托福，以便暑假做高质量实习或暑研。优先级（编者观点）：海外强推推荐信 >> GPA（含匹配课程）> 实习 > 标化（约 325+3.5/105/7.5）。中介可做琐事，冲顶尖项目帮助有限。提醒关注部分项目对浙大学生态度年度波动（如 Cornell MFE、NYU MFE 等，详见原手册长文）。最终选 Oxford 一年统计项目并结合已找到的可留用实习。

其他想对学弟学妹说的话
放轻松，做自己；一切都是最好的安排。`,
}

var geKaiJie = Profile{
	DisplayName:   "KJ杰哥慢走",
	OriginalAuthor: "葛开杰",
	School:        "哥伦比亚大学 Columbia University",
	MajorLine:     "统计学硕士 Stat MA",
	ScoreLine:     "统计 Overall 3.6/4，托福104，GRE 322+3.5",
	ArticleTitle:  "飞跃手册2021 | KJ杰哥慢走 Stat MA @ Columbia（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "统计", "数据科学", "哥伦比亚大学", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"GPA 中游怎么定位统计/DS 硕士？",
		"浙大四分制与 WES 认证要注意什么？",
		"实习对统计硕士帮助有多大？",
	},
	KnowledgeBody: `申请简介
本科专业：统计，Overall GPA 3.6/4，最终去向 Columbia Stat MA，托福 104，GRE 322+3.5。Offer 含 Cornell Applied Stat、BU/USC MSMF、UR MSF 等。推荐信：张立新、张朋、经院方岳老师。

申请经验
代表“平平无奇”申请人：成绩中游、科研实习不突出、GT 普通。早立志出国；方向由金工转向统计/数据分析。GPA：浙大 4 分制“封顶”与 WES 百分制认证策略；大三大四后 GPA 难逆转，慎依赖重修挤占标化实习时间。标化：可先 GRE 后托福，集中冲刺；部分项目仍看重高分 GRE。软背景：SRTP/SQTP 可丰富 PS；互联网大厂日常实习（如数据运营）可补充但边际收益有限。选校看 title、专排、课表、毕业生去向（LinkedIn），避免唯 bar 论。`,
}

var maWanTeng = Profile{
	DisplayName:   "万腾一根葱",
	OriginalAuthor: "马万腾",
	School:        "香港科技大学 HKUST",
	MajorLine:     "数学博士（学习理论/统计）",
	ScoreLine:     "CKC 统计交叉 Overall 3.96/4（90.6/100），托福98",
	ArticleTitle:  "飞跃手册2021 | 万腾一根葱 Math PhD@HKUST（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "香港", "博士", "统计学", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"统计 PhD 要不要申 MS 保底？",
		"北美暑研线上体验下降怎么办？",
		"港府奖学金 HKPFS 值不值得申？",
	},
	KnowledgeBody: `申请简介
本科专业：竺院统计交叉，Overall GPA 3.96/4（90.6/100），Top 2%（CKC）、3/40（数院），最终去向 HKUST Math Ph.D.（学习理论向），带 HKPFS，托福 98。北美 Stat PhD 多校申请，HKUST offer；PSU 面试，Wisc waiting 后拒。奖项：国奖、校一奖、CKC 卓越奖、美赛 M、数学竞赛省一等。推荐信：Rice 暑研 AP 强推、张荣茂、何钦铭（SRTP）。

申请经验
全程申 Stat PhD，未用 MS 保底；北美 Stat MS 成本高，且 HK 老师早给 oral commitment。Rice 暑研因疫情改线上，积极性下降但仍有 minimax 理论探讨与强推。申请季因疫情与中美关系，部分同学转向英港新欧。3 月 PSU 面试与港府奖学金预期叠加后接 HKUST。推荐实力强者申 HKPFS（待遇与会议补助等，见当年官网）。建议大三寒假联系北美暑研；Stat/ML 方向卷度上升，可考虑 MS 跳板但 MS 期间仍需科研压力。科研勿只套模型应用，要关注理论。

（原手册邮箱从略。）`,
}

var wuZhiHao = Profile{
	DisplayName:   "wzh昊啊昊",
	OriginalAuthor: "吴志浩",
	School:        "香港中文大学 CUHK",
	MajorLine:     "统计学博士 Stat Ph.D.",
	ScoreLine:     "统计 Overall 3.8/4.0，Major 3.9/4.0，Rank 9/55，托福83",
	ArticleTitle:  "飞跃手册2021 | wzh昊啊昊 Stat PhD@CUHK（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "香港", "博士", "统计学", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"威斯康星 3+1+1 和保研冲突怎么选？",
		"数院保研接收考试没过怎么办？",
		"港科广交叉学科面试侧重什么？",
	},
	KnowledgeBody: `申请简介
本科专业：统计学，Overall GPA 3.8/4.0，Major GPA 3.9/4.0，Rank 9/55，最终去向 CUHK Stat Ph.D.，托福 83，六级 548。Applied CUHK Stat、HKUST OM PhD、HKUST-GZ Bio PhD 等；CUHK 录取，HKUST OM waiting。推荐信：黄炜、赵敏智。

申请经验
原准备出国，参加威斯康星 3+1+1 项目因疫情网课；大四动摇参加保研并获名额，但数院接收考试（数分高代）准备不足未获本院接收，转向外推与出国。曾面试上交医学院四年制直博未成功。后申港校：CUHK 统计面试概念题 + 项目经历；港科广交叉项目更偏生物知识不匹配；港科大商学院统计组面试细问统计概念，过程中 CUHK 发来 offer 并接受。建议早准备暑研/科研/托福 GRE，多留备选路径。威斯康星项目门槛相对友好、仍学到东西，可作保底交流选项。

（原手册微信联系方式已删。）`,
}

var zhangZeXuan = Profile{
	DisplayName:   "暄暄别催啦",
	OriginalAuthor: "张泽暄",
	School:        "芝加哥大学 University of Chicago",
	MajorLine:     "统计学硕士 Stat MS",
	ScoreLine:     "数应均分 85.33/100，Major 88.60/100，托福106，GRE 322+3.5",
	ArticleTitle:  "飞跃手册2021 | 暄暄别催啦 Stat MS@UChicago（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "统计", "芝加哥大学", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"大二才决定出国怎么刷绩点？",
		"统计硕士要不要找中介？",
		"文书怎么避免流水账？",
	},
	KnowledgeBody: `申请简介
本科专业：数学与应用数学，Overall 85.33/100，Major 88.60/100，最终去向 UChicago Stat MS，托福 106，GRE 322+3.5。Offer 含 CMU Stat、NUS、Rice 等。推荐信：王何宇、张立新、实习老板。科研两段“水”且放养；实习两段数据分析，与专业 match。

申请经验
大二下决定出国，大一均绩约 80，大三一年拉到约 90 才将均分抬到 85。GRE 拖至申请季，10–12 月与文书推荐信并行极焦虑，建议英语早考。选校要有彩票/冲刺/平申/保底；佛系等 offer 但底线要保住。中介类比“饭店 vs 自己做”：差钱、英语弱、申请季仍考语言者可考虑；关键是挑老师而非机构，可多聊再决定甚至白嫖后 DIY。英语建议两个月集中突破。选校看项目水不水、课表、地理位置、就业。文书重逻辑链：为何专业、经历如何递进、为何该校、为何彼此匹配；避免大号 CV 与堆砌术语。

（原手册末社交联系方式已删。）`,
}

var chenZe = Profile{
	DisplayName:   "泽_ChillZ",
	OriginalAuthor: "陈泽",
	School:        "佐治亚理工学院 Georgia Tech",
	MajorLine:     "量化与计算金融 QCF 硕士",
	ScoreLine:     "数金交叉 Overall 3.61/4.0，托福107，GRE 323+3.5",
	ArticleTitle:  "飞跃手册2021 | 泽_ChillZ QCF@Gatech（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融工程", "佐治亚理工", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"低 GPA 金工怎么选保底校？",
		"视频面试和行为面怎么练？",
		"QCF 双学位转码路径值不值？",
	},
	KnowledgeBody: `申请简介
本科专业：数学金融交叉，Overall GPA 3.61/4.0，最终去向 Georgia Tech QCF，托福 107，GRE 323+3.5。Offer 含 UIUC MFE、Rutgers MQF；拒 NYU/Columbia/UCLA MFE 等。推荐信：两封校内、一封私募经理。

申请经验
GPA 不高多申保底，注意保底校申请时机与留位费成本。面试分录视频与真人，需分辨行为面与技术面，可与 native speaker 练习。GT QCF 老牌项目 placement 与 career service 较好，可读 IYSE 或 COC 的 CSE 双学位，利于转码。

其他想对学弟学妹说的话
早定目标并匹配能力；GPA 弱用科研与量化实习补；PS 与简历呈现经历与能力，保持自信。`,
}

var tangZiFeng = Profile{
	DisplayName:   "Peak唐不糖",
	OriginalAuthor: "唐子峰",
	School:        "苏黎世大学 UZH & 苏黎世联邦理工 ETH Zurich",
	MajorLine:     "定量金融硕士 MScQF",
	ScoreLine:     "数应&金融混合班 Overall 3.72/4.0，雅思7",
	ArticleTitle:  "飞跃手册2021 | Peak唐不糖 MScQF@ETH&UZH（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融工程", "瑞士", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"决定出国晚了一年怎么排时间表？",
		"MFE 先修课数学和 CS 哪个更重要？",
		"本科交换对金工录取影响有多大？",
	},
	KnowledgeBody: `申请简介
本科专业：数学与应用数学&金融学混合班，Overall GPA 3.72/4.00，最终去向 UZH-ETH MScQF，雅思 7。Offer 含 USC MFE；Columbia MsFE waiting list。推荐信：统计、金融各一封与实习老板。美赛与国赛、微积分与物理竞赛等经历。

申请经验
2020 年初决定出国叠加疫情，上半年多上课与远程实习，下半年集中语言、GRE 与文书。建议早准备以补短板；标化尽早；MFE/FinMath 需多修数学与计算机课，金融背景相对次要；有条件建议海外交换获取海外推荐信，对录取帮助大。

（原手册邮箱从略。）`,
}

var tianZeRui = Profile{
	DisplayName:   "田田今天吃饱",
	OriginalAuthor: "田泽睿",
	School:        "哥伦比亚大学 Columbia University",
	MajorLine:     "金融工程硕士 MFE",
	ScoreLine:     "数应+金融双学位 Overall 3.9/4.0，托福106，GRE 326+3.5",
	ArticleTitle:  "飞跃手册2021 | 田田今天吃饱 MFE@Columbia（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融工程", "哥伦比亚大学", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"金工申请要修多少学分的课才够？",
		"托福 GRE 拖到十月是什么体验？",
		"CMU MSCF 和哥大 MFE 怎么比较？",
	},
	KnowledgeBody: `申请简介
本科专业：数学与应用数学 + 金融双学位，Overall GPA 3.9/4.0，最终去向 Columbia MFE，托福 106，GRE 326+3.5。Offer 含 GT QCF、BU MSMF、NUS MFE（奖学金）等；CMU MSCF 有面拒；MIT MFin 无面拒等。国奖、校一奖。推荐信：王何宇、计院 NLP 课老师、实习老板。优势：课程极多（申请时约 200+ 学分）、实习与一段科研；劣势：部分数学课分数、无海外推荐信、TG 非顶尖。

申请经验（节选，原手册约 7 页项目详解已压缩）
每学期成绩都重要，一学期下滑可能长期追不回；编者大二上沉迷游戏导致专业课爆炸，后以多修课拉高总绩点，但核心课硬伤仍在。金工 = 数学+统计+CS+金融，编者认为金融相对最可后补（如 CFA），数学统计 CS 更难补。课程列举：微积分、线代、概率、ODE、PDE、实变、数值分析；数理统计、随机过程、多元、回归、时序、机器学习；投资学、金融工程、计量等；数据结构、OOP、数据库、AI/ML 等——量力而行，绩点差于不修。TG 应尽早：编者十月前无成绩，一个月速成 T+G 勉强过线；冲顶尖 MFE 常见竞争对手 110+330、口语 23+、Q170。重视 C++（本校 OOP）。实习与 GPA、TG 为核心；海外学期交换更易拿海外推。信息渠道：飞跃手册、一亩三分地、quantnet、ChaseDream、Grammarly 等；半包中介性价比因人而异。
时间线示例：12 月交申请，1 月 NUS offer，2 月 CMU 面试与哥大 MFE offer，3 月 CMU 拒后 withdraw 其余。对 CMU MSCF、Columbia MFE、Cornell、MIT MFin、NUS MFE、Oxford MCF 等有分 tier 评价（详见原手册全文）。

其他想对学弟学妹说的话
消除信息差、少踩坑；心态不要被他人 offer 打乱；专注当下能做的。（原手册末微信咨询从略。）`,
}

var xiZeCheng = Profile{
	DisplayName:   "奚奚哈哈哈哈",
	OriginalAuthor: "奚泽成",
	School:        "纽约大学 NYU",
	MajorLine:     "Courant 数学金融 MathFin 硕士",
	ScoreLine:     "数金 Overall 3.88/4.0，Major 3.96/4.0，托福104，GRE 326+4",
	ArticleTitle:  "飞跃手册2021 | 奚奚哈哈哈哈 MathFIN@NYU Courant（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融工程", "纽约大学", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"金工申请 GPA、实习、标化、推荐信哪个更重要？",
		"中介全包有哪些坑？",
		"同样录取下英国和美国硕士怎么选？",
	},
	KnowledgeBody: `申请简介
本科专业：数学金融交叉，Overall GPA 3.88/4.0，Major GPA 3.96/4.0，最终去向 NYU Courant MathFin，托福 104，GRE 326+4。混申多所 MFE；哥大、Baruch、MIT、CMU 等拒或不顺；另有 IC math finance、NYU Tandon MFE、NUS MFE 等 offer。推荐信：苏中根、李胜宏、实习老板。

申请经验
疫情打乱节奏，曾认真考虑保研，最后一天放弃名额。对泛金融申请：GPA 与实习往往最关键；托福多数达线即可，部分项目卡 GRE（如哥大约 330、Baruch 传闻 328）。课程匹配重要：纽大两项目、Baruch、英国项目常有先修要求（微积分两学期、线代、编程、ODE、概率类课等）。强烈建议自己掌控申请：编者遇中介漏申 ddl、错交 GRE 分数等问题。只申 Tier1/2、无保底导致惊险，Tandon MFE 早录带奖，Courant MathFin 很晚才来。英美选择：英国综排高、学制短、部分可衔接博士；美国 OPT 与更长学制利于实习与留美找工，回国认可度口碑编者感觉略高。个人留美短期工作再回国取向选美国。

其他想对学弟学妹说的话
祝录取与目标皆如愿。`,
}

var xuanNengKai = Profile{
	DisplayName:   "nk能开张吗",
	OriginalAuthor: "宣能凯",
	School:        "南洋理工大学 NTU",
	MajorLine:     "金融科技硕士 MSc FinTech",
	ScoreLine:     "数应 Overall 85.0/100，托福107（口语25），GRE 157+170+3.5",
	ArticleTitle:  "飞跃手册2021 | nk能开张吗 MSc FinTech@NTU（境外升学）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融科技", "新加坡", "浙江大学", "飞跃手册"},
	SampleQuestions: []string{
		"GPA 不高能申哪些港新金科项目？",
		"NTU FinTech 和 HKUST FinTech 怎么比？",
		"港新申请文书重要吗？",
	},
	KnowledgeBody: `申请简介
本科专业：数学与应用数学，Overall 85.0/100，最终去向 NTU MSc FinTech，托福 107（S25），GRE 157+170+3.5。混申英港新多项目：获 HKU、NTU、HKUST、CUHK、NUS 等 offer；LSE、爱丁堡拒。推荐信：中宏课老师、实习老板、全外文课教授。

申请经验
自认 GPA 下界，避开美国与最卷金工，主申相对友好的港新（LSE 纯彩票）。比较 NTU FinTech（新课程、人数约 40、偏科技、有宿舍）、HKUST FinTech、NUS QF（与上交合办 part-time 路径等）、HKU FinTech（人数多）等；个人偏好新加坡。语言因疫情拖到 10 月，遇托福 non-scoreable，12 月底才出分，建议早报名早出分。中介“再来人”导师制与模拟面试体验因人而异，港新部分项目文书权重不高。

其他想对学弟学妹说的话
可跨选经院、计院课程；ADS 等课给分策略可参考手册；实习不必长但要早规划。`,
}

var daiYunXiang = Profile{
	DisplayName:   "昀祥今天晴",
	OriginalAuthor: "戴昀祥",
	School:        "哥伦比亚大学 Columbia University",
	MajorLine:     "金融工程硕士 MFE（院外受邀）",
	ScoreLine:     "金融学 Overall 3.94/4，Rank 7/88，托福107，GRE 331",
	ArticleTitle:  "飞跃手册2021 | 昀祥今天晴 MFE@Columbia（院外受邀·金工）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融工程", "哥伦比亚大学", "浙江大学", "飞跃手册", "院外受邀"},
	SampleQuestions: []string{
		"大一大二怎么规划金工申请时间线？",
		"实习和推荐信怎么与课程并行？",
		"只申金工不混申要注意什么？",
	},
	KnowledgeBody: `说明：本文为飞跃手册「院外受邀」篇，作者本科为浙江大学金融学，非数院培养方案。

申请简介
Overall GPA 3.94/4，Rank 7/88，最终去向哥大 MFE，托福 107，GRE 331。Offer 含 Berkeley IEOR（Fintech）、JHU 金数等；拒 Stanford ICME、Cornell 金工、芝大金数、NYU Tandon MFE 等。推荐信：含量化方向副教授、私募合伙人、数学系教授、金融系研究员等组合。

申请经验
高中起想研究生出国体验不同教育。大一–大三上刷数学与金融学分与绩点；大三下确定金工、中介、实习与补课并行；大三暑假上课与实习并启动托福 GRE；大四上集中文书、面试与毕设。确定金工后不混申，全力打磨材料，做好 gap 或读一般项目再读博的心理准备。感悟：选择、运气与天赋同样重要。

其他想对学弟学妹说的话
勇敢选择并认真准备，积累运气。`,
}

var liaoHuaZe = Profile{
	DisplayName:   "sleep华泽先",
	OriginalAuthor: "廖华泽",
	School:        "波士顿大学 Boston University",
	MajorLine:     "数学金融与金融科技 MSMFT（院外受邀）",
	ScoreLine:     "材料科学与工程 Overall 3.77/5，Major 3.69/5，Rank 40/97，托福103，GRE 331",
	ArticleTitle:  "飞跃手册2021 | sleep华泽先 MSMFT@BU（院外受邀·金工）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融工程", "跨专业", "波士顿大学", "浙江大学", "飞跃手册", "院外受邀"},
	SampleQuestions: []string{
		"工科跨申金工托福 GRE 考很多次怎么办？",
		"三维一般怎么靠实习和先修课补背景？",
		"英美混申体感差异是什么？",
	},
	KnowledgeBody: `说明：院外受邀，本科材料科学与工程，跨申金工。

申请简介
Overall GPA 3.77/5，Major 3.69/5，Rank 40/97，最终去向 BU MSMFT，托福 103（30+29+20+24），GRE 331（161+170+3）。英美大量投递，Offer 含 Fordham、格拉斯哥、USC、BU 等。推荐信：金融科技实习老板一封；两位浙大老师（概率统计与智能计算相关课程/项目）。

申请经验
大二暑假起想出国，大三转申金工。语言：托福四次、GRE 三次，申请季前才出分；建议集中训练，托福冲 100 可参考 30+25+20+25 组合分配精力；GRE 先托福后或集中攻坚 verbal。背景：GPA 难改，靠先修课、实习、自做小项目凑文书。实习三段偏智能投顾、风控、基金，质量一般但与专业相关。选校 10–15 所，设梯度；体感英国更卡硬背景与本专业，美国对跨专业相对友好。文书弱背景需把项目写完整逻辑，突出数学/编程/金融三方面能力。

其他想对学弟学妹说的话
早规划早考标化；跨专业多选先修课与实习；保持信心。`,
}

var liuHuBen = Profile{
	DisplayName:   "虎贲不干杯",
	OriginalAuthor: "刘虎贲",
	School:        "麻省理工学院 MIT",
	MajorLine:     "金融学硕士 MFin（院外受邀）",
	ScoreLine:     "物理学 Overall 3.90/4.0，Rank 2%，托福104，GRE 327",
	ArticleTitle:  "飞跃手册2021 | 虎贲不干杯 MFin@MIT（院外受邀·金工）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融", "麻省理工", "浙江大学", "飞跃手册", "院外受邀"},
	SampleQuestions: []string{
		"理工转金工要修多少外院系学分？",
		"实习一定要 big name 吗？",
		"交换推荐信怎么拿？",
	},
	KnowledgeBody: `说明：院外受邀，本科物理学。

申请简介
Overall GPA 3.90/4.0，Rank 约前 2%，最终去向 MIT MFin，托福 104（S25），GRE 327。Offer 含 Columbia MFE、Columbia 金经、NYU 金数、芝大金数等；多项目拒或 wait。奖项：竺奖、互联网+银奖等。推荐信：物理系两门难课/科研老师、实习老板、UCB 交换课程老师等组合。

申请经验
金工/金数硕士：课程与实习最重要；数学统计计算机课权重大于金融课；注意各校在意课程（如 CMU 看 C++，UCB 看机器学习）且转专业不能默认招生官认为你已具备基础——编者额外修 70+ 学分外院系课。实习重能否在 PS 里写清细节与收获，不必迷信 big name（外国人对国内机构认知有限）。交换若能在美国名校关键课拿高分并争取教授推荐信，价值大，需主动沟通而非上课即自动有推。托福 GRE 过线即可，编者 T104、G327。最终在 Columbia 金经与 MIT MFin 间因 title 选 MIT。

（原手册末邮箱联系从略。）`,
}

var qianXinYue = Profile{
	DisplayName:   "shine昕玥",
	OriginalAuthor: "钱昕玥",
	School:        "麻省理工学院 MIT",
	MajorLine:     "金融学硕士 MFin（院外受邀）",
	ScoreLine:     "金数交叉 Overall 3.85/4，竺院 Top 2%，托福114，GRE 330+4",
	ArticleTitle:  "飞跃手册2021 | shine昕玥 MFin@MIT（院外受邀·金工）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融", "麻省理工", "浙江大学", "飞跃手册", "院外受邀"},
	SampleQuestions: []string{
		"Baruch 绿皮书没刷完面试会挂吗？",
		"CMU 无面拒后心态怎么调整？",
		"MFE 申请群和信息平台怎么用？",
	},
	KnowledgeBody: `说明：院外受邀，本科金数交叉，竺院排名约 Top 2%。

申请简介
Overall GPA 3.85/4，最终去向 MIT MFin，托福 114，GRE 330+4。混申英美新多个 MFE；NUS 早保底；Baruch 第二批绿皮书未刷完面试跪；CMU 无面拒后次日接到 MIT 录取电话。MIT 含笔试与行为面（疫情改视频），偏量化综合能力。奖项：美赛 M、校一等奖学金。推荐信：实习老板与两位浙大老师。

申请经验
申请季漫长玄学；多刷一亩三分地、ChaseDream、微博留美老阿姨等减少信息不对称；可拉群与同伴交流。不要高估自己，同池竞争者背景极强。

其他想对学弟学妹说的话
相信“最好的安排”，录取即匹配。`,
}

var yeXuHua = Profile{
	DisplayName:   "煦华慢半拍__",
	OriginalAuthor: "叶煦华",
	School:        "卡内基梅隆大学 CMU",
	MajorLine:     "计算金融硕士 MSCF（院外受邀）",
	ScoreLine:     "16级国贸 Overall 3.8+，Major 3.9+，Rank 10%，托福112，GRE 328",
	ArticleTitle:  "飞跃手册2021 | 煦华慢半拍__ MSCF@CMU（院外受邀·金工）",
	LongBioPrefix: zjuFeyue2021LongBioPrefix,
	ExpertiseTags: []string{"留学", "金融工程", "卡内基梅隆", "跨专业", "浙江大学", "飞跃手册", "院外受邀"},
	SampleQuestions: []string{
		"大一大二绩点弱还能转金工吗？",
		"defer 一年 gap 怎么找实习？",
		"CMU MSCF 面试和录取标准怎么看？",
	},
	KnowledgeBody: `说明：院外受邀，本科 2016 级国贸，跨专业转量化。

申请简介
Overall GPA 3.8+，Major 3.9+，Rank 约 10%，最终去向 CMU MSCF，托福 112（26），GRE 328。20 fall 曾 defer；21/22 混申 DS/Stat/MFE 等，最终仍入 MSCF。推荐信：实习老板、经院余林徽、计院黄忠东。

申请经验
大二下 SRTP 接触计量经济后对数据与模型感兴趣，大三起补随机过程、数值计算、OOP、时序、PDE、Baruch C++ 证书等。绩点非顶尖、实习一般，首轮申请康奈尔/哥大/芝大等级别结果不佳；defer 期间找实习，以录取信说明身份海投多数公司未卡 gap。二轮申请更激进遇“卷年”四月仍多拒信；BIDA 等 ddl 晚申或材料晚致秒拒。最终 CMU MSCF 面试前一周密集准备后录取。项目评价（节选）：MSCF 为金工 tier1，匹兹堡/纽约校区可选，课程重 coding，新增 ML project，可修 CS 课；就业数据透明；真人行为面，收到面试≠高概率录取；committee 回复及时体验好。哥大 MFE、康奈尔 MFE、哥大金数、芝大金数、NYU DS 等有补充点评（详见原手册后续页）。

其他想对学弟学妹说的话
早收集项目清单与 ddl，准备 back-up plan；申请季焦虑可转移注意力到算法、实习等。`,
}

// zjuFeyue2021ProfilesAbroadMore 境外升学补全（11）+ 院外受邀金工（5），共 17 人。
var zjuFeyue2021ProfilesAbroadMore = []Profile{
	miaoYiPing,
	zhangFa,
	dengXiYue,
	geKaiJie,
	maWanTeng,
	wuZhiHao,
	zhangZeXuan,
	chenZe,
	tangZiFeng,
	tianZeRui,
	xiZeCheng,
	xuanNengKai,
	daiYunXiang,
	liaoHuaZe,
	liuHuBen,
	qianXinYue,
	yeXuHua,
}
