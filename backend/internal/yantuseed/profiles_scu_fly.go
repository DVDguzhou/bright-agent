package yantuseed

const scuFlyLongBioPrefix = `本文来自四川大学飞跃手册，著作权属原作者；以下为升学就业经验分享。`

const (
	scuFlyAudience       = `四川大学在读或应届学生，考虑保研、考研、留学或就业。`
	scuFlyEducation      = `本科/硕士（在读或已录取）`
	scuFlyMajorLabel     = `保研/留学/考研方向`
	scuFlyKnowledgeCat   = `四川大学飞跃经验`
)

var scuFlyKnowledgeTags = []string{"保研", "留学", "四川大学", "飞跃手册", "考研", "就业"}

var scuFlyProfiles = []Profile{
	{
		DisplayName:       `阳光的可可`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | 经验分享指南`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：经验分享指南。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# 经验分享指南

1. 打开[GitHub](https://github.com/)，登入或注册` + "`" + `GitHub` + "`" + `账号
2. 进入飞跃手册[仓库页面](https://github.com/scu-flying/scu-flying.github.io/tree/main/docs)，选择对应模块，此处以国外研究生申请为例，进入` + "`" + `grad-application` + "`" + `文件夹，点击` + "`" + `Add file` + "`" + `
3. 检查目前是否有对应的学院
   + 如果没有对应的学院，比如截至引导制作的时候并没有数学学院，需要先输入学院名，若已经有则跳过这一步即可
   + 出现上图页面时再输入` + "`" + `/` + "`" + `，创建格式为` + "`" + `[国家]-入校年级-姓名(匿名则为anonymous，可选昵称)` + "`" + `的markdown文件，如[US]-19-zhangsan.md

4. 填写分享内容

在此提供如下模板

` + "`" + `` + "`" + `` + "`" + `markdown
# \\[US\\]-19-张三

## 基本背景

>23fall 半diy
>
>主修GPA: 3.5
>
>TOEFL: 120(R:30, L:30, W:30, S:30)
>
>GRE: 130+130(V:130, Q:130)
>
>国内x段科研+海外x段科研
>
>国内x段实习+海外x段实习
>
>x封xx推+x封xx推

## 申请结果

Admission:

+ 若干

Reject:

+ 若干

## 个人信息

**经验分享/申请季感受：**

+ 若干

**信息收集的网站/软件推荐**：

+ 若干

**给学弟学妹的建议/想对学弟学妹说的话**：

若干

**联系方式：**

+ 邮箱：
+ vx:
` + "`" + `` + "`" + `` + "`" + `

5. 依次选择` + "`" + `Propose new file` + "`" + `，` + "`" + `Create pull request` + "`" + `，保持` + "`" + `Allow edits from maintainers` + "`" + `选中，确认上传`,
	},
	{
		DisplayName:       `葡萄pro`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[US\\]-19-one PhD@NWU`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[US\\]-19-one PhD@NWU。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[US\\]-19-one PhD@NWU

## 基本背景

>23fall 半diy
>
>主修GPA: 3.72
>
>TOEFL: 99(R:26, L:28, W:23, S:22)
>
>GRE: 318+4(V:149, Q:169)（未交）
>
>国内两段科研+海外两段科研：
>
>+ 校内两段在一个实验室 一段groupwork
>+ 一段 independent 均为wetlab打工人 AP小导（supernova）+系主任大导（citation过万 但没借助connection） 
>+ 海外ntu一段 drylab research 前scu老板（已跳槽至ntu）+ntu院长（与申请项目低相关度 做的也不太好 没要这一段的推荐信 
>+ 海外uw一段 线下暑研 AP老板（较菜）送强推 一篇letter在投
>
>一段实习（培养方案强制实习 0含金量0实习推）
>
>暑研推+科研推+课程推：
>
>+ 2年科研的ap小导 强推
>+ 2年科研的大老板（没有直接指导 写的很general+课程推+系主任立场评价学生） 强推 
>+ uw暑研ap老板 据说写了super strong 但美国人为人浮夸 实际强度未知 
>+ 国内正高课程推 大部分项目交了123 硕士/部分phd program交的124/12
>
>软背景补充：
>
>+ 1段uip course TA
>+ 1段research also RA fellowship

## 申请结果

Admission:

+ MS in CEE@CMU 12.15-2.20(PhD降录)
+ MS in CEE@Stanford 12.6-2.21
+ MS in CEE@UW 12.15-3.8(Phd降录)

Offer:

+  PhD in CEE@NWU 12.15-1.20

Reject:

+ PhD in CEE@WUSTL 12.15-3.13
+ PhD in CEE@Brown 12.31-3.14

## 个人信息

**经验分享/申请季感受：**

暑研套瓷/本科生j1面签经验请私戳 一条血泪建议：申请季勿加toxic申请群 申请完多旅游多旅游多旅游忘掉在申请

**信息收集的网站/软件推荐**：

+ gradcafe
+ 小红书
+ 一亩三分地

**给学弟学妹的建议/想对学弟学妹说的话**：

焦虑越少心越宽的人一般申请结果都会好…少焦虑…

**联系方式：**

+ vx：kabutack_oneone
+ 小红书：kabutack_oneone`,
	},
	{
		DisplayName:       `花卷去散步`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[EU\\]-18-匿名 MS@Uppsala Universitet`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[EU\\]-18-匿名 MS@Uppsala Univer。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[EU\\]-18-匿名 MS@Uppsala Universitet

## 基本背景

>22fall 半diy
>
>主修专业：药学
>
>主修GPA: 3.56
>
>国内三段科研
>
>两封科研推+一封课程推
>
>华西生物国重创新班

## 申请结果

Admission:

+ MSc in Pharmaceutical Modelling@Uppsala University 
+ MSc in Medicinal Chemistry@Copenhagen University 
+ MSc in Bio-Pharmaceutical Sciences (Drug Discovery and Safety specilisation) @Leiden University 
+ MSc in Molecular Medicine and Innovative Treatment@University of Grolingen 

Offer:

+  

Reject:

+ MSc in Bioscience（Drug Innovation) @Utrecht University   
+ MSc in Drug Discovery and Safety（CADD) @Vrije Universiteit Amsterdam  
+ MSc in Biomedicine@Universität Zürich
+ MSc in Biomedical Science@Universität Bern 
+ MSc in Pharmaceutical Sciences@ETH Zurich
+ MSc in Chemicial Biology@Université de Genève
+ MSc in Medicinal Chemistry@Aarhus University
+ MSc in Pharmaceutical Technology: Discovery, Development and Production@Lund University 

## 个人信息

**联系方式：**

+ Email: [邮箱已隐藏]`,
	},
	{
		DisplayName:       `汤圆9`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[US&UAE\\]-19-马晓晨`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[US&UAE\\]-19-马晓晨。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[US&UAE\\]-19-马晓晨

## 基本背景

>GAP一年后申请 24Fall 机构申请 
>
>主修GPA: 3.61
>
>IELTS: 7.0 (R: 7.5, L: 8.0, W:6.0, S:6.5)
>
>GRE: 324 (V:154, Q:170) 考了3遍，真的很难！
>
>国内1段科研+海外0段科研
>川大内院长组跟青椒科研实习
>申请时：一篇ICCV2作（导师一作），一篇顶会1作，1篇目标顶会ArXiv
>
>国内0段实习+海外0段实习
>
>3封科研推（川大的小老板+川大同实验室的小老板+1个澳门大学的大老板）

## 申请结果

+ Admission:

  + MBZUAI CS PhD 全奖（2024-02-09）
  + CMU MSCV 无奖（2024-02-14）
  + ...

  > 最后决定去MBZUAI，因为老师比较未来可期且显卡给的太多了，很适合后续搞大模型等等任务。因为我个人对于run不是必须，所以这个学校在阿联酋并不会影响我的考量。
  
+ Reject:
  + UW Madison CS PhD （2024-02-24）
  + ...

## 个人信息

**经验分享/申请季感受：**

+ 大学前两年准备的保研，后来大三下放弃保研准备出国，中间走了一些弯路，但是回看来说**感想敢干，相信自己的判断和决策**，并朝着自己热爱的方向努力是最终取得好结果的关键。
+ 运气较好，遇到了非常kind的年轻老师指导开展科研，青椒因为有论文压力，且组内缺少年长的硕博，会比较愿意给本科生有效指导，并且只要你能力能超过其他的现有的硕士，就能在组内能拿到最多的资源，这个在成熟的博导组里面是很困难的，很少有老师会倾斜大量时间和资源给本科生，这对于我的成长与BG的积累带来了极大的帮助。所以后续也选择了年轻的新AP作为下一步PhD科研的起点。
+ 因为之前准备保研，且论文的进度没法在23Fall拿出来，所以后来选择通过Gap的方式积等论文以后进行申请。这个过程其实是比较赌的，因为如果论文没有出来完全是负收益，但是有论文才能方便申请PhD，最后论文发出来了确实是运气比较好，也让后续的申请有拿得出手的东西。如果想走这条路，一定要对自己的科研成果有一定清晰地认知，并做足准备。而且现在论文的录用是有一定的运气和随机成分的，同一片论文在不同的审稿人眼里可能就是狗屎和蛋糕的区别，也需要有相应的心理准备。
+ 中间本来和老师谈好了Gap期间可以去腾讯AI Lab实习，**但是发现没有应届生身份后是没法实习的**，这一点在国内很恶心，一定要注意，实习尽量在大三下那个暑假搞到，不然没有“在校生”身份，除非你及其优秀不可或缺企业怕五险一金等等法律纠纷问题不敢要你。

**信息收集的网站/软件推荐**：

+ Zhihu和Bilibili啥的都可以初步帮你嚼论文，但真深入一定要去arxiv或者google找论文原文看。
+ 整理论文，做笔记用Zotero

**给学弟学妹的建议/想对学弟学妹说的话**：

+ 一定要坚信自己喜欢科研才能follow我这条路。
  + 何凯明说过，科研95%的时间都是无趣的。 但是我说：如果你能从最后那5%获得爽感，那就适合搞科研。如果不能，尽量学一门技术当程序员是最合适的。
+ 尽量通过各种校内外的实习机会尝试接触到从idea->代码实现->不断改进打磨->论文的完整科研训练后，就知道自己是不是喜欢科研了。如果在其中某一步觉得蚌埠住了，就要考虑是不是真的适合科研了。

**联系方式：**
+（有什么想问的都可以邮件告诉我update在这里）
+ 邮箱：[邮箱已隐藏]
+ Personal page: [https://me.xiaochen.world/](https://me.xiaochen.world/)
+ Github Profile: [https://github.com/SunnyHaze](https://github.com/SunnyHaze)
+ Google Scholar:[https://scholar.google.com.hk/citations?user=hGEIyCEAAAAJ](https://scholar.google.com.hk/citations?user=hGEIyCEAAAAJ)`,
	},
	{
		DisplayName:       `核桃拍照片`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[CN]-20-hfy 保研@浙江大学`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[CN]-20-hfy 保研@浙江大学。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[CN]-20-hfy 保研@浙江大学

## 基本背景

>**23保研** 
>
>**专业：网安**
>
>**主修GPA:** 3.85
>
>**必修均分排名：** 4/195
>
>**CET-6:** 545
>
>**国内2段科研：**
>
>* 院级大创（太丢人了qwq）
>* 一作论文投稿一篇（CCF-C会议，后被拒）
>
>**竞赛：**数模省三、信安赛（未获奖）

## 申请结果

Admission:

+ 浙计网安（专硕）

Reject:

+ 中科院自动化所
+ 哈深计科
+ 复旦计科
+ 东南大学网安

## 个人信息

**经验分享/申请季感受：**

+ 保外重要性排序：rank>科研＞竞赛＞其他
+ 面试时大胆介绍科研经历（即使论文没中，没实质性成果），准备好对自己科研竞赛经历的问题拷打
+ 早套磁！早套磁！早套磁！
+ 建议根据自身情况适量海投
+ 录取难度：学硕＞专硕＞直博，rank没那么高但又想冲好学校的可以考虑直博（但一定要想清楚自己适不适合读博士）
+ 提前进行专业课及数学复习，专业课（以考研408为例）重要性顺序排序如下：数据结构≥操作系统=计网＞计组。   数学重要性排序如下：离散数学＞概率统计＞线性代数＞信安数＞微积分      注意：每个学校对于专业课和数学的考核侧重点不同，比如南京大学还要考编译原理，哈深还要考数据库，上交要考网安技术和网络攻防。建议根据报名学校侧重复习。
+ 提前准备机试：建议Leetcode top100题刷起，有些学校（如复旦、清深）要考核
+ 不到最后不要放弃！本人在夏令营期间屡屡碰壁，直到预推免期间才开始陆续收获offer
+ 多信息收集！多信息收集！多信息收集！

**信息收集的渠道推荐**：

+ 计算机保研交流群（绿群）
+ CSBAOYAN github仓库
+ 知乎、小红书、github、CSDN等
+ 各院校官网

**给学弟学妹的建议/想对学弟学妹说的话**：

投稿前逛了一圈别人写的，感觉基本背景中我算比较菜的。相信比我优秀的学弟学妹很多，所以大家要有信心。对于网安保外的问题，欢迎找我咨询。

**联系方式：**

+ vx: FeiY-Huang`,
	},
	{
		DisplayName:       `灵动的薯片`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[US\\]-19-宋子昊`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[US\\]-19-宋子昊。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[US\\]-19-宋子昊

## 基本背景

> 23fall 半diy
>
> 吴玉章荣誉学院
>
> 主修专业：生物科学
>
> 主修GPA: 3.96
>
> GPA排名：1
>
> TOEFL: 99(R:29, L:25, W:24, S:21)
>
> 国内六段科研
>
> 国内一段实习
>
> 三封科研推
>
> Pub介绍：
>
> 一篇9分顶刊一作
>

## 申请结果

Offer:

+  BME PHD@JHU
+  BME PHD@DUKE
+  BioE PHD@UW
+  EECE PHD@WUSTL
+  ChBE PHD@UIUC  
+  EDBB PHD@EPFL 
+  BIOSCIENCE PHD@HKU(HKPFS)
+  BIO PHD@THU 
+  CQB PHD@PKU 

Reject:

+ SSQB PHD@Harvard
+ CB PHD@Harvard
+ BioE PHD@Caltech 
+ CBE PHD@Princeton 
+ Biology PHD@MIT  
+ Bioscience PHD@UCSD  
+ Biophysics PHD@UCSF 
+ BioE PHD@UCB
+ BioE PHD@UCSF



## 个人信息

**经验分享/申请季感受：**

md别申phd，太痛苦了，先读个ms吧

**信息收集的网站/软件推荐**：

+ 选校帝

**给学弟学妹的建议/想对学弟学妹说的话**：

别申phd别申phd能去清北就去清北，能找个伴一块申不管同性异性都好。

**联系方式：**

+ [联系方式已隐藏]`,
	},
	{
		DisplayName:       `自在的蓝莓`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[US\\]-19-凌阅微 PhD@Stanford`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[US\\]-19-凌阅微 PhD@Stanford。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[US\\]-19-凌阅微 PhD@Stanford

## 基本背景

>23fall 全diy
>
>主修专业：工业工程
>
>主修GPA: 93.33/100 (3.91/4.0)
>
>TOEFL: 111(R:30, L:30, W:26, S:25)
>
>GRE:337+4.0(V:167, Q:170)
>
>国内科研经历：大大小小有好几段，就不展开细讲了，主要是医学相关的一些课题。 海外一段科研：加拿大Mitacs科研实习项目 (Polytechnique Montréal; 2022.07.29-2022.10.29)。
>
>两封科研推+一封课程推
>
>推荐信介绍：
>
>+ 课程推：Dean, Professor (not Chinese) - 强推: Know me well. 
>
>+ 科研推1：Professor (not Chinese) - 强推: 修读课程+课程助教+几段科研经历的合作。 
>+ 科研推2：Associate Professor (Chinese) - 强推: 修读课程+课程助教+1段科研经历的合作。
>
>有几篇在投SCI一作/共同一作；发表过SCI二作和EI会议论文
>
>软背景补充：
>
>+ 国际减灾与应急管理创新班
>+ 几段课程助教经历
>+ 1次国际会议的poster presentation，日本京都大学主办。
>+ 参加ASEAN-China Young Leaders’ Summit，北京大学主办。
>+  Research Postgraduate Summer School (The Hong Kong Polytechnic University)
>+ 暑课：Advancing Global Health in a Changing World (清华大学)
>+ Summer session: Introduction to Computation and Optimization for Statistics (University of California, Los Angeles)
>+ 还有一些PA/班长等杂七杂八的经历。

## 申请结果

Offer:

+ PhD in Operations Research@Polyu 2022.08.26 Submitted --> 2022.10.02 Accepted(no interview)
+ Phd in Management Science and Engineering@Stanford 2022.11.29 Submitted --> 2023.02.21 Accepted.(no interview)

Reject:

+ Phd in Health Policy and Management(Health Services Research and Policy)@JHU 2022.11.30 Submitted --> 2023.02.03 Rejected(no interview) 
+ Phd in Global Health@UWashington (Seattle) 2022.11.30 Submitted --> 2023.02.14 Rejected(no interview) 
+ PhD in Operations Research@MIT 2022.12.05 Submitted --> 2023.02.14 Rejected(no interview)

## 个人信息

**联系方式：**

+ [联系方式已隐藏] 
+ Wechat ID: Coral-CN 
+ Email: [邮箱已隐藏]

请备注姓名，谢谢。`,
	},
	{
		DisplayName:       `俏皮的蓝莓lab`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[HK\\]-19-陈关泽 MS@HKUST`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[HK\\]-19-陈关泽 MS@HKUST。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[HK\\]-19-陈关泽 MS@HKUST

## 基本背景

>23fall 半diy
>
>主修专业：信息资源管理
>
>主修GPA：3.88
>
>GPA排名：3/75
>
>IELTS: 7.0(R:8.0, L:7.5, W:6.5, S: 6.0)
>
>GRE:326+4.0(V:158, Q:168)
>
>国内两段科研+海外一段科研：
>
>+ 一个国家级大创，化学学院院长课题组，研究有机发光材料(OLED) 
>+ 挑战杯，与华西公卫、计算机合作，研究幼儿体质 
>+ Mitacs 加拿大暑研，CSC资助 在加拿大待100天左右。直接进入那边导师课题组，做医疗数据挖掘方向
>
>国内两段实习：
>
>+ SEWC 西门子成都 进行生产数据的预处理、分析和开发 
>+ 华为鲲鹏 进行高性能计算开发
>
>一封暑研推+一封科研推+一封课程推

## 申请结果

Admission:

+ CUHK-Ms Computer Science-AD tl: 2022.11 submit--2023.01 提醒补交成绩单-2023.1录取 
+ PolyU-Mphil AI-AD tl:2022.11 submit -- 2022.12 面试-- 2022.01 录取

Reject:

+ 



## 个人信息

**经验分享/申请季感受：**

+ 经验分享：出国语言得早点准备，对于雅思托福 GRE，一次很难考到满意的分数。另外，对于跨专业申请，一方面要注重自己必修的GPA, 另一方面也需要选修相关的课程，并积极找学校内外老师沟通联系，做项目，硬背景和软背景要一起抓。对于重要但校内选不到的课程，可以在couresa补充并写进简历。另外关注校内教务处发布的一些暑研信息，特别是Mitacs!!!每年会在大三下学期开学放在教务系统，这个可以看作国外申请的一次模拟，交的材料和出国申请相差不大。每年全中国会录取200个左右，大家都可以去申请，就当买彩票! 
+ 申请季感受：由于自己申请的方向都是CS, DS和AI等热门且卷的方向，而且自己也是跨专业。因此offer下的很慢。对于nus等的dsml hku的ds等热门专业，交的早但一直被学校养鱼，前期就很难受。对于某些保底校，有些是默拒绝，有些是oq, 也是让我很难受 
+ 吐槽：小吐槽一下本专业，必修课程有系统开发、数据结构与算法等偏cs的课，可惜开在一个文科学院下，申请时容易给招生官误解。在港大cs和ds面试时候，就问了我学院的问题，以为我是一个文科生，哎..

**信息收集的网站/软件推荐**：

+ 一亩三分地
+ 小红书

**给学弟学妹的建议/想对学弟学妹说的话**：

强烈安利Mitacs！！ 跨专业申请的同学 一定要早做准备

**联系方式：**

+ 邮箱: [邮箱已隐藏]`,
	},
	{
		DisplayName:       `勤劳的花生鸭`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[HK\\]-19-刘之敏 MS@HKUST`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[HK\\]-19-刘之敏 MS@HKUST。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[HK\\]-19-刘之敏 MS@HKUST

## 基本背景

>23fall 半diy
>
>主修专业：档案学
>
>辅修专业：英语
>
>主修GPA：3.6
>
>辅修GPA：3.7
>
>GPA排名：12
>
>IELTS: 7.5(R:7.5, L:8.0, W:6.0, S: 6.5)
>
>国内三段科研：
>
>1. 打通农安社区服务最后一公里——以大面街道五星社区为例（2020年11月-2021年3月） 角色：组长 为了加快城市化进程，农村村民的土地以及城郊的土地被大量的征收以便满足城市化对于建设用地的扩张需求，被征收土地的农户们由政府统一安置到农民安置区（以下简称农安区）居住。近年来，农安区的建设暴露了许多问题，例如没有考虑农安区农民作为特殊群体的利益和诉求、社区服务不精准、社区公共空间的不合理利用与划分、高位看低位等问题。小组围绕这一问题以大面街道五星社区为案例开展问卷调研、访谈、实地调研等活动。发现潜在问题并提出对策。 对农安社区的研究让我对社会工作、基层党群服务中心都有了更深地认知，相较于“共享单车”，这一段科研经历小组采用了更严谨的调查方式，并且运用SPSS软件检测了问卷的效度。分析上采用了新公共服务理论、公众满意度理论、PESTEL等，收获颇多。 调研过程中也遇到了一些难题，例如对于公共管理专业理论的认知不够深入，研究方式运用不够娴熟。我非常期望在研究生阶段能进一步丰富自己的知识，结合实践分析社会问题。 非物质文化遗产政策文本分析（2021年8月-2022年8月） 
>2. 非物质文化遗产政策文本分析是在学术社团赵跃老师带领下开展的对非物质文化遗产2004年-2022年8月，115条政策文本的量化分析。在这个项目中，我初次接触了罗斯维尔的政策工具，并与学姐老师讨论，从供给型、需求型、环境型三个角度设计了符合非物质文化遗产政策的政策工具。按照政策文本段落为最小单位，逐条分析并统计结果，得出结论。 
>3. 2022年中国市级政府财政透明度研究（2022年7-9月） 角色：课题组成员 负责内容：收集中国市级政府网站财政公开情况，研究相关对策。主要从一般公共性预算、政府性基金、国有资本经营、社保基金、政府债务、三公经费等方面开展调研。过程中对于信息搜集能力有较大的考验，尤其是对于产业投资基金与项目绩效公开状况的考核，大部分市级政府官网上都没有建设专门的板块，这需要我浏览多个网站综合考核，搜集相关新闻资讯、事业单位网站公开情况、以及询问工作人员等…遇到难以考核的情况，我积极询问研究生学长以及老师，了解科学判定方式，以求得出更加客观公允的结论。经过两个月的暑期课题组调研，我不仅对于中国市级政府的财政系统有了更加全面地认知，意识到不同城市之间财政公开透明度存在的差异性，也明白信息检索能力的重要性并结合实践提高了信息检索的能力
>
>国内两段实习
>
>1. 大面街道五星社区工作者（2022年7月-8月）
>
>2. 成都交子供应链有限公司档案整理部门实习生（2021年12月-2022年1月）
>
>两封科研推（乔健老师，赵跃老师）

## 申请结果

Admission:

+ 公共政策@HKUST（10.31-12.20面试-1.12offer） 
+ 社会政策@CUHK（10.14—1.21） 
+ 社会政策@Polyu（10.23-1.18）
+ 公共政策@Cityu（11.21-2.4）

Reject:

+ 



## 个人信息

**经验分享/申请季感受：**

+ 首先要对自己有信心，社科类申请没有那么难。不需要在前期过度精神内耗。 
+ 其次，充分的准备必不可少，尤其是专业的笔试与面试。在递交了申请之后就应该去了解笔试和面试的情况，早作打算，提前备考。 
+ 还有比较重要的就是不要过度依赖中介，也不要一个人死磕。不过度依赖中介指：申请者本人应该对截止时间，笔面试情况，需要的材料…有充分的了解。不要被动的等待中介提醒。很吃亏，8.27考出了雅思，九月份没有及时写个人陈述，导致十月一整个很慌乱。不一个人死磕指我们要寻求身边人的帮助，家人、老师、中介，在自己迷茫不确定的时候及时咨询，让大家一起想办法，问题也可以更好解决。

**信息收集的网站/软件推荐**：

+ 小红书
+ 知乎

**给学弟学妹的建议/想对学弟学妹说的话**：

如果决定去留学，就不要中途去考研。时间比较冲突，也会比较累。早早申请，早早offer

**联系方式：**

+ [联系方式已隐藏]
+ wx: min[电话已隐藏]`,
	},
	{
		DisplayName:       `清新的核桃`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[UK\\]-19-匿名`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[UK\\]-19-匿名。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[UK\\]-19-匿名 

## 基本背景

>23fall 全diy
>
>主修专业：行政管理
>
>辅修专业：新闻学
>
>主修GPA：87
>
>辅修GPA：91
>
>GPA排名：30%
>
>IELTS: 7.0(R:8.0, L:8.0, W:6.5, S: 6.0)
>
>国内三段实习（1段市电视台，1段社交媒体公司，2段学校内新闻媒体）
>
>两封相关课程老师课程推

## 申请结果

Admission:

+ 政治新闻@Sheffield

Reject:

+ Media Industry@Leeds

## 个人信息

**经验分享/申请季感受：**

+ 避雷：成都少城留学中介，文书申请老师不负责任 （英港）
+ 建议学弟学妹对要申请的专业及时了解，提前准备好实习经历，科研经历，（雅思可以不着急考出结果，后面加也来得及）在大三升大四的暑假把文书等材料准备好，申请季一开始就可以投，这时候正是985背景收到offer最容易的时间段。 
+ 另外可以半diy 不要把申请全丢给文书老师，尤其是中介老师，如果是专门写文书的老师可能还好，中介机构不一定会把你的事放在第一的位置上，但是你要自己把握，很多时候文书你自己的想法就非常好，写完了还担心语言不好的话可以上fiverr找人润色

**信息收集的网站/软件推荐**：

+ fiverr（找文书润色） 
+ 一亩三分地（信息搜集—工科偏多） 
+ 小红书博主：花岚 
+ 公众号：英国留学申请

**给学弟学妹的建议/想对学弟学妹说的话**：

跨专业申请难度不小，一定要提前准备，有相关的经历做铺垫，才能以最好的姿态展现给申请官

**联系方式：**

+ [联系方式已隐藏]`,
	},
	{
		DisplayName:       `马卡龙银杏`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[UK\\]-19-马尧 MS@UCL`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[UK\\]-19-马尧 MS@UCL。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[UK\\]-19-马尧 MS@UCL

## 基本背景

>23fall 半diy
>
>主修专业：信息资源管理
>
>主修GPA：87
>
>IELTS: 7.5(R:8.5, L:8.5, W:6.5, S: 6.0)
>
>GRE:324+3.5(V:154, Q:170)
>
>国内五段科研+海外两段科研：
>
>+ 中科院研究助理（神经网络方向）
>+ 剑桥大学学术交流（医学人工智能） 
>+ 信息系统EI顶会两篇（信息行为） 
>+ EI年度最佳论文一篇（健康信息） 
>+ IEEE会议论文一篇（健康信息系统） 
>+ SSCI一区一作在修一篇（神经网络） 
>+ SCI一区一作在审（医学影像）
>
>国内四段实习+海外一段实习：
>
>+ 药企（数据分析） 
>+ 政府部门（数据库运维） 
>+ 中国电信（软件研发） 
>+ 中科院（科研助理） 
>+ 西门子（QA）
>
>三封科研推
>
>软背景补充：
>
>+ 帝国理工医学数据科学暑校distinction 
>+ 斯坦福医学院远程课程证明 
>+ 美赛H奖 
>+ 计算机比赛Python科目三等奖 
>+ 计算机比赛JAVA科目三等奖
>+ 数据分析比赛一等奖 
>+ 校级比赛若干

## 申请结果

Admission:

+ 信息系统管理与数字化创新@Warwick
+ 应用统计建模与健康信息学@KCL
+ 健康信息学@UCL
+ 信息系统管理与数字化创新@LSE

Reject:

+ 健康数据科学@IC

## 个人信息

**经验分享/申请季感受：**

+ 本科量化课程占比低，可以通过选修、比赛、科研证明相关能力

**信息收集的网站/软件推荐**：

+ coursera
+ 牛客

**给学弟学妹的建议/想对学弟学妹说的话**：

尽早明确专业目标，围绕目标去提升对应专业背景，不要做无效内卷

**联系方式：**

+ [联系方式已隐藏]`,
	},
	{
		DisplayName:       `俏皮的薯片`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[US\\]-19-畅想 MS@UCSD`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[US\\]-19-畅想 MS@UCSD。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[US\\]-19-畅想 MS@UCSD

## 基本背景

>23fall 全托
>
>主修专业：信息资源管理
>
>主修GPA: 3.7+
>
>IELTS: 7.5(R:8.5, L:8.5, W:6.5, S:6.5)
>
>国内两段科研+海外一段科研：
>
>+ 一篇CHI二作（HCI顶会）
>+ 两篇iceb（均非一作）
>
>国内两段实习：
>
>+ 成都BBD
>+ OPPO研究院
>
>Pub介绍：
>
>+ accessibility
>+ behavior
>
>两封暑研推+一封科研推(dku+cityu+scu)
>
>少数族裔

## 申请结果

Admission:

+ MSIS@UMD
+ MSCSS@UCSD

Reject:

+ HCIM@UMD
+ MSHCI@GaTech



## 个人信息

**经验分享/申请季感受：**

+ 对人机交互感兴趣的联系我

**信息收集的网站/软件推荐**：

+ ACM
+ AIS
+ 各个特别兴趣小组

**给学弟学妹的建议/想对学弟学妹说的话**：

+ 感兴趣的加微信私聊吧

**联系方式：**

+ 手机： +86 136 8123 0974`,
	},
	{
		DisplayName:       `荔枝练瑜伽`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[US\\]-19-Eclipse MS@UMich`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[US\\]-19-Eclipse MS@UMich。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[US\\]-19-Eclipse MS@UMich

## 基本背景

>23fall 全diy
>
>主修专业：信息资源管理
>
>主修GPA: 3.87
>
>TOEFL: 105(R:29, L:29, W:26, S:21)
>
>GRE:324+3.5(V:154, Q:170)
>
>国内三段科研
>
>国内一段实习（大厂数分）
>
>一封科研推+两封任课老师课程推

## 申请结果

Admission:

+ DS75@UCSD(12.15-3.6 UTC 22:45) 无奖
+ MSWE@UCI(12.15-3.7 UTC 18:27) 无奖
+ MSCS@UFL(1.15-3.8 UTC 14:43) 小奖

+ MSIM@UIUC(1.15-3.17 UTC 14:56) 无奖
+ MSDS@UMich(1.15-3.21 UTC 19:10) 无奖
+ MSCS@TAMU(1.15-3.23 UTC 20:32) 无奖
+ MSCSS@UCSD(12.15-4.12 UTC 16:57) 无奖

Reject:

+ MDS@UCI(12.15-3.6 UTC 21:00)
+ MCS@Rice(1.15-3.9 UTC 23:24)
+ MSIS@UT-Austin(12.15-3.17 UTC 15:45)
+ MSECE@Duke(1.15-3.20 UTC 15:48)
+ MCS@UIUC(1.15-3.21 UTC 13:45)
+ MSI@UMich(1.15-3.21 UTC 18:42)
+ MDS@Rice(1.15-3.31 UTC 17:18)
+ MSCS@UNC(12.14-4.10 UTC 18:16)
+ MSDS@Columbia(12.15-4.11 UTC 23:54)
+ MSCS@Emory(12.15-4.19 UTC 11:30)
+ MCS@UCI(12.15-4.20 UTC 18:55)

## 个人信息

**经验分享/申请季感受：**

+ 关于材料
  + WES参考[认证流程](https://www.bilibili.com/video/BV1n64y187SF)
  + CV建议直接上[Overleaf模板](https://www.overleaf.com/latex/templates/tagged/cv)
  + PS初稿写作思路可以看[Adam指南](https://www.youtube.com/watch?v=_KLp91NeB8M&t=360s)
  + 推荐信早做准备，不要赶ddl提交，记得waive

  + ChatGPT润色好于fiverr一般写手，也可以用于缩写，但reorganize能力较差
  


+ 关于焦虑
  
  + 前三年的心态，可以看看[应对内卷焦虑](https://scu-cs-runner.github.io/SurviveSCUManual/1-save-self/11-cope-with-anxiety.html)
  + 飞跃手册的初衷之一是帮学弟学妹合理定位，节省时间，而非传播焦虑，或者物化他人。找到自己的置信区间是极为重要的，这一定程度上决定了后续自尊心是否会崩塌。坐井观天实在可悲，望洋兴叹又何尝不是
  + 最好可以找到属于自己的情绪输出方式，不要积压，比如说卷，读书，玩游戏，环游世界。如果无所事事不会给你带来痛苦，那么摆烂也无所谓，身心健康最重要。留得青山在，不怕没柴烧
  + 不要陷入各种鄙视链的怪圈当中，比如海本陆本，湾区锁男，转码等等，很多时候你落入他人框定的范围也都是无奈之举，我们无法未卜先知找到全局最优解，那么就向着局部最优解的道路前进也无妨。活出自己，又有什么不好：请看[如果宇宙的尽头是转码，请让我死在十字街头](https://www.1point3acres.com/bbs/thread-937639-1-1.html)
  + 没有超强的心理承受能力不建议每天逛知乎和小红书，人均四大/HYPSMC是很容易让人感到落差。不能退而结网，也最好别整天临渊羡鱼，跟几个能力相仿的朋友拉个群吹吹水挺好的，不属于自己的圈子暂时不需要挤破头钻进去
  
+ 关于结果
  + 需要好好斟酌一下是去bar最高/title最好的program还是最适合你的，选择不同，出路往往也大相径庭
  + 在它已经是定数时，其实还有很多可做的，比如找工就刷题投简历，小众方向转博甚至接了offer直接联系老师就行
  + 降低期待，学会接受，不服的话，再来一年



**信息收集的网站/软件推荐**：

+ 一亩三分地
  + [23Fall分享一些接受Interfolio进行推荐信提交的院校列表](https://www.1point3acres.com/bbs/thread-945200-1-1.html)
  + [23 fall CS 各学校 GRE 要求情况汇总](https://www.1point3acres.com/bbs/thread-906889-1-1.html)
  + [作为志愿者审MS申请材料那些事](https://www.1point3acres.com/bbs/thread-581428-1-1.html)
  + [自己写推荐信的资料整理](https://www.1point3acres.com/bbs/thread-947843-1-1.html)
  + [浅谈CS MS选校的渔与鱼：以找工向为例](https://www.1point3acres.com/bbs/thread-971898-1-1.html)
+ csmsapp
+ Google
+ newbing
+ 各校飞跃手册

**给学弟学妹的建议/想对学弟学妹说的话**：

祝愿我们在抵达路的末端时，都不会后悔

**联系方式：**

+ 邮箱：[邮箱已隐藏]
+ vx: Sherry___42`,
	},
	{
		DisplayName:       `热情的拿铁`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[US\\]-19-Eclipse PhD@UIUC`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[US\\]-19-Eclipse PhD@UIUC。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[US\\]-19-Eclipse PhD@UIUC

## 基本背景

>25fall 全diy
>
>本科背景见[链接](https://scu-flying.com/#/grad-application/public-administration/[US]-19-eclipse)
>
>硕士GPA: 3.894
>
>一篇WSDM共一，一篇AAAI非一作，一篇Q1水刊一作，一篇水会共一，一篇在投一作
>
>推荐信：
>
>UMich Stats Professor, Citations 1.5w+, h-index 60+, IMS Fellow, research强推 (best in 12 years)
>
>UT-Austin Information Professor, Citations 1.5w+, h-index 60+, research推
>
>MSU CSE Professor, Citations 4w+, h-index 90+, research推
>
>IBM Center for Computational Health, Senior Research Scientist, Citations 4k+, h-index 20+, research推
>
>UMich Information Associate Professor, Citations 2w+, h-index 50+, coursework推

## 申请结果

Admission:

+ Biomedical & Health Informatics@UW(12.1-1.23) 

+ Health Informatics@UNC(12.1-2.5) 

Offer:

+ Information Sciences@UIUC(12.1-2.25)

Reject:

+ Bioinformatics@UMich(12.1-12.23)
+ Biostatistics@UMich(12.1-1.8)
+ Computational Biology@CMU(12.1-2.12)
+ Computational Precision Health@Berkeley(12.1-2.12)
+ Statistics@UMich(12.1-2.18)
+ Computer Science & Informatics@Emory(12.1-2.24)
+ Computer Science@Cornell(12.1-2.25)
+ Biomedical Data Science@UW-Madison@UW-Madison(12.1-2.26)
+ Information Studies@UT(12.1-3.3)
+ Computer Science@Dartmouth(12.1-3.28)

## 个人信息

**经验分享/申请季感受：**

不应妄自尊大，也不必妄自菲薄

**信息收集的网站/软件推荐**：

Reddit

**给学弟学妹的建议/想对学弟学妹说的话**：

祝愿我们在抵达路的末端时，都不会后悔

**联系方式：**

+ 邮箱：[邮箱已隐藏]
+ vx: Sherry___42`,
	},
	{
		DisplayName:       `灵动的饼干鸭`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[US\\]-19-MJ MS@Stanford`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[US\\]-19-MJ MS@Stanford。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[US\\]-19-MJ MS@Stanford

## 基本背景

>19级 软件工程 23Fall MS申请者
>
>**三维**：GPA92.3(top2%)  T103(S23)  G325(AW 3.0)
>
>**科研**：两段校内科研（1篇CCF-B二作，2篇SCI低区一三作，ML相关）
>
>**竞赛**：Kaggle金牌，美国数学建模大赛F奖（MLDS相关）
>
>**推荐信**：3封都是川大本校AP

## 申请结果

4月结果全出了回来更新

## **给学弟学妹的建议/想对学弟学妹说的话**

+ 绩点：GPA是最重要的，MS项目大部分没那么看重你的本科出身。比如川大今年录了3个斯坦福EE：SE、CS、EE系各录了一个
+ 语言：对于EECS专业，语言过线即可（T100 G320）。除了极个别项目喜欢高GT选手，比如耶鲁MSCS卡G328
+ 实习：推荐关注谷歌微软实习机会，微信公众号分别是“微软学术合作”、“谷歌招聘包打听”
+ 科研：申请院校比较看重论文成果和实验室title
+ 暑研：如果是线上+无研究成果+无推荐信，申请时似乎用处不大

**最重要的是别焦虑，有自己的规划和时间线， _Don't feel pushed by peer pressure_**

比如，我的时间线：
+ 大一在原专业学化学和生物
+ 大二平级转专业进来那个秋季学期，因为课太多，除了写了一份大创申报书什么也没做
+ 大二下学期课程大大减少，开始做项目，有了成果产出
+ 大三上参加了一些DS比赛
+ 大三暑假临时决定出国

> 恰逢疫情严重，暑假约的考试被多次取消，导致10月还无G无T（然而11月末很多申请都快截止了）🥲
> 9.28 朋友圈晒保研offer满天飞，但再看看自己，连个语言成绩都还没考出来，更别提无海外经历、无暑研、无大厂实习、无大牛推（菜菜，别骂）😂
> 10月份，别人在聚餐旅游庆祝保研的时候，我一周考一次语言，导致考场老师都快认识我了（“哟，小姑娘，又来给ETS送钱了是吧”）😭
> 终于，在11月考出了GT（松了一口气），彩票也刮了。人生仅一次的机会，管他中不中呢，试试吧😂（最后中了）`,
	},
	{
		DisplayName:       `青蛙ii`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[US\\]-21-YZ MS@Georgia Tech`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[US\\]-21-YZ MS@Georgia Tech。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[US\\]-21-YZ MS@Georgia Tech

## 基本背景

>25Fall 全托
>
>主修专业：软件工程
>
>主修GPA: 3.71（刷过分不清楚实际排名，感觉可能在30/200左右）
>
>TOEFL: 105(R:30, L:27, W:26, S:22)
>
>GRE:326+3.5(V:156, Q:170)
>
>国内两段实习（外企，大厂，打杂）
>
>两封课程推+一封实习推

## 申请结果

Admission:

- MSECE@Georgia Tech（大约一月卡点提交，四月出结果，非常晚）

没错，除了一个彩票其他的全拒了 没得选

Reject:

- MSCSE@Georgia Tech
- MCS@UIUC 
- MSIS@UT Austin 
- MSCS@UVA（截止日期刚过就拒了）
- MSCS@UMN Twin Cities 
- MSCS@Virginia Tech
- Big Data@Simon Fraser University （出得很晚）
- MSCS@TAMU（一直没反应，可能默拒）
- CS PhD@William & Mary
- NUS 项目名忘了，一月才提交，一直没反应

## 个人信息

**经验分享/申请季感受：**

可以看得出来我的申请是妥妥的反面教材，能有结果纯属运气好。当然运气也是实力的一部分，感觉没必要在这里凡尔赛，但是建议还是，遵循大家的建议，不要像我一样为了申省钱的项目去踩很多根本没有人碰的小众项目，甚至完全不申像CMU，Duke，SD这种特别大众学校，大家都选的还是有道理的。 花费较低的项目很多是研究导向，因此对科研的要求会很高。诸如VT的MSCS这种最好是套磁。 不清楚UMN为什么会拒我，可能录的人少？ 暂时想不到说什么经验分享，可能以后过来补充。欢迎给我发邮件或者加我微信，不过纯GPA战士不一定帮得上太多。

**信息收集的网站/软件推荐**：

+ OpenCS CSRankings CSOpenRankings 那个经典的论坛

**给学弟学妹的建议/想对学弟学妹说的话：**

不要找中介。 这个建议相信很多前辈也给过，或许在此也多说无益，该找的同学还是会找。所以如果您仍然打算找中介，记得在后悔的时候过来像我一样提醒一下后面的同学，也算是做一点无意义的贡献。 --- 还是忍不住多说两句。 事实一：中介的卖点包括协助背景提升，协助文书，选校，和帮助填申请和提交。 事实二：硕士申请的背景包括GPA，语言成绩和科研/实习背景，可以思考甚至都不是本专业出身的中介将如何帮您提升这些背景。 事实三：文书里的内容实际上可以自己想写成什么样就写成什么样，可以思考国外学校的招生人员是否也清楚这一点，以及如果大家都清楚这一点，“文书很重要”的这种说法到底是怎么传起来的。 事实四：选校需要注意的地方包括但绝不限于地理位置（气候，安全性，政策，工作机会，生活成本，生活便利性，娱乐），花费（学费，奖学金机会，助学金机会，生活成本），学校本身实力（综合排名，科研实力，教学质量，就业支持，专业排名，名气），录取难度（录取维度考量和偏好，外州歧视乃至陆本歧视，录取总人数和录取率），学校其他情况（交通，华裔比例，课业压力，coop等优势政策，行政管理），基于以上考量，可以尝试询问自己联系的中介，看看他们在除了学校“综合排名，专业排名”的其他属性部分，了解的内容是否超过10%。 事实五：我填一个申请平均花费十五分钟。 附录： https://opencs.app/ https://chatgpt.com/

**联系方式：**

- 邮箱：[邮箱已隐藏]`,
	},
	{
		DisplayName:       `鸽子椰子`,
		School:            `四川大学`,
		MajorLine:         `保研/留学/考研`,
		ArticleTitle:      `四川大学飞跃 | \\[CN\\]-18-Wan M-保研@上海交大医学院`,
		LongBioPrefix:     scuFlyLongBioPrefix,
		ShortBio:          `来自四川大学飞跃手册：\\[CN\\]-18-Wan M-保研@上海交大医学院。`,
		Audience:          scuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于四川大学升学和就业的问题。`,
		Education:         scuFlyEducation,
		MajorLabel:        scuFlyMajorLabel,
		KnowledgeCategory: scuFlyKnowledgeCat,
		KnowledgeTags:     scuFlyKnowledgeTags,
		SampleQuestions: []string{`四川大学保研怎么样？`, `川大出国容易吗？`, `川大就业前景如何？`},
		ExpertiseTags: []string{`保研`, `留学`, `四川大学`, `保研/留学/考研`},
		KnowledgeBody: `# \\[CN\\]-18-Wan M-保研@上海交大医学院 

## 基本背景

>21保研
>
>主修专业：临床医学
>
>主修GPA：3.8
>
>GPA排名：6/71
>
>IELTS: 7(R:9.0, L:8.0, W:5.5, S:5.5)
>
>国内两段科研：
>
>+ 华西医院心理卫生中心研助 国家级大创参与人 
>+ 校级大创负责人
>
>一封科研推+一封课程推（华西医院心理卫生中心教授，生命科学学院教授）
>
>SCI共一1篇
>
>软背景补充：
>
>+ 修读医学课程：医学免疫学、医学伦理学、组织学与胚胎学
>+ 医院志愿时长40小时，有抗疫志愿服务经历
>
>5+pub

## 申请结果

Admission/Offer:

+  临床医学4+4项目 MD@上海交通大学医学院

Reject:

+ 北京协和医学院
+ 临床改革试点班
+ 上海交通大学医学院
+ 精神卫生中心
+ 北京第六医院

## 个人信息

**信息收集的网站/软件推荐**：

+ 知乎上有个历年交医4+4面试经验合集
+ 微信公众号交医4plus4

**给学弟学妹的建议/想对学弟学妹说的话**：

劝人学医，天打雷劈；你想学医，我来挨劈。欢迎想不开的朋友前来咨询

**联系方式：**

+ [联系方式已隐藏]`,
	},
}
