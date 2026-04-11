package yantuseed

// 华中科技大学光电学院飞跃手册2020第三编「2016级飞跃案例与经验」系列，27位作者。
// 原文版权归华中科技大学光学与电子信息学院、工程科学学院和编辑委员会所有。
const hustFeyueLongBioPrefix = "本文来自华中科技大学光学与电子信息学院《飞跃手册》（2020版）第三编「2016级飞跃案例与经验」，著作权属编委会与原作者；以下为个人出国申请经验，仅供留学参考。"

const (
	hustAudience     = "正在准备出国留学申请的同学，尤其是光电、EE及理工科背景。"
	hustEducation    = "海外硕士/博士（已录取或就读）"
	hustMajorLabel   = "申请方向"
	hustKnowledgeCat = "留学申请经验"
)

var hustKnowledgeTags = []string{"出国留学", "经验贴", "飞跃手册", "华中科技大学"}

var hustFeyueProfiles = []Profile{
	{
		DisplayName:       "码农阿喵",
		OriginalAuthor: "孟渝淇",
		School:            "华中科技大学",
		MajorLine:         "转CS Master",
		ScoreLine:         "GPA 91.9, GRE 325+3, TOEFL 102(S23)",
		ArticleTitle:      "华科飞跃手册 | 光电转CS硕士申请总结",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "光电转CS硕士，Harvard暑校加持，详细对比十余所美国CS/ECE Master项目选校思路。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于转CS硕士申请、选校对比和中介避坑的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"光电背景转申CS Master需要提前准备哪些课程？",
			"JHU、Duke、USC等CS硕士项目各有什么特点？",
			"转专业申请要不要找中介？",
		},
		ExpertiseTags: []string{"转CS", "硕士申请", "选校对比", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 91.9，GRE 325+3，TOEFL 102(S23)，Harvard暑校经历。
光电转CS方向申请，录取JHU CS、Rice CS+EE、Cornell ECE、UCLA ECE、UCSD、Duke ECE、Penn ECE、NWU CE、USC CS+EE等多所学校。

详细研究了美国十余所CS硕士项目特点：JHU CS项目灵活可选课丰富，Duke偏研究型，CMU各项目侧重不同（MSCS极难、MCDS偏数据、MSIN偏网络），USC科研机会多但37学分学制长，UCLA和UCSD地理位置好就业便利。

核心建议：转专业一定要提前补CS基础课（数据结构、算法、操作系统等），越早越好；中介要慎重选择，选校定位必须自己来，不能全交给中介；Harvard暑校虽然贵但能拿到有分量的推荐信，对申请有帮助。文书要突出转专业动机和CS方向的准备。`,
	},
	{
		DisplayName:       "柠檬不酸ya",
		OriginalAuthor: "李光炫",
		School:            "华中科技大学",
		MajorLine:         "EE Master",
		ScoreLine:         "GPA 3.86/4(前10%), GRE 324+3.5, TOEFL 98(S23)",
		ArticleTitle:      "华科飞跃手册 | 三无选手EE硕士申请总结",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "无论文无专利无强推的「三无」背景，靠华为实习和三维硬指标拿下UCLA等校EE硕士。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于EE硕士申请、实习加分和文书写作的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"没有论文和专利申请MS还有竞争力吗？",
			"公司实习经历在MS申请中有多大作用？",
			"文书应该自己写还是找人帮忙？",
		},
		ExpertiseTags: []string{"EE硕士", "三维成绩", "实习经历", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.86/4（年级前10%），GRE 324+3.5，TOEFL 98(S23)，华为实习经历。无论文、无专利、无强推荐信，典型「三无」申请者。

录取结果：UCLA、USC、Georgia Tech、UMich均获AD。

核心经验：MS申请和PhD不同，不太看论文和科研深度，反而看重实习经历和综合三维。华为的实习经历成为文书亮点，展示了工程实践能力。三维（GPA、GRE、TOEFL）对MS申请非常重要，尤其GPA要尽可能高。文书建议自己写，最了解自己经历的是自己，找native speaker润色即可。选校要拉开梯度，冲刺+匹配+保底合理分布。`,
	},
	{
		DisplayName:       "扶摇九万里",
		OriginalAuthor: "杜谦",
		School:            "华中科技大学",
		MajorLine:         "EE MS+PhD混申",
		ScoreLine:         "GPA 3.73, GRE 325+3, IELTS 7.5",
		ArticleTitle:      "华科飞跃手册 | EE方向硕博混申经验总结",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "斯坦福短期交流+UCLA背景提升，硕博混申横扫UT Austin、UIUC等十校。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于硕博混申策略、暑研选择和标化考试规划的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"硕博混申应该怎么分配学校？",
			"暑研和短期交流对申请有多大帮助？",
			"标化考试应该什么时候考完？",
		},
		ExpertiseTags: []string{"硕博混申", "暑研", "标化考试", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.73，GRE 325+3，IELTS 7.5，斯坦福短期交流+UCLA背景提升项目。

录取结果：UT Austin（最终去向）、UMich、USC、Columbia、UIUC、Duke、Purdue、Northwestern、UCLA等AD。

核心经验：尽早准备是关键。暑研和海外交流经历对申请帮助巨大，不仅提升背景还能拿到海外推荐信。标化成绩要在大三暑假前全部考出来，留出秋季学期专心准备文书和选校。硕博混申策略上，PhD重点套磁目标导师，MS则侧重项目质量和就业前景。时间规划建议：大二暑假考G/T、大三暑假做暑研、大四上学期全力申请。`,
	},
	{
		DisplayName:       "北极星xw",
		OriginalAuthor: "杨茜琬",
		School:            "华中科技大学",
		MajorLine:         "欧洲EE硕士",
		ScoreLine:         "GPA 86.0/100(约40/120), TOEFL 92(S18)",
		ArticleTitle:      "华科飞跃手册 | 保研失败转申欧洲硕士经验",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "保研失败后全程DIY申请欧洲硕士，分享欧洲高性价比留学路线与选校策略。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于欧洲硕士申请、DIY流程和低成本留学方案的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"保研失败后转出国来得及吗？",
			"欧洲硕士申请和美国有什么不同？",
			"无GRE无推荐信怎么申请？",
		},
		ExpertiseTags: []string{"欧洲留学", "DIY申请", "性价比", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 86.0/100（年级约40/120），TOEFL 92(S18)，无GRE，无推荐信。保研失败后紧急转出国。

录取结果：Lund University AD、EIT Digital（Aalto+KTH联合项目）AD附带小额奖学金。

核心经验：保研失败后转出国完全来得及，关键在于迅速调整心态。全程DIY，欧洲申请流程相对简单，无需GRE，很多项目也不强制要求推荐信。欧洲留学最大优势是性价比：北欧部分国家学费低甚至免学费，生活成本可控。选校建议多申保底校，欧洲学校录取周期长，要有耐心。EIT Digital是欧洲跨校联合项目，可在两个国家的大学各读一年，体验丰富。`,
	},
	{
		DisplayName:       "追光Zzz",
		OriginalAuthor: "雷震宇",
		School:            "华中科技大学",
		MajorLine:         "EE PhD/欧洲MS混申",
		ScoreLine:         "GPA 3.92/4 88/100, GRE 152+168+3, TOEFL 99(S20)",
		ArticleTitle:      "华科飞跃手册 | 从美国PhD到EPFL硕士的申请转折",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "NTU暑研加持，从美国PhD签证被check到转向瑞士EPFL硕士的曲折申请路。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于PhD与MS混申策略、暑研推荐信和签证问题的经验。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"暑研推荐信对PhD申请有多重要？",
			"签证被check怎么办？",
			"如何在美国PhD和欧洲MS之间抉择？",
		},
		ExpertiseTags: []string{"EPFL", "暑研推荐信", "签证", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.92/4（88/100），GRE 152+168+3，TOEFL 99(S20)，NTU暑研经历。

录取结果：EPFL MS（最终去向）、IC、Purdue（PhD降MS）、UNC PhD。签证被行政审查（check），最终从美国PhD转向瑞士EPFL硕士。

核心经验：暑研推荐信对PhD申请至关重要，暑研导师的评价直接影响录取结果。签证被check是EE/光电方向常见问题，建议提前做好Plan B。EPFL作为欧洲顶级理工院校，研究水平极高，硕士毕业后转PhD也很顺畅。申请时要尽早做决定，不要犹豫，同时准备多条路线（美国PhD+欧洲MS）以应对不确定性。`,
	},
	{
		DisplayName:       "橘子汽水er",
		OriginalAuthor: "段雨祥",
		School:            "华中科技大学",
		MajorLine:         "ECE Master",
		ScoreLine:         "GPA 84.2/100 3.67/4 Rank 16/28, GRE 328+3.0, TOEFL 106(S21)",
		ArticleTitle:      "华科飞跃手册 | ECE硕士加权刷分与选校策略",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "Missouri暑研经历，GRE 328高分，详解加权GPA重要性与ECE硕士选校方法。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于ECE硕士申请、GPA提升和暑研经历的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"加权GPA对MS申请到底有多重要？",
			"GRE 320+算什么水平？",
			"ECE方向哪些学校性价比高？",
		},
		ExpertiseTags: []string{"ECE硕士", "刷加权", "GRE高分", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 84.2/100（3.67/4），Rank 16/28，GRE 328+3.0，TOEFL 106(S21)，Missouri暑研经历。

录取结果：Columbia、UPenn、Duke（最终去向）、JHU、USC、WUSTL、Northwestern、UFL均获AD。

核心经验：刷加权GPA非常重要！GPA是MS申请中权重最高的硬指标，大三选课要策略性地选择高分课程提升加权。GRE高分（尤其V和AW）能在同等GPA中脱颖而出。暑研经历虽然对MS不如PhD那样关键，但能提供一封有分量的海外推荐信。选校时注意ECE项目在不同学校侧重不同：Columbia偏学术、Duke偏研究、USC课程丰富选择多。`,
	},
	{
		DisplayName:       "嗷呜小怪兽",
		OriginalAuthor: "李卓颖",
		School:            "华中科技大学",
		MajorLine:         "BME硕博混申",
		ScoreLine:         "GPA 88.9(3/30), GRE 321, TOEFL 98(S20)",
		ArticleTitle:      "华科飞跃手册 | Mitacs暑研到BME博士的申请路",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "Mitacs加拿大暑研+ETH毕设双经历，从兴趣探索到BU博士录取的申请历程。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于Mitacs暑研、ETH毕设和BME方向博士申请的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"Mitacs暑研项目怎么申请？",
			"去ETH做毕设是什么体验？",
			"如何在申请中找到自己的兴趣方向？",
		},
		ExpertiseTags: []string{"BME博士", "Mitacs暑研", "ETH", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 88.9（年级3/30），GRE 321，TOEFL 98(S20)，Mitacs加拿大暑研+ETH毕设经历。

录取结果：BU PhD（最终去向）、Northwestern BME、UCSD、Rice、Rutgers。

核心经验：英语一定要早准备，口语是中国学生的软肋，TOEFL口语低分会影响面试表现。暑研至关重要，Mitacs项目是加拿大政府资助的暑研计划，申请门槛不高但体验极好。ETH做毕设能接触世界顶级实验室的科研氛围。找到兴趣方向需要不断尝试：在不同实验室、不同课题中探索，最终确定BME方向。申请中展示清晰的科研轨迹和成长过程比单纯堆论文数量更有说服力。`,
	},
	{
		DisplayName:       "暴走萝卜丁",
		OriginalAuthor: "龚子博",
		School:            "华中科技大学",
		MajorLine:         "CS/ECE PhD",
		ScoreLine:         "GPA 3.93/90.7, GRE 153+170+4.0, TOEFL 104(S23)",
		ArticleTitle:      "华科飞跃手册 | 大二换实验室到CCF A顶会的PhD申请",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "大二换实验室从头来过，暑研成为转折点，手握3篇CCF A顶会在投斩获多校CS PhD。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于CS PhD申请、顶会论文和暑研经历的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"大二才换实验室还来得及发顶会吗？",
			"暑研对CS PhD申请起什么作用？",
			"申请中如何和同学分享信息互助？",
		},
		ExpertiseTags: []string{"CS PhD", "顶会论文", "暑研", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.93（90.7/100），GRE 153+170+4.0，TOEFL 104(S23)，一段暑研经历，3篇CCF A类顶会论文在投。

录取结果：Cornell CIS PhD、UCSD ECE PhD、UMD CS PhD、UMass CICS PhD（最终去向）、EPFL CS MS、ETHZ EEIT MS。

核心经验：大二换实验室从头开始，一度非常迷茫，但暑研成为了申请的转折点——不仅提升了科研能力，还拿到了关键的推荐信。任何时候都不要放弃，科研进展可能在某个时刻突然加速。要保持open的心态，多和同学朋友交流申请情报，信息差在申请中影响巨大。CCF A顶会论文（即使在投）是CS PhD申请的强力加分项。`,
	},
	{
		DisplayName:       "晚风予星河",
		OriginalAuthor: "熊津锋",
		School:            "华中科技大学",
		MajorLine:         "EE/Optics PhD",
		ScoreLine:         "GPA 91.2(12/280), GRE 321, TOEFL 105(S26)",
		ArticleTitle:      "华科飞跃手册 | 从校内科研到Yale PhD的暑研之路",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "WUSTL暑研+国奖背景，校内科研到海外暑研再到Yale PhD的完整申请链。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于PhD申请流程、暑研选择和半DIY中介策略的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"暑研对PhD申请为什么是必须的？",
			"自行联系暑研和项目暑研有什么区别？",
			"半DIY和全DIY中介怎么选？",
		},
		ExpertiseTags: []string{"PhD申请", "暑研", "Yale", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 91.2（年级12/280），GRE 321，TOEFL 105(S26)，WUSTL暑研经历，三作论文一篇，国家奖学金。

录取结果：Yale PhD（最终去向）、UPenn PhD、UMD PhD。

核心经验：暑研对PhD申请是必须的，自行联系暑研本身就是一次完整的申请预演——从选导师、写邮件、准备材料到面试，全流程锻炼。校内科研→WUSTL暑研→套磁面试是一条清晰的路线。中介建议选半DIY模式：选校和文书主体自己把控，中介负责流程管理和材料检查。套磁要有策略，先读教授近期论文再写有针对性的邮件。`,
	},
	{
		DisplayName:       "阿拉蕾biu",
		OriginalAuthor: "刘一涵",
		School:            "华中科技大学",
		MajorLine:         "EE PhD/MS混申",
		ScoreLine:         "GPA 90.13 3.94/4, GRE 322+3.5, TOEFL 102(S24)",
		ArticleTitle:      "华科飞跃手册 | 无论文也能拿EE PhD的申请总结",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "UCF CREOL暑研经历，无论文大胆申PhD，拿下USC PhD等多校录取。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于无论文申PhD、暑研经历和硕博混申的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"没有发表论文能申请到PhD吗？",
			"UCF CREOL光学中心暑研体验如何？",
			"PhD和MS混申如何分配精力？",
		},
		ExpertiseTags: []string{"EE PhD", "无论文申请", "CREOL暑研", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 90.13（3.94/4），GRE 322+3.5，TOEFL 102(S24)，UCF CREOL暑研经历，无发表论文。

录取结果：PhD方向——USC PhD（最终去向）、UMD PhD、UCF PhD；MS方向——UIUC、CMU、Cornell、Columbia、UPenn等。

核心经验：没有论文也能申请到PhD！关键在于暑研表现和导师推荐信。在UCF CREOL的暑研经历让招生委员会看到了科研潜力。大胆尝试很重要，很多同学因为没有paper就不敢申PhD，其实导师看中的是科研能力和潜力而非论文数量。运气和人脉也是申请中不可忽视的因素。硕博混申是稳妥策略：PhD冲刺、MS保底，最终结果往往超出预期。`,
	},
	{
		DisplayName:       "太阳花2号",
		OriginalAuthor: "殷凡超",
		School:            "华中科技大学",
		MajorLine:         "材料/钙钛矿方向 PhD",
		ScoreLine:         "GPA 3.96/4, GRE 155+169+4, TOEFL 109(S23)",
		ArticleTitle:      "华科飞跃手册 | 钙钛矿方向Stanford PhD的飞跃之路",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "UCLA-CSST暑研、3篇一作共一+2专利，从华科到Stanford PhD的顶尖申请经验。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于顶尖PhD申请、科研积累和综合软实力提升的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"怎样才能申请到Stanford PhD？",
			"UCLA CSST暑研项目如何申请？",
			"本科阶段发一作论文需要什么条件？",
		},
		ExpertiseTags: []string{"Stanford PhD", "钙钛矿", "CSST暑研", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.96/4，GRE 155+169+4，TOEFL 109(S23)，UCLA-CSST暑研，3篇一作/共一论文+2项专利。

录取结果：Stanford PhD（最终去向）、UChicago PhD、Rice PhD。

核心经验：早立志、立大志。钙钛矿方向科研从大二开始深耕，四年持续投入是拿到顶级录取的基础。UCLA-CSST暑研项目非常值得申请，不仅能接触顶级实验室，还能拿到有分量的推荐信。"吃得苦中苦"是科研常态，大量实验和反复失败不可避免。Learn from the best——选择最好的课题组和导师能加速成长。除了硬实力，软实力（沟通能力、团队协作、学术报告）也是顶尖PhD面试中的考察重点。`,
	},
	{
		DisplayName:       "鹤鸣九皋",
		OriginalAuthor: "张鸿博",
		School:            "华中科技大学",
		MajorLine:         "EE PhD",
		ScoreLine:         "GPA 3.96/4 94.6/100 Rank 1/287, GRE 162+170+3.5, TOEFL 106(S23)",
		ArticleTitle:      "华科飞跃手册 | 年级第一无暑研极限冲刺PhD",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "GPA年级第一、GRE 332，无暑研无海外推荐信的极限操作拿下Yale PhD等录取。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于高GPA申请、无暑研PhD策略和套磁技巧的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"没有暑研和海外推荐信还能申PhD吗？",
			"大三下才决定出国来得及吗？",
			"套磁邮件怎么写才有针对性？",
		},
		ExpertiseTags: []string{"EE PhD", "高GPA", "极限申请", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.96/4（94.6/100），年级排名1/287，GRE 162+170+3.5（332），TOEFL 106(S23)，无暑研、无海外推荐信，一篇挂名+一篇共一在投。大三下才决定出国。

录取结果：Yale PhD（最终去向）、NUS PhD、Georgia Tech PhD、USC PhD、Rochester PhD、Purdue PhD、UT Austin PhD。

核心经验：提前规划是最重要的建议——大三下才决定出国属于极限操作，有很大运气成分。GRE 332和年级第一的GPA弥补了无暑研的劣势，但这不可复制。套磁要有针对性，认真读教授论文后写个性化邮件。选导师要三思：研究方向、课题组氛围、毕业率都要调查清楚。`,
	},
	{
		DisplayName:       "蓝莓冰沙Q",
		OriginalAuthor: "彭小雷",
		School:            "华中科技大学",
		MajorLine:         "欧陆/新加坡硕士",
		ScoreLine:         "GPA 90.7(2/33), IELTS 6.5(S5.5)",
		ArticleTitle:      "华科飞跃手册 | 欧陆与新加坡硕士申请攻略",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "巴黎暑校经历，无论文拿下KTH、NUS、NTU等欧陆新加坡多校硕士录取。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于欧洲和新加坡硕士申请、EPFL录取标准和巴黎高科面试的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"EPFL硕士录取看重什么？",
			"KTH和NUS硕士项目怎么选？",
			"巴黎高科需要笔试和面试吗？",
		},
		ExpertiseTags: []string{"欧洲硕士", "新加坡", "KTH", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 90.7（年级2/33），IELTS 6.5(S5.5)，巴黎暑校经历，无论文。

录取结果：TELECOM Paris AD、KTH AD、NUS AD、NTU AD；EPFL Reject。

核心经验：EPFL非常看重GPA和本科学校背景，985高GPA是基本门槛。巴黎高科（TELECOM等）需要参加笔试和面试，面试可用英语。KTH和NUS都是性价比很高的选择，KTH北欧工科传统强校且有学费减免机会，NUS在亚洲就业市场认可度极高。申请欧陆学校注意各国流程差异较大，法国、瑞典、瑞士的材料要求和时间线各不相同。IELTS口语5.5虽然偏低但不影响大多数欧洲学校申请。`,
	},
	{
		DisplayName:       "星球漫游33",
		OriginalAuthor: "周楠森",
		School:            "华中科技大学",
		MajorLine:         "3+2 KTH联合培养",
		ScoreLine:         "GPA 91.7(12/335), TOEFL 95(S22)",
		ArticleTitle:      "华科飞跃手册 | 3+2瑞典KTH联合培养经验分享",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "3+2项目赴KTH全免学费，麦吉尔暑研经历，分享瑞典留学与独立生活感悟。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于3+2联合培养、KTH学习和瑞典生活的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"3+2联合培养项目值不值得去？",
			"KTH的学习体验怎么样？",
			"瑞典留学的优势有哪些？",
		},
		ExpertiseTags: []string{"KTH", "3+2项目", "瑞典留学", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 91.7（年级12/335），TOEFL 95(S22)，麦吉尔大学暑研经历。

录取结果：KTH 3+2联合培养，全免学费。

核心经验：瑞典学校实诚看GPA，高绩点是申请的硬通货。KTH作为北欧顶级理工学府，教学质量高、科研资源丰富，且全免学费大大降低了留学成本。把KTH当作看世界的跳板非常合适——瑞典社会平等开放，国际化程度高，毕业后无论留欧还是继续深造都有优势。独立生活能力在海外会得到极大提升，从做饭到租房到处理行政事务，全方位锻炼。`,
	},
	{
		DisplayName:       "微光Lab",
		OriginalAuthor: "吴昊",
		School:            "华中科技大学",
		MajorLine:         "Optics PhD（3+2后申请）",
		ScoreLine:         "Master GPA 3.74/4, GRE 141+168+3",
		ArticleTitle:      "华科飞跃手册 | 3+2之后转申Optics PhD的经验",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "3+2项目后转方向申请Optics PhD，分享推荐信与专业课面试的关键经验。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于3+2后续深造、Optics PhD申请和面试准备的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"3+2毕业后怎么继续申请PhD？",
			"推荐信在PhD申请中有多关键？",
			"PhD面试会被问什么专业课问题？",
		},
		ExpertiseTags: []string{"Optics PhD", "3+2深造", "面试准备", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：硕士GPA 3.74/4，GRE 141+168+3，经历了3+2联合培养项目（UD）。微电子转光学方向，在海外学习期间找到了读PhD的兴趣。

录取结果：Rochester Institute of Optics PhD（最终去向）、OSU AD、ASU AD。

核心经验：推荐信在PhD申请中极其重要，尤其是来自熟悉你科研能力的导师的推荐。3+2项目是一个很好的过渡，能在海外环境中明确自己是否适合读博。PhD面试要做好充分准备，教授会直接问专业课问题来考察基础功底，光学方向尤其会考察波动光学、量子光学等核心课程内容。微电子转光学方向是可行的，关键在于展示出对新方向的深入理解和研究热情。`,
	},
	{
		DisplayName:       "枫叶加零",
		OriginalAuthor: "周笑阳",
		School:            "华中科技大学",
		MajorLine:         "加拿大研究型硕士MSc",
		ScoreLine:         "GPA 3.91(46/80), TOEFL 97(S22)",
		ArticleTitle:      "华科飞跃手册 | 加拿大全奖研究型硕士申请总结",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "Mitacs暑研转加拿大全奖研究型硕士，无论文无专利也能拿全额资助。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于加拿大研究型硕士、Mitacs暑研和全奖申请的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"加拿大研究型硕士和授课型有什么区别？",
			"Mitacs暑研项目的体验如何？",
			"不想读博但想做科研怎么选？",
		},
		ExpertiseTags: []string{"加拿大硕士", "全奖", "Mitacs", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.91（年级46/80），TOEFL 97(S22)，Mitacs暑研经历，无论文无专利。

录取结果：INRS全奖研究型硕士AD。

核心经验：不想直接读博但又想做科研的同学，加拿大研究型硕士（MSc/MASc）是绝佳选择——全额奖学金覆盖学费和生活费，2年学制压力适中。Mitacs暑研"事少钱多"，是了解加拿大学术环境的好渠道，且暑研导师往往会直接给出硕士录取。加拿大生活安定、社会福利好、移民政策友善。选择加拿大还有一个优势：硕士毕业后可以获得工签，方便积累海外工作经验。`,
	},
	{
		DisplayName:       "蔷薇花开Lv",
		OriginalAuthor: "曾逸麟",
		School:            "华中科技大学",
		MajorLine:         "法国IOGS 3+3光学",
		ScoreLine:         "GPA 89.6/100, TCF 398(B1)",
		ArticleTitle:      "华科飞跃手册 | 法国IOGS 3+3光学项目申请",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "中法班3+3赴IOGS学习光学，分享法国工程师体系面试与光学简历准备。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于法国工程师学校、IOGS光学项目和中法班申请的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"法国工程师学校和普通大学有什么区别？",
			"IOGS的光学项目怎么样？",
			"中法班面试用什么语言？",
		},
		ExpertiseTags: []string{"法国留学", "IOGS", "光学", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 89.6/100，TCF 398（B1水平），通过中法班项目申请。

录取结果：IOGS（法国高等光学学院）3+3项目录取。

核心经验：法国工程师学校（Grande École）体系与普通大学不同，是法国精英教育的代表。IOGS是法国光学领域的顶级学校，师资和实验条件一流。中法班申请需要面试，可以用英语+法语混合进行，法语不需要特别流利但要展示学习意愿。选校要看自己的兴趣方向，光学相关的经历和课程要在简历中突出。面试的核心是能和教授就专业话题展开对话，展示学术热情和基础知识储备。`,
	},
	{
		DisplayName:       "甜筒翻转ss",
		OriginalAuthor: "张开",
		School:            "华中科技大学",
		MajorLine:         "教育技术硕士（转专业）",
		ScoreLine:         "GPA 3.89, GRE 159+170+4.0, TOEFL 116(S30)",
		ArticleTitle:      "华科飞跃手册 | 光电转教育技术CMU硕士申请",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "光电跨申教育技术，TOEFL 116+GRE满分数学，从明确转专业动机到斩获CMU。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于转专业申请教育技术、文书策略和海外交流经历的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"理工科如何转申教育技术方向？",
			"转专业文书的动机线索怎么写？",
			"海外交流经历对跨专业申请有多大帮助？",
		},
		ExpertiseTags: []string{"教育技术", "转专业", "CMU", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.89，GRE 159+170+4.0，TOEFL 116(S30)，两段海外交流经历。光电背景转申教育技术方向，大二下确定转专业目标。

录取结果：CMU（最终去向）、宾大、哥大、NYU、IUB、FSU。

核心经验：尽早规划转专业路线是关键。大二下确定方向后，有针对性地选修教育学相关课程、参加教育技术相关项目和实习。明确转专业动机非常重要——文书要清晰展示"为什么从光电转到教育技术"的逻辑链。TOEFL 116和GRE 170的顶尖标化成绩证明了学术能力。海外交流经历不仅丰富背景，还帮助理解目标领域的国际视野。认识自己、找到真正热爱的方向，比盲目追求热门专业更重要。`,
	},
	{
		DisplayName:       "小确幸z7",
		OriginalAuthor: "田雅琪",
		School:            "华中科技大学",
		MajorLine:         "BME PhD（港中文）",
		ScoreLine:         "GPA 93.1/100(3/282), TOEFL 94(S21)",
		ArticleTitle:      "华科飞跃手册 | 只申一所学校拿下CUHK PhD",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "准备保研同时申请CUHK博士，夏令营面套一举拿下PhD全奖Offer。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于香港PhD申请、夏令营面套和保研备选策略的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"只申一所学校的策略可行吗？",
			"CUHK夏令营面试什么流程？",
			"保研和出国可以同时准备吗？",
		},
		ExpertiseTags: []string{"CUHK PhD", "夏令营", "BME", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 93.1/100（年级3/282），TOEFL 94(S21)，无GRE，2次国家奖学金。主要准备保研，同时申请了CUHK PhD。

录取结果：CUHK PhD全奖Offer（最终去向）。

核心经验：只申了一所学校属于非常冒险的策略，不建议模仿。成功的关键在于：高GPA和国奖证明学术实力，通过夏令营面试直接与导师面对面交流、展示科研能力。CUHK夏令营是一个高效的申请渠道，面试表现好可以当场拿到口头Offer。保研和出国可以并行准备，但要注意时间节点的冲突。TOEFL口语偏低不影响港校申请，但面试中英语表达能力仍然很重要。`,
	},
	{
		DisplayName:       "银河冲浪手",
		OriginalAuthor: "周博轩",
		School:            "华中科技大学",
		MajorLine:         "EE/光学 PhD",
		ScoreLine:         "GPA 3.98(2/283), GRE 325+4, TOEFL 104(S23)",
		ArticleTitle:      "华科飞跃手册 | UCLA光学方向PhD申请总结",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "年级第二、海外暑研+一作论文，斩获UCLA、Caltech等顶尖光学PhD录取。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于顶尖PhD申请、科研积累和暑研选择的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"GPA接近满分对PhD申请有多大加成？",
			"光学方向顶尖学校有哪些？",
			"暑研期间怎样拿到强推荐信？",
		},
		ExpertiseTags: []string{"光学PhD", "UCLA", "顶尖申请", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.98（年级2/283），GRE 325+4，TOEFL 104(S23)，海外暑研经历，一篇一作论文。

录取结果：UCLA（最终去向）、USC PhD、Caltech PhD、NUS PhD。

核心经验：顶尖GPA（接近满分）是冲击名校PhD的基础。一作论文证明了独立科研能力，海外暑研提供了有说服力的推荐信。光学/光电方向的顶尖学校包括UCLA、Caltech、Stanford等，这些学校非常看重申请者的科研深度和方向匹配度。暑研期间要主动承担科研任务、展示独立思考能力，这样才能拿到有分量的强推荐信。`,
	},
	{
		DisplayName:       "纳米小分队",
		OriginalAuthor: "陈章迪",
		School:            "华中科技大学",
		MajorLine:         "EE/纳米方向 PhD",
		ScoreLine:         "GPA 3.90, GRE 169+149+3, TOEFL 97(S22)",
		ArticleTitle:      "华科飞跃手册 | 纳米方向PhD申请与竞赛经历",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "NUS交流+IEEE NANO论文+挑战杯国赛一等奖，从华科到Purdue PhD的申请。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于纳米方向PhD申请、学术竞赛和海外交流的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"挑战杯等竞赛对PhD申请有帮助吗？",
			"GRE偏科（数学高verbal低）影响大吗？",
			"NUS交流项目值得参加吗？",
		},
		ExpertiseTags: []string{"纳米方向", "Purdue PhD", "学术竞赛", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.90，GRE 169+149+3（数学满分但verbal偏低），TOEFL 97(S22)，NUS交流经历，IEEE NANO会议论文一篇，3项专利，挑战杯国赛一等奖。

录取结果：CUHK PhD、Purdue PhD（最终去向，2021 Spring入学）。

核心经验：丰富的科研竞赛经历（挑战杯国赛一等奖、IEEE NANO论文、专利）弥补了GRE verbal偏低的劣势。NUS交流经历拓宽了国际视野，也帮助获得海外推荐信。GRE偏科不是致命问题，理工科PhD更看重研究潜力和科研产出。Purdue在纳米/材料方向实力很强，选校时要关注具体方向的实验室资源。`,
	},
	{
		DisplayName:       "光波dispersion",
		OriginalAuthor: "邓鹏飞",
		School:            "华中科技大学",
		MajorLine:         "Optics MS/PhD混申",
		ScoreLine:         "GPA 92.2(前2%), GRE 328+4.0, TOEFL 109(S23)",
		ArticleTitle:      "华科飞跃手册 | 光学方向硕博混申Rochester PhD总结",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "UCI暑研经历，GRE 328+顶尖GPA，硕博混申横扫UCB、CMU等名校。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于光学方向硕博混申、顶尖选校和暑研经历的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"光学方向PhD选Rochester还是其他学校？",
			"硕博混申如何分配申请学校？",
			"GPA前2%和GRE 328+的组合有多大竞争力？",
		},
		ExpertiseTags: []string{"光学PhD", "Rochester", "硕博混申", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 92.2（年级前2%），GRE 328+4.0，TOEFL 109(S23)，UCI暑研经历。

录取结果：PhD——Rochester Optics、UCF、Northwestern、TAMU、UCSB、UCSD、UC Berkeley；MS——UC Berkeley、UMich、CMU、Cornell、Columbia。最终选择Rochester Optics PhD。

核心经验：硕博混申是光学方向的常见策略。Rochester的Institute of Optics是全美最顶级的光学专业院系，历史悠久、师资顶尖。UCI暑研提供了关键的海外推荐信和科研经历。顶尖GPA+高GRE的组合在申请中极具竞争力。选校时PhD看导师匹配度，MS看项目质量和就业资源。`,
	},
	{
		DisplayName:       "芯片味的茶",
		OriginalAuthor: "胡满琛",
		School:            "华中科技大学",
		MajorLine:         "EE/光电 Master",
		ScoreLine:         "GPA 91.4(3.98, 1/28), GRE 325+3.5, TOEFL 105",
		ArticleTitle:      "华科飞跃手册 | 华科年级第一到CMU硕士的申请路",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "Vanderbilt暑研+两篇论文，年级第一横扫CMU、Columbia等九所顶尖硕士项目。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于顶尖MS申请、暑研论文和选校策略的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"CMU的EE/ECE硕士项目怎么样？",
			"暑研期间怎样高效产出论文？",
			"年级第一申MS是不是有点浪费？",
		},
		ExpertiseTags: []string{"CMU硕士", "暑研论文", "顶尖MS", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 91.4（3.98/4，年级1/28），GRE 325+3.5，TOEFL 105，Vanderbilt暑研经历，共一论文1篇+二作论文1篇。

录取结果：CMU（最终去向）、Columbia、Duke、JHU、USC、UCLA、UIUC、Cornell、UMich。

核心经验：年级第一的GPA是横扫名校的硬实力基础。Vanderbilt暑研不仅产出了论文，更重要的是获得了有说服力的推荐信。CMU作为最终选择，其EE/ECE硕士项目课程设置灵活、科研资源丰富、就业网络强大。暑研期间要高效利用时间，目标明确地推进课题以争取论文产出。`,
	},
	{
		DisplayName:       "激光小王子",
		OriginalAuthor: "鲍语今",
		School:            "华中科技大学",
		MajorLine:         "Optics/EE Master",
		ScoreLine:         "GPA 3.53, GRE 317, TOEFL 99(S19)",
		ArticleTitle:      "华科飞跃手册 | 中等GPA光学硕士申请经验",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "GPA中等但有飞秒激光器搭建经验，分享非顶尖背景的务实选校策略。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于中等GPA申请、光学方向和务实选校的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"GPA不高怎么选校才合理？",
			"实验室动手经验对申请有帮助吗？",
			"TAMU的光学项目怎么样？",
		},
		ExpertiseTags: []string{"光学硕士", "中等GPA", "务实选校", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.53，GRE 317，TOEFL 99(S19)，飞秒激光器搭建实验经历。

录取结果：TAMU AD（最终去向）、Lund University AD。

核心经验：GPA中等（3.5左右）的申请者要务实选校，不要盲目冲刺top 20。飞秒激光器搭建的动手经验是光学方向的加分项，展示了实验能力。TAMU在光学/光电领域有不错的实验室资源，性价比较高。同时申请了欧洲学校作为备选，Lund University在光学领域也有传统优势。对于非顶尖背景的申请者，选校策略要现实：以排名30-80的学校为主，确保有保底校。`,
	},
	{
		DisplayName:       "港湾小舟rv",
		OriginalAuthor: "代兆威",
		School:            "华中科技大学",
		MajorLine:         "香港研究型硕士",
		ScoreLine:         "GPA 85.8/3.76, IELTS 6.5",
		ArticleTitle:      "华科飞跃手册 | 港校研究型硕士申请经验",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "南安普顿暑校背景，申请港理工研究型硕士和港中文授课型硕士的对比经验。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于香港研究型硕士、港校申请和暑期学校的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"港校研究型和授课型硕士有什么区别？",
			"IELTS 6.5够申请港校吗？",
			"暑期学校对港校申请有帮助吗？",
		},
		ExpertiseTags: []string{"香港硕士", "研究型", "PolyU", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 85.8（3.76/4），IELTS 6.5，南安普顿大学暑期学校经历。

录取结果：港理工研究型硕士、港中文授课型硕士。最终选择港理工（PolyU）研究型硕士。

核心经验：香港研究型硕士（MPhil）有全奖资助，适合想做科研但暂不确定是否读博的同学。与授课型硕士（MSc）相比，研究型需要套磁找导师，门槛更高但含金量也更高。IELTS 6.5是大多数港校的最低要求，够用但不算亮点。南安普顿暑期学校可以丰富海外背景。港校申请周期较灵活，部分导师全年招生，要主动联系。`,
	},
	{
		DisplayName:       "元气弹bq",
		OriginalAuthor: "龚如一",
		School:            "华中科技大学",
		MajorLine:         "EE/Optics Master",
		ScoreLine:         "GPA 3.73, GRE 322+2.5, TOEFL 101(S21)",
		ArticleTitle:      "华科飞跃手册 | 无科研交流背景的EE硕士申请",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "无科研交流经历、美赛M奖加持，分享普通背景下如何务实定位拿到USC录取。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于普通背景EE硕士申请和务实选校的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"没有科研和交流经历怎么申请MS？",
			"美赛获奖对留学申请有帮助吗？",
			"USC的EE硕士项目怎么样？",
		},
		ExpertiseTags: []string{"EE硕士", "普通背景", "USC", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.73，GRE 322+2.5，TOEFL 101(S21)，无科研经历、无海外交流经历，美赛M奖。

录取结果：Rochester AD、USC AD（最终去向）。

核心经验：没有科研和交流经历不代表无法申请，关键是在有限的背景中找到亮点。美赛M奖虽然不是顶级加分项但展示了团队协作和建模能力。GPA 3.73和GRE 322是中等偏上的三维，定位排名30-60的学校比较合理。USC的EE硕士项目课程选择丰富、地处洛杉矶就业机会多。对于普通背景的申请者，文书要聚焦个人成长和未来规划，而非强行包装科研经历。`,
	},
	{
		DisplayName:       "解码小能手",
		OriginalAuthor: "余昕雨",
		School:            "华中科技大学",
		MajorLine:         "EE Master",
		ScoreLine:         "GPA 3.27, GRE 323, TOEFL 107",
		ArticleTitle:      "华科飞跃手册 | GPA偏低的EE硕士申请策略",
		LongBioPrefix:     hustFeyueLongBioPrefix,
		ShortBio:          "GPA 3.27但TOEFL 107，2学术+1实习推荐信组合，分享低GPA选校与文书补救策略。",
		Audience:          hustAudience,
		WelcomeMessage:    "你好，欢迎问我关于低GPA申请策略、推荐信组合和保底选校的问题。",
		Education:         hustEducation,
		MajorLabel:        hustMajorLabel,
		KnowledgeCategory: hustKnowledgeCat,
		KnowledgeTags:     hustKnowledgeTags,
		SampleQuestions: []string{
			"GPA只有3.2左右还能申到什么学校？",
			"推荐信怎么选2学术+1实习的组合？",
			"Rochester的光学/EE项目值得去吗？",
		},
		ExpertiseTags: []string{"EE硕士", "低GPA策略", "Rochester", "飞跃手册", "华中科技大学"},
		Source: `华科飞跃手册`,
		KnowledgeBody: `申请背景：GPA 3.27，GRE 323，TOEFL 107，2封学术推荐信+1封实习推荐信。

录取结果：Rochester AD（最终去向）、NYU AD、BU AD、UCI AD、RPI AD、Case Western AD。

核心经验：GPA 3.27在EE申请中偏低，但TOEFL 107和GRE 323部分弥补了劣势。推荐信采用2学术+1实习的组合，展示了学术能力和实践经历的双面。低GPA的选校策略要务实：以排名50-100的学校为主力，少量冲刺30-50。Rochester在光学方向是世界级水平，虽然综合排名不算顶尖但专业实力极强。文书中要坦诚面对GPA不足，用GPA上升趋势或课外表现来补充说明。`,
	},
}
