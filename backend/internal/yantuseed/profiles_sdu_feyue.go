package yantuseed

const sduFeyueLongBioPrefix = `本文来自山东大学飞跃手册，著作权属原作者；以下为升学/留学经验，仅供参考。`

const (
	sduFeyueAudience       = `正在准备出国留学或深造的同学，尤其是985院校背景。`
	sduFeyueEducation      = `硕士/博士研究生（已录取或就读）`
	sduFeyueMajorLabel     = `申请方向`
	sduFeyueKnowledgeCat   = `留学申请经验`
)

var sduFeyueKnowledgeTags = []string{"出国留学", "保研", "经验贴", "山东大学"}

var sduFeyueProfiles = []Profile{
	{
		DisplayName:       `牛轧糖7学画画`,
		School:            `山东大学`,
		MajorLine:         `Computer Science And Technology`,
		ArticleTitle:      `山大飞跃手册 | Computer Science And Technology 深造/留学`,
		LongBioPrefix:     sduFeyueLongBioPrefix,
		ShortBio:          `山东大学Computer Science And Technology，深造/留学，分享申请与升学经验。`,
		Audience:          sduFeyueAudience,
		WelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,
		Education:         sduFeyueEducation,
		MajorLabel:        sduFeyueMajorLabel,
		KnowledgeCategory: sduFeyueKnowledgeCat,
		KnowledgeTags:     sduFeyueKnowledgeTags,
		SampleQuestions: []string{`山大申请海外PhD需要什么条件？`, `如何准备GRE和托福？`, `985背景如何定位选校？`},
		ExpertiseTags: []string{`留学申请`, `山东大学`, `Computer Science And Technology`},
		OriginalAuthor: `anonymous`,
		Source: `山东大学飞跃手册`,
		KnowledgeBody: `# 南方科技大学计算机系考研攻略

在考研之前，一定要先决定好为什么考研，目标不够强烈，很难坚持到最后。

不要跟风考研，时间和精力要花费得有意义。

### 一. 选专业

并不是所有的同学都喜欢自己本科的专业，跨考也是一种常规操作，决定考研需要目标，选择专业则需要理智。跨考看起来是一个换专业的好机会，但同时也意味着重新学习专业课，以及在考研复试时可能会很困难

### 二. 择校

#### 1. 专硕和学硕

学硕：侧重于理论学习，以发paper为目标，可以直博，学费较低（和保研差不多）。考研难度相对较大，可以调剂至专硕，学制3年

专硕：侧重于案例分析和实践操作，以就业和实习为目标，部分不允许直博，需要考博，学费略贵。考研难度要小一些，除少数专业，通常只能在专硕间调剂，学制2-3年

简而言之学硕是培养科学家，专硕是培养研究生学历的人才

不读博的话二者没有区别，有时候专硕在找工作上反而比学硕跟占优势

总体趋势：专硕增加学硕减少，要考学硕要抓紧

#### 2. 全日制、非全日制

全日制研究生：和全日制本科生一样，在学校上课学习

非全日制研究生：周末上学或者集中学习，一般不提供住宿、奖学金。大多是专硕。

上二者法律地位相同，属于双证学历教育统招研究生

在职研究生：不同于非全日制研究生，以在职人员身份，不脱产或者半脱产学习。考察难度最小，社会认可度正在上升。

#### 3. 定向、非定向

非定向：毕业后自由择业

定向：国家计划内定向培养，培养费用由中央或地方财政拨款，录取前考生工作单位、录取学校、考生本人三方签署定向培养协议。档案、人事、户口、工资关系仍留在原工作单位，考生毕业后回原单位工作。比如非全日制研究生，大部分属于定向培养方式，一般不享受奖学金和其他生活待遇。

很多非全日制只招收“定向培养”

#### 4. 分数线

自划线：有34所自画线学校，会在国家线出来之前自己画出校线，选择了这些学校的同学需要关注

\\1. 国家线：国家画一条线，不同学科不一样（本校计算机系属于工学，2022年国家线工学线为273分）。国家线有A、B区的区别，A区通常高5分。注意：A、B区是指你所报考的学校是否在该区

\\2. 单科线：公共课或专业课的国家线，也就是数学、英语、政治、专业课的最低录取线。总分和单科线都过了，才可以参加调剂

\\3. 校线：划出国家线后学校会划出校线，过了校线就可以申请校内调剂，即你所报考的专业没有录取你，你还可以在校内调剂到其他专业

\\4. 专业线：各个专业根据报考人数在校线上划出一条专业线，过了该条线才可以参加专业复试。

通常我们说的学校分数线是指去年该学校的校线，专业分数线是指去年该专业的专业线，这两条线每年会酌情变化

专业线>校线>国家线

#### 5. 择校标准

择校的标准因人而异，列举几个作为参考

l 想要投入科研：查看各个学校在科研力量上的投入；查看QS排名等

l 专业：不同学校的王牌专业不一样，根据自己想要选的专业排名选择学校也是一个很好的做法

l 想要找工作：985，211（虽然国家说不论这个，但是各个公司还是看的这个），双一流等企业常见的量化标准；如果有心仪的公司，考该公司本地附近的学校也不错，比如想去腾讯，华为，可以考本校

l 工作地点：有人想回到家乡发展，可以选择家乡附近的大学

l 难度：考研不是一个简单的任务，做过考研真题的同学会发现，十几年前的题目基本上直接套公式就可以做，但是近几年却可以玩出花来，选择一个分数线低的学校会更容易成功，可以通过报录比判断

l 专硕、学硕：部分学校部分专业只招学硕，部分只招专硕；如果是希望有研究生学历可以方便找工作，建议专硕

l 学制：不同类型的研究生，就读的时间不尽相同，有些同学想要快点工作，选2年学制的学校比较合适

l 黑名单：部分学校会有一些引人非议的操作，每年都有人中招，可以关注一下相关的信息，避免踩坑

### 三. 备考

不同学科考研科目不相同，具体如何安排复习要根据个人情况调整。南方科技大学计算机系的考研科目是数学（一），英语（一），政治（一），统考408

 

一些关键时间节点：

| 10月 | 11月 | 12月         | 1月  | 2月      | 3月  | 4月  | 5月  | 6月  | 7月  | 8月  | 9月            | 10月     | 11月                 | 12月         | 1月  | 2月      | 3月  | 4月  |
| ---- | ---- | ------------ | ---- | -------- | ---- | ---- | ---- | ---- | ---- | ---- | -------------- | -------- | -------------------- | ------------ | ---- | -------- | ---- | ---- |
|      |      |              |      |          |      | 调剂 |      |      |      |      |                | 开始报名 | 网上确认（现场确认） |              |      |          |      | 调剂 |
|      |      |              |      |          |      |      |      |      |      |      | 大纲公布       |          |                      | 打印准考证   |      |          |      |      |
|      |      | 初试（两天） |      | 公布成绩 | 复试 |      |      |      |      |      | 咨询周，预报名 | 结束报名 |                      | 初试（两天） |      | 公布成绩 | 复试 |      |

每年考研通常是12月最后一个周末

通常考研机构建议“大三开始备考考研”指的是上表中10月，考研时间在大四上学期期末之前，也就是来年12月，复试则在大四下学期，也就是再过一年的三月，录取后，在7月大学毕业，9月研究生入学

但是该时间并不是绝对的，毕业后也可以考研

 

8-10月，各个院校公布招生简章和专业目录

9月中上旬公布考试大纲，但是不可以等到这时候才开始复习，在此之前应该以去年的考试大纲学习，这时候再补充学习大纲新增知识点

9月中下旬开放网上咨询，但是除了极少数很优秀的学校，绝大多数学校的咨询不会有任何结果

9月还会公布一些其他的报考注意事项，包括是否可以跨省参加考试一类的问题，需要关注研招网公告

预报名与正式报名同样有效，但部分省份不允许往届生预报名（如果可以预报名，一定要预报名，可以及时收到信息是否出错的通知。每年都有报名信息错误导致报名失败的案例）

正式报名：注意缴费是否成功

现场确认（网上确认）：确认信息是否正确，需要：三月内电子证件照，本人身份证（网上确认还需要本人手持身份证照）等，建议提前准备

打印准考证：在研招网下载电子版准考证自行打印。电子版做好存档，复试可能会用到

 

 

建议采取行动的时间节点：

 

 

| 10月             | 11月 | 12月         | 1月  | 2月      | 3月                                    | 4月  | 5月  | 6月  | 7月                | 8月                | 9月            | 10月                         | 11月                 | 12月                         | 1月  | 2月      | 3月  | 4月  |
| ---------------- | ---- | ------------ | ---- | -------- | -------------------------------------- | ---- | ---- | ---- | ------------------ | ------------------ | -------------- | ---------------------------- | -------------------- | ---------------------------- | ---- | -------- | ---- | ---- |
| 建议开始备考时间 |      |              |      |          | 实际上和你竞争的大多数人开始备考的时间 | 调剂 |      |      | 专硕大多这时候入场 | 再不备考就来不及了 |                | 开始报名（有一大堆材料要交） | 网上确认（现场确认） |                              |      |          |      | 调剂 |
|                  |      |              |      |          |                                        |      |      |      |                    |                    | 大纲公布       |                              |                      | 打印准考证                   |      |          |      |      |
|                  |      | 初始（两天） |      | 公布成绩 | 复试                                   |      |      |      |                    |                    | 咨询周，预报名 | 结束报名                     |                      | 初试（你要参加的那一场考研） |      | 公布成绩 | 复试 |      |

 

简单小技巧：

**考研政治**：每年都有押题，有的时候押题很准确，但是不可偏听偏信。背押题卷最主要的不是指望押题，而是积累词汇库，具体考试时使用抄材料大法（见B站up主的分享，这里分享一个很好的：[材料分析题｜不背书只抄材料的方法——以肖四（一）35-1为例_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV16M4y1c7Df?spm_id_from=333.1007.top_right_bar_window_custom_collection.content.click)）。考研政治一般在八九月份开始备考

**考研英语**：主要是背单词（考研词汇5500左右），拿着一本考研词汇闪过顺着背，差不多背到一千多快两千词（甚至只要求会认就行，不一定要会写）就可以读懂考研英语上绝大多数内容了。然后刷往年真题练习题感（读懂文章不会做题在考研里实在是太正常了，还有不要刷模拟题，没有用）。除此以外，考研作文要提前准备模板，一大一小两篇作文，自己提前了解（不要相信某些机构的作文押题，每年都说押题押中了作文主题词，实则每年都给一两百个单词，用来测验模板好不好用还行）。其他题目会有很多讲得天花乱坠的视频，然而解题方法其实过拟合了，再巧妙也只适用于那一题，不推荐。考研英语因为要背单词，建议每天背。

**考研专业课**：计算机系考研专业课为408，内容为数据结构与算法，计算机组成原理，操作系统，计算机网络。其中计算机网络考察内容最简单，计算机考察内容最难。有一道手写代码题，要求用C/C++。不熟悉这两种语言的同学不用害怕，不会考察很难的语法内容，不用java是要制止投机取巧而不是为了刁难人。只做往年真题不看书都可以拿到八九十分，但是想要突破一百、一百一，需要精读课本。考研计算机根据自己的基础决定备考时间，但是一定要刷真题。

**考研数学**：上面的科目很难拉出差距，但是考研数学可以。考研数学有三个科目：高等数学，线性代数，概率论与统计。本校高数并没有应试训练所以本校同学可能会有些吃亏，需要自己找材料自学。线性代数和概率论其实很简单，前者题型基本固定了，后者需要背诵的内容大于计算。实际上备战考研大多数时间都是用在考研数学的学习中。

没有参与过考研的同学可能不太好调节自己的复习进度，可以在网上看看其他人的建议自行拟定计划。注：不要在政治上花太多时间。

### 四. 报名

提前注册好学信网账号（与研招网互通）

材料：身份证，学生证（应届生），毕业证、学位证证书编号（往届生），档案所在地信息

流程：登录[研招网](yz.chsi.com.cn/)->注册并登录->点击网上报名->填写信息（注意：毕业证和学位证号码不一样别弄反了）

往届生：其他人员

应届生：应届生（还没毕业）

在职考生：其他在职人员/其他人员

 

报名后在自己报考点附近就近预定旅馆（就是你参加考试的敌方，如果是应届生且自己的学校也是考点，就报在本校）

 

网上确认/现场确认

个人证件照：会用在准考证上。要求：本人近三个月内正面、免冠、无妆、彩色头像电子证件照（蓝色或白色背景，具体以报考点要求为准）；脸部无遮挡，头发不得遮挡脸部、眼睛、眉毛、耳朵或造成阴影，要露出五官；不得化妆，不得佩戴眼镜、隐形眼镜、美瞳拍照等

身份证正反面

手持身份证照片

 

缴费成功才算报名成功

记录一下报名号

 

十二月中旬可以在研招网打印准考证



### 五. 初试

通常为12月最后一个周末，注意中午是14：00开考，哪怕就近预定旅馆，中午恐怕也无法午休

第一天：

8：30-11：30 政治

14：00-17：00 英语

第二天：

8：30-11：30 业务课一（通常为数学）

14：00-17：00 业务课二（本校为408）

特殊科目会考第三天

### 六. 复试

二月中下旬出成绩，三月中出国家线。国家线通常不会变化太多，扩招线下调，人多线上升。各个学校复试不一样，通常要一个英文自我介绍。

### 七．附件

附件仅供参考



 

 

高数版


![第十章 空间解析几何之向量]`,
	},
	{
		DisplayName:       `蜜桃zzz看电影`,
		School:            `山东大学`,
		MajorLine:         `Computer Science And Technology`,
		ArticleTitle:      `山大飞跃手册 | Computer Science And Technology 深造/留学`,
		LongBioPrefix:     sduFeyueLongBioPrefix,
		ShortBio:          `山东大学Computer Science And Technology，深造/留学，分享申请与升学经验。`,
		Audience:          sduFeyueAudience,
		WelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,
		Education:         sduFeyueEducation,
		MajorLabel:        sduFeyueMajorLabel,
		KnowledgeCategory: sduFeyueKnowledgeCat,
		KnowledgeTags:     sduFeyueKnowledgeTags,
		SampleQuestions: []string{`山大申请海外PhD需要什么条件？`, `如何准备GRE和托福？`, `985背景如何定位选校？`},
		ExpertiseTags: []string{`留学申请`, `山东大学`, `Computer Science And Technology`},
		OriginalAuthor: `zhangzhaoxu`,
		Source: `山东大学飞跃手册`,
		KnowledgeBody: ``,
	},
	{
		DisplayName:       `巧克力吖在赶DDL`,
		School:            `山东大学`,
		MajorLine:         `Intelligent Engineering And Management`,
		ArticleTitle:      `山大飞跃手册 | Intelligent Engineering And Management The Hong Kong Polytechnic University`,
		LongBioPrefix:     sduFeyueLongBioPrefix,
		ShortBio:          `山东大学Intelligent Engineering And Management，The Hong Kong Polytechnic University，分享申请与升学经验。`,
		Audience:          sduFeyueAudience,
		WelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,
		Education:         sduFeyueEducation,
		MajorLabel:        sduFeyueMajorLabel,
		KnowledgeCategory: sduFeyueKnowledgeCat,
		KnowledgeTags:     sduFeyueKnowledgeTags,
		SampleQuestions: []string{`山大申请海外PhD需要什么条件？`, `如何准备GRE和托福？`, `985背景如何定位选校？`},
		ExpertiseTags: []string{`留学申请`, `山东大学`, `Intelligent Engineering And Management`},
		OriginalAuthor: `孔海洋`,
		Source: `山东大学飞跃手册`,
		KnowledgeBody: `# [HK]-19-巧克力吖在赶DDL PhD in AAE @ The Hong Kong Polytechnic University
### 学术背景
> 本科院校：山东大学本科（985、211、双一流院校）
>
> 专业：主修：工业工程（智能工程与管理） （管理学院）
>
> 辅修：金融数学与金融工程 （数学学院）
>
> GPA：工业工程：87.72/100，金融数学与金融工程：90.77/100（前七学期）
>
> 语言考试分数：IELTS（6.5，R:8.0, L:5.5, S:5.5, W:6）
>
> 无GRE/GMAT
>
> 其余条件：有挑战杯、节能减排之类竞赛的国奖四个，有多段科研经历（智库项目、优青、青基，国创计划），有社团、学
>
> 生组织任职，有一篇二作的JCR-Q2的SSCI论文（导师一作），此外有一份成型的RP（带PPT）。

### 申请目标和结果
申请目标：港五及两所分校（香港大学，香港中文大学，香港科技大学，香港理工大学，香港城市大学，香港中文大学（深圳），香港科技大学（广州））
最终结果：香港理工大学-AAE（民航与航空工程系）-PhD program

经过与23fall同期的申博生以及本校老师的交流，我大致了解了不同地区博士项目的情况。北美博士相对更好些，因为北美地区十分注重基础，他们的博士项目学制都较长，让博士生拥有更多时间学习知识打牢基础，构建知识体系。但是我还是希望上学制短的PhD项目，而且我没有GRE/GMAT成绩，所以我一开始的定位是坡二（新加坡国立大学与南洋理工大学）与港五，但是新加坡23fall开始需要GRE/GMAT，我放弃了申请新加坡。
因为本科不是C9，加上港校博士竞争愈加激烈，我的主要目标是港城与港理，申请了港理的AAE与港城的SEE，此外也提交了港中文、港科、港科广MPhil项目的申请，主要在工业与系统工程这一方向。

### 申博全流程经验分享
我个人觉得还是早套磁比较好。我本来是23考研选手，但是怕考不上所以在11月初决定申博，其实这个时候相对晚了，第一批提交已经临近尾声了，很多导师都已经定好人，套磁比较吃亏，所以如果秋季入学，我觉得3月就应该开始准备相关的工作。
我个人申博流程如下：
1. 梳理个人感兴趣且有把握坚持研究的领域。因为之前也咨询过学长学姐，大部分人读博是非常煎熬的，遇见失败、挫折应该会成为常态，兴趣会促使我们选择领域，但是克服挫折还需要个人的坚持，所以千万不要因为一时兴起读一个没有了解但是让你感兴趣的领域。在确定申请专业之前请对这个其研究领域、研究内容有大致了解，评估你是否有能力、有兴趣、坚持做相关领域的研究。
为什么会标注这三个？因为兴趣是促使你在领域探索的动力，因为你需要在年限内毕业，你要有能力完成研究、发表论文、顺利毕业，因为你会在读博过程中遇见大量的困难，有些甚至会让你对自身产生怀疑，但你要始终相信自己坚持下去（除非你是真的读不下去了，自我评判）。
2. 梳理个人条件，定位学校与对应学院。这一步是为了避免个人条件不足盲目报考最后发现无法满足要求不得不放弃offer这种情况的发生，仅作建议。因为不乏逆天改命的同学，大家可以大胆套磁大胆尝试，但如果精力有限我建议稳扎稳打。
3. 选取意向导师，精读其最新论著与高被引文章。新论著是导师近期的研究方向，也是入学后大概率要研究的内容，需要熟悉相关理论，高被引是导师认可度较高的成果，也需要了解。它们在你后续的面试中都有可能成为你的面试题目。
4. 写套磁信，进行初步的联系。承接第三步，读完老师论著后，你可以以询问的形式配合个人的研究成果（若有）去写这样一份套磁信，让老师看见你的态度：你不是一时兴起，而是了解过导师，读过文章，带着问题、诚意来的。
当然你也可以直接询问能不能读他/她的PhD/MPhil项目，有些老师喜欢干脆了当，简单的套磁信他们也许更喜欢。
5. 如果套磁成功，后续跟导师约非正式面试，进行接触。这个比较重要，对于导师，面试是用来印证他个人根据书面材料对你形成的印象的一次机会，对于你来说，这也是你对导师进行评估的机会。好好准备PPT并熟悉你的个人材料，尤其是科研竞赛的，如果可以的话，讲讲你的RP也是不错的选择。
其次，早考语言成绩。我的语言成绩是22年8月考的，当时全力准备考研所以只留出12天的时间准备考试，我个人感觉考6.5是比较轻松的，但是要考到6的小分，总分上7的话，建议留出至少一个月以上的备考时间，但也不宜过长，口语会定期更新题库，个人感觉2个月为宜，基础不牢靠可以3个月。时间的话，如果有参加暑研的打算，大二下大三上是比较不错的时间节点，这个时间大家刚刚完成英语课程，感觉还在，复习起来相对容易，没有的暑研计划的也尽量在大三上完成，英语如果长时间不用很容易生疏。
6. 关于竞赛论文，我觉得也是早参加比较好。我能有这些比赛成绩，一方面是因为所在班级实行导师制，我在大一就拥有了学业导师，早早进组打工；另一方面是因为学院有热情的青年导师不吝赐教，还有志同道合的伙伴跟我一起比赛。我建议学弟学妹在大一就开始准备，忙好绩点的同时，跟学长学姐搞好关系，认识一些干劲十足的青年教师跟资源充足的中年教师，争取大一跟项目学习整个流程，怎么立项，怎么组建团队，怎么写材料做PPT，大二大三积极参加比赛，挑战杯、互联网加、节能减排、电赛、数模、国创计划。暑期可以找一下科研项目刷一下科研经历。

我的申博时间线：
2022年11月初开始准备材料，11.10发出第一封套磁信（一共发了26封，比较积极的回复有5个左右，主要是港中深、港科广、港理、港城的老师）。
2022.11.22给导师发套磁信，导师当天约面试；
2022.11.23 面试；
2022.11.25 导师给口头offer；
2022.11.29 交申请；
2023.4.4晚下offer。

### 其余建议
因为我是本科申直博，没有硕士经历，就不对硕士学长学姐提建议了，以下建议主要是针对本科生。
真的要抓绩点！！！我的绩点太低了，没有国奖巨吃亏，当然本身背景也一般。
大一搞好人际关系，不要让自己过于孤立，组队连个人脉都没有。
大二大三是准备各项材料的重要时间，平衡好学业跟科研竞赛的精力投入，如果无力准备竞赛论文，先保证高绩点，再准备论文，竞赛放最后。
不要放鸽子，鸽了港城的印度老师现在连个信都等不到。有个话不太贴切，但是大致有这么一个意思，好聚好散。
做好PS、CV、RP，CV可以用哥大的模板。
运气也是重要因素，虽然这句话没啥用，但是碰上人品好的导师真的十分不易，如果遇见一定要抱紧大腿。
充分利用各类渠道搜集信息，我申博过程中，知乎、小红书、寄托天下、ConnectEd、科研Doge都扮演着重要的角色（准备材料的过程主要参考知乎，给我正面回复的导师信息基本来自后三者，港理的导师是来自寄托跟ConnectEd的，真的很感谢搜集信息的各位前辈！）, 如果有任何问题，欢迎添加[联系方式已隐藏] 进行咨询。`,
	},
	{
		DisplayName:       `慵懒的太妃糖_0`,
		School:            `山东大学`,
		MajorLine:         `Semester Program`,
		ArticleTitle:      `山大飞跃手册 | Semester Program 深造/留学`,
		LongBioPrefix:     sduFeyueLongBioPrefix,
		ShortBio:          `山东大学Semester Program，深造/留学，分享申请与升学经验。`,
		Audience:          sduFeyueAudience,
		WelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,
		Education:         sduFeyueEducation,
		MajorLabel:        sduFeyueMajorLabel,
		KnowledgeCategory: sduFeyueKnowledgeCat,
		KnowledgeTags:     sduFeyueKnowledgeTags,
		SampleQuestions: []string{`山大申请海外PhD需要什么条件？`, `如何准备GRE和托福？`, `985背景如何定位选校？`},
		ExpertiseTags: []string{`留学申请`, `山东大学`, `Semester Program`},
		OriginalAuthor: `uc_yangzonghao`,
		Source: `山东大学飞跃手册`,
		KnowledgeBody: `# 哥伦比亚大学学期交流攻略 

### 写在前面：

大家好，我是来自致诚书院2016级统计系的阳宗灏。在大二自主申请并拿到了哥伦比亚大学、宾夕法尼亚大学和天普大学的学期交流的邀请，在申请的过程中积累了一定的经验。利用暑期的时间，完成了这样一份攻略，主要针对哥伦比亚大学学期交流的申请，当然学期交流的申请都大同小异，对于申请其他项目的南科大同学来讲也有一定的借鉴意义。在整个攻略的完成过程中，我想要特别感谢与我合作的2016级金融科技专业唐龙飞同学，帮我完成了中介部分的内容，并对整文的修改、内容的充实做了非常多的工作，还要感谢李浩然学长和杨瑞雪学姐对攻略提出的修改和添加建议。最后通过我们大家的努力，终于为大家呈现出了这部非常全面，涵盖项目申请，奖学金申请以及出国准备事项的攻略。我想借此攻略为我的交流申请季做一个总结，希望能够对将来申请的同学提供一些指导，同时我想向在我申请过程中帮助很大的韩蔚老师表示感谢！

在本文中，涉及到一些学校政策，和招生政策层面的内容，若有改变和错误之处欢迎同学们指正。 

### 项目介绍：

哥伦比亚大学的学期交流项目众多，大致分为三类：学分项目（TOEFL100+）、语言项目（TOEFL85-99）、商科证书课程（TOEFL85-99），学业合格可获得商科专业证书Certificate of Professional Accomplishment。

学分项目是学生们选择的主要项目，一学期的费用总计会在25-30万人民币左右。由三个学院分别招生：Columbia College（cc），School of Engineering and Applied Science（seas），以及School of Professional Studies（sps）。cc和seas是哥大最大两个本科生学院，如果你是学工科的同学，申请的时候请申请seas的学期交流。其他学科的同学就可以申请cc。以上至于cc和sps两个学院，我在这里可以给大家详细讲一下，因为在申请的时候还花时间做了一些research。首先，我先放一张官网上的对比图（图一）。



​                                                                          图一

其实这两个院最大的区别在于cc是本科生院，而sps是研究生院。在选课的时候，cc的访学生如果想要选研究生课程需要得到advisor的approval，但是sps的同学在这方面就不受限制，而且sps同学的选课优先级要高一些，sps的同学比cc的同学先选课。但是对于各个具体的课程来说，有的会只对cc学生开放，有的只对sps学生开放。虽然也能cross register到不对你学院开放的课程，但是比较痛苦和麻烦。所以建议大家可以先在Vergil系统查到自己想修的课程是对哪个学院开放，再决定申报哪个项目。

还有一点区别就是cc会在春季学期提供宿舍，而sps不提供学生宿舍。就在哥大就读的体验来讲，其实这两个学院提供的交流项目没有太大的区别，只是最后的成绩单一个是cc给的，一个是sps给的。至于同学们最后选择哪个项目还是你们自己的决定，不过有一点要提醒的是cc的申请一般在3月就会截止（秋季学期交流），而sps一直到6、7月都还可以申请，所以如果错过了cc申请的同学还有机会申请sps的交流项目。对于南科大来讲，不管是哪个项目都会提供奖学金的，所以大家不必担心。因为我本人是申请的cc，所以本文我将着重介绍cc的申请。

### 申请准备：

1. 语言考试：作为学期交流的申请，语言考试都是必不可少的。哥大的学期交流的语言成绩要求是：TOEFL：100+（、IELTS：7.0+）哥大需要ETS把官方成绩单直接寄到哥大（学校代码: 2116），所以在注册托福考试的时候一定要记得勾选把成绩单寄到哥大，补寄还是有点小贵的，所以珍惜免费邮寄的机会。语言成绩是硬门槛，过了这个分数线被录取的概率就会提高很多。当然分数是越高越好，如果在准备学期交流的时候就拿到托福110+的话，在两年有效期内研究生申请还能接着用。这里我提供4位南科大被此项目录取的同学的TOEFL成绩：同学A – 104分；同学B- 106分；同学C- 101分：同学D-99分。另一方面需要非常注意的是考试准备的时间节点。我的建议是假设你是准备大三的秋季学期入学（申请截止时间为入学同年4月左右），那么你最好大一的暑假就开始准备托福并在暑假结束时考一次，如果考过了100分，那么就恭喜你，暂时摆脱语言考试。如果没有考过的话（in most cases），不用慌张，你还有大二寒假的时间来准备托福考试，但这一次就是背水一战，最后一次了。

2. Letter of eligibility: 哥大学期交流的申请需要教授或教工部的老师写一个letter of eligibility来证明你在学习优秀，人品正直。大家可以找自己的书院导师来书写。官网的原文是这样的：

*A signed Statement of Eligibility from the applicant’s academic advisor or an equivalent official (such as university registrar) who verify that an applicant is enrolled full-time; confirm that the applicant is in good academic and civic standing at his or her university/college; and verify that the applicant is permitted to study elsewhere as part of the Visiting Student Program. This statement should not be a letter of recommendation from an instructor.*

3. 推荐信：申请还需要由你的数学或其他理科教授提供一封推荐信。其实在我今年的申请中是不需要推荐信，这是新加的要求。官网上的原文是：

A letter of recommendation from a professor in a math or science class.

4. Short Questions: 哥大学期交流的申请不需要personal statement（PS），取而代之的是三个short questions，每个问题的回答不超过250个词。这里我把我申请时回答的三个问题贴在这里供大家参考。

*a)*    *Why do you seek to spend a semester at another institution? What do you hope to gain from a visiting students experience?*

*b)*    *What do you value most about Columbia and why?*

*c)*    *Why do you wish to pursue the courses you have indicated at Columbia?*

这三个短问题一定要非常重视，其作用和PS的作用相同，当大家的语言成绩和GPA都过线的时候，招生官做筛选的时候就是通过这三个短问题来挑选更适合哥大，更明确哥大的学期交流作用的学生。这里，我的建议是大家最好在申请通道开通后就尽早去官网看看是什么问题，放在脑子里好好思考一下，写一个初稿。大家别忘了，英语老师和语言中心都是准备英语文书很好的资源。写好的回答一定至少要给一个native English teacher看一下，他们会给你很好的修改意见。语言中心每学期也提供了写作的tutorial，大家可以好好的利用这些资源。

### 申请流程(以秋季入学为例)

 图二

这里我以秋季入学为例，做了一个大概的申请流程图（图二）。当然这只是我的建议，错过了以上的时间节点并不一定代表不能申请了，大家只要做到plan ahead就可以。首先最先准备的是语言考试，具体时间我在上一个部分做了详细的解释，请一定记得邮寄ETS的官方成绩单给哥大。第二个需要注意的时间节点是申请开始的时间，一般在入学前一年的十二月份左右，官网上会提前告知，大家可以留意一下。当申请通道开通以后，同学们就可以开始申请了，填写个人资料，上传成绩单等等。这个时候你就可以看到申请时要求回答的三个短问题了（不知道每年会不会有改变）。然后按部就班的准备短问题，要推荐信、letter of eligibility等等就可以了。还有就是申请截止日期，即使你的语言成绩还没有过，都一定要在截止日期前提交申请，要不然就错过啦。最后就congratulations啦，收获offer。

### 奖学金申请

那么在获得offer以后要做的一件非常重要的事情就是申请奖学金啦，我们非常幸运南科大为本科生提供了如此丰厚的奖学金。目前，我们可以申请的奖学金主要有两个：南科大卓越计划和留学基金委员会（留基委）优秀本科生资助。

首先卓越计划的奖学金是每学期小于等于20万或不超过项目所需费用的100%，由土豪爸爸南科大提供，只需要申请者GPA超过3.5，交流学校为以当年us news为参考全球排名前二十的院校即可。政策一直在变，请同学要提前咨询一下国合部和教工部的老师。当然哥大是满足要求的，所以只要你GPA过了3.5就可以申请。但如果你的GPA低于3.5，又被哥大录取了的话，你还可以申请南科大对长期项目的资助不超过6.5万元。南科大的资助申请时间一般在交流上一个学期的学期末。

另外就是留基委的资助，我们学校的名额只有1个，不过按照经验学校会超额推荐，所以建议大家都试着去申请一下留基委的资助，即使不是学校推荐的第一顺位，还是有机会通过审核获得资助的，我就是一个幸运的案例。留基委的资助内容是：往返旅费，签证费和补贴生活费1600美元/月（纽约州）。留基委的奖学金需要非常注意的是他每次秋季学期的申请时间大概在4月底到5月初，且非常严格，过时不候，比较尴尬的是哥大的offer一般是在5月份才发放，所以大家最好尽早提交哥大的申请，然后到了三月份就开始发邮件向哥大说明你的情况，催他们尽快审核你的申请，赶紧发offer。

同学们，这都是真金白银呀，收到offer就抓紧时间申请吧。 

### 后续事项

同学们，当你拿到offer以后，还有很多很多的事情等着要完成。这里我给大家简单的列举一下。

* 申请奖学金：南科大的奖学金申请相对容易，只需要按照教工部和国合部的要求提交材料即可，所以不多说。留基委需要准备的资料是非常繁琐的，没有什么捷径可走，大家按照要求提供资料。再提醒一下，申请期限很重要，一定不要错过了。因为上面已经作了一些说明，这里就不重复了。

  对于想要在哥大交流两个学期的同学，我想再和大家分享一个留基委申请的头疼事。哥大的学期交流项目是一到两个学期，有的同学如果想在哥大交流两个学期的话，在留基委的申请上会遇到一些麻烦。哥大在发邀请信的时候只会发第一个学期的offer，即使你明确了第二个学期要在哥大就读，哥大也只会在第一个学期结束前才问你是否愿意第二个学期继续就读。这时如果你选择继续就读，哥大才会发放第二个学期的offer。为什么说这个会造成麻烦呢？我们在申请留基委的奖学金的时候，由于标准化审核的需要，留基委要求资助的期限要严格按照录取信的学习期限发放，且同一阶段（即本科），不能二次申请。也就是说大家最多只能申请到留基委4个月的生活费资助。而且，如果要在哥大就读两个学期的话，第一个学期后需要先回国报道，然后再出去交流。如果中途不想回国也可以，毕竟寒假只有半个多月的时间，倒两次时差就差不多了，那就需要办理延期回国的手续，否则会按照违约处理。那么，如果有同学遇到了这种情况，我的建议是：积极和哥大交涉，电话和邮件都用上，说明自己的情况，尽量能争取到两个学期的offer，或者是conditional offer也可以（说明如果第一学期期末考试全部通过的话将允许你继续就读），在邀请信上明确标明两个学期的留学期限。虽然我今年没有成功，但是说不定申请的同学口才比我好就说动了哥大的职员了呢。

* 办理护照和美国签证：这两样东西是必不可少的，尤其是申请留基委的同学，尽早办好可以提前预定机票，这样更可能选到自己心仪的航班。护照和签证呢，不是留基委统一办理的，需要大家自己去办理。其中，签证费可凭借中信银行的收据报销（留基委），所以大家可以放心大胆地去自己办理签证。

* 租房：哥大对于学期交流的同学只在春季学期提供宿舍，秋季学期不提供宿舍，所以秋季入学的同学需要自己在校外找房。学校宿舍的租金大约在1100美元/月左右，根据位置和房型不同而变化。校外的住宿价格在1000到1600美元/月之间，当然纽约也有很多luxury building，租金在2000+。哥大的校园主要集中在114街到122街之间，125街以北黑人就会逐渐增多，因此从安全的角度来讲建议大家租房尽量选在125街以南的街区。预算较少的同学还可以租住客厅，价格一般在1000美元/月以内。这里，我为大家总结一下住房的途径：

  * UAH：http://facilities.columbia.edu/housing/overview UAH住房是指学校的房屋住宿系统，房源主要集中在Morningside campus附近、Medical Center附近以及Bronx附近（Arbor）。 房间类型主要分为两种：apartment和dormitory。 Apartment一般是指两室一厅或三室一厅的公寓房，一般带有一个厨房、一个卫生间以及一个客厅。整栋楼一楼可能会有doorman，但是大多数是没有的。 Dormitory是指一间较大的房屋内具有相对独立的约10个左右的房间，房间大小根据房型结构不同而不同，dorm一般配有一个公用的厨房和两到三个公用的卫生间，定期会有人进行公共部分的打扫，楼下都有doorman。Dorm的房间可能是单人间，也可能是双人间，个人根据不同情况选租。 另外一种UAH的宿舍类型是studio，较为适合携带配偶的学生居住，但申请时需提供相应法律关系证明。 

  * I-House (International House) https://www.ihouse-nyc.org/ 一个连锁的独立公寓机构，开放给各类学生和实习生，提供短住和长住。I-House是独立于哥大的系统，所以其申请也可以不受制于学院审核。它位于Riverside Drive &W122nd Street，临着两个公园，其中很多房间可以看到Hudson River的河景。旁边是大教堂和曼哈顿音乐学院。步行10分钟即可到达哥大。I-House里社区的氛围非常浓，经常都会给国际学生举行一些文化交流活动。但是申请相对比较困难，有的需要提交你的个人陈述，并且由居住在house里的同学组成的委员会来审核。若能够入住I-House也一定是一个非常不错的经历。如果已经申请成功并接受了I-House的房子，在到达的当天就可以入住。 

* OCHA (Off-Campus Housing Assistant) https://ocha.facilities.columbia.edu/registration/index OCHA系统是哥大为学生们于曼哈顿地区搜索校外住宿时所提供的帮助。由于这是学校官方整理的信息，这个数据库比其它网上的找房系统更为可信。只需要把你的UNI输入即可登陆。透过这个数据库，那些没有申请到学校宿舍以及想住校外的同学可以找到直接联系长租或短租的室友，并可以设立自己的资料页面寻找一起合租的小伙伴。那些已经找到住房但需要多一个或几个室友的同学也可以在这里找到可信赖的未来室友。 

* 微信群：每年哥大的中国新生都会建立很多的微信群，这些群里会有很多租房，转租和合租的信息，是在校外租房最常用的一种方式。

  因为哥大的学期交流项目（cc）在秋季学期是不提供住宿的，所以秋季交流的同学都会面对校外找房的问题。主要就是通过OCHA和微信群两个渠道找租房。因为是校外找房，所以大家一定要事前甄别好，安全始终要放在第一位。校外的房源租期普遍都是一年，租期为一个学期的房源非常少，对于只交流一个学期的同学来说租房是一个难题。春季学期的同学可以直接住学生宿舍，秋季学期的同学就只有耐心地等一个学期的房源，经常关注OCHA的网站。找房是一个长线的工作，大家从5月开始就可以关注着，如果有好房源就下手，不过哥大附近的房源非常多，等到暑期的时候再看也是没有问题的。这里我再贴一个纽约犯罪地图，大家可以在租房的时候做参考。

* NYPD纽约市犯罪地图：https://maps.nyc.gov/crime/ 

* 办理南科大的离校手续：大家可以在暑假的时候完成这个事情，具体的要求请参照教工部和国际部的邮件指导。

* 办理电话卡：首先要注明一点，在美国这边打电话发短信都是免费的，套餐费用主要决定了高速流量的多少。在国内国外都可以办理电话卡，国内的话中国电信美洲分公司比较常用，plan大概在25\\~50刀不等，好处是可以在国内拿到电话卡，一下飞机就能用。美国本土的运营商很多，我推荐AT&T，个人plan大概在30\\~50刀不等，如果加入family plan会更复杂一些，可以到了这边再了解。在美办电话卡的好处是信号更强，营业网点很多，客服方便，还会有协约机优惠，不过需要自己到了纽约之后来办，刚到美国的第一天可能不太方便。最后还有一点，就是在美国携号转网和换套餐很方便，所以如果对自己目前的运营商不满意，随时可以去营业网点换。如果觉得最开始两三天不方便，国内移动漫游过来一天30人民币max不限流量，可以这样cover没办美国号码的那几天。

  我自己是订的中国电信美洲公司的电话卡，码了这么长的文章也给自己插入个广告，哈哈。大家在订购电信卡的时候，欢迎使用我的推荐码：YCFI，输入后双方都能获得十美元话费。

* 银行卡：银行卡有多种选择。国内办的话，比较推荐中国银行的“美好前程”留学开学服务，综合来看比较实惠的。同学们也可到了美国以后再办理银行卡，因为国际银行卡盗刷的情况在国外比较难预防和处理，而且卡片出现什么问题，如丢失，也很难处理，所以比较推荐大家到了美国之后自己办一张当地银行卡。

其他的可能还有选课，orientation，交学费之类的问题，我就不在这里说啦。哥大要求国际学生都要购买保险，且不能通过其他保险waive。目前哥大有两个保险的plan：90 plan和100 plan，里面的保险内容和额度都不同，价钱也不同，大家可以自己选择。因为哥大的体系已经非常成熟，在开学前，会一步步的有邮件来引导大家做到哥大前的准备，非常的详细，大家不用担心。 

### 中介V.S.DIY

DIY的过程在上文中已经说的比较清楚了，因为也有同学是通过中介的方式申请到了哥大的学期交流项目，这里单独说一下。具我了解，在至今所有成功申请到哥大交流项目的六位同学中，有四位是通过中介申请的。

首先，中介收取的费用是在1万人民币左右。仅仅是提供项目管理以及一些在美生活、学习方面的帮助，不会帮助修改personal statement等会影响录取的文件，因此可以认为通过中介并不会提高被录取的概率。下面我会列举中介和DIY的不同之处。

a)    在申请前期，不需要教授或者学校的推荐信。提交的也不是上文提到的三小问，而是需要提交一篇personal statement。



这和申研时的ps已经很像了，所以以后有出国读研打算的同学们可以先拿这个练练手。需要注意的，国人与老美在进行这种写作的时候思维差异还是很大的，大家自己写的第一份ps在老美看来肯能是千篇一律，毫无重点，所以强烈建议同学们寻找一位语言中心的native speaker，从一开始就帮助自己构建思路，再一遍遍的修改。（我当时花半个多月润色的ps再拿给外教看后被痛批一顿，只得推倒重来，又花了两三周的时间才最终定稿）

b)    中介也会先进行一遍电话面试，筛选出一部分同学（我私下了解到，中介在电话面试中大概会滤掉50%的人）

c)    在申请中，中介是和哥大直接对接的人，同学们只用按照中介的指导一步步进行即可。对于学业繁忙的同学还是能节省大量的时间的。

d)    纽约附近的租房时，一般都是要求一签一年的合同，对于想念一个学期的同学来说，找到适合的半年房源是极其困难的（笔者关注了一两个月也还是没有找到。。。）通过中介的话，会提前在合作的公寓中帮同学们留好房间，租期也是刚好吻合同学们的项目时间。这一点还是提供了比较大的方便的。

e)    中介会让参加同一个项目的同学组成小组，在美国后每周都要上交访学报告以及互相交流、帮助，还是有助于同学们尽快适应美国生活的。在行前也会举办交流会，请到往届同学分享经验等。

f)    对于想考雅思的同学，中介和雅思有一个合作的奖学金。在同学们项目结束回国后，可以递交访学报告进行评比，最高可以获得2万人民币的奖学金。

g)    中介还有一些附赠的服务，比如到美之后的接机，额外的医疗保险等。 

中介提供的服务大致就是这些，主要还是能帮助同学们避开一些坑以及

同学们和哥大交流中的障碍。大家可以自己考虑花费1万人民币来购买这些服务还是DIY。

### FAQ

其实并没有什么问题，只是自己脑补了一些同学们可能关心的问题在这里做一下解答。

a)    在哥大学期交流后可不可以留在纽约实习？

纽约是全球金融的中心，这也是很多选择来哥大进行学期交流的同学的一个关键的原因。但是答案恐怕会让大家失望了，对于学期交流的同学来讲是不可以在交流结束后的暑期或者寒假实习的。在美实习工作是需要拥有实习签证的，美国的实习签证分为OPT(Optional Practical Training)和CPT(Curriculum Practical Training)签证。OPT签证是持F-1学生签的同学最常申请的实习签证；CPT签证是如果课程中包含实习要求，才申请的签证。但是对于交流的同学来讲，因为visiting student program是一个non-degree program，所以不符合申请OPT和CPT的要求。因此，在交流后是不能留在美国实习的。

b)    春季学期交流还是秋季学期交流，或者交流一个学年？

对于交流一个学期的同学，我的推荐是在秋季学期交流。如果在春季学期交流会涉及到在南科大的期末考试缓考的问题，因为哥大的春季学期一般在一月初到五月底，正好和南科大秋季学期的期末时间重合。那么关于是否交流一个学年的问题，第一个要考虑的是自身的经济情况，因为奖学金基本可以覆盖第一个学期的费用，但是第二个学期的费用基本是自己负担的。其次交流一个学年也是有利有弊，利在于在哥大的体验更加完整和充分，甚至还可以利用一年的时间在哥大有自己的实验课题；弊则在于交流的这一年往往会占用你整个大二或着大三的时间，这样的话会间断南科大的培养，导致不能专心于需要连续时间投入的实验课题。

c)    学分认证问题：

南科大对学分的互换非常开放，同学们在申请学分换算的时候，需要在南科大官网中下载学分认定表，最后在交流结束后将填好的表格交至教工部即可。在确定需要认证学分的课程后，需要向哥大教这门的老师或系秘书发邮件要课程的syllabus，拿着syllabus给南科大教这门课的老师看，若课程内容能够基本覆盖的话，请教授在表格上签上字，只要大家在交流的时候通过了这门课，学分就可以认证。

九、资金准备：

哥大交流整体下来花费还是比较大的，而且学校的资助也是在同学们回国之后再审核、资助，另外申请签证时也需要有30万左右的存款证明，所以资金的筹集也是一个比较重大的问题。我会按照时间先后，依次说明一下每一个阶段需要准备的资金。

a)    申请时：申请费邮寄费等折合成成人民币在2000元左右，此时不需要太多的资金准备。

b)    收到offer后：可以开始申请I-20表格，用于申请签证。此时需要提交28万元的存款证明，冻结资金至拿到美签。存款证明文件的目的是向哥大证明学生所在的家庭有足够的经济能力承担学生在美期间的学习和生活费，以及向签证官证明学生去美国的目的就是学习。存款证明文件可以不用新开账户；几个账户分别开存款证明也可以，只要总额达到要求。最后，同学们在获得签证后即可解冻，不会影响到后续交学费交房租等事项。

c)    房租：如果是租房的同学，最开始订房前会交一笔定金，通常是一个月房租，在1万人民币左右。房租根据租约的不同，有月付，一次性付半年等付租金的方式，同学们此时则需要根据自己的具体情况付租金。

d)    学费：学费是在开学之后才缴纳，有一次性付清，月付等不同plan，同学们可以根据自己的情况考虑。

### 交流感受：

这里，我主要想谈一谈我的感受。主要有三点：第一是提升了自己的生活和语言能力；第二是认识了很多优秀的同学；第三是在一天天的挑战中成长。

刚到美国后最大的感受就是我人生第一次自己独立的过生活。来之前需要租好房，来了以后需要给自己添置家具，每天还需要为吃什么发愁，每次买个东西还非要把价格换成人民币让自己好好心疼一下….这里没有了国内的食堂，两步就可以吃到自己习惯的食物，上课也不再是从宿舍到教学楼的距离。当我突然有一天需要面对这一切的时候，我深刻地感受到了，这才是生活。生活本就不是永远安逸，留学让我们提前接触到了生活茶米油盐的一面。我慢慢的开始不再依赖路边的餐车，经常去超市里买菜，自己回家做。每次听着电台，做着饭，也不失是一种愉快的体验。当然，出国还有一个必须面对的问题是语言，在面对外国人的时候，迫使自己只能用英文交流。我自己呢，因为从初中开始就在外国语学校，所以一直以来对英语交流都非常的感兴趣，所以在这样的环境下，我生活的更加的自如。在一年的学习生活里，我不知道我的英语口语和听力是否有提高，但是我确定的是我在和外国人交流的时候更加的自信了。这是我的第一点收获，也是最实际的收获。

通过在哥大这样世界顶尖的学府交流的机会，我认识了许多身边优秀的同学。他们中有来自哥大的本科生和研究生，也有同样来交流的来自中国其他高校的同学们。我们在课上课下的交流中，增进了友谊。我认为这些友谊是我可以从哥大带走的东西，他们会在往后的日子里，在我需要帮助的时候随时站在我的身后。举一个小例子吧，我作为来自中国的同学，答题解题的能力相对更强，所以我经常在课下和同学一起讨论作业的时候充当了梳理概念，讲解习题的角色，这让我认识了一个在之后对我有很大帮助的朋友，Kevin。在暑假快要到的时候，他问我我找到暑期实习了吗？我说还没有。然后他就offer给我了一个实习的机会，让我非常感动。而且在那之后，他还专门花了一下午的时间帮我修改我的CV和Cover Letter。我当时就坐在那里，看着两个native speaker一字一句的抠我的简历的时候，我走神了，我感觉我为何如此幸运。在这一年的时间里，我身边发生了太多这样的事情，我真诚的为他人给予了帮助的同时，我收获了真挚的友谊。

最后一点收获也是最深刻的，就是在哥大每天都有不同的挑战，让我在挑战中不断的成长。不可否认的是在哥大这样的学府学习的学生都是这个时代的佼佼者，他们有着优异的学习成绩，同时也在其他方面有着亮眼的成就。在哥大，从课程本身的难度，领域泰斗的教授，到身边优秀的同学，他们每一天都在挑战和激励着我。在这样的挑战中，我承认我有过沮丧，认为自己不够优秀，永远无法达到他们的高度。但是，在我熬过这个沮丧之后，我成长了。我开始去追问自己在人生的维度上到底想要什么？我不再把参考系放在他人身上，而是我自己，关注自己的成长，这样的转变让我更加的从容，自信。

综上是我总结的留学一年来的感悟。希望对之后的同学们有一个参考和启迪的作用。我非常感恩在哥大的这一年，感恩这次经历给我带来的一切。我也感谢南科大给我了这样一个机会让我可以在哥大学习。在这一年，我收获了，成长了，交到了真挚的朋友，我认为这就足够了。

### 联系方式：

欢迎大家加入哥伦比亚大学学期交流qq群，大家有什么疑问都可以在这里讨论。



有问题需要单独探讨也可以联系我的个人邮箱：yangzh98@qq.com

 

相关链接：

* 哥伦比亚大学学习交流项目：http://undergrad.admissions.columbia.edu/apply/visiting-students

* Virgil系统：https://vergil.registrar.columbia.edu/#/courses/*
* 中国银行“美好前程”信用卡：http://www.boc.cn/pbservice/pb4/200811/t20081120_14095.html

* 学分认证表格：http://www.sustc.edu.cn/communication_down`,
	},
	{
		DisplayName:       `杨梅_水母`,
		School:            `山东大学`,
		MajorLine:         `Semester Program`,
		ArticleTitle:      `山大飞跃手册 | Semester Program 深造/留学`,
		LongBioPrefix:     sduFeyueLongBioPrefix,
		ShortBio:          `山东大学Semester Program，深造/留学，分享申请与升学经验。`,
		Audience:          sduFeyueAudience,
		WelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,
		Education:         sduFeyueEducation,
		MajorLabel:        sduFeyueMajorLabel,
		KnowledgeCategory: sduFeyueKnowledgeCat,
		KnowledgeTags:     sduFeyueKnowledgeTags,
		SampleQuestions: []string{`山大申请海外PhD需要什么条件？`, `如何准备GRE和托福？`, `985背景如何定位选校？`},
		ExpertiseTags: []string{`留学申请`, `山东大学`, `Semester Program`},
		OriginalAuthor: `why_I_suggest_u_KAUST`,
		Source: `山东大学飞跃手册`,
		KnowledgeBody: `# 我为什么推荐你去KAUST做3-6个月的科研实习



> 当初想去KAUST做科研实习，很重要的一个原因是想体验阿拉伯的文化和生活（笑。——  [16级计算机系王雨童](<https://rainytong.github.io/>)



去年9月底到今年1月底，我很幸运的前往沙特参与了kaust的VSRP项目 (Visiting Student Research Program)，因为最近看到学校在宣传和KAUST的3+2本硕联陪项目，加上大家对kaust了解有限，我想以自己的角度写一篇总结向大家吐血推荐一下这个项目。



## Part 1 我为什么申请这个项目

先介绍一下这个项目的申请条件：具体的条件大家去官网搜吧，我记得要求申请者是大三在读或者研一在读，gpa 3.5+，需要英语成绩，需要选择一位想跟的教授。

再介绍一下我申请该项目时的背景：大三下刚开始，计系，gpa3.7出头，托福刚过百，一段刚开始的实验室科研，目标北美读研／博。

因为自己的背景没有亮点，又深知cs北美申请的竞争之惨烈，所以在大三下学期，开始焦虑未来的申请时，一个偶然的机会让我知道了kaust的vsrp项目，稍作了解后，发现这是一个性价比很高也很适合我的项目：时长3至6个月，时间灵活，纯做科研不需要上课，并且经济上很多福利，包括每个月1000美元的工资+机票住宿全包+住宿海边别墅+...



所以申请的**motivation**总结如下：

- 对中东世界和最土豪大学充满好奇，想要体验阿拉伯的文化和生活 （这一点是支撑我申请的重要原因2333）

- 是一个让我可以尝试科研，专心科研的好机会，并且对教授的研究方向很感兴趣
- 帮助我决定读研还是读博，同时提升软背景，给申请增加一个亮点
- 有机会要到一封海外教授的科研推荐信
- 给自己一个了解kaust的机会，看看是否适合自己

- 时间合适，大四上没有必须要上的课
- 项目福利好多，可以挣出毕业旅行的💰
- 做毕设 :-D



同时在申请的时候，我也有一些顾虑：

- 沙特是一个很大的恐怖主义输出国，我身边的家人朋友老师包括我自己在内都很担心安全问题
- 因为大四上是申请留学的重要节点，申请本身就有很多工作要做，而且我的gre还没考出来，如果大四上去参加科研实习并且要到教授的推荐信，就意味着我要同时做好科研项目+考出gre+做好申请，这个风险和压力还是比较大的。



因此我把大四上去kaust这件事情总结为一个较高风险超高回报的事，事实证明确实如此。



## Part 2 申请的timeline

这个vsrp项目是kaust学校出钱，每个教授每年大概有两个学生名额，所以申请的关键在于有没有教授愿意要你。因此我在三月中旬了解到这个项目之后，立即开始选项目选教授，并且陶瓷教授，做了很多尝试之后终于联系到了我的女神老板Prof. Xiangliang Zhang，在三月底给了我面试机会并同意我进她的实验室，现在想想感觉真的幸运能遇到这么好的老师。

💡timeline:

- 大三下的3月中旬： 开始陶瓷
- 3月底： 得到面试和老师的同意后，在官网提交申请
- 4月-7月：暑假要参加UCI暑研，所以和教授定的九月过去，由于沙特政府签证办理的限制，kaust需要在到达沙特前的两个月开始处理我的申请，因此4月到7月就是漫长的等待
- 7月底：得到正式通知，申请通过
- 9月初：回国后开始办理签证，小秘开始联系我订机票，和各种注意事项

- 9月下旬：抵达kaust，开启一段神奇的旅程 



## Part 3 kaust以及沙特阿拉伯生活体验



### 天气

本来想去沙特天然美黑的，但并没有如我所愿。沙特夏天最炎热的时候在7-9月，阳光很强烈，但是大街上基本看不到行人的，在学校里走地下通道就可以美滋滋了。从10月中下旬开始天气越来越舒服了，因为学校就在海边，所以空气不干也不湿，海风吹着，室内空调也很足，每天阳光充沛也不容易抑郁。总之我感觉自己在kaust度过了一段非常美好的气候。



### 衣

在去沙特之前买了一件黑袍abaya，出校门穿的，但是在学校里男生女生怎么穿都可以。不过后来沙特开放旅行签了，外国女性已经不需要穿abaya了，在校外建议穿长裤就可以。



### 食

实验室旁边就是食堂，午餐晚餐大概15沙到35沙不等，折合人民币30-60元吧，虽然后期也吃够了，但是食堂里种类不少，尤其是好吃不贵的甜点让我很怀念。

学校里也有很多餐馆，中餐、西餐、印度咖喱、中东烤肉、意大利餐、汉堡炸鸡店、披萨店、甜品店、冰激凌店都有。有一些很不错的经常会吃。

我个人很喜欢喝咖啡，学校里有很多包括星巴克在内的咖啡店，并且实验室楼下就有一家超好喝的咖啡店几乎每天都喝，对我来说真的很美好。

学校旁边是一个图瓦村，有很好吃的烤鱼和超好喝的果汁，然后吉达市里有不少饭店也可以开发。

沙特国内不允许喝酒吃猪肉，不过学校里倒是有不少人自己酿酒喝。



### 住

住在一个三人一栋的三层别墅里，单人单间+独卫，有厨房、洗衣机、烘干机，别墅旁边是一条运河直接通向大海，因为我自己住在三楼，房间还自带了一个挺大的阳台，观景体验很赞。

然后住宿区野猫很多，每天回家都要小心被抓伤。

学校里有超市，有医院，有好几个体育馆，我住的地方旁边就是一个健身房。



### 行

校内交通便利，在学校里从早到晚都有各种路线的bus，bus站也非常多。

然后去校外的话，学校每周都有固定路线的大巴车通往吉达的各种商场或者其他地方。校内也有出租车服务，如果要去特定的地方就需要预约出租车，定点接送，价格小贵但是非常安全靠谱。身边有的小伙伴会有自己的车，平时可以搭小伙伴的车出去玩儿。



### 玩

虽然我跟很多人吐槽过在这里什么玩的都没有很无聊，但其实还是有很多娱乐项目可以开发的，比如在校内最方便的就是各种体育活动了，健身、各种健身课舞蹈课瑜伽课、保龄球、高尔夫、攀岩、游泳、壁球网球羽毛球乒乓球..., 还有很多海上活动，我体验过的有红海浮潜、出海钓鱼，其他的还有划船、潜水等等，并且可以在这边考潜水证。

然后学校里有电影院，虽然是阿拉伯字幕很考验听力，但人比较少经常可以体验包场的快感。

其实沙特的很多地方包括吉达市都是可以探索的，沙特周边也有很多好玩的旅游国家比如土耳其、巴林和我去的约旦等等，从沙特去欧洲玩也很方便。



### 人与安全

去之前听到一些声音说这里对女性不友好不尊重，这里是恐怖主义云集的地方。去过之后我才明白这些大概是没有真正了解过沙特的人眼中的偏见吧。

沙特人都是非常虔诚的信教者，以我短时间的肤浅观察来看，在这里遇到的大多数本地人和一些周边国家的人，他们待人朴实、温和，对女性尊重且友善，尤其对中国人十分热情友好。关于安全问题，我也问过很多身边生活在沙特的朋友，他们认为不安全因素任何地方都有，总的来说这里是个很安全的地方。

关于文化体验，走在大街上，身边都是穿着白袍黑袍带着头巾的男人女人，是一种挺奇妙的体验。



## Part 4 科研生活体验

kaust的环境容易让人感到平静与岁月静好。这四个月可能是我大学四年最平静专注不浮躁的一段时光。

从我实验室到宿舍的路上会经过清真寺，所以每天实验室 食堂 清真寺 宿舍四点一线，偶尔多走几步到海边散散步吹吹风。

kaust的科研氛围很好，大牛老师挺多，实验室的资源和funding都很充足。这里介绍一下我所在的实验室的情况吧：

在计算机系的实验室里，研究生/博士生/访问学生每人有一个半封闭式的小隔间，每人一台mac台式机，组里的服务器也不少。博士后/research scientist是一人一间小办公室的，然后老板的话就是一个挺大的海景办公室。我们组每周开一次组会，时间在中午，因为老板超nice所以每周都会给我们订自助午餐，组会就是大家边吃午餐边听talk。我每周会再单独和老板meeting一次，汇报进度并讨论接下来一个周的任务。

总的来说，kaust是一个各个方面都帮你考虑周到的地方，你只需要无忧无虑的在这个舒适的环境里专心科研就可以。



### 写在最后

感谢给了我这个机会、很多信任与帮助的Xiangliang老师。感谢支持鼓励我参加这个项目的唐博老师。

也很感谢在kaust这一段时间远程陪伴我的张兆旭同学。



虽然不想以功利的角度衡量这个项目的价值，但是不得不说这个经历成为了我申请中很重要的一个点，它不仅让我找到了在科研上的热情，成为我下决心读博的关键因素，也对我的phd申请起到了很大的帮助。



总之我很庆幸自己当初选择了申请这个项目，这段时光对我来说是无价的，在这里也认识了很多优秀独立有思想的小伙伴，越说越怀念，就先写到这里吧，之后有什么想起来的再补充，也欢迎有问题的可以邮箱联系我(11611808@mail.sustech.edu.cn)。`,
	},
	{
		DisplayName:       `瓢虫_瓢虫`,
		School:            `山东大学`,
		MajorLine:         `Summer Research`,
		ArticleTitle:      `山大飞跃手册 | Summer Research 深造/留学`,
		LongBioPrefix:     sduFeyueLongBioPrefix,
		ShortBio:          `山东大学Summer Research，深造/留学，分享申请与升学经验。`,
		Audience:          sduFeyueAudience,
		WelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,
		Education:         sduFeyueEducation,
		MajorLabel:        sduFeyueMajorLabel,
		KnowledgeCategory: sduFeyueKnowledgeCat,
		KnowledgeTags:     sduFeyueKnowledgeTags,
		SampleQuestions: []string{`山大申请海外PhD需要什么条件？`, `如何准备GRE和托福？`, `985背景如何定位选校？`},
		ExpertiseTags: []string{`留学申请`, `山东大学`, `Summer Research`},
		OriginalAuthor: `columbia_environment_LDEO_liujingyu`,
		Source: `山东大学飞跃手册`,
		KnowledgeBody: `# 哥伦比亚大学环境学院LDEO暑期实习申请攻略+体验

by 15级-环境-刘静宇

<section style="box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 5px 0% 10px;transform: translate3d(10px, 0px, 0px);-webkit-transform: translate3d(10px, 0px, 0px);-moz-transform: translate3d(10px, 0px, 0px);-o-transform: translate3d(10px, 0px, 0px);box-sizing: border-box;">
<section style="display: inline-block;vertical-align: bottom;width: 25%;border-bottom: 3px solid rgb(197, 185, 185);border-bottom-right-radius: 0px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="text-align: center;margin: 0px 0% 5px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;border-width: 0px;box-sizing: border-box;">

</section>
</section>
</section>
</section>
<section style="display: inline-block;vertical-align: bottom;width: 35%;border-right: 3px solid rgb(197, 185, 185);border-top-right-radius: 0px;border-bottom: 3px solid rgb(197, 185, 185);border-bottom-right-radius: 0px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 0px 0% 5px;transform: translate3d(-10px, 0px, 0px);-webkit-transform: translate3d(-10px, 0px, 0px);-moz-transform: translate3d(-10px, 0px, 0px);-o-transform: translate3d(-10px, 0px, 0px);box-sizing: border-box;">
<section style="text-align: right;font-size: 18px;color: rgb(122, 101, 101);padding: 0px;letter-spacing: 1px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<strong style="box-sizing: border-box;">
01.申请攻略</strong>
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 0px 0% 5px;box-sizing: border-box;">
<section style="text-align: right;font-size: 12px;color: rgb(199, 162, 150);line-height: 1.2;padding: 0px 8px;letter-spacing: 1.5px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
1.1背景介绍</p>
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
1.2项目内容</p>
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
1.3申请要求</p>
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="transform: translate3d(20px, 0px, 0px);-webkit-transform: translate3d(20px, 0px, 0px);-moz-transform: translate3d(20px, 0px, 0px);-o-transform: translate3d(20px, 0px, 0px);box-sizing: border-box;">
<section style="display: inline-block;width: 50%;vertical-align: top;border-top: 3px dashed rgb(249, 226, 219);border-top-left-radius: 0px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="font-size: 14px;letter-spacing: 0.5px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;text-align: justify;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<strong style="box-sizing: border-box;">
1.1.背景介绍</strong>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;大家好，我是环境科学与工程学院15级的刘静宇，今年暑假作为南科大第一个本科生参加了哥伦比亚大学LDEO暑期实习项目。在这个项目申请以及项目过程中走过不少弯路，沮丧过失望过也开心过激动过。趁着记忆尚且清晰，就此写下这一篇文章，希望对后来申请的同学提供一些小小的帮助。</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;<span style="letter-spacing: 1.7px;box-sizing: border-box;">
&nbsp;学生组成：这个项目最初是提供给哥伦比亚大学环境科学学院和地球科学学院的本科生，使他们在大二大三的时候进入实验室与Research Scientist（研究科学家，顾名思义就是只负责做研究不用上课的科学家）们一起做研究。后来招生范围逐渐扩散到其他学校，今年的要求是一半左右的学生必须来自于社区大学（community college，通常为两年制，学费较便宜，科研机会较少）。往届的学生（可在该网址看到往届学生的abstract 和slides：https://www.ldeo.columbia.edu/education/programs/summer-internship/ldeo-interns） </span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 项目时间：十周（6.3-8.10）<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 资助情况：南科大会预先为你付好住宿费，并在8月份回来后填写交流资助表给予2800美元的补助。机票和生活费得自己承担，往返机票提前订有4000RMB左右的便宜机票，通过飞猪即可。生活费的部分，通常中餐在实验室的Cafeteria吃（注意！这里只收现金！），10美元（沙拉/套餐+咖啡）左右。早晚自己做可以控制每天的花费20美元左右，10周1400美元。交通费方面，NYC（new york city）的地铁坐一次2.75美元，你一个人从机场JFK到哥大便宜点坐地铁也要15美元。另外NYC的夏天是一年中活动最多，气候最好的时候，如果你有其他的玩乐活动，只能自己多备一点钱了。一句话，做饭能省钱，电影特别贵！</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<strong style="box-sizing: border-box;">
1.2 项目内容&nbsp;</strong>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;申请开始的时候你可以在申请的官网上看到各个教授今年夏天做的项目和需要的技能。通过与教授沟通（https://www.ldeo.columbia.edu/education/summer-internship）选择3个你最感兴趣的项目。最后由教授选择你收到offer后决定去哪一个教授组里做项目。通常宣传册上的介绍只会是一个大的方向，具体内容你要在第一周与教授谈过之后才会确认。所以第一周一般是literature review，之后就在教授的指导下开始做实验。通常每个月会有一个Research Focused Question（分别对应为Introduction, Methods, Results and Discussion)由Dallas和Michael两位研究科学家主持，三人一组做一个简单的presentation。第九周的时候要求完成一个Poster和一个1-minite-slide，然后在Monell auditorium （研究气候变化的一个中心，由于总是能模拟雨打房顶的声音我们都叫它The Rain Building)进行1-minite-slide pre以招徕观众去看你的poster（如图1）。最后就是在Comer（geochemistry building）贴上你的海报，等着教授/家长/小朋友？？来看你的poster讲解你的问题啦（如图2）！最后第十周的时候会要求你完成10 pages paper包含abstarct。同时第九周的时候会通知你提交AGU（<span style="letter-spacing: 1.7px;box-sizing: border-box;">
American Geophysical Union）fall meeting的abstarct，熟悉地学的小朋友们都知道这个会议有多么的优秀，你可以选择交或者不交。通常这个会议会在12月份召开，想陶瓷会有一点晚，但是去见见仰慕已久的笔友们还是很棒哒！另外整个项目每周二每周四中午12:30都会有seminar包含lamont的各个不同方向，个别强制要求参加，所以大家最好打包午饭。</span>
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="text-align: center;margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;box-sizing: border-box;">

</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="text-align: justify;font-size: 14px;letter-spacing: 1.7px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="text-align: center;margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;box-sizing: border-box;">

</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="font-size: 14px;letter-spacing: 1px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;text-align: justify;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
1.3 申请要求</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;<span style="letter-spacing: 1.7px;box-sizing: border-box;">
&nbsp;申请资格：请注意，一定是大二大三的本科生才可以申请！！！</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="letter-spacing: 1.7px;box-sizing: border-box;">
&nbsp; &nbsp; 原文为&nbsp;The program is open to US citizens or permanent residents&nbsp;who have completed their junior or sophomore year in college with majors in earth science, environmental science, chemistry, biology, physics, mathematics, or engineering.&nbsp;Neither graduating seniors nor international students with the exception of sophomore and junior students from SUSTech who are fully funded by their university are eligible for this internship. Minorities and women are encouraged to apply（https://www.ldeo.columbia.edu/education/programs/summer-internship/lamont-summer-intern-program）</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="letter-spacing: 1.7px;box-sizing: border-box;">
&nbsp; &nbsp;&nbsp;也就是说不仅环境专业，化学、生物、物理、数学、工程……只要对这个老师，这个课题，对地学研究感兴趣，都可以申请！ </span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 申请方式：点击网页的apply，填写网上报名表格。时间为每年的1月18日至2月18日。<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; &nbsp;申请材料：</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp; 1.成绩单扫描版学工部打印盖章即可（pdf）</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="letter-spacing: 1.7px;box-sizing: border-box;">
&nbsp; &nbsp; 2.Resume（尤其介绍自己的computer skills）</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3.Statement of interest（三段关于自己为什么选这三格课题的陈述+qualities of good scientist）</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 4. 两封教授的推荐信<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; &nbsp; 加分项:</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;One year of calculus, plus (depending on your disciplinary focus and if available to you) one previous earth, atmospheric or ocean-science course.</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;A minimum of two semesters of college-level chemistry, if selecting geochemistry research.</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;If selecting biologically oriented research, you are required to have a minimum of two semesters of college-level biology.</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;A minimum of three semesters of college-level physics, if selecting geophysics or atmospheric sciences research.</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;A minimum of two semesters of college-level geology, if selecting geology research.</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;最后，请想要申请的同学尽快办护照！护照！护照！重要的事情说三遍！</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
注意事项：</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(249, 110, 87);box-sizing: border-box;">
项目时间为每年的6月3日至8月10日。故同学在拿到offer后要申请延期期末考试（详情请参照官网http://www.sustc.edu.cn/upload/files/缓考流程.png）。所以想去的同学最好大二把必修课尽量选上，这样大三的课业不会那么重，也不会有来年开学再考N门期末的悲惨经历（通常缓考集中为开学后第二周的晚上或周末，具体顺序只能听天由命了）。</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="text-align: right;transform: translate3d(-10px, 0px, 0px);-webkit-transform: translate3d(-10px, 0px, 0px);-moz-transform: translate3d(-10px, 0px, 0px);-o-transform: translate3d(-10px, 0px, 0px);margin: 0px 0% 10px;box-sizing: border-box;">
<section style="display: inline-block;width: 50%;vertical-align: top;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="display: inline-block;width: 100%;vertical-align: top;background-color: rgb(239, 209, 170);line-height: 1;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="text-align: left;margin: 0px 0%;transform: translate3d(-2px, 0px, 0px);-webkit-transform: translate3d(-2px, 0px, 0px);-moz-transform: translate3d(-2px, 0px, 0px);-o-transform: translate3d(-2px, 0px, 0px);box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;width: 35%;box-sizing: border-box;">
<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 202 202" style="vertical-align: middle;max-width: 100%;box-sizing: border-box;" width="100%">
<polygon points="0.8,-76.2 -1.8,-278.2 202.8,-78.8" fill="#ffffff" style="box-sizing: border-box;">
</polygon>
<polygon points="0,0 202,0 0,202" fill="#ffffff" style="box-sizing: border-box;">
</polygon>
<polygon points="458,-77 256,-77 458,-279" fill="#ffffff" style="box-sizing: border-box;">
</polygon>
<polygon points="458,-8 458,194 256,-8" fill="#ffffff" style="box-sizing: border-box;">
</polygon>
</svg>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: -10px 0% 0px;box-sizing: border-box;">
<section style="font-size: 18px;color: rgb(160, 160, 160);padding: 0px 15px;letter-spacing: 1px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<strong style="box-sizing: border-box;">
02.个人体验</strong>
<strong style="box-sizing: border-box;">
<br style="box-sizing: border-box;">
</strong>
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="text-align: left;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 0px 0% 12px;box-sizing: border-box;">
<section style="font-size: 12px;color: rgb(255, 255, 255);line-height: 1.2;letter-spacing: 1px;padding: 0px 10px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
2.1住宿条件<br style="box-sizing: border-box;">
</p>
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
2.2科研体验</p>
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
2.3业余生活</p>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="text-align: justify;font-size: 14px;letter-spacing: 1.7px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="text-align: justify;font-size: 14px;letter-spacing: 1.7px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="text-align: justify;font-size: 14px;letter-spacing: 1.7px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 0px 0%;text-align: center;font-size: 11px;box-sizing: border-box;">
<section style="overflow: hidden;display: inline-block;box-sizing: border-box;">
<section style="width: 5em;height: 3em;overflow: hidden;vertical-align: top;display: inline-block;box-sizing: border-box;">
<section style="transform: rotate(45deg);-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);-o-transform: rotate(45deg);box-sizing: border-box;">
<section style="width: 4em;height: 4em;padding: 8px;margin: 15px auto 0px;border-left: 0.1em solid rgb(239, 209, 170);border-top: 0.1em solid rgb(239, 209, 170);box-sizing: border-box;">
<section style="width: 0px;border-top: 1.5em solid rgb(239, 209, 170);border-left: 1.5em solid rgb(239, 209, 170);border-bottom: 1.5em solid transparent !important;border-right: 1.5em solid transparent !important;box-sizing: border-box;">
</section>
</section>
</section>
</section>
<section style="font-size: 14px;color: rgb(255, 255, 255);box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="background-color: rgb(236, 185, 169);box-sizing: border-box;">
我可爱的室友们</span>
</p>
</section>
<section style="width: 5em;height: 3em;overflow: hidden;vertical-align: bottom;display: inline-block;box-sizing: border-box;">
<section style="transform: rotate(-135deg);-webkit-transform: rotate(-135deg);-moz-transform: rotate(-135deg);-o-transform: rotate(-135deg);box-sizing: border-box;">
<section style="width: 4em;height: 4em;padding: 8px;margin: -1.8em auto 0px;border-left: 0.1em solid rgb(239, 209, 170);border-top: 0.1em solid rgb(239, 209, 170);box-sizing: border-box;">
<section style="width: 0px;border-top: 1.5em solid rgb(239, 209, 170);border-left: 1.5em solid rgb(239, 209, 170);border-bottom: 1.5em solid transparent !important;border-right: 1.5em solid transparent !important;box-sizing: border-box;">
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 0px 0%;text-align: center;box-sizing: border-box;">
<section style="display: inline-block;vertical-align: top;width: 48%;padding: 0px 5px 0px 0px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;text-align: right;box-sizing: border-box;">
<section style="width: 100%;background-color: rgb(250, 199, 199);box-sizing: border-box;">
<section style="padding: 5px 10px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="color: rgb(255, 255, 255);font-size: 12px;letter-spacing: 5px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
●●●●●●</p>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;border-style: solid;border-width: 4px;border-radius: 0px;border-color: rgb(242, 218, 202);box-sizing: border-box;">

</section>
</section>
</section>
</section>
<section style="display: inline-block;vertical-align: top;width: 48%;padding: 0px 0px 0px 5px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;border-style: solid;border-width: 5px;border-radius: 0px;border-color: rgb(245, 241, 204);box-sizing: border-box;">

</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;text-align: left;box-sizing: border-box;">
<section style="width: 100%;background-color: rgb(236, 185, 169);box-sizing: border-box;">
<section style="padding: 5px 10px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="color: rgb(255, 255, 255);font-size: 12px;letter-spacing: 3px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
♦♦♦♦♦♦</p>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="text-align: center;margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;box-sizing: border-box;">

</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="text-align: center;margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;box-sizing: border-box;">

</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="text-align: justify;font-size: 14px;letter-spacing: 1.7px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
2.1<span style="letter-spacing: 1.7px;box-sizing: border-box;">
住宿情况</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="letter-spacing: 1.7px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="letter-spacing: 1.7px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;2018年我们安排住在110街上西区的Cathedral Garden，据说是哥大最好（新）的宿舍。套间（四人款，两个单人间，一个双人间，一个厨房一个起居室）如上图，我自个儿的房间，有空调，背后是衣柜可以放行李箱挂衣服，右边有一个书桌，上面配有一个台灯。</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="letter-spacing: 1.7px;box-sizing: border-box;">
&nbsp; &nbsp; 看到这里读者肯定发现一个问题，床怎么这么高！哥大宿舍的床普遍这么高，为了给学生放衣柜和鞋子还有行李箱，但本钢铁·少女·东西少腿短，每次上床都要180度体式翻转。（注意！如果你要带床单，床的大小跟南科大一样，但请带防滑/多毛的那种，因为本少女每次上床床单都会溜下来QAQ）宿舍里配备有烤炉冰箱但没有微波炉，可以跟室友商量在Amazon/Carglist上买60刀就可以买一个。洗碗机是懒人福音但要注意清洁还有通水槽。厨房、浴室和餐厅作为公共区域是最容易引起矛盾的，作为南科大的优良学子，请注意保持清洁，最好每周五打扫一次。浴室一般会有一个浴帘，请一定要把里面的一层放在里边，不然水会撒出去成为厕所池塘！（不要问我是怎么知道的QAQ）。</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="letter-spacing: 1.7px;box-sizing: border-box;">
&nbsp; &nbsp; 注意！此宿舍最令人吐槽的地方在于没有wifi，如果大家需要学习，可以去顶层的10楼（好像是）的洗衣房旁的自习室里蹭wifi，或者去楼下旁边的Starbucks（开到10点）、Butler图书馆，就是哥大主校区张开双手女神像对面的那栋建筑暑期工作日11点关门，但晚上一个人胆小最好约室友一起去。虽然本少女经常一个人晚上走着回，感觉街上不是很乱，但有时候会遇到乞讨的流浪汉，会有一些紧张。</span>
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="letter-spacing: 1.7px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
2.2科研体验</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 通勤：讲到这可能有些勤奋好学的小朋友要问了，啊，那我可不可以留在实验室学习呢？答案是：NO！实验室在新泽西，宿舍在NYC曼哈顿的上西区，每天大家都需要在8:10左右出门，从riverside park 走15分钟的路（快的话）到106街哥大校门口，坐8:30黄色的幼儿园小巴士去新泽西，全程接近50分钟。9:30到达实验室，一般10:00正式开始工作，4:30pm黄色小巴士又会载你回到106街。如果你不满足这么短的工作时间，可以搭载lamont自己的bus，最早为8:00AM在120街Amesterdam Ave. Teachers College 门口，最晚周一到周四为19:00，周五为18:00。周六只有早上9:00下午18:00的shuttle，周日没有bus！<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 老师指导：我自己跟的教授较为年轻，只有一个博士生，平时都是他直接在实验室指导我们做实验和阻止我们讨论journal club。邮件是沟通的主要方式，约会（会议）等都是通过邮件交流。另外像大型的仪器使用，比如HPLC、XRD、Gamma Detector等都有专门的Lab Technician负责，邮件沟通约好时间后会很耐心的指导你做实验。换一个仪器，换一个lab technician，也考验了你的沟通能力和协调能力。据我所知还有些老师外出开会比较多，这样指导你做实验的主要会是博士生，但博士生也很厉害！我室友就是一个博士指导的，很耐心很nice～<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; Seminar：seminar除了邀请各个方向的教授（主要是intern的导师）来做讲座之外，还有一场career introduction,会有哥大本科生介绍他们申请graduate school的情况。这个时候你就会发现gap做research assistant的人有多么多了，一是PhD的工资其实是很低的，而且学术界，1个research scientist的工资还没有当地的高中老师工资高；二是现在竞争压力确实大，科研经历没有两三段发足够量的paper是很难被录取的。除此之外还会有从lamont毕业的博士生研究生介绍他们在环境咨询公司和传统公司工作的经验。<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 科研压力：这取决于你自身的努力程度。这个项目主要是让本科生有一个实际的科研机会，三个月的时间也很难有特别大的突破，但每天付出都少时间取决于你自身。另外实验室是不允许本科生单独在的，周六去需要lab manager或者你的导师在场。</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
3. 业余生活</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 集体活动：整个项目举办了三次集体活动，第一次是报到第一天在宿舍旁一起吃了顿饭，大家坐在一起尬聊背景生活自己的项目。然后很多时候你就会发现对方说的英文单词你都不懂，没关系这个时候你就大胆的问吧！说不定还会收获一段美丽的友谊/爱情！第二次是迎新party在去lamont的第一天，大家也就吃吃喝喝再来一次自我介绍，这时候你可以约上今天认识合眼缘的朋友一起逛lamont，真的超美的！第三次在第九周的final party，我因为赶ddl没有参加，但听说还很好玩，其中还送了帽子为纪念品嘻嘻。<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 个人旅游：详情请参照知乎-NYC有什么好玩的地方？（经典的旅游景点，数不尽的博物馆，免费的音乐会脱口秀等等）<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 交友：一定要主动搭讪！一定要主动搭讪！一定要主动搭讪！搭讪三句宝</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;项目开始之前: How you doing? What's your project? Why you choose your major?<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 项目开始之后：How was your day? What's your plan for the weekend? 然后就是共同感兴趣的活动约约约啦。</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6月底NYC一般会有一个LGBT Pride，感兴趣的同学可以去体验一下，非常的intense！</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;有用的App： Yelp（类似于大众点评）， Google Map，Facebook（上面有各种各样events，博物馆免费夜呀之类的你加了好友之后别人interested的活动你都可以看到然后你可以私下问问她一起去嘛之类的）<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp; &nbsp; 安全：注意防骗、防抢，平时出门不要带20美元以上的现金，不要亲信那些向你要钱人的话，晚上8:00之后不要去公园。<span style="letter-spacing: 1.7px;box-sizing: border-box;">
&nbsp;&nbsp;</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
&nbsp;&nbsp;&nbsp;&nbsp;<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="text-align: justify;font-size: 14px;letter-spacing: 1.7px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 0px 0%;text-align: center;font-size: 11px;box-sizing: border-box;">
<section style="overflow: hidden;display: inline-block;box-sizing: border-box;">
<section style="width: 5em;height: 3em;overflow: hidden;vertical-align: top;display: inline-block;box-sizing: border-box;">
<section style="transform: rotate(45deg);-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);-o-transform: rotate(45deg);box-sizing: border-box;">
<section style="width: 4em;height: 4em;padding: 8px;margin: 15px auto 0px;border-left: 0.1em solid rgb(239, 209, 170);border-top: 0.1em solid rgb(239, 209, 170);box-sizing: border-box;">
<section style="width: 0px;border-top: 1.5em solid rgb(239, 209, 170);border-left: 1.5em solid rgb(239, 209, 170);border-bottom: 1.5em solid transparent !important;border-right: 1.5em solid transparent !important;box-sizing: border-box;">
</section>
</section>
</section>
</section>
<section style="font-size: 14px;color: rgb(255, 255, 255);box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="background-color: rgb(236, 185, 169);box-sizing: border-box;">
Natural History Muesum| 我 | MoMA</span>
</p>
</section>
<section style="width: 5em;height: 3em;overflow: hidden;vertical-align: bottom;display: inline-block;box-sizing: border-box;">
<section style="transform: rotate(-135deg);-webkit-transform: rotate(-135deg);-moz-transform: rotate(-135deg);-o-transform: rotate(-135deg);box-sizing: border-box;">
<section style="width: 4em;height: 4em;padding: 8px;margin: -1.8em auto 0px;border-left: 0.1em solid rgb(239, 209, 170);border-top: 0.1em solid rgb(239, 209, 170);box-sizing: border-box;">
<section style="width: 0px;border-top: 1.5em solid rgb(239, 209, 170);border-left: 1.5em solid rgb(239, 209, 170);border-bottom: 1.5em solid transparent !important;border-right: 1.5em solid transparent !important;box-sizing: border-box;">
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 0px 0%;text-align: center;box-sizing: border-box;">
<section style="display: inline-block;vertical-align: top;width: 48%;padding: 0px 5px 0px 0px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;text-align: right;box-sizing: border-box;">
<section style="width: 100%;background-color: rgb(250, 199, 199);box-sizing: border-box;">
<section style="padding: 5px 10px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="color: rgb(255, 255, 255);font-size: 12px;letter-spacing: 5px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
●●●●●●</p>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;border-style: solid;border-width: 5px;border-radius: 0px;border-color: rgb(242, 218, 202);box-sizing: border-box;">

</section>
</section>
</section>
</section>
<section style="display: inline-block;vertical-align: top;width: 48%;padding: 0px 0px 0px 5px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;border-style: solid;border-width: 5px;border-radius: 0px;border-color: rgb(245, 241, 204);box-sizing: border-box;">

</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;text-align: left;box-sizing: border-box;">
<section style="width: 100%;background-color: rgb(236, 185, 169);box-sizing: border-box;">
<section style="padding: 5px 10px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="color: rgb(255, 255, 255);font-size: 12px;letter-spacing: 3px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
♦♦♦♦♦♦♦</p>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="font-size: 14px;letter-spacing: 1.7px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="text-align: justify;font-size: 14px;letter-spacing: 1.7px;color: rgb(155, 146, 121);padding: 0px 12px;line-height: 1.7;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 0px 0%;text-align: center;font-size: 11px;box-sizing: border-box;">
<section style="overflow: hidden;display: inline-block;box-sizing: border-box;">
<section style="width: 5em;height: 3em;overflow: hidden;vertical-align: top;display: inline-block;box-sizing: border-box;">
<section style="transform: rotate(45deg);-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);-o-transform: rotate(45deg);box-sizing: border-box;">
<section style="width: 4em;height: 4em;padding: 8px;margin: 15px auto 0px;border-left: 0.1em solid rgb(239, 209, 170);border-top: 0.1em solid rgb(239, 209, 170);box-sizing: border-box;">
<section style="width: 0px;border-top: 1.5em solid rgb(239, 209, 170);border-left: 1.5em solid rgb(239, 209, 170);border-bottom: 1.5em solid transparent !important;border-right: 1.5em solid transparent !important;box-sizing: border-box;">
</section>
</section>
</section>
</section>
<section style="font-size: 14px;color: rgb(255, 255, 255);box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="background-color: rgb(236, 185, 169);box-sizing: border-box;">
梵高 | 我 | 盛夏的NYC</span>
</p>
</section>
<section style="width: 5em;height: 3em;overflow: hidden;vertical-align: bottom;display: inline-block;box-sizing: border-box;">
<section style="transform: rotate(-135deg);-webkit-transform: rotate(-135deg);-moz-transform: rotate(-135deg);-o-transform: rotate(-135deg);box-sizing: border-box;">
<section style="width: 4em;height: 4em;padding: 8px;margin: -1.8em auto 0px;border-left: 0.1em solid rgb(239, 209, 170);border-top: 0.1em solid rgb(239, 209, 170);box-sizing: border-box;">
<section style="width: 0px;border-top: 1.5em solid rgb(239, 209, 170);border-left: 1.5em solid rgb(239, 209, 170);border-bottom: 1.5em solid transparent !important;border-right: 1.5em solid transparent !important;box-sizing: border-box;">
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin: 0px 0%;text-align: center;box-sizing: border-box;">
<section style="display: inline-block;vertical-align: top;width: 48%;padding: 0px 5px 0px 0px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;text-align: right;box-sizing: border-box;">
<section style="width: 100%;background-color: rgb(250, 199, 199);box-sizing: border-box;">
<section style="padding: 5px 10px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="color: rgb(255, 255, 255);font-size: 12px;letter-spacing: 5px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
●●●●●●</p>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;border-style: solid;border-width: 5px;border-radius: 0px;border-color: rgb(242, 218, 202);box-sizing: border-box;">

</section>
</section>
</section>
</section>
<section style="display: inline-block;vertical-align: top;width: 48%;padding: 0px 0px 0px 5px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;border-style: solid;border-width: 5px;border-radius: 0px;border-color: rgb(245, 241, 204);box-sizing: border-box;">

</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="margin-top: 10px;margin-bottom: 10px;text-align: left;box-sizing: border-box;">
<section style="width: 100%;background-color: rgb(236, 185, 169);box-sizing: border-box;">
<section style="padding: 5px 10px;box-sizing: border-box;">
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="color: rgb(255, 255, 255);font-size: 12px;letter-spacing: 3px;box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
♦♦♦♦♦♦♦</p>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="text-align: justify;font-size: 12px;letter-spacing: 1.7px;color: rgb(186, 159, 159);padding: 0px 10px;line-height: 1.8;box-sizing: border-box;">
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<strong style="box-sizing: border-box;">
<span style="line-height: 1.78;box-sizing: border-box;">
本文作者：刘静宇</span>
</strong>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<strong style="box-sizing: border-box;">
<span style="line-height: 1.78;box-sizing: border-box;">
致谢：南方科技大学，国际合作部李远老师，郑焰老师，Cassie Xu, Dallas Abott, Annimarie Pillsbury, Sarah Ortiz, Solana Huang, Shelly Lim, Zoe Kruass</span>
</strong>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<span style="line-height: 1.78;box-sizing: border-box;">
mua~</span>
</p>
<p style="white-space: normal;margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="box-sizing: border-box;">
<p style="margin: 0px;padding: 0px;box-sizing: border-box;">
<br style="box-sizing: border-box;">
</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="box-sizing: border-box;">
<section style="font-size: 12px;color: rgb(199, 162, 150);box-sizing: border-box;">
<p style="text-align: center;margin: 0px;padding: 0px;box-sizing: border-box;">
▷ &nbsp;送你一个小葡萄！&nbsp; ◁</p>
</section>
</section>
</section>
<section class="" style="box-sizing: border-box;" powered-by="xiumi.us">
<section style="text-align: center;margin-top: 10px;margin-bottom: 10px;box-sizing: border-box;">
<section style="max-width: 100%;vertical-align: middle;display: inline-block;box-sizing: border-box;">

</section>
</section>
</section>
</section>`,
	},
	{
		DisplayName:       `红薯酱弹吉他`,
		School:            `山东大学`,
		MajorLine:         `Summer Research`,
		ArticleTitle:      `山大飞跃手册 | Summer Research 深造/留学`,
		LongBioPrefix:     sduFeyueLongBioPrefix,
		ShortBio:          `山东大学Summer Research，深造/留学，分享申请与升学经验。`,
		Audience:          sduFeyueAudience,
		WelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,
		Education:         sduFeyueEducation,
		MajorLabel:        sduFeyueMajorLabel,
		KnowledgeCategory: sduFeyueKnowledgeCat,
		KnowledgeTags:     sduFeyueKnowledgeTags,
		SampleQuestions: []string{`山大申请海外PhD需要什么条件？`, `如何准备GRE和托福？`, `985背景如何定位选校？`},
		ExpertiseTags: []string{`留学申请`, `山东大学`, `Summer Research`},
		OriginalAuthor: `columbia_environment_LDEO_wuxin`,
		Source: `山东大学飞跃手册`,
		KnowledgeBody: `# 哥伦比亚大学LDEO暑期科研



> by 武鑫 11612722 树仁书院 环境科学与工程学院

## 一、哥伦比亚大学暑期科研项目内容介绍

美国哥伦比亚大学，是一所位于美国纽约曼哈顿的世界顶级私立研究型大学，为美国大学协会（AAU）的十四所创始院校之一，常春藤盟校之一。哥伦比亚大学在2019年的USNews美国大学综合排名第3名，世界大学排名第8名。

该实习项目由哥伦比亚大学地球科学研究所、拉蒙特-多尔蒂地球观测站（Lamont-Doherty Earth Observatory）、巴纳德学院（Barnard College）和地球与环境科学系共同资助，面向哥伦比亚大学本校学生，社区大学，和南方科技大学环境、海洋、地球与空间科学等相关专业的大二、大三本科生开放申请。具体申请信息可关注南科大环境公众号或者去官网查询：[www.ldeo.columbia.edu](http://www.ldeo.columbia.edu)

项目时间： 十周（5月28日到8月3日）

 |

## 二、哥伦比亚大学暑期科研申请攻略

1. 面向学生：

大二、大三年级本科生；

对地球科学、大气科学或者海洋科学研究感兴趣；

建议修读至少两门地球科学、大气科学或者海洋科学课程；生物、化学、等其他专业学生可通过官网查询查找自己感兴趣的项目和老师进行申请：www.ldeo.columbia.edu/education/programs/summer-internship/lamont-summer-intern-program

已修读过至少一年的微积分课程

2. 申请方式

每年申请截止时间不同，可关注南科大环境公众号根据提供的网页链接线上填写表格。

3. 申请材料

成绩单电子版；

Resume:简历主要介绍自己的选修课程，主要科研经历，编程技能；

Statement of interest：根据哥大发的项目介绍选择三项自己感兴趣的，并确定一二三志愿，描述成为一个优秀科学家的必备素质；

两封教授的推荐信；

4. 衣食住行

由哥伦比亚大学统一安排在学校宿舍，我们住在Columbia Main Campus Certhedral Garden，一般为五人到六人合住（三到四个个单人间一个双人间），十楼备有洗衣房和公共休闲区，住宿费用由南方科技大学预先缴费。

交通方面，从宿舍到Lamont研究所大概花费一小时或者四十分钟，本项目负责老师Dallas会给Intern安排早上八点半在Broadway 116st的免费小巴士（特别像幼儿园接送校车），下午四点半再从Lamont返回；从Main Campus到Lamont每小时也会一趟往返shuttle。NYC的地铁坐一次2.75美元（可以选择refill time和refill value，如果经常出去玩建议refill time一个月花费150美元），如果地铁转乘公交的话两个小时内不收费。

饮食方面，在Lamont研究所的Cafeteria吃一般为各种特色沙拉，汉堡，香菇汤或者杂烩鸡汤，一餐大概八到十美元；自己做饭的话很划算，哥大会给每间公寓提供足够多的餐具，住宿附近会有Foodtown和Market提供蔬菜主食材料，做中餐的话附近110街会有Hmart一家韩国超市其中有丰富的中国食材，大概每周花费三十到四十美元。

美国六月期月份是多雨季节，温差大，建议多带外套，长衣长裤。

5. 资助情况

除住宿费外，南方科技大学还将提供一定金额的生活费补助，1.5万元。需要在六月份前申请留学交流资助，做好留校及交流备案机票和生活费得。

主要花费：办理美国J1交流签证，还有Intern交流费用（总共340美元）；往返机票提前一个月预订（花费4000元左右；饮食交通十周花费1000美元左右。

6. 注意事项

申请J1签证除了填写DS-160表格，还需要哥大方提供DS-2019表格，该表格需要填写自己研究项目和学习计划，后由Lamont国际合作部和导师签字邮寄到学校。时间安排比较紧张建议尽早填写。

同学在拿到offer后要申请延期期末考试，所以想去的同学最好大二把必修课尽量选上，这样大三下学期的课业不会那么重。

## 三、科研经历分享

  本次去哥伦比亚大学Lamont研究所进行了为期十周的大气污染与人体健康方面的研究，受益匪浅。整个暑期项目一共有33个实习生，分别来自哥大Barnard college,纽约社区大学和南科大环境系。十周的科研安排很紧凑，我们在第一周参观Lamont不同地质、海洋，生态不同领域研究楼，进行实验安全培训，分别与自己的mentor见面确定具体研究方向、每周开会时间等细节；在第一个月（第四周）左右完成自己课题的proposal，具体包括specific research question, methods 两项内容，会在Dallas(该项目带队研究科学家）的安排下三人一组开展口头报告（讨论比较轻松，主要是分享自己的课题内容）；在第二个月会重新分组完整的讲述自己研究内容（research question，methods, result); 最后一周比较关键也是最繁忙的一周，最后一天早上需要在Monell auditorium 完成 1-min- slide 的报告（一般是30-45秒，33个实习生连续不间断的简短介绍自己的研究，语速快到飞起），下午在Comer building 一楼站在各自的Poster展示区向大家介绍自己的这十周的研究成果。另外Dallas每周都安排了Lamont研究所里的科学家向大家分享自己的研究（例如Geomap、Climate change、responsible Science)。

 |

  我的研究课题是在骑行过程中评估纽约曼哈顿区超微粒子污染程度，出野外就是背着二十多个测空气质量的设备骑着半电动自行车在曼哈顿区环形。我影响最深刻的一次骑行是从Hudson river 出发，到达Washington square Park后再经过一条Business Street沿着Central Park 中间的畅通无阻的骑行道返回Main Campus, 历时两小时四十分钟，总长 15.6英里。



## 四、生活娱乐

  这两个多月我提升最高的不仅仅是英语，还有厨艺。因为很不习惯美国的饮食，Lamont 又提供了很完备的厨具，我们同行的三个人基本上每天都是在公寓自己做饭，每周都会去Food town 大采购水果蔬菜或者去H-mart一家韩国超市买一些华人主食。后来因为个人口味不同我们分开在各自的公寓做饭，我的厨艺真的是大大提升，同时也会经常和我的一位来自厄瓜多尔舍友分享食物。这位舍友在五年前来纽约之前并不通晓英语，现在在新泽西一所社区大学读大三，最震撼的是儿子已经17岁了马上跟她一样步入大学。她的经历让我觉得人生充满无限可能，只要保持一颗年轻的心不断奋进！`,
	},
	{
		DisplayName:       `椰子oo逛公园`,
		School:            `山东大学`,
		MajorLine:         `Summer Research`,
		ArticleTitle:      `山大飞跃手册 | Summer Research 深造/留学`,
		LongBioPrefix:     sduFeyueLongBioPrefix,
		ShortBio:          `山东大学Summer Research，深造/留学，分享申请与升学经验。`,
		Audience:          sduFeyueAudience,
		WelcomeMessage:    `你好，欢迎问我关于升学深造、备考和择校的问题。`,
		Education:         sduFeyueEducation,
		MajorLabel:        sduFeyueMajorLabel,
		KnowledgeCategory: sduFeyueKnowledgeCat,
		KnowledgeTags:     sduFeyueKnowledgeTags,
		SampleQuestions: []string{`山大申请海外PhD需要什么条件？`, `如何准备GRE和托福？`, `985背景如何定位选校？`},
		ExpertiseTags: []string{`留学申请`, `山东大学`, `Summer Research`},
		OriginalAuthor: `importance_of_summer_research_in_CS_yanxiangyi`,
		Source: `山东大学飞跃手册`,
		KnowledgeBody: `# 在计系，暑研对北美申请重要性的讨论

by [15级-计算机-阎相易](个人申请总结/计算机科学与工程系/[US]-15-阎相易)

在计系，如果没有北美暑研的经历，基本不可能申请到好学校的PhD项目。

- Why?

  1. 大背景：
    CS大热，申请北美的学校时，大家不仅要和其他学校计算机系同级的同学竞争，还要面临转专业大军和大批美本、美硕的涌入，CS的application pool永远处于饱和状态，说CS是最难申请的专业一点都不夸张。

  2. PhD申请要素：
    - 英语（相对不重要）：TOEFL（一般过百即可） + GRE （一般V过150即可）
    - GPA（相对不重要）：3.7+
    - Paper（相对重要）
    - 推荐信（非常重要）：
      - 规律一：国内无效
      由于多年国内糟糕的推荐信风气（让学生写了之后发给老师改改就提交，或者老师直接把网申系统填推荐信的链接发给学生自由处置），大陆教授的推荐信越发不值钱。

      - 规律二：亲近、了解大于牛
      假如你的导师人品合格、学风端正，决定亲自来写推荐信，则此规律生效，即：跟你亲近的、了解你日常生活、学习、科研的导师的“了解推”，要比只是title上高（xxx院士、xxx fellow、xxx chair）但是并不了解你的导师的“普通推”有效很多。

  3. 我系现状：
    我们系的绝大部分教授博士毕业于香港、英国、日本和新加坡，我了解到的深度合作院校是悉尼科技大学，最近加入我系的图灵奖得主之前工作的学校是EPFL，我们就索性把欧陆也加进去吧。由此可见，我系的connection主要还是和这些地方多，目前我了解到的只有郝祁、张煜群老师博士毕业于北美高校。

    我系学生申请这些地方的学校要比北美容易很多（北美本身就是最难+没有connection）。因此如果要申请北美的PhD，基本就只能靠自己折腾了。

- How?

  按成功概率排名：

  1. 暑研项目：
    随着大家越来越意识到暑研的重要性，暑研项目也变成了“小申请”，每年的难度都在增加。

    1）我校有两个优秀的暑研项目：
    - [CSST @ UCLA](https://csst.ucla.edu/)：
      难，算上我校优秀的补贴，自己不花钱。

    （我系最终入选人数/我系进入面试人数）
      - 13级：1/2人。
      - 14级：0/0人。
      - 15级：1/2人。
      - 16级：0/0人。

    - [UCInspire @ UCI](https://sites.uci.edu/ucinspire/)：

      一年比一年难，算上我校优秀的补贴，自己大约3-4万，我系15级入选8人左右。

    2）可以自己申请的：
    - [MITACS @ 加拿大](https://www.mitacs.ca/en)
    - [ICT Summer Research Program @ USC](http://ict.usc.edu/academics/internships/)
    - [RISS @ CMU](https://riss.ri.cmu.edu/)（不要抱~~太大~~任何希望）

    3）欧洲：
    - [Summer @ EPFL](https://summer.epfl.ch/)（不要抱~~太大~~任何希望）

    如有其他优秀项目，欢迎大家提PR补充。

  2. 如果之前有过科研实习，实习单位导师可以推。

  3. 导师通过connection推。

  4. 自己发邮件套。

  通过暑研项目找到暑研的概率要比后面三种的概率大很多，先不谈有多少竞争者，或者对方老板的位置早就被熟人推过去的学生填满了。

  我们来看一个实际的问题：签证。

  通过暑研项目，走的是F1签证-学生签，也就是officially你是被算作去“上课”的，只不过是实验室自习课hhh，这种签证比较好过，而且上上下下都有项目小秘打点，教授不用跑这跑那操心你的签证，也不用给你发stipend。

  后三种方式，走的是J1签证-访问学者签，对面老板不仅要帮你四处奔波办手续，要面临你被拒签的风险，还可能要给你发工资。

  所以除非是非常铁的熟人推，或者是你特别特别牛，后三种方式，都很困难。



附表：对于推荐信的理解

| 描述 | 有效性 |           
| :---: | :---: |
| 北美圈子里有名的教授强推 | 五星 |
| 北美圈子里有名的教授普通推 | 四星 |
| 圈子里有名的外国教授的强推 | 四星 |
| 圈子里有名的外国教授的普通推 | 三星 |
| 非常了解你的、不一定要非常牛的大陆教授的走心推荐 | 三星 |
| 只是很牛但不了解你的大陆教授的推荐 | 没用 |
| 其他 | 减分 |

  联系方式：x.yan@uci.edu。`,
	},
}
