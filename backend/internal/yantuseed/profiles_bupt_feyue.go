package yantuseed

// 北邮飞跃手册第十四章「申请经验谈」系列，23 位作者。
// 原文版权归北邮人论坛飞跃重洋版《北邮飞跃手册》编辑委员会所有。
const buptFeyueLongBioPrefix = "本文来自北京邮电大学《北邮飞跃手册》第十四章「申请经验谈」，著作权属编委会与原作者；以下为个人出国申请经验，仅供留学参考。"

const (
	buptAudience       = "正在准备出国留学申请的同学，尤其是北邮及理工科背景。"
	buptEducation      = "海外硕士/博士（已录取或就读）"
	buptMajorLabel     = "申请方向"
	buptKnowledgeCat   = "留学申请经验"
)

var buptKnowledgeTags = []string{"出国留学", "经验贴", "飞跃手册"}

var buptFeyueProfiles = []Profile{
	{
		DisplayName:       "幽灵不打烊",
		OriginalAuthor: "holyghost",
		School:            "北京邮电大学",
		MajorLine:         "ECE signal processing",
		ScoreLine:         "GPA 89, GRE 770Q+640V+4.5, TOEFL 106",
		ArticleTitle:      "北邮飞跃手册 | ECE信号处理方向申请感想",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "ECE信号处理方向，拿到美国多校PhD/MS录取，分享从保研抉择到套磁拿Offer的全过程。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于出国留学申请、选校定位和套磁策略的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"北邮本科申请美国ECE方向PhD有多大把握？",
			"要不要放弃保研名额全力准备出国？",
			"如何选择申请的专业方向和学校？",
		},
		ExpertiseTags: []string{"出国留学", "ECE", "北邮", "飞跃手册", "信号处理"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `申请背景：
RA MSEE@UT-Dallas
方向：ECE- signal processing
G: 770(Q)+640(V)+4.5  T: 28+22(Speaking)+28+28=106
GPA: 89
物理竞赛2等，英语2等
一篇国内会议论文，与申请方向无关。
研究经历：电设算是跟申请沾点边，毕设也沾点边。

申请结果：
UT-Dallas MSEE Offer（申请UC-Boulder被转到UT-Dallas）
OSU MS AD（申请PhD被降级为MS）
UC-Boulder PhD AD
Columbia MS AD（申请PhD被降级为MS）
Drexel PhD AD
Clemson PhD AD
StevensIT MS AD
HKUST MPhil Offer（电面）
KTH AD
EuMI AD
VIBOT Offer
UCSB/UMD/Umich/UWashington/Upenn/Purdue/Rochester PhD REJ

到底要不要出国？这是第一次挣扎。大二回到本部，出国是我第一个想法，学了熵以后明白了，只有不确定性大的时候，信息量才会大。老妈很支持，砸锅卖铁也把你送出去。

第二次抉择：要不要放弃保研名额？破釜沉舟，一心一意准备出国。放弃之后确实少了很多事。

怎么选专业、怎么选学校？我认为还是要选自己感兴趣的方向。选校很关键，决定你会花多少钱。地点相对很重要。东西海岸历来是黄金地段。导师比学校排名更重要。

建议不要只选美国，欧盟项目、香港、加拿大、新加坡都有不少全奖。MS自费的话一定要申好学校！

等消息时候要积极套磁！见面的效果比电话、邮件好多少倍。我的UTDallas Offer就是因为跑到友谊宾馆跟Colorado的老师聊了一上午获得的。`,
	},
	{
		DisplayName:       "星辰大海Luo",
		OriginalAuthor: "patrickluo",
		School:            "北京邮电大学",
		MajorLine:         "通信工程",
		ArticleTitle:      "北邮飞跃手册 | 通信工程硕士申请总结",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "通信工程自费硕士申请，从GT备考到选校定位的实战经验分享。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于出国留学申请、选校定位和套磁策略的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"北邮通信专业出国是否有优势？",
			"申请自费硕士应该如何定位？",
			"GT考试和GPA应该如何平衡？",
		},
		ExpertiseTags: []string{"出国留学", "通信工程", "北邮", "飞跃手册", "硕士申请"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `高考时来到北邮通信专业。在宿舍遇到了室友拿本TOEFL词汇在背，出国的萌芽在大一时埋在了心里。

不想考研太累，综合不想考研、保研没戏、不能只有本科学历，那么只有出国了。那时的想法是非全奖不出。上新东方、考TOEFL、考GRE、IBM实习、好好考试、提高成绩。

后来认识到全奖名校太难，定位到硕士自费。定位很重要：是全奖博士还是自费硕士，基本上就是这两种选择。

好好学习包括GPA、研究经历、paper、实习、推荐信、PS、GT成绩（排名按重要分先后）。等待的时候多骚扰，邮件不好使就直接打电话。心态挺重要的，看的轻一点压力就没那么大了。`,
	},
	{
		DisplayName:       "carol吃薯片",
		OriginalAuthor: "carol",
		School:            "北京邮电大学",
		MajorLine:         "通信工程转HCI",
		ArticleTitle:      "北邮飞跃手册 | 从通信工程到HCI的转专业申请",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "从通信工程跨申HCI方向，分享转专业申请中的背景调整与方向探索经验。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于出国转专业申请和HCI方向选择的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"如何从通信工程转申HCI方向？",
			"转专业申请应该做好哪三件事？",
			"申PhD还是Master更合适？",
		},
		ExpertiseTags: []string{"出国留学", "HCI", "北邮", "飞跃手册", "转专业"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `有转专业意向的同学，重点应该做好三件事：
一、对自己的专业、想学的专业、自身兴趣和能力有个尽量清晰的认识；
二、对主观客观情况有个全面的考察和了解；
三、积极调整自己的背景，和想学的专业尽量match。

建议尽量不要背弃本专业。申请方向的确定越早越好。兴趣的发现和确定是个漫长的过程。背景、兴趣、能力的综合考虑是专业问题的重点。

除了自学HCI相关的东西，也在找北京高校相关研究。和北邮自动化院老师做HCI方向的事情，开始听课，做语音搜索方面的人因研究。

申请方向除了HCI就是HCI相关的多媒体。不愿完全抛弃EE，万一HCI方向全军覆没，至少EE应该还可以给一个出国的可能。

建议为了钱而申直博的本科生再谨慎一些。如果GPA高或四年间已攒了不少研究经验，尽可以申博士；若以上两条都不太满足，先申个硕士也是不错的选择。`,
	},
	{
		DisplayName:       "海浪轻轻摇",
		OriginalAuthor: "haipiaoxiao",
		School:            "北京邮电大学",
		MajorLine:         "EE/Speech方向",
		ArticleTitle:      "北邮飞跃手册 | 专业结合兴趣的EE方向选择",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "EE语音处理方向，兴趣驱动的跨领域申请与研究经历积累经验分享。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于出国留学申请、选校定位和套磁策略的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"如何在申请中把自己的特色变成亮点？",
			"没有基础如何积累研究经历？",
			"曲线救国的申请策略怎么用？",
		},
		ExpertiseTags: []string{"出国留学", "语音处理", "北邮", "飞跃手册", "跨方向"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `自知自己是一个相当没有自制力和恒心的人，喜欢的东西很多很泛，是常说的"三分钟热度"。

以语音信号处理专业选修课的经历投声学所某公司实习。一开始让我听MP3校对midi，后来主要做游戏demo，算是interactive game for education purpose。此为申请研究经历一。

联系清华的老师做毕设，转回到speech方向。在清华的一年收益颇多，导师人很开明，一开始就明说要出国。此为申请研究经历二。

从结果来看跟自己背景match要好的多。虽然没能实现学HCI的graphics & animation的梦想，但从大四一年的毕设工作中也对目前的方向有了兴趣。

路都是人走出来的，只有想不到没有做不到。在自己奋斗追梦的路上不要忘了亲朋好友。`,
	},
	{
		DisplayName:       "小柯_Nap",
		OriginalAuthor: "xiaokeaister",
		School:            "北京邮电大学",
		MajorLine:         "数字媒体艺术/Information Science",
		ArticleTitle:      "北邮飞跃手册 | 数媒转Information Science的选校感想",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "数字媒体艺术背景转申Information Science与HCI设计方向的选校心得。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于数媒转专业申请和Information Science方向选择的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"数媒专业出国可以申什么方向？",
			"HCI design和CS的HCI有什么区别？",
			"Information Science方向怎么选？",
		},
		ExpertiseTags: []string{"出国留学", "HCI", "北邮", "飞跃手册", "Information Science"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `决定申请后，心情异常矛盾，觉得自己不是个研究型人才。转专业在出国申请过程中更容易实现，国外教育更加人性化一些。

数媒的背景让我对视觉的东西更敏感，首先想到图像和视频处理。和UNCC的华人AP聊过后，对图像处理甚至EE彻底死心了。

决定帮自己选择综合性比较强的program。Information Science闯入视野，与管理、设计、社会学等学科的结合诞生了很多交叉学科。

最终在HCId、Information Management、Information Technology几个专业间选择了IUB的HCId。HCId是HCI中介于human factors与machine factors研究之间的部分，更偏重于以用户为中心进行界面及其他交互方式的设计。

Application的过程中做再多的功课都不为过。`,
	},
	{
		DisplayName:       "赢了别浪",
		OriginalAuthor: "wining",
		School:            "北京邮电大学",
		MajorLine:         "Media Informatics",
		ScoreLine:         "GPA 77, major 80+",
		ArticleTitle:      "北邮飞跃手册 | 德国Media Informatics申请历程",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "低GPA逆袭德国RWTH Aachen，分享德国留学申请与APS审核全攻略。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于德国留学申请和APS审核准备的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"GPA不高如何申请德国留学？",
			"APS审核怎么准备？",
			"RWTH Aachen录取看重什么？",
		},
		ExpertiseTags: []string{"出国留学", "德国", "北邮", "飞跃手册", "Media Informatics"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `首先介绍DAAD，可以在网上选校。德国最著名的理工大学无非是TUM和RWTH Aachen，计算机最强的是卡尔斯鲁厄。TU9是一个德国的九所理工联盟。

不能不知道的abcdv论坛，因为上面有关于德国一切信息。

最恶心的APS审核，凸显德国人办事严谨的一道工序。最好在头一年10月就去递送审核材料。笔试题并不很深但覆盖大学所有可能。

GPA算是出国人里面非常低的，77，major 80+，好在成绩呈上升趋势。在国重混了半年，跟了个项目，跟西门子、大众金融混了下。RWTH Aachen录取的时候提到丰富的career experience。

最终去了RWTH Aachen的Media Informatics，选择HCI和Multimedia靠拢。如果不能立即实现自己的兴趣，那么我们就要向它无限靠拢。

德国给人一种厚重、严谨、务实的感觉。欧洲很美，美的神秘。`,
	},
	{
		DisplayName:       "猫咪打盹中",
		OriginalAuthor: "didocat",
		School:            "北京邮电大学",
		MajorLine:         "ECE/加拿大申请",
		ArticleTitle:      "北邮飞跃手册 | 加拿大ECE方向申请过程",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "加拿大ECE方向申请全流程，分享中加申请差异与实战技巧。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于加拿大留学申请和ECE方向选校的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"加拿大和美国的申请有什么不同？",
			"加拿大学校的截止日期特点是什么？",
			"寒假收到offer要注意什么？",
		},
		ExpertiseTags: []string{"出国留学", "加拿大", "北邮", "飞跃手册", "ECE"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `基本材料的准备和美国基本相同，大多数学校都是网申。

UToronto要在研院网上申请之后，在ECE dept再填一次，还要把全部成绩一项一项地敲进去。UAlberta除了网上填表还要填一张纸质的寄过去。

加拿大的申请费一般高于美国学校。UBC申请费可顶2倍的廉价美国学校申请费。申请的时候最好区别档次，避免盲目批量申请。

申请截止日期平均晚于美国。最早一批是BC省的UBC和UVIC 12月中旬截止。Waterloo、UOttawa、SFU等晚至3月甚至5月，但秉着FIFO精神还是最好在年底搞定。

最早的Offer通知是在大年三十早上教授打手机给的surprise。加拿大学校无论Offer还是据信一律平信小信封寄，积极查信很重要。`,
	},
	{
		DisplayName:       "旅人TripX",
		OriginalAuthor: "traveller",
		School:            "北京邮电大学",
		MajorLine:         "EECS",
		ArticleTitle:      "北邮飞跃手册 | EECS方向20校申请总结",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "GRE考砸仍坚持出国，20所学校EECS方向申请与材料准备的精细化经验。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于出国留学申请、选校定位和套磁策略的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"GRE考砸了还要不要坚持出国？",
			"申请20所学校是不是太多了？",
			"材料准备要细致到什么程度？",
		},
		ExpertiseTags: []string{"出国留学", "EECS", "北邮", "飞跃手册", "Master申请"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `去年的今天收到GRE的噩耗，险些放弃这条路。很庆幸有朋友和家人的支持，坚持了下来。So if u do care, do not hesitate to keep on！GRE不是决定你命运的一步棋。

Offer：Nanyang (PhD)、SFU、NCSU
AD：Aubrun、Columbia、WSU、IIT、Northeastern
总共申请了20个，12-15个就足够了。

暑假开始就应该着手准备。浏览学校网页查看申请要求很适合暑假的休闲，包括申请费、GT/GPA要求、截至日期、研究方向分类等。

PS是千锤百炼的结晶，全文重写也很常见。修改时一定要从admission committee的角度考虑。推荐信要尽量保证语气、用词的差异。

关于合寄，争取在deadline或圣诞节前把材料递到小米手里。把自己能做的做到完美，精致于每一个细节，得到的结果就不会有遗憾。`,
	},
	{
		DisplayName:       "泡泡不会破",
		OriginalAuthor: "bububub",
		School:            "北京邮电大学",
		MajorLine:         "信息与计算科学/应用数学",
		ScoreLine:         "TOEFL 27+26+23+28, GRE 540+800+4",
		ArticleTitle:      "北邮飞跃手册 | 信息与计算科学转应用数学申请总结",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "信息与计算科学转应用数学，零辅导班自学备考TOEFL和GRE的申请历程。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于出国留学申请、选校定位和套磁策略的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"如何零基础准备TOEFL和GRE？",
			"没报辅导班如何自学备考？",
			"选校时萝卜青菜怎么选？",
		},
		ExpertiseTags: []string{"出国留学", "数学", "北邮", "飞跃手册", "考试准备"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `本科信息与计算科学，研究生应用数学。为了能掌握点真本事决定留学去。

申请院校及结果：UIUC(Rej)、UCLA(Rej)、OHIO UNIV.(AD)、NEU(AD)、NTU(Offer)

强烈推荐：寄托家园和wikipedia，百科全书能查到所有想知道的东西。

因为资金的缘故没有报任何辅导班。托福考试的大门口就那么难进，费了九牛二虎之力才报上名。口语最难搞，买了新东方口语特训自练。

GRE准备不如托福充分，体现在分数上。一分付出一分收获是真的不假。

强烈推荐去petersons注册，有海量申请信息。CV和PS不要一味参考模板，写出自己的亮点。

选校：萝卜青菜各有所爱。毕业之后的工作问题考虑进来很有必要，有时候学校的地理位置也会起到决定性作用。`,
	},
	{
		DisplayName:       "硬糖嘎嘣脆",
		OriginalAuthor: "Hardcandy",
		School:            "北京邮电大学",
		MajorLine:         "自动化学院物流工程转工业工程IE",
		ScoreLine:         "GPA 81-82, TOEFL 623+4.0, GRE 480+800+3.0",
		ArticleTitle:      "北邮飞跃手册 | 从物流工程到工业工程PhD的申请总结",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "物流工程跨申工业工程IE方向PhD全奖，无竞赛无论文的逆袭经验。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于转专业申请PhD和工业工程方向选校的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"物流工程如何转申工业工程PhD？",
			"无竞赛无paper如何申请？",
			"IE方向美国学校怎么选？",
		},
		ExpertiseTags: []string{"出国留学", "工业工程", "北邮", "飞跃手册", "PhD申请"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `本科专业：自动化学院物流工程专业
Overall GPA：81-82  Major GPA：82-83
无竞赛、无paper、有点研究经历和实习经历

最终去向：University of Louisville IE PhD with Fellowship: TW + health insurance waiver + $20,000/year

心得体会：
第一点：遇到困难时不要沮丧，要相信自己，办法总比问题多一个。
第二点：积极主动。在寻找做科研的机会时自己要主动。
第三点：申请关键因素是学校或教授认为你和他的背景是否match。

选校：先参考网上IE在美国高校的情况，按照专业排名逐一上学校网站查看，再按综合排名查专业排名未列出的学校。筛选标准：GT要求是否达到、faculty是否感兴趣、是否有牛教授、地理位置等。

IE学校点评包括Columbia、Stanford、Cornell、UVA、UFL、UMich、USC、NCSU、TAMU、RPI等。`,
	},
	{
		DisplayName:       "lyk_星期五",
		OriginalAuthor: "XXlyk",
		School:            "北京邮电大学",
		ArticleTitle:      "北邮飞跃手册 | 金融工程方向申请经验",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "从目标规划到金融工程FE选校，就业导向的留学申请策略分享。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于出国留学申请、选校定位和套磁策略的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"出国前如何做好目标和规划？",
			"申请金融工程FE需要什么条件？",
			"选校时地理位置有多重要？",
		},
		ExpertiseTags: []string{"出国留学", "金融工程", "北邮", "飞跃手册", "规划"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `目标和规划很重要。如果有可能，多去公司实习实习，最好在大学期间能想清楚。出国读PhD 5、6年的时间，如果为了读而读你会很痛苦。

GT其实是最容易的部分，认真努力好好学取得好成绩没问题。GPA如果从大一就考虑出国，每门课都要好好学。基础课、数学物理编程很重要，专业课很重要。

选校是个很痛苦的过程。因为读完打算找工作，所以学校的位置>专业>名气。BizWeek上雇主对学校学生评价的排名是侧面参考。

金融工程FE是高度竞争的领域。一定要有银行的实习，GRE 650以上，GPA 3.8以上的人一大堆。强烈建议GPA弄好、GRE考好，最好有银行实习。`,
	},
	{
		DisplayName:       "天马行空bupt",
		OriginalAuthor: "pegasusbupt",
		School:            "北京邮电大学",
		ArticleTitle:      "北邮飞跃手册 | PhD申请中的动机与套磁经验",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "从出国动机到套磁策略，PhD申请中的关键决策与常见错误避坑。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于出国留学申请、选校定位和套磁策略的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"出国留学的动机应该怎么想清楚？",
			"申请材料犯了大错怎么办？",
			"套磁应该找什么样的教授？",
		},
		ExpertiseTags: []string{"出国留学", "PhD", "北邮", "飞跃手册", "套磁"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `出不出国不在于你有多牛而在于你想不想。当面临重大选择，标准不在于3/5年甚至10/20年是否后悔，而在于行将入土时你是否会后悔年轻时没有勇气去把握那个机会。

踏上出国这条路还有一个好处：让你习惯了奋斗。闻到血腥味了的狼是没法再变回羊的。

G的准备：越早动手越好，半年背单词应该够了。请小心数学，它没你想象的那么简单。
T的准备：中国学生口语大都不好，多下功夫。

犯的最大错误：所有申请PhD学校的PS里还写着I believe I am qualified for your master program。任何一点疏忽在录取中都可能被放大为被拒原因。

陶瓷tip：找方向吻合且是招生委员会成员的教授，他们不但可以提供RA也可以帮助申到TA。`,
	},
	{
		DisplayName:       "Func_不加班",
		OriginalAuthor: "Func",
		School:            "北京邮电大学",
		MajorLine:         "计算机科学 CS PhD",
		ScoreLine:         "GPA 88.1(本)/82.4(硕), GRE 500+800+5.0, TOEFL 117",
		ArticleTitle:      "北邮飞跃手册 | CS PhD申请Offer总结与飞跃体会",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "硕士申请CS PhD方向，陶瓷拿下全部Offer，Semantic Web交叉方向的申请体会。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于CS PhD申请、套磁和交叉方向选择的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"北邮硕士申请CS PhD如何定位？",
			"陶瓷对于申请PhD有多重要？",
			"申请交叉方向PhD要注意什么？",
		},
		ExpertiseTags: []string{"出国留学", "计算机", "北邮", "飞跃手册", "PhD申请"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `背景：本科山东大学GPA 88.1，硕士北邮计科GPA 82.4
GRE: 500+800+5.0  TOEFL: 117 (29+29+29+30)
IBM CRL实习经历
最终去向：RPI，RA，$16000/9months，方向Semantic Web
申请20所：6个Offer、2个AD、8个Rej、4个没消息

选校：主申专业30-50左右的学校，50-80保底，同时冲击牛校。不支持唯排名论，但可作为参考。

定位：这是申请过程中比较重要的环节。足够的信息量+准确的自我定位能够避免选择的盲目性。

陶瓷：所有的Offer都来自陶瓷。陶瓷挺重要，最起码能让老师对你有点印象。但陶瓷并不是万能的，尤其对于牛校来说。

申请考察的是综合素质，尽量不要让自己有硬伤，尤其是GPA。能把GT考高就尽量考高，能发paper就发paper。

心态调整：别人的最优解不一定是自己的最优解；当前的最优解不一定是长远的最优解。`,
	},
	{
		DisplayName:       "念旧的小鬼",
		OriginalAuthor: "NostalgicImp",
		School:            "北京邮电大学",
		MajorLine:         "Networking/WiMAX",
		ScoreLine:         "GPA 88(本)/81.4(硕), GRE 1370+3.5, IBT 95",
		ArticleTitle:      "北邮飞跃手册 | Networking方向PhD申请总结",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "Networking方向横跨EE与CS的PhD申请，分享方向match与presentation的实战经验。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于Networking方向PhD申请和套磁的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"Networking方向如何跨EE和CS申请？",
			"方向match程度对申请有多关键？",
			"如何用研究经历做好presentation？",
		},
		ExpertiseTags: []string{"出国留学", "网络", "北邮", "飞跃手册", "PhD申请"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `本科华电电信GPA 88，硕士北邮计科GPA 81.4
MCM美赛奖，IEEE国际会议论文，国家通信行业标准，Intel WPO实习

申请18所美国学校，沿着Networking方向把EE和CS的PhD Program都搜了。
Rotation Fellowship: WUSTL
RA: UMass-Amherst, UFL, UT-Dallas, Polytechnic
AD: Columbia
最后从了WUSTL PhD@CSE

申请关键是方向的match程度和你对这个match的presentation。凡是陶瓷回复的教授都是方向非常match的。选校过程尤为重要，选的18个学校全是陶瓷收到积极回复的。

关于presentation：包括发paper的方向、实习的工作、实验室的项目，甚至把看到的paper里的理论加以领会，都可以向教授present。

做Networking的同学可以查阅CS、EE或ECE，EE偏重底层MAC调度算法、移动网络架构，CS偏重高层协议设计和网络性能分析。`,
	},
	{
		DisplayName:       "亚星today",
		OriginalAuthor: "asianstar",
		School:            "北京邮电大学",
		MajorLine:         "EE电院方向",
		ArticleTitle:      "北邮飞跃手册 | 电院EE方向申请总结与套磁经验",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "电院EE方向申请，套磁实战技巧与教授选择的关键细节分享。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于EE方向留学申请和套磁的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"如何了解教授是否在招人？",
			"套磁时打电话和发邮件哪个更有效？",
			"电院常见的申请方向有哪些？",
		},
		ExpertiseTags: []string{"出国留学", "EE", "北邮", "飞跃手册", "套磁"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `关于教授：
- 关注教授最近的学术活动，如果他要参加会议，有可能的话去参加，很重要
- 联系到教授的学生很好，了解实验室人员配置，如果有很多PhD要毕业就是绝佳的机会
- 教授是不是Fellow不重要，关键看老师的项目和拿到的项目多少

几点关注：
- 好地方和学费便宜的学校申请人总是很多
- 申请前打听自己方向上国内最好的地方
- 多打电话，邮件不是最有效的，机会稍纵即逝
- 没有招过中国学生的老师最好不要申请
- 不要死绑在美国一棵树上，申加拿大、欧洲、香港保底

电院对口方向：无线、信号处理和多媒体。
不要以为某个方向北邮申请的人太多就不申请。
申请PhD比MS容易拿到assistantship，但对research experience要求甚高。`,
	},
	{
		DisplayName:       "耳朵爱听歌",
		OriginalAuthor: "耳朵",
		School:            "北京邮电大学",
		MajorLine:         "数字媒体艺术/教育技术",
		ArticleTitle:      "北邮飞跃手册 | 数媒到教育技术的非典型飞跃",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "数字媒体艺术转教育技术与媒体研究方向，从实习到Cornell Offer的申请历程。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于数媒转专业申请和教育技术方向选择的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"数字媒体艺术专业出国能申什么？",
			"如何在校外找毕设导师？",
			"PS的逻辑线索和事例怎么组织？",
		},
		ExpertiseTags: []string{"出国留学", "数字媒体", "北邮", "飞跃手册", "Cornell"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `非典型飞跃从2007年8月底开始。在IBM Intern期间和队友准备Imagine Cup。是微软的比赛让我认识到IT界女性的定位，认清了自己的特长。

专业选择上三条线：
1. 有New Media侧重的媒体研究（传媒MA项目）
2. 数字媒体艺术Digital Media Arts（与本科对口）
3. 教育技术Instructional Technology（退路）

校外毕设：坐在寝室的一个下午发出去几十封邮件给北师大、北大教授。大部分老师还是友善并乐于帮助的。

PS的逻辑：不是流水账，要找到一根逻辑线索让读者明白对专业和学校的选择是水到渠成的。每一段的开头用引导性的斜体文字标注时间和地点。

从三月底一个Offer到四月中旬Cornell Offer，申请历程完结。人生会让你绕一些弯路，经历一些事情，然后回到老路上来继续前行。

最终去了Cornell的Ithaca。`,
	},
	{
		DisplayName:       "toto想回家",
		OriginalAuthor: "byr_transfer",
		School:            "北京邮电大学",
		MajorLine:         "电院/本科转学Transfer",
		ScoreLine:         "GPA 89, major 90, 电院前8-9%",
		ArticleTitle:      "北邮飞跃手册 | 本科Transfer申请经验分享",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "本科转学Transfer到美国，分享GPA与课外活动如何打动招生官。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于本科转学Transfer申请和选校的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"本科转学transfer到美国可行吗？",
			"Transfer和申请研究生有什么区别？",
			"什么样的人适合transfer？",
		},
		ExpertiseTags: []string{"出国留学", "转学", "北邮", "飞跃手册", "本科"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `Transfer就是在原大学就读中途转到其他学校继续深造，拿对方学校的degree。

Transfer好处：申请研究生时有很大优势，在美国能亲眼见教授，英语没问题，省了一大笔钱。

什么样的人适合：比较喜欢挑战、精力旺盛、有一定经济实力、大一一年有一定背景。

最重要的是GPA。大概89，major 90，电院前8-9%。课外活动也重要：院篮球队和辩论队主力，围棋5段。

申请结果：Applied 16, Scholarship 8, Admission 3, Rejection 2
最后从了U of Idaho，每年5000多美元的intl tuition scholarship。

建议申请公立学校为主，私立学校学费太贵。SAT一定会增加竞争力，推荐想transfer去IVY League的一定要考。

任何一段时间的辛苦付出都不会被抹煞。`,
	},
	{
		DisplayName:       "苹果酱w",
		OriginalAuthor: "applw9204120",
		School:            "北京邮电大学",
		MajorLine:         "计算机学院智能科学与技术/NLP",
		ScoreLine:         "GPA 88+, rank 1/32, GRE 560+800+3.5, TOEFL 109",
		ArticleTitle:      "北邮飞跃手册 | NLP方向PhD飞跃总结",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "智能科学NLP方向PhD申请，分享选校策略与保持平和心态的实战经验。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于NLP方向PhD申请和选校的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"NLP方向如何选校和定位？",
			"本科生申请CS PhD需要论文吗？",
			"如何在申请中保持平和心态？",
		},
		ExpertiseTags: []string{"出国留学", "NLP", "北邮", "飞跃手册", "PhD申请"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `计算机学院智能科学与技术本科
GPA：88+；major GPA：92；rank：1/32
论文：一篇三作，发表于水会
北大web mining实习

Offer：U Pitt(ISP), UMBC, U Alberta(ms)
AD: CMU, Colorado at Boulder, UT-Dallas
Rej: UMD, NYU, USC, Utah, U Toronto

GPA越高越好。GT尽可能考高，"过线就行"是说给考完的同学听的。

进实验室就是发邮件+踹门。本科申牛校PhD还是要有论文的。

选校很偷懒：导师优先级，从实验室老师那里找大牛教授名单，剔除MIT/Stanford/CMU等神校教授，剩下的作申请目标。保底选两三所就行。

跟着大家的步调走，别急躁也别恐惧。所有人都这么做，只要走下去终会走到你心动的地方。人的一生几十年，用几个月的充实忙碌去交换梦想，交易够划算。`,
	},
	{
		DisplayName:       "墨墨不上线",
		OriginalAuthor: "momolan",
		School:            "北京邮电大学",
		MajorLine:         "数字媒体艺术/HCI",
		ScoreLine:         "GPA 82+, major 85+, GRE 560+800+3.5, TOEFL 95",
		ArticleTitle:      "北邮飞跃手册 | 数媒转HCI方向申请总结",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "数字媒体艺术转HCI设计方向，从偏好排除到IUB HCI/d的择校分析经验。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于HCI方向选择和数媒转专业申请的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"HCI的不同分支该怎么选？",
			"数媒专业申HCI如何扬长避短？",
			"教授反套PhD该怎么应对？",
		},
		ExpertiseTags: []string{"出国留学", "HCI", "北邮", "飞跃手册", "数字媒体"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `数字媒体艺术专业，不太想把编程作为以后谋生的手段。上了网页制作和Internet技术的课，第一次觉得代码挺有人情味的。后来发现有个叫人机交互的东西。

HCI分类：偏重cs的、偏重informatics的、偏重psychology/social的、偏重industrial的。把偏向cs的学校都去掉了。

遭到UMBC教授的反套，建议申请PhD。但对一下子搭进去5、6年没想好。

最终择校：IUB的HCI偏向design，业界认可度非常高，就业情况也相当好。能给想学的东西比地理位置重要。

offer: IUB HCI/d ms $2300, IUPUI HCI ms scholarship
ad: UCI, Rutgers, Pittsburgh, FSU, Depaul, UMBC, UToronto
rej: UW Seattle, RPI, Cornell

关于iSchool：从library & information science发展过来。注意有些传统的iSchool偏图书馆学。

HCI是个很广泛的学科，觉得交互设计不开窍就看其他track，一定有适合自己的。`,
	},
	{
		DisplayName:       "雷霆闪电89",
		OriginalAuthor: "Thunder1989",
		School:            "北京邮电大学",
		MajorLine:         "CS/Networked and Embedded Systems",
		ArticleTitle:      "北邮飞跃手册 | CS系统方向学术申请之路",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "CS系统方向PhD申请，分享MSRA实习经历与学术方向选择的思考。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于CS系统方向PhD申请和学术规划的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"MSRA实习对申请PhD有多大帮助？",
			"做system方向和做theory方向申请差别大吗？",
			"申PhD之前要想清楚什么？",
		},
		ExpertiseTags: []string{"出国留学", "系统", "北邮", "飞跃手册", "PhD申请"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `方向是networked and embedded systems, ubiquitous computing, sensor systems，也没套过磁。

CS@EPFL：不要钱，申着玩
CS@UCLA：收的做networking，基本不做system
CS@Dartmouth：做phone sensing + machine learning
CS@UVA：这个方向资格最老的大牛给的
CS@UIUC：在waiting list上
CS rej@Stanford, CMU, UW

学术圈和娱乐圈差不多，关系都很混乱。MSRA的MASS组经历很重要。

申PhD之前要想好要不要申，选方向要谨慎，这毕竟是好几年的事。做完毕业之后也不大可能换方向了。

做理论的像DM、CV他们横扫的级别要比做system的好得多。每个人都可以做的更好，如果没有，说明你还不够努力。`,
	},
	{
		DisplayName:       "小猪xp_Art",
		OriginalAuthor: "xpig",
		School:            "北京邮电大学",
		MajorLine:         "工业设计",
		ScoreLine:         "GPA 3.1, TOEFL 95, 无GRE",
		ArticleTitle:      "北邮飞跃手册 | 工业设计2012Fall申请总结",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "工业设计申请全攻略，作品集准备与DIY申请的实战经验分享。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于工业设计留学申请和作品集准备的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"工业设计申请最重要的是什么？",
			"作品集应该怎么准备？",
			"没有GRE能申请到好学校吗？",
		},
		ExpertiseTags: []string{"出国留学", "工业设计", "北邮", "飞跃手册", "作品集"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `工业设计专业，托福95，没有G的成绩，GPA 3.1，背景非常一般。

申请结果：
ASU Industrial Design Accept
隆德大学 Industrial Design Accept
哥德堡大学 Children Culture Design Accept
UIUC/Purdue/Notre Dame/RIT/UIC/新加坡国立/香港理工 Reject

申请材料重要程度：作品集＞英语成绩＞PS＞GPA＞推荐信。

作品集一定是最重要的。想申大牛校最好平时多参加红点、IF竞赛。多到学校网站上看学生作品集，每个学校注重的方向不同。

有G还是挺重要的，申请范围宽不少。至少不要让英语成绩成为短板。

PS写出自己的特色。美国研究生教育很重视研究，如果有大概感兴趣的方向写在PS里对以后学习有帮助。

中介不靠谱，DIY一下，并不复杂，只要细心就好。`,
	},
	{
		DisplayName:       "教训记牢了",
		OriginalAuthor: "canbyjiaoxun",
		School:            "北京邮电大学",
		MajorLine:         "电信工程及管理/CSE PhD",
		ScoreLine:         "GPA 88.63, major 91.8+, GRE 150+169+4, TOEFL 111(S27)",
		ArticleTitle:      "北邮飞跃手册 | CSE PhD申请总结与选校经验",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "电信工程申请UCSD CSE PhD全奖，分享本科直博的条件与选校方法。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于CSE PhD申请和本科直博的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"本科生直接申请CS PhD有多难？",
			"UCSD的CSE PhD是什么水平？",
			"如何在PhD和MS之间做选择？",
		},
		ExpertiseTags: []string{"出国留学", "CSE", "北邮", "飞跃手册", "PhD申请"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `国际学院电信工程及管理，GPA 88.63
Paper: co-author TRANS ISVLSI SERE
国创项目+数模竞赛+中兴实习

最终：UCSD CSE PhD Fellowship 2700/month
还有UT Austin ECE PhD AD、CMU INI MS、Rochester/BU/William&Mary/U Arizona等PhD offer
CUHK CSE+IE两个系都给了全奖

出国动机：想好好搞学术，CA领域顶会ISCA从70年代到现在中国大陆一共发了6篇。

PhD vs MS：MS基本无奖学金，两年后奔工业界。PhD潜心学术5年毕业。对本科生来说直接申PhD有相当难度，需要良好硬件条件+研究经历。

MS如何选校：费用、地理位置（加州最佳）、program设置。
PhD如何选校：老师>专业>学校名誉>地理位置。排名30-60的学校水平几乎在一个档次。

找靠谱的实验室：最好去清华、中科院或MSRA。北邮大部分实验室做的是工程项目，要想做真正的研究需要利用帝都的资源。`,
	},
	{
		DisplayName:       "光子麦克斯",
		OriginalAuthor: "xmaximum",
		School:            "北京邮电大学",
		MajorLine:         "电子院光信息科学与技术/Optics",
		ScoreLine:         "GPA 79, TOEFL 91, GRE 148+164+3.0",
		ArticleTitle:      "北邮飞跃手册 | 光学专业申请总结",
		LongBioPrefix:     buptFeyueLongBioPrefix,
		ShortBio:          "光学与光电子方向选校指南，美国三大光学中心与日本留学路径对比。",
		Audience:          buptAudience,
		WelcomeMessage:    "你好，欢迎问我关于光学方向留学申请和选校的问题。",
		Education:         buptEducation,
		MajorLabel:        buptMajorLabel,
		KnowledgeCategory: buptKnowledgeCat,
		KnowledgeTags:     buptKnowledgeTags,
		SampleQuestions: []string{
			"光学/光电子方向如何选校？",
			"美国三大光学中心是哪些？",
			"日本光学研究有什么特点？",
		},
		ExpertiseTags: []string{"出国留学", "光学", "北邮", "飞跃手册", "Optics"},
		Source: `北邮飞跃手册`,
		KnowledgeBody: `电子院光信息科学与技术，GPA 79
申请方向：Optics/Optoelectronics/Photonics
实验室经历：北邮光研院一年半，电子院半年，一篇会议一作

AD：UCF (CREOL-optics), Lehigh (Physics-Photonics)
预科：University of Tokyo (Photonics Devices)
REJ：UC Davis, UC Irvine, USC, U Arizona, McGill, Duke, RPI

美国三大光学中心：Rochester U (Institute of Optics), University of Arizona (School of Optical Science), University of Central Florida (College of Optics and Photonics)。Rochester最为悠久、偏理论、录取难度最大。

大牛学校：MIT, Stanford, Princeton, Caltech, UCLA, UC Berkeley, U Colorado at Boulder光学和光子学都特别强。

选校方法：在Web of Science检索权威杂志如optics letters，按学校筛选近年发表数量，快速定位到具体教授。

日本光纤通信、光集成、光器件有很强优势。日本的"研究生"只是预科，正式录取叫"修士"。

梦想不会逃跑，逃跑的一直是自己。`,
	},
}
