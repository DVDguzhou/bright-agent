package yantuseed

const thuFlyLongBioPrefix = `本文来自清华大学飞跃手册，著作权属原作者；以下为留学申请经验分享。`

const (
	thuFlyAudience       = `清华大学或其他高校的学生，考虑出国留学深造。`
	thuFlyEducation      = `本科/硕士（在读或已录取）`
	thuFlyMajorLabel     = `留学申请方向`
	thuFlyKnowledgeCat   = `清华飞跃经验`
)

var thuFlyKnowledgeTags = []string{"留学", "清华大学", "飞跃手册", "PhD", "申请", "出国"}

var thuFlyProfiles = []Profile{
	{
		DisplayName:       `芒果煮火锅`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | compare`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：compare。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `通常情况下，做出合理的选校，正常完成申请流程后，你应该会收到至少一个 offer。

当 offer 数量大于 1 时就需要做出选择。

如果你已经按照建议 [分层选校](./../../prepare/selection/)，那么你基本上也做好了项目志愿排序，可以按照申请前选校的想法接 offer。

但是，由于申请季战线足够长，以至于你的想法可能发生变化，你也会了解到新的信息和受到其他因素的干扰（如 [funding](./../funding) 额度、项目变化、意向导师跑路、个人感情等）。这时候在做出选择时就需要综合考虑各方面因素，如个人志趣、发展计划、经济条件等，遵从自己的原则和内心。

如果实在做不出选择，可以向和师长、朋辈、家人等商讨和征求意见，但最终的决定权一定 **在你自己手中**。很多时候，你问别人的时候其实是在问自己，你已经有答案了，你寻求的并不是对方的意见，而是对方的肯定和认同。

Follow your heart and you will not regret.


!!! note "全聚德"

    虽然这种情况发生的可能性不大，但是由于选校策略、国际关系、个人原因等复杂情况导致了不幸的发生，也不要气馁。接受现实，快速调整，然后做出下一步计划。`,
	},
	{
		DisplayName:       `珍珠9`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | Funding`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：Funding。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# Funding

做任何事情都是需要钱的，读研也不例外。对于海外留学来说常见的其它 funding 来源包括：

1. Fellowship：向学校申请或录取时附带。主要是由大学、研究机构、政府和私人机构提供的资金，用于支持学生在研究生阶段的学习和研究。奖学金通常涵盖学费、生活费、研究经费等方面的支持，并且通常不需要学生做任何工作。且一个显著的好处是不上税。

2. Assistantship：PhD 附带，MS 可申请。主要是由大学和研究机构提供的资金，用于支持学生在研究生阶段的学习和研究。Assistantship 通常包括 TA（Teaching Assistantship）和 RA（Research Assistantship）两种形式。TA通常需要学生协助教授完成课程教学工作，而RA则需要学生协助教授或研究机构进行研究工作。

3. Stipend：PhD 附带，由大学或研究机构提供，旨在帮助学生支付生活费用，如食宿、交通、医疗保险等。
    - [PhD Stipends](https://www.phdstipends.com/results)

4. CSC 国家公派留学：由国家留学基金委员会(China Scholarship Council)提供海外生活费。
    - [国家留学网](https://www.csc.edu.cn/)
    - [2023年国家留学基金资助出国留学人员选派简章](https://www.csc.edu.cn/article/2613)

5. Work：部分国家（如德国）的学签支持一定时间的课外工作，可以自行在校外打工或实习。


对于 PhD 项目申请一般都是带奖的（当然这个奖可能有很多个 component，比如有几年发 fellowship 有几年发 stipend，或者要做 TA/RA 来发 stipend 等等）。 master 项目一般是不带奖的，或者需要自己申请。我们建议同学们在面试和接 offer 前注意一下 funding 问题，尤其是 PhD 项目，因为 funding 问题可能会影响你的整个科研生活体验。`,
	},
	{
		DisplayName:       `核桃看日落`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | rent`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：rent。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `## 校内宿舍

由于土地、资金有限，美国许多大学都只要求本科一年级的新生入住学校宿舍。而且学校宿舍的费用一般也比外面租房费用高。大部分的留学生/研究生都会选择和同学一起租房。

但也有一些学校为研究生提供校内宿舍，具体情况请参考学校Housing部门的规定。住在校内宿舍比较安全、方便。

## 校外租房

首先，要明确“校外租房”的概念——“校外租房”不是指在学校区域范围之外租房，而是指租住非学校官方管理的房屋。也就是说，有可能你租的房子比学校宿舍离教室/实验室更近。

大二以上的本科生、研究生都会选择校外租房，不仅性价比更高（方便自己做饭，独享卧室和卫生间等），而且寒暑假也不会因为学校关闭需要搬离。

通常大学周围都会有为学生提供住宿的 apartment 或 house。

!!! note
    早考虑，早商量，早看房。

在确定去向之后就应该尽快寻找房源，不仅会有更大的选择空间，挑到满意的房型，也可以避免签约高峰期房屋涨价。早签约通常还可以获得一些优惠（Early Bird Discount）。

**一旦签订合同，仅因个人原因不入住或者提前退宿，则不能取消，只能转租**

!!! note
    个别地区仅支持线下看房，可以麻烦在当地的学长学姐看房，或入境后先入住青旅等地。

### 考虑因素

#### 位置
位置是最重要的因素之一。首先要考虑安全性，是否住在校区内，以何种交通方式上学。离校区中心越近的房子越安全。步行考虑距离和时间；校外考虑公交、校车的线路和站点；开车考虑停车位和收费等。

其次要考虑生活便利程度，住处周围是否有商业服务，到常去的图书馆、体育馆的距离。服务业越多，生活越便利，但可能比较喧嚣。

#### 价格
请根据个人的经济情况合理定位。房屋根据地理位置、房型大小、物业服务、房子的新旧等因素差异很大。一套房子内的床位越多，则每个人分摊的价格越少。

房屋除了租金之外，还会有水费、电费、网费、燃气费、垃圾费、停车费以及保险费等等。

!!! note
    租房合同中应写明租金里包括和不包括的部分，如有疑惑及时联系提供方核实。

#### 房型

房型通常用 XBYB 表示，即 X 个 Bedroom，Y 个 Bathroom（1.5B 表示一个完整卫浴，另一个不能洗澡）

- 常见户型：(价格降序)

|户型|描述|
|---|---|
|Studio/1B1B|独享卧室、卫生间、客厅和厨房|
|2B1B/2B2B|2 个卧室，1~2 个卫生间，共享客厅和厨房|
|3B3B/3B2B/3B1B|3 个卧室，1~3 个卫生间，共享客厅和厨房|
|4B4B/4B3B/4B2B|4 个卧室，基本是最大的户型，也是常见的合租户型|

### 信息来源

留学群：提前搬离的同学都会找人转租，也有租了 house 找室友分摊房费。

微博、小红书等：会有一些同学或中介将房屋信息发在自媒体上。

!!! warning

    谨防虚假信息和诈骗！不要轻易相信学长、熟人，谨防杀熟被坑。

著名的 [Apartment.com](https://www.apartments.com/)：可以地图看房，联系对应房源的房东或房屋中介获取更多信息。

### 流程

1. 选房：明确自己的需求、预算等寻找房源。看好心仪且空余的房屋后，就可以和中介/房东沟通，表明租房意愿，获得详细信息。

2. 申请：确认无误后，通常需要登记相应的身份证明、财力证明等文件，有时还需要缴纳 app fee, deposit fee 等。对方会审核背景资料，通过后发送租赁合同。

3. 签合同：仔细阅读检查合同，确认 **所有条款和信息无误** 后再签署合同。依照合同支付押金和首月房租。

4. 入住：等待入住日期搬入。`,
	},
	{
		DisplayName:       `奶酪雪花`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | 疫苗和体检`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：疫苗和体检。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 疫苗和体检

前往其它国家并停留较长时间都会有相应的检疫要求，一般收到 offer 后学校会向你提供相应的指引，一般来说是需要填写一份学校方出具的疫苗检疫要求表格。

相关的检疫证明可以通过海关总署国际旅行卫生保健中心进行，他们会帮你一条龙办好相关的证明并帮你填表。

- [北京保健中心预约入口](https://www.beijingithc.org.cn/yuyue/)。预约 *出境体检/接种/转录* 即可，注意办理地点请选择和平里或海淀（海淀诊所办事处不提供疫苗接种服务）。
- 地址：
    1. 和平里本部：北京市东城区和平里北街20号1层。
    2. 海淀门诊部：北京市海淀区德政路10号。
- 体检时需要空腹前往。
- 携带材料：
    1. 护照、留学签证
    2. 本年度录取通知书
    3. 赴美留学人员提供I20表或DS2019表
    4. 公派留学生提供CSC证明
    5. 既往有效疫苗接种记录

另外如果签证是一年以上可以申请免费体检。有效签证一年以内不要求体检（只转录疫苗表格即可）。

# 订机票

- 携程：
  1. 价格：等待两三天，低价时出手。
  2. 行李：价格合适、有行李托运名额下单（注意几个托运名额、换乘每段限重）
  3. 关注点：2个大件保障、不用过境签、行程时间短、转机不需要换机场、行李自动中转、飞行符合作息等。

- 航空公司官网：
  1. 选定时间班次，注册账号或咨询客服购买
  2. 注意留学生可以打折优惠`,
	},
	{
		DisplayName:       `春卷薯片`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | visa`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：visa。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 签证

!!! note "经验征集"
    我们希望有同学提供其它国家领馆面签的经历经验。

## 美国：

### 关键文件 / 信息填报

#### I-20
向录取学校发送护照、财力证明等文件，由院系处理后获得。

!!! note
    不同学校处理效率千差万别，有的学校几天就能发出，有的学校需要一个月以上，可以适当催一催，但总体还是需要 patience。

#### SEVIS I-901 (国安费)
为了方便移民局随时查看所有在美国际学生和学者在美国的动态，**美国国土安全部** 的美国移民与海关执法局规定美国所有高校必须把国际学生和访问学者的信息资料输入 SEVIS 系统 (全称为 Student and Exchange Visitor Information System，中文为学生及交流访问者信息系统)，包括他们的录取院校、录取项目、学习进度、学习状态等。而学生需要为这些信息交保管的费用，350 美金。

缴费流程：

1. 选择 PAY I-901 FEE

2. 仔细对照自己的 I-20 输入以 N 开头的 SEVIS ID，姓名，和出生日期，之后输入自己的地址，确认自己的信息无误之后使用双币信用卡缴费即可。

缴费网站: <https://www.fmjfee.com/i901fee/index.html>

金额：$350

#### DS-160
DS-160 是申请美国非移民签证的一个在线表格，该要求为前往美国的强制要求。

DS-160 填写网站：<https://ceac.state.gov/genniv/>

**预计需要填写1.5小时**，而且此页面经常发生 session time out，所以建议大家先查好个人资料，并在填写的时候每隔一段时间就保存一下。具体的填写细节可以参考 [DengHilbert 的 visa 经验](https://denghilbert.github.io/blog/%E6%B5%81%E7%A8%8B)。

### 预约面签
预约非移民签证-学生签证 F-1

申请网站：<https://www.ustraveldocs.com/cn_zh/>

申请费：￥1120（$160）

### 大使馆：

 - 北京：朝阳区安家楼路55号；地铁一般一个多钟到。预约时可以选不同的时段但实际上只要在上午到达都是一样的排队。

### 面签材料：

- **护照**；
- **2 张白底证件照**（2英寸 * 2英寸，约51毫米 * 51毫米），一般去照相馆说明是用于美签的照片照相馆会自动帮你准备好；
    - 上传电子照片不适用时需要上交；
    - 现场补拍需要交 50 元现金，请注意一定要带等于 50 元，比如带张布达拉宫，或者五张长江三峡，别带人民大会堂，不提供找零。
- **面签预约确认单**（不带无法进入使馆）；
- **I-20 签名原件**；
- **DS-160 申请确认表**；
- **SEVIS 注册和费用支付证明**；
- 其它材料：(highly recommended)
    -   表明在 *经济、社会、家庭* 等各方面具有 **牢固约束力** 的文件，证明您在 **完成美国的学业后会如期回国**。

        !!! warning
            有些同学对于申 VISA 时表明回国倾向这件事有误区。诚然你可能是有未来在国外发展的计划的 & 现实是有很多人这样做，甚至留学就是为了移民机会等等，但是你现在申请的就是 **用于留学目的的签证**，至于你以后留不留那是后面查 h1b eb1 的事，现阶段你 **必须** 明确之后要回国。

    -   您认为可以作为申请支持材料的 **资金证明** 和任何其他文件：证明您有充足的资金支付第一学年的所有开销，并且能够为在美停留期间的所有剩余开销找到足够的资金来源。M-1签证申请人必须证明其有能力支付在美停留期间的所有学费和生活费。
    -   不接受银行对账单的影印本，除非能同时出示 **银行对账单原件或银行存折原件**。
    -   如果您有资助人，请携带您 **与资助人的关系证明**（例如您的出生证明、户口本），资助人最近的纳税申报表原件、银行存折和/或定期存款证明。
    -   能够证明学术准备情况的 **学术性文件**： 带有评分/评级的学校成绩单（最好使用原件）、公共考试证书（A-levels等）、标准化考试分数（SAT、TOEFL等）以及毕业文凭。
    -   赴美 **研究/学习计划** 及相关的详细信息，其中包括美国学校的导师和/或系主任的姓名及电子邮箱地址。[研究/学习计划模板](https://www.ustraveldocs.com/Research%20or%20Study%20Plan-1.pdf)
    -   **CV**: 一份详细介绍以往学术和专业经验的简历 (英语版)，其中包括投过稿的出版物完整清单。[CV模板](https://www.ustraveldocs.com/Resume%CC%81%20LCW%20Edits.pdf)
    -   导师的个人简介、简历或打印网页（针对所在美国教育机构已为其指定导师的研究生）。
    -   你申请的项目说明，院系的课程说明（打印 pdf 或网页均可）。

-   其它材料：(useful)
    -   带本纸质书去看，排队很无聊的，或者带个一起面签的朋友唠嗑。

### 面签流程：

0. 手机、背包等物品不能带入使馆，需要在进入使馆前到对面存包和电子产品（或者找其他人看管）。建议面签时用 **透明文件袋** 装好所有所需文件并只带文件袋进使馆。

**（排队约3～4小时）**

1. 检查护照与相关文件；

2. 录入十指指纹；

3. 向签证官出示护照和 I-20 表；

4. 回答问题：
    - 学什么专业；
    - 具体研究方向；
    - 项目时长、毕业后的计划；
    - 本科学校/毕业时间；
    - 是否有在美学习经历；
    - 由谁资助，资助人是谁，资助人的职业；
        - 父母：父母工作；
        - 导师：经费来源；
        - ……
5. ……

### 面签结果
 - approved（北京使馆发蓝表），等待签证下发；
 - check（北京发绿表，也就是 221g 表），可能要求补充材料（个人 CV, Study plan，Offer letter， 导师 CV 等），合并成一个 ` + "`" + `.pdf` + "`" + ` 文件在 **工作日** 发送至使馆邮箱，**邮件标题：姓，名-护照号码-DS-160确认码**。 *请勿使用清华邮箱发送，可用 gmail 或 qq 邮箱*。 发送成功后要 **确保收到自动回复**，否则请换邮箱重试。
    - check 时间预计 2~8 周，[面签结果统计网站](https://checkee.info)。如果更长时间可能是陷入了“check 黑洞”，就是你的 case 被人忘了，~~或者是其它不能说的原因~~，这种情况可能需要一些特殊手段，或者直接撤签重交，这里不作详细说明，遇到的同学应该直接跟对应项目的留学生 office 联系，或向以前遇到过的同学了解情况。
    - 签证状态查询网站：[Visa Status Check](https://ceac.state.gov/CEACStatTracker/Status.aspx?App=NIV)。

!!! note
    理工科研究生 F-1 几乎全部 check。如果有 *近期在美交换/学习/研究经历* 会增加过签概率。

    人文社科、艺术、（数学）纯理论方向和本科生暑研大概率过签。

!!! warning
    如果有被拒签经历(F, J)有可能会被当场拒签！

??? example "敏感专业举例"

    [Technology Alert List](./alertlist.pdf)

    1. 航空航天工程
        - 航空动力系统
        - 导航与控制系统
        - 航天器设计与制造
    2. 核科学与工程
        - 核物理
        - 核反应堆设计与安全
        - 核武器技术
    3. 化学工程
        - 化学武器技术
        - 爆炸物制备与应用
        - 毒性化学物质研究
    4. 生物技术
        - 生物武器研究
        - 基因编辑
        - 病原体与病毒研究
    5. 材料科学与工程
        - 先进陶瓷材料
        - 高性能合金
        - 高温超导材料
    6. 信息技术与通信
        - 信息安全与网络安全
        - 加密技术
        - 高性能计算
    7. 光电子与激光技术
        - 光电子系统
        - 激光武器技术
        - 高能激光
    8. 机器人技术与人工智能
        - 无人机技术
        - 自主导航与控制
        - 人工智能军事应用
    9. 地球科学与大气科学
        - 天气控制技术
        - 遥感技术
        - 地理信息系统
    10. 海洋工程与海洋科学
        - 潜艇设计与制造
        - 水下武器技术
        - 海洋资源开发与利用

### 取回护照

签证通过并下发后你会收到邮件提醒（一般在 [Visa Status Check](https://ceac.state.gov/CEACStatTracker/Status.aspx?App=NIV) 显示 Issued 之后几天），如果到你选择的中信银行地址（比如门口的清华科技园就有一个点）取回护照，需要缴费。到中信银行总行可免费取回。邮寄需要线下缴费。

中信银行清华科技园（或 general 来说任何中信分行）取护照需要携带：

-   面签预约确认单（上面有护照号、UID、DS-160 确认码，取护照信息查验用）；
-   身份证；
-   77 人民币 **现金**（提供找零，带 100 即可）


## 德国：

### 关键文件 / 信息填报

#### APS

为保证在递签前得到审核证书，请提前至少四个月申请 APS。申请细节参见 [APS](../../prepare/help/) 。

PhD 不属于学签范围，一般无需 APS。

#### Sperrkonto 自保金

自保金是德国长期签证常见的财产证明方式（其他方式有奖学金和德国工资）。在政府指定的合作单位（截至 2023 年有 [expatrio](https://www.expatrio.com/)、[fintiba](https://www.fintiba.com/) 和 [coracle](https://www.coracle.de/) 三家网络中介公司）开户+存入一年额度的预存款（价位参考联邦政府根据一年在德国的平均开销），到达德国并获得德国银行卡后按月为单位提取。每次延签均需财产证明。
2023 年度学生签证的自保金为 931€/月，11208€/年。

### 预约面签
预约长期签证-学生（ms）或工作（PhD）签证 D

申请网站汇总：<https://www.aps.org.cn/zh/verfahren-und-services-deutschland/visum-fur-deutschland>

申请费：75€，以当天汇率换算人民币

### 签证处/使领馆：

- 北京：朝阳区东方东路19号DRC外交办公楼D1座13层1302室；地铁亮马桥站B口出，一般一个多小时到。预约时不可选时段，但实际上只要在上午到达都是一样的排队。

### 面签材料：

以北京审核部为例，参考审核部发布的 [北京留学签证特别提示](https://www.aps.org.cn/wp-content/uploads/WichtigeHinweise_Visumantrag_chn.pdf) ，需要携带的有：

- **银行卡**，支持银联，用于支付申请费（75€，以当天汇率折算人民币收费）；
- **德国高校录取通知书/大学预备语言班报名材料原件**；
    - 原件可用彩色打印件代替，下同
    - “语言班报名材料”为语言班报名证明+学费收据+大学联系信或者大学申请证明
- **经济来源证明原件**，一般为自保金，有时为 CSC ；
- **学历证明原件**，以下材料任选其一：
    - **中国高校在读证明/休学证明/退学证明**，适用于在读生；
    - **本科毕业证书和学士学位证书**，适用于本科毕业生、硕士生在读生以及硕士毕业生；
    - **硕士毕业证书和硕士学位证书**，适用于硕士毕业生；
- **医疗保险证明原件**，需要以下两个保险：
    - 覆盖入境后三个月的旅行保险
    - 德国公立保险，此项在入学后生效
- **留德人员审核部的审核证书/审核证明/审核传真**，即 APS 证书；
    - APS 正在推行无纸化，电子版审核证明打印件具有同等效力。

需要上交的，其中未标注下划线的材料需要递交完整的两套（按顺序整理）：

- <u> **护照** </u>；
- <u> **31 元人民币现金** </u>，用于支付快递费用；
- <u> **1 张白底证件照** </u>（35x45mm，白底，六个月内近照），一般去照相馆说明是用于申根签的照片照相馆会自动帮你准备好；
    - 不支持现场补拍
- <u> **[VIDEX 二维码](https://videx.diplo.de/videx/visum-erfassung/#/videx-kurzfristiger-aufenthalt) 打印件的末页** </u>，请注意打印清晰度；

    !!! note
        请仔细检查 VIDEX 二维码打印件，其标题应为 “Anhang zum Antrag auf Erteilung eines **Schengen**-Visums”（申根）而非 “Anhang zum Antrag auf Erteilung eines **nationalen** Visums”。在填写 VIDEX 入境事由时应有“旅游”的选项以及选择首个入境国；
        VIDEX 二维码的停留时间填 90 天，实际停留时间在纸质表格里填写；

- <u> **EMS 护照回寄快递单** </u>（当场填写，限北京领区）；
- **签证申请表原件**，贴有上述证件照；
    - 填写样例见 [样例](/visa-template-de.pdf)，手写或机打均可，不可涂改；
    - 合计需 3 张证件照，2 张贴表，1 张别在护照上；
    - 建议单面打印及多带两份空表，以防止需要重写的情况，签证申请表是最容易出问题的环节；

    !!! note
        以北京审核部的标准，入境日期只能填写开学前一周或近似日期，填写时间过早的会被打回重写。

- **《居留法》条款告知书**，即所下载的纸质申请表末页，申请人亲笔签名（中文加拼音）；
- **护照照片页复印件**；
- **德国高校录取通知书/大学预备语言班报名材料复印件**；
- **大学授课语言和要求达到的语言级别的说明**；
    - 授课语言说明在高校官网可以查询，打印本专业所涉及的页面即可，语言级别说明德语为 Sprachanforderungen；
- **经济来源证明复印件**，同上；
- **语言水平证明复印件**，需与语言级别说明相对应；
- **学历证明复印件**，同上；
- **完整的个人简历**；
    - “完整”指学习经历需**从小学开始**一直填写到现在，并附个人联系方式（如 email）；
    - 英语/德语均可，德语中简历称为 Lebenslauf，教育经历称为 Ausbildung；
- **留学动机说明**，申请人亲笔签名（中文+拼音）；
- **留德人员审核部审核证书/审核证明/审核传真的复印件**；
- **入境后医疗保险证明复印件**，同上。

全部整理完一般有 50+ 页材料，建议带一个文件袋装好。递签时会被要求取下纸质材料之中的别针。

- 其它材料：(highly recommended)
    - 电脑：较大概率会出现需要改材料的情况。
    - 两份空的申请表：同上。
    - 一支黑色签字笔：填邮寄单。

### 递签流程：

0. 手机、电脑等电子设备带入审核部需关机。建议面签时用文件袋装好所有所需文件；

1. 到达审核部楼下，到时间后有工作人员带领进楼；

2. 取号，填写邮寄单；**（排队约数分钟）**

3. 检查护照与相关文件；

4. 扫描 VIDEX 二维码；

5. 录入十指指纹；

6. 缴费。

!!! note
    正常情况下没有面签，因为 APS 已经面签过了。
    如果出现材料不完整或不合格需要补材料的情况，北京审核部允许在当日上午补齐材料并提交。
    审核部门口张贴有打印店地址，但此店打印收费10元/页，如需补材料建议找审核部附近的其他打印店，如亮马河对面过人行桥就有一家，正常价格收费。

### 递签结果

- 由于德国长期签证办理需将材料寄到学校所在城市的外管局进行审核，办理时间较长，一般需 5-8 周。
- 德国签证不会 check （因为所有人都要 check）。
- 待更新

### 取回护照

签证办理完成后护照会寄送至快递单上的邮寄地址，发 EMS。

!!! note
    德国签证办理严格区分领区。以北京审核部为例，邮寄地址仅可填写北京领区内地址。
    若临近毕业，户籍或居住地在上海、沈阳、成都、广州领区的人员不建议在北京领区办理。可以让已保研或低年级的学校同学代收，经实操快递单的名字可以不为本人。

## 参考资源

[DengHilbert 的 visa 经验](https://denghilbert.github.io/blog/%E6%B5%81%E7%A8%8B)`,
	},
	{
		DisplayName:       `年糕喝牛奶`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | waiting`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：waiting。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `## 催结果

等待 Offer 中的一个典型场景是：你已经收到了一些录取通知，但是还没有收到你最想去的学校的录取通知，或者是你通过 [一些信息渠道](../../preface/info/) 得知已经有很多人收到录取了。这时候一个常见的选择是发邮件问问，下面是一份邮件模板。

!!! note "催结果邮件"
    Dear ` + "`" + `<the program>` + "`" + ` Admission Committee,

    Greetings, I am ` + "`" + `<your name>` + "`" + `, an applicant for the ` + "`" + `<the program>` + "`" + ` at ` + "`" + `<the school>` + "`" + `, and ` + "`" + `<id info>` + "`" + `. I am planning to make my final decision recently because I will need to spare enough time for visa affairs / prepare for my travel to the US, but I have not heard anything back from your program since my submission of my application last November. I am really looking forward to joining your learning community and ` + "`" + `<the program>` + "`" + ` is still my top choice. I am wondering if it is possible to know about my current application status and if may I still have the chance to join you. It will greatly help me make my decision, thank you.

    Best Regards,

    ` + "`" + `<your name>` + "`" + `.


## 4.15 协议

另一个等 offer & 做决定时比较 trick 的地方是 *美国* 很多高校有所谓的 [4.15 协议](https://cgsnet.org/resources/for-current-prospective-graduate-students/april-15-resolution/#:~:text=Resolution%20Regarding%20Graduate%20Scholars%2C%20Fellows%2C%20Trainees%2C%20%26%20Assistants,both%20student%20and%20graduate%20school%20expect%20to%20honor.)。大意就是：对于带奖的 offer 学生没有义务在 4.15 日之前对 offer 做出任何答复，并且即使是已经接了的 offer 也可以在 4.15 之前反悔。所以如果你在 4.15 之前收到了一个 offer，但是你还在等待你更想去的学校的 offer，那么你可以先接了这个 offer，然后在 4.15 之前再决定要不要反悔。

另一方面来说，形式上在 4.15 之后你已经接了 offer 就不能反悔了，但仅仅是形式上，很多时候只要向已经接 offer 学校合理解释，他们也不会为难你。

在等 offer 层面，4.15 协议有两个影响：

-   一是若你已经手握多个 offer，但你在 4.15 之后还没有答复他们，那么你的 offer 是可以被学校合理取消的（或者有些项目可能会另外声明他们的 ddl，但总之一般都是这个日期前后）
-   二是由于有些人会默认不回复自己的放弃的 offer 等它自动 4.15 过期，所以你确实是可能会在 4.15 后收到一些项目的消息的。

    > 另一方面来说，也正是因此我们建议对于你确定不去的项目，就尽早放弃掉，这样可以让别人早点收到 offer。`,
	},
	{
		DisplayName:       `自在的可颂er`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | contributor`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：contributor。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 功德墙

[Sam7](https://SamSeven777.github.io/homepage) [V1ncent19](https://v1ncent19.github.io/) [Co1lin](https://co1in.me/) [Sophia](https://www.zhihu.com/people/wanrong6) [Luxixi717](mailto:[邮箱已隐藏]) Lucy [Charlie](https://www.zhihu.com/question/360515552/answer/2852974194) [Murph](mailto:[邮箱已隐藏]) [Tony-zhn](https://tony-zhn.github.io/) [David](mailto:[邮箱已隐藏].cn) [FriedChicken](mailto:[邮箱已隐藏]) [Mariana](https://mariana2000.github.io/) [Miracle](mailto:[邮箱已隐藏]) [Chris](mailto:[邮箱已隐藏]) [RZ](mailto:[邮箱已隐藏]) [zengsz19](mailto:[邮箱已隐藏]) [Zachary](mailto:[邮箱已隐藏].edu) [AyaHuang](mailto:[邮箱已隐藏]) [Luke](mailto:[邮箱已隐藏]) [liang2kl](https://liang2kl.github.io) [yutc](http://yutc.me)`,
	},
	{
		DisplayName:       `松鼠实习中`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | about`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：about。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 关于

[清华大学飞跃手册](https://feiyue.online)（简称“手册”）是由一群清华大学出国（境）深造的毕业生编写维护的在线文档。

该手册旨在总结出国（境）深造的经验教训，回答申请中遇到的问题，为拟出国（境）深造的学弟学妹提供借鉴和参考，减少信息差带来的不公平，降低准备时间和金钱成本，缓解申请过程中的焦虑。

希望本手册能够帮助到拟出国（境）深造的清华学生，在申请路上顺顺利利，获得自己心仪项目的 Offer！


## 声明

本手册使用 [Material for Mkdocs](https://squidfunk.github.io/mkdocs-material/) 构建，在 [GitHub](https://github.com/THU-feiyue/THU-feiyue) 上开源，使用 GitHub Pages 公开发布。

手册内容由清华大学飞跃手册编写委员会收集、编写、审核、发布并维护。内容仅供参考，且不代表任何政治立场。手册所有内容 **依据[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)授权，不得做商业用途，转载或者引用请注明来源**。

对于不遵守此声明或者其他违法使用本文内容者，依法保留追究权等。

## 进度与更新

目前本手册已经完成了大部分 [前言](../preface), [准备](../prepare), [录取及之后](../afterad) 章节中内容，并在未来可能会添加招生信息、项目/院系介绍等板块，欢迎有意发布内容的老师或同学 [联系我们](mailto:[邮箱已隐藏])。

希望有更多同学加入进来，帮助撰写和完善网站内容。

提交申请总结请前往[飞跃数据库](https://database.feiyue.online)。

本手册还在快速建设中，欢迎你提出意见或建议。`,
	},
	{
		DisplayName:       `清新的冰棍酱`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | friendlink`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：friendlink。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `- [飞跃数据库](https://database.feiyue.online/)
- [自动化系飞跃手册](https://dagrad.site/) （清华/校友邮箱登录）
- [Open CS Application](https://opencs.app/)
- [山东大学飞跃手册](https://sdu-application.github.io/sduapplication.github.io/#/)
- [中科大飞跃手册](https://www.ustcflyer.com/welcome) （需要登陆）, [2015版](http://www.ustc.global/wp-content/uploads/2016/01/USTC-Fly-Guide-2015.pdf)
- [上海大学溯源手册-飞跃版块](https://shuosc.github.io/fly/categories/%E7%95%99%E5%AD%A6/)
- [南科大飞跃手册](https://sustech-application.com/#/), [2019版](https://sustech-application.github.io/2019-Fall/#/?id=%e5%8d%97%e6%96%b9%e7%a7%91%e6%8a%80%e5%a4%a7%e5%ad%a6%e9%a3%9e%e8%b7%83%e6%89%8b%e5%86%8c-2019-fall)
- [上海交大飞跃手册](https://survivesjtu.github.io/SJTU-Application/)
- [华中科大光电飞跃手册](https://hust-feiyue.github.io/)
- [华中科大电气飞跃手册](https://github.com/LHYi/Feiyue_for_ECE)
- [浙大数院飞跃手册](http://www.math.zju.edu.cn/_upload/article/files/99/e1/32b8399349af89f05033bf19a32e/4fd486a5-8a4e-47f0-a9c1-9fdba8cae593.pdf)
- [浙大外语飞跃手册](http://www.sis.zju.edu.cn/_upload/article/files/d1/4f/4bdc41fb43c998f58d9ea03b77c5/1af0ee6f-ca7e-4a9f-b100-b3161378590c.pdf)
- [浙大电气飞跃手册](http://ee.zju.edu.cn/_upload/article/files/e5/cb/875540014b9489d2cec796955ea7/d1051aae-5958-4137-9ebd-f5b59fea0230.pdf)
- [电力电子飞跃手册](https://flyingbrochure.org/)
- [东南大学飞跃手册](https://www.yuque.com/2020seufly/guide), [2015版](https://jerrypiglet.gitbooks.io/2015_seu_abroad/content/)
- [南京工业大学飞跃手册](https://github.com/yaoshun123/FLY_NJTech)
- [欧洲留学飞跃手册](https://chaoli.club/index.php/6978/0)
- [南开CS手册-出国版块](https://nkucs.icu/#/experiences/abroad/)
- [华东理工飞跃手册](https://ecust-leap.github.io/)
- [四川大学飞跃手册](https://scu-flying.com/#/)
- [南京大学物理留学分享](https://jialanxin.github.io/njuphy-/)
- [南京大学电子飞跃手册](https://picture.iczhiku.com/weixin/message[电话已隐藏]66.html)
- [西交利物浦手册-申请总结版块](https://awesome-xjtlu.github.io/wiki/#/grad-application/readme)
- [武大数统飞跃手册](https://www.yuque.com/2020whumathstat/fly-sheet)
- [大连理工飞跃手册](https://github.com/alexedinburgh/dutOverseas)
- [CityU GuideBook](https://penjc.github.io/CityU/)`,
	},
	{
		DisplayName:       `努力的馒头`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | info`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：info。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `## 官网

任何项目都应该以学校官方网站给出的官方信息为准。其他信息都应该作为辅助和参考，帮助你更好地做出判断。使用搜索引擎搜索大学名称，包含 .edu 的域名通常就是学校官方网站。

- 美国大学：官网 ➡ Admission ➡ Graduate ➡ 查看研究生院的申请要求、方式和项目。

## 社区平台

申请过程中的第一手和权威资料总是应该来源于官网。但是有很多信息我们是无法从官方渠道获得的，比如这个项目录取偏好、录取 timeline、培养的用心程度、隐形资源、学生去向等等，这个时候无论你是不是打算 DIY ，社区/论坛都是是一个好的去处。

为了方便你熟悉上手各种社区平台，这里介绍了一些留学会用到的社区/论坛，包括社区/论坛特点的介绍、怎样逛论坛、以及你可能获得哪些信息。

!!! note
    目前主要撰写了理工科的论坛信息，希望有文商法等学科的同学来补充其他内容。

### 一亩三分地

[一亩三分地留学申请版](https://www.1point3acres.com/bbs/offer) 是理工科（尤其是CS）申请信息最多的网站，里面的版块划分和内容索引都比较完善，很适合想要 diy 搜集信息的同学。普遍来说逛的多的是 [选校定位](https://www.1point3acres.com/bbs/forum-79-1.html)，[项目库](https://offer.1point3acres.com/db/programs/--)，[研究生申请总版](https://www.1point3acres.com/bbs/forum-27-1.html) 和 [录取汇报](https://www.1point3acres.com/bbs/forum-82-1.html) 版，当然其它一些院系介绍、 offer 比较版也是很实用的，如果想了解学校 prestige 或者是等 offer 的时候了解进展可以 [搜搜自己感兴趣的学校](https://www.1point3acres.com/bbs/tag.html?category=2)，需要注意的是一亩三分地的网页版搜索功能是要氪金的，但是移动端 app 版不用，所以你下载 app 并注册就能使用检索功能了。得到新手任务基础积分后应该可以查看大部分需要积分才能看到的内容，所以建议最好做一下新手任务，可以在网上查到答案。按学校分类的 offer 榜也需要氪金，建议可以移步 [寄托天下院校库](https://schools.gter.net/) 的对应内容。

!!! tip
    - 不必只看对应的某一版块，比如事实上在录取汇报版和 offer 比较版有比选校定位版更多的各个学校 / 项目的优劣和特点分析，所以可以都翻一翻。
    - 快速寻找高含金量帖子的方法：点评论数多的，比如讨论数 $\\geq 10$ 的一般都会有比较实际的内容。
    - 善用院校搜索，比如找到某个项目对应的页面，然后拉到去年 / 前年这个项目发 offer 的时候，会有许多相关的帖子，点进去看看一般会有不错的内容。

### 寄托天下

[寄托天下](https://bbs.gter.net/) 也是一个各种学科方向帖子都很多的网站，用户没有一亩三分地多，但是没有收费内容，注册后就能看到。你可以在网站页眉选择 [论坛](https://bbs.gter.net/)，[offer榜](https://offer.gter.net/)，[院校库](https://schools.gter.net/) 之类的。寄托天下的结构和内容与一亩三分地基本一致。总而言之，一亩三分地的用户更多，寄托天下不用氪金，综合使用就好。

### 小红书

小红书凭借平台上消费经验和生活方式的分享在年轻人中热度不小，许多个人博主和留学机构也在上面分享留学信息。很多留学博主为了增加自己的流量，经常分享一些项目介绍、申请经验和学习方法等内容，也有不少个人记录自己的申请情况和抱团。通过 #话题 就可以快速定位感兴趣的学校和项目，查看已经录取和正在申请中的案例情况。也可以搜索备考经验、文书写作以及国外生活等方面的经验。在提交申请后，可以根据小红书上的分享确定项目offer和面试的情况，留学机构也会分享一些成功案例，还可以找到感兴趣的/申请同一个项目的朋友。

但是小红书上许多信息的获取是有条件的，需要点赞/关注/评论/私信等方式才能获得完整信息。

!!! warning
    警惕虚假信息、广告和诈骗。

### 知乎

请辩证看待知乎。知乎和一亩三分地不同之处在于：一亩三分地的内容基本以交流和提问为主的，知乎上基本以展示自己的情况为主的。因此你可以在上面看到中文互联网上最 top 的一批申请结果（而且会有一些人在凡尔赛 / 卖弱，搞得有点乌烟瘴气）， highly biased，请你不要焦虑，不是所有人都去 HYPSM；但一个好处是上面有很多陆本顶校的回答，可以改善一亩三分地上难以采集到清北科 tier 同学样本的问题。

知乎申请相关的内容主要是对应年份的申请记录，如 [24 fall](https://www.zhihu.com/question/443613502/answer/2818895221) , [23 fall](https://www.zhihu.com/question/360515552) , [22 fall](https://www.zhihu.com/question/379814619) , [21 fall](https://www.zhihu.com/question/357928233/answer/1668324597) , [20 fall](https://www.zhihu.com/question/318624725/answer/1265464156)，再早的参考价值就比较有限了。其它还有一些懂哥的申请总结或就读体验。知乎上留学中介的水帖过多，检索起来十分痛苦，建议谨慎采取检索策略。

### The Grad Cafe

[The Grad Cafe](https://www.thegradcafe.com/) 是国外一个的著名的 offer 结果汇报网站，一般适合用来查发 offer / 面试的时间（尤其是 Ph.D.项目）；它的 [论坛](https://forum.thegradcafe.com/) 里也有很多实用讨论，值得一逛。


### ChaseDream

一个主攻商科的论坛网站，不太了解。欢迎以后有经管 / 社科的友友说说。

### 豆瓣

豆瓣小组里也有少量实用内容，常见小组如women in academic和women in social science有较多常规来说较为冷门的专业的朋友，可以提供一些难以搜集到信息的项目与专业的信息，但旧帖较多，时效性差，可以尝试检索。

## 微信公众号

- 清华海外学习：国际处海外学习办公室官方公众号。（或登录info -- 首页最下方“部门信息” -- 国际合作与交流处/港澳台办公室 -- “项目申请”栏目）
- 美国签证指导：提供美国签证最新资讯及分享美国签证常见问题。`,
	},
	{
		DisplayName:       `苹果可颂`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | 国家/地区选择`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：国家/地区选择。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 国家/地区选择

以下列出国家和地区的一些学校以供参考：

## 北美
- 美国：[Best Graduate Schools - U.S. News](https://www.usnews.com/best-graduate-schools)
- 加拿大：
    - [多伦多大学 UToronto](https://www.utoronto.ca/)
    - [麦吉尔大学 McGill](https://www.mcgill.ca/)
    - [滑铁卢大学 UWaterloo](https://uwaterloo.ca/)
    - [英属哥伦比亚大学 UBC](https://www.ubc.ca/)
    - [渥太华大学 UOttawa](https://www.uottawa.ca/en)

## 欧洲
- 英国：
    - [剑桥大学 Cambridge](https://www.cam.ac.uk/)
    - [牛津大学 Oxford](https://www.ox.ac.uk/)
    - [帝国理工学院 IC](https://www.imperial.ac.uk/)
    - [伦敦大学学院 UCL](https://www.ucl.ac.uk/)
    - [伦敦政经学院 LSE](https://www.lse.ac.uk/)
    - [爱丁堡大学 UEdinburgh](https://www.ed.ac.uk/)

- 瑞士：
    - [苏黎世联邦理工 ETH Zurich](https://ethz.ch/en.html)
    - [洛桑联邦理工学院 EPF Lausanne](https://www.epfl.ch/en/)
    - [苏黎世大学 UZurich](https://www.uzh.ch/en.html)
- 法国：
    - [巴黎高师 ENS](https://www.ens.psl.eu/en)
    - [索邦大学 Sorbonne](https://www.sorbonne-universite.fr/en?search-input=demande%20de%20bourses%20upmc&start=337)
    - [巴黎综合理工 Ecole Polytechnique](https://www.polytechnique.edu/en)
- 德国：
    - [慕尼黑工业大学 TUM](https://www.tum.de/en/)
    - [海德堡大学 Uni Heidelberg](https://www.uni-heidelberg.de/en)
    - [马克斯·普朗克学会(马普所) MPG](https://www.mpg.de/en)
- 其它欧洲诸国
    - [代尔夫特理工大学 TUDelft](https://www.tudelft.nl/en/)
    - [阿姆斯特丹大学 UvA](https://www.uva.nl/en)
## 澳洲
- 澳大利亚：
    - [澳大利亚国立大学 ANU](https://www.anu.edu.au/)
    - [悉尼大学 USYD](https://www.sydney.edu.au/)
    - [墨尔本大学 UofMELB](https://www.unimelb.edu.au/)
## 亚洲
- 日本：
    - [东京大学](https://www.u-tokyo.ac.jp/zh/index.html)
    - [东京工业大学](https://www.titech.ac.jp/)
    - [京都大学](https://www.kyoto-u.ac.jp/ja)
- 新加坡：
    - [新加坡国立大学 NUS](https://nus.edu.sg/)
    - [南洋理工大学 NTU](https://www.ntu.edu.sg/)
- 香港：
    - [香港大学 HKU](https://www.hku.hk/c_index.html)
    - [香港中文大学 CUHK](https://www.cuhk.edu.hk/chinese/)
    - [香港科技大学 HKUST](https://hkust.edu.hk/index.php/zh-hans)
    - [香港城市大学 CityU](https://www.cityu.edu.hk/zh-hk)
    - [香港理工大学 PloyU](https://www.polyu.edu.hk/sc/)`,
	},
	{
		DisplayName:       `暖暖的榴莲吖`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | master or doctor?`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：master or doctor?。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# master or doctor?

出国（境）深造选择的学位项目（研究生申请时我们不再说某校的某专业，而是以 Program 作为对象），通常分为硕士（master）和博士（doctor）两类。

下面的表格比较了两类项目的差异：

|项目|硕士（master）|博士（doctor）|
|  ----  | ----  | ---- |
|类型|[List of master's degrees - Wikipedia](https://en.wikipedia.org/wiki/List_of_master%27s_degrees)<br>Master of Arts (MA)<br>Master of Science (MS, MSc)<br>Master of Engineering(MEng)<br>Master of Business Administration (MBA)<br>etc.|[List of doctoral degrees in the US - Wikipedia](https://en.wikipedia.org/wiki/List_of_doctoral_degrees_in_the_US)<br>Doctor of Arts (D.A.)<br>Doctor of Education (Ed.D.)<br>Doctor of Philosophy (Ph.D.)<br>etc.|
|学制|1-3 年|3-7 年|
|花费|10-90 万人民币/年|免学费<br>通常有工资补助|
|内容|课程/论文|研究|
|未来发展|工业/商业/转申博士|学术研究|

!!! warning
    不同项目实际情况可能存在差异，以学校官方给出的信息为准

!!! note
    而对于人文社科的朋友们来说，由于在connection和认可度上的天然缺陷，如果没有海外长交换的经历，本科直接申请top30以内的PhD有着非常大的难度（近乎于天方夜谭），同时可能也难以适应国内外文科研究上的巨大差异，在这种情况下，先申请一个master作为PhD前的过渡与积累可能是一个更加稳健的选择

选择学位时应该综合考虑个人志趣、未来发展、经济条件等方面做出选择。


一些申请前关于申请什么方向或项目值得考虑的问题：

- 我喜欢做科研/学术研究吗？更具体来说，我喜欢现在我的专业方向吗？尤其是对于 doctor 而言这一过程常持续 4+ 年。
- 我想要换一个专业方向吗？有没有必要读一个跳板 master？
- 我的家庭能否支持我读完 master ，或者更进一步能否接受较高额学费的投入产出比？
- 我应该选择直博还是先读 master 以后再寻求机会转申，并保留 master 毕业直接就业的可能性呢？
- 我读 doctor 的目的是什么？是为了对学术研究的追求 / 在就业市场上更有竞争力 /多体验一下不同的人生？或者只是因为现在不知道自己想做什么，大家都在读博 / 出国，我先读一个再说？
- 我在做决定之前有没有广泛寻求过各方的建议？课程教师 / 科研导师 / 上司或同事 / 学长学姐 / 家长 ……


关于这些问题的思考不仅有益于你做出更好的申请规划，最终很可能也需要体现在你的申请文书中，所以我们建议你尽早开始考虑这些问题。`,
	},
	{
		DisplayName:       `萤火虫海星`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | timeline`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：timeline。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `!!! warning "不完善的条目"
    本页面内容有待更多案例进行确证。

申请需要遵循一定的流程，还需要进行繁琐的准备，包括 [经历积累](../../prepare/experience/)、[前期的考试](../../prepare/exam) / [文件](../../prepare/material) 准备、[系统提交](../../prepare/onlinesystem/)、[面试](../../prepare/interview)、后期的 [签证](../../afterad/visa/) / [旅行](../../afterad/travel/) 等。希望你一旦决定未来去向就应该早做打算，进行良好的规划。这里以最常见的申请秋季入学（Fall）项目为例提供申请时间线的参考，不同国家地区的申请时间线和准备繁琐程度都是不同的，建议你早作规划。具体的申请相关事项请移步 [准备工作](../../prepare/) 和 [录取之后](../../afterad) 章节了解，[往届申请案例](../../cases) 中有些也会包含申请者的时间线。

------

**本科学制四年为例**

## 常规时间线 - 秋季学期（Fall）入学

大部分 PhD 申请和美港新英 master 申请都可以均遵循下述时间线。

### 开始申请流程之前（大三以前）
- 前期刷 [GPA](../../prepare/exam/#gpa)、积累 [科研经历](../../prepare/experience/research)、[实习经历](../../prepare/experience/intern)，一直进行；具体哪个更重要视学科和你的 [目标项目](../master_phd/) 而定。

### 大三上 Sept
- 如果担心自己的英文水平，可以先开始进行 [语言考试](../../prepare/exam/#21) 和 [GRE](../../prepare/exam/#22-gregmat) 的准备和试水了。另外 **如果计划进行暑研的话也应该在这个时候有一个可用的语言成绩**。
- 如果计划进行暑研，那么应该这个时候（不晚于）参与科研训练，积累 connection 了。
- 如果要考 GRE sub 的话应该留意时间，有些 sub 一年只有一两次。

### 大三下 Jan - April
- 联系暑研、申请暑校/[交换项目](../../prepare/experience/exchange/) 等。

### 大三下 spring&summer
- 继续科研 / 实习，攒GPA。
- 如需要，可以着手 [套磁](../../prepare/selection/touch/)

### 大四上 Sept
- [选校定位](../../prepare/selection/)
- 开始撰写 CV 和 SOP 等 [文书材料](../../prepare/material/)。
- 联系 [推荐信](../../prepare/rl/)。
- 准备文件材料，比如 [学信网-WES认证](../../prepare/ehlp/chsi)，有些项目还会要求进行文件公证。

###  大四上 Dec
- 部分项目 ddl 较早，注意 [提交系统](../../prepare/onlinesystem/)。

### 大四下 Jan - Mar
- [面试](../../prepare/interview/)

### 大四下 April - May
- [确定去向](../../afterad/compare/)
- [办签证](../../afterad/visa/)，确定 [出行计划](../../afterad/travel/) 和 [租房](../../afterad/rent/) 等。

### 毕业后 fall
- 入学，congrats!！

----------

## 申请德国Master - 冬季学期（WS）入学

大部分 PhD 申请均遵循上述时间线。master 申请的时间线相对灵活，此处以申请德国冬季学期（WS）入学为例举一个极端例子。仍以本科学制四年为例。

### 大二及以前开始，直至申请
- 学习德语（optional）

### 大三上、下
- [交换项目](../../prepare/experience/exchange/) 等
- 刷课，提高[课程匹配度](../../prepare/exam/#3) 和/或 GPA
- [语言考试](../../prepare/exam/#21) 试水

### 大四上 Sep
- 准备并递交[APS](../../prepare/help/)材料
- 刷课，提高[课程匹配度](../../prepare/exam/#3) 和/或 GPA

### 大四上 Nov
- TestDaF考试（optional），参见 [语言考试](../../prepare/exam/#23)

### 大四上 Nov-Jan
- [APS](../../prepare/help/)面谈，时间以排队顺序而定
- 文件材料准备，如开始撰写 CV 和 ML 等 [文书材料](../../prepare/material/)。

### 大四下 Feb-Jul
- [选校定位](../../prepare/selection/)
- 递交申请。目前德国学校均采用网上申请系统，详见 [提交系统](../../prepare/onlinesystem/)。

> 对你没看错，确实是 Feb-Jul。德国学校 10.1 开学，因此申请时间晚于其余地区。较早的 RWTH Aachen ddl为 3.1，其次 TUM 5.31，剩余绝大部分学校 ddl 为 7.15。

### 大四下 Mar-Aug
- [确定去向](../../afterad/compare/)
- [办签证](../../afterad/visa/)，确定 [出行计划](../../afterad/travel/) 和 [租房](../../afterad/rent/) 等。

### 毕业后 Oct
- 入学，congrats!！`,
	},
	{
		DisplayName:       `鸽子练瑜伽`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | 为什么出国留学`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：为什么出国留学。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 为什么出国留学

出国代表着要离开自己熟悉的人和事，远离熟悉的生活和文化，背井离乡，到底是为了什么？是什么促使我们做出这样的决定？每个人心里都会有不同的答案，这里我们只是列举一些可能的原因，以供你参考。如果能帮你找到方向、下定决心最好不过。

### 教育质量与学术水平

不论是从教学规模、课程设置、培养方案、教师队伍，还是科研成果、学术氛围、经费投入、仪器设备，我们不得不承认，即使是清华大学这样的“世界一流大学”，与世界上的许多高校在各个方面仍有不小的差距。如果你希望从事学术研究、技术工作，希望继续学习知识、开展科学研究，那么我们认为你出国（境）深造、有一段海外经历是有必要的。

### 了解文化、增长见识

走出自己舒适区，亲身感受与你生长的地方不同的文化，观察各种各样的人和人生，自己去探索和思考那个我们只在网络和媒体上了解的另一个世界，做出自己的思考和判断。国外留学这段经历会锻炼你的独立性、自主性、适应性，建立一个多元的价值观，认识新的朋友，见证许多精彩的故事。

### 工作机会与移民

对比平均薪资待遇和生活环境等，发达国家在很多地方都比我们有更优渥的条件。如果为了更好的薪资待遇（即使在国内工作，一段海外经历也常能让你更有竞争力），或者就只是更希望在其他国家生活，又或者是单纯讨厌现在的生活而为了逃离，出国留学也不失为一种方法途径。

当然也有可能是亲情、爱情、友情或者其他的某种原因。Anyway，如果你产生了或者决定了出国（境）深造的想法，那么本手册会竭尽所能帮助你实现。`,
	},
	{
		DisplayName:       `阳光的榴莲`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | 学校成绩与考试`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：学校成绩与考试。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 学校成绩与考试

一般讨论的背景包含 三维 = 标化 + GPA = 语言 + GRE/GMAT + GPA。本节的内容旨在帮助你建立申请过程中对标化考试、GPA的地位认知，以及一些考试准备 & 背景提升的指引。

## GPA

申请美国研究生院的最低GPA要求一般是 3.0/4.0，所以如果你的 GPA是 2 开头的，那么首先要做的就是想办法把成绩提高到 3 以上。（这里及以下都讨论 4.0 绩点制下的 GPA，清华的绩点-等级对应关系在平均上基本与美本相似，当然给分力度可能还是差一些）


如果达到了一般的最低要求（3.0），那么GPA越高对你的申请越有优势。虽然每个项目都可能有自己的评价体系（比如 depend on 学科、项目导向等），但是许多项目后验上看录取 GPA 会高于 3.5。大部分的项目一般认为 3.7 是较高的GPA，因此如果如果你的学校成绩在 3.7/4.0 以上，那么请继续保持，并应该将更多的精力放在提升背景的其他方面。

笼统来说粗粒度地划分可以认为 3.0/3.3/3.7 是 GPA tier，更细粒度来说可以认为每 0.1 一个档。

!!! warning

    4.0/4.0 并不意味着 100% 能够被录取，但是 <3.0 意味着几乎 100% 不会被录取。

    不过 GPA不是全部，你的经历和其他背景也非常重要。更具体来说，在高于一定的阈值之后，提升 GPA 的边际效应就不太明显了，比如你可以说 3.8 很可能比 3.6 好，但是比 3.75 好吗？比 3.71 好吗？如果你有一些其它有竞争力的背景，例如有丰富的实习经历、强力的科研发表，那完全足以 cancel 少量的绩点劣势。

    值得一提的是，这一点在你 [网上论坛冲浪](../../preface/info/) 时也应该注意，你可能看到有些人 GPA 很低仍能拿到顶校录取，但是总是有很多其它与 GPA 同等重要或更重要的因素的，所以尽量让自己有更多出彩多样的背景，而不是只有绩点！

## 标化考试

作为一个国际学生，你通常需要完成语言能力考试（TOEFL/IELTS）与研究生入学考试（GRE/GMAT）等标准化考试，来评估你的能力。通常只有标化考试分数达到录取最低要求的申请者才会被 review，高的标化考试成绩会让你更有优势，但学校不会因为你的标化考试成绩高就而录取你。

!!! warning

    具体需要哪些考试成绩及最低分数要求参见你申请项目的官方网站。

    TOEFL有效期2年，GRE有效期5年。因此请合理安排考试时间，务必保证申请时成绩有效。

### 语言考试

主流的考试是托福（TOEFL）或雅思（IELTS），近年也有人考多邻国（Duolingo）之类的，但总体的考察内容是类似的——听说读写。

听读写类似高考题进行的听力、阅读、作文部分，对于我校同学来说普遍不会有什么问题。由于生活中缺乏语境和练习，说（口语）的部分对大部分中国学生来说都是令人头疼的，因此想要得高分就需要加强练习。

语言考试的准备时间视个人的英语基础和语言天赋而定。可以在各种论坛上寻求经验帖，并积极在网上找学习资料（bilibili 之类平台的学习视频、zlib 的参考书、自己买书等等），必要时也可以选择补习机构的辅导。

虽然语言成绩是必要的一项背景，但是除了申顶校或个别分控学校，基本都是过线即可（例如以美国项目为例，典型的分数线是 TOEFL 100 / IELTS 6.5），后面的边际效应就很低了。甚至也有一些语言成绩未达标但还是拿到了录取的案例，所以不必特别担心。

!!! note

    对于 Speaking 部分，很多学校有特别要求：如托福 Speaking 不得低于 23/30，或不达标不能申请 TA。请 PhD 和希望申请 TA 的 master 申请者注意。

#### TOEFL

托福TOEFL: 检定非英语为母语者的英语能力考试（Test of English as a Foreign Language）。

考试形式：网考/iBT(Internet-Based Test)，使用计算机答题。由四部分（reading、listening、speaking、writing）组成，每个部分30分，满分120分。前两部分考完后有中场休息。考完客观题部分直接出分，总分几天后出。

!!! note

    2023年7约26日起，考试形式发生变化：考试时长由原来的3.5小时左右（含加试）缩减到约2小时以内。阅读听力部分结束后，不再设置10min休息。

    新托福考试时长：阅读35分钟，听力36分钟，口语16分钟，写作29分钟，总时长约在2小时以内。

    考试技巧待补充

    - [家考托福注意事项](./help/toefl-home.md)

考试内容：

- 阅读：2篇文章，共20题

- 听力：3篇lecture，2篇conversation，共28题

- 口语：1个独立任务，3个综合任务，共4题

- 写作：1个综合写作，1个学术讨论写作


考试地点：TOEFL考点，家中（home edition，疫情产物，不推荐）

报名方式：教育部教育考试院托福网考报名官网 <https://toefl.neea.edu.cn/>

1. 注册账号
2. 支付考试费
3. 选择考场和时间，填写报名表并确认付费

*详见官网

报名费：￥2,100

北京市考试人数非常多，请尽量提前计划复习和预约考试时间，以免因为没有语言成绩影响暑研和申请。一般建议大二下开始复习，大三考托，这样申请前成绩有效，且能在暑研之前拿到成绩。考试成本较高，强烈建议充分复习，一次考到理想分数（>105~110，视项目确定）。


#### IELTS

雅思IELTS: 国际英语测试系统（International English Language Testing System）

报名方式：教育部教育考试院雅思报名官网 <https://ielts.neea.cn/>

形式与 TOEFL 类似，也使用计算机答题。由四部分（reading、listening、speaking、writing）组成，每个部分满分 9.0 分，取四项均值作为最终成绩。S 部分可以预约时选择线上面试或是真人面试形式，单独进行；R L W 部分另外进行集中上机考试。

!!! note "难度参考"
    考试内容由于太过久远已经全部忘掉了，只能给大家提供一个个人化的难度参照。19 全国一卷 140 分英语的基础，本科阶段有少量阅读英文文献；考试的时候口语是不出意外地寄掉了，没话说，不知道是因为个人社恐还是因为口语真不行；听力完全没有应试基础（本省高考不考听力）但水了个7.0；阅读稍有难度但不多，高分飘过；写作跟中考英语的议论短文差不多，考前刷刷题背几个句型再练习一下键盘键入英语，稳稳水过。

#### Duolingo

多邻国Duolingo是一款语言学习工具软件，其创立的多邻国英语测试（Duolingo English Test）成绩被一些项目接受，但相应的也有一些项目不接受，没什么特殊情况还是考托雅比较好。

### 德语

欧洲标准将语言学习者的能力从低到高分为 A1-C2 六个等级，A1 为入门，C2 为接近母语水平。德国各高校的入学标准为授课语言等级达到 C1 水平。作为参考，英语的 C1 水平门槛为 **IELTS 6.5-7.0**。在无德语环境下从零开始学习德语至 C1 水平，一般需要 **两年及以上**。

#### TestDaF

TestDaF （Test Deutsch als FremdSprache） 是中国大陆学生能参加的、满足德国德语授课专业入学要求的主流考试。考试分为听说读写四项，其中口语与其余三项分开进行，类似 IELTS。考试形式纸笔/机考均有，纸笔考试难度小于机考。截至2023年度中国大陆的 TestDaF 均为纸笔考试。报名网址为 <https://testdaf-main.neea.cn/>（限中国大陆）与 <https://www.testdaf.de/de/>（全球）。TestDaF 的考试频率为两个月一场（全球）及 **四个月一场（中国大陆）**，若在中国大陆报名，报名时间约为考试日前 7 周开始，前 5 周结束报名。

满分5分，常规大学理工科专业的入学要求为4444。文史类及法学类要求略高，总分 17-19 均有可能。个别学校（如 TU Darmstadt）提供较低分数发 offer 的选项但入学需满足 4444，另有个别学校（如 RWTH Aachen）申请时无需提交成绩，最迟注册时提交。

出成绩时间约为考试日后 **6-8 周**。

#### Goethe C1/C2

歌德学院在全球提供各等级的德语能力课程与考试。大部分学校接受 Goethe C1，个别学校如 TUM 要求 Goethe C2。考试信息请参考 <https://www.goethe.de/ins/cn/zh/spr/prf/anm.html>。

若具备 Goethe B2 等级的德语水平，可申请德国语言班的长期签证，为期 6-12 个月。

### GRE/GMAT

GRE: 研究生入学考试（Graduate Record Examinations），是由私（kě）立（wù）的美国教育考试服务中心（ETS）主办的标准化考试，用来测验大学毕业生的知识技能掌握情况。报名网址 <https://ereg.ets.org/ereg/public/jump?_p=GRI>

GMAT: 研究生管理科入学考试（Graduate Management Admission Test）是一项专门用于测试商学院申请学生能力的标准化考试，重点在于测试应试者在一般商务环境中的理解，分析和表达能力。

理工科主要参加GRE考试，商科申请者（特别是MBA、金融硕士、会计硕士等）需要参加GMAT。

GRE 包含 quant, verbal 和 writing 三个部分，一般申请的时候看的是前两个。

quant 就是简单的高中数学题，奔着满分 170 去即可；verbal 类似于是英语的语文题，做句子理解，里面有很多诘屈聱牙的句式和大量生僻词汇和用法，因此这个部分也是很多同学都头疼的部分。这个部分对词汇量要求非常高，所以如果要准备 GRE 和语言的话推荐先准备 verbal 部分，之后准备语言考试会显得比较容易。

!!! note

    越来越多的研究生院将GRE考试成绩作为Optional，尤其是理工科。也常见无 GRE 录取的案例。

## 课程匹配度

课程匹配度是欧陆 master 申请的重要因素，有时甚于推荐信。

课程匹配度的基本原则是对照所申请专业的 bachelor courses（有时会给一个课表）与笔者所上课程的重合程度，大于某个百分比才能往下走，否则直接 rej。 **PF 的课一般会被视为没有学分**。注意要进行学分换算，欧陆采用 ECTS 学分制度，每个学期固定 60 ECTS。

> 以理工类为例，如果部分学校的培养方案比较重视数理基础，需要补数学课。另外 THU 有一个特色是实验课学分数比对应学时数少（正常应该两倍甚至更多），这方面可能会吃亏。
>
> 如果想跨申匹配度差的专业（如转码）一般不予接受。`,
	},
	{
		DisplayName:       `安静的泡芙`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | interview`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：interview。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 面试

如果拿到了面试邀请，恭喜你，说明你已经拿到了入场门票！

应该说面试是一个比较 diverse 的过程，不同的专业方向会有不同的组织形式偏好，甚至即使是同一个项目，面试你的面试者也会导致完全不同的面试风格 / 内容。但是有一些内容是一般可以早作准备的，下面作简单罗列：

- 简短的自我介绍。最好能几分钟快速介绍一些 highlight。
- 如果本专业流行学术型面试，e.g.由 professor 直接来招人，那么可以做一个自己过往 research experience的 slides。如果知道具体是谁来面的话还应该提前检索其 pub 简单了解一下方向。
- 如果本专业流行问知识性问题，可以稍微复习一下 ~~但是一般也没啥用，该会的还是会该不会的还是不会，可见平时还是应该打好基础~~
- 如果你的背景某个部分有重大缺陷，比如核心课挂科这种，准备好一个合适的理由。
- 一些你关心的要素如果不清楚的话准备好提问，比如 funding、指导风格、课题组成分。
- PhD 面试经常有的一个灵魂拷问：如果我们给你 offer 你会不会来 / 有多大可能会来。一般来说如果你的回答不是很确定的话会增大 wl / rej 的风险，但是还是如实按个人情况回答即可，他们既然这样问了至少是有录取的意愿的，如果已经有更好的 offer 那也不必养鱼。
- 如果可以知道面试官的身份，可以提前熟悉他们的背景和口音。
- 精心设计面试流程，穿什么，怎么打招呼，Zoom背景等，留下好的第一印象。`,
	},
	{
		DisplayName:       `认真的包子`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | onlinesystem`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：onlinesystem。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `申请系统开放的时间与项目入学时间一般是对应的，几个常见的 checkpoint 包括：5月 - 8月申请次年 fall 入学的港新提前批、**10月 - 次年2月申请次年 fall 入学**、1月 - 更晚申请次年 spring 入学。

具体的开放时间随学科、学校所在地区的惯例而有不小的变化，所以请最好提前一年半（至少一年）总结好所有申请项目的系统提交时间。

由于清华邮箱有可能收不到验证邮件，可以使用其他邮箱注册账号填写申请。

!!! tip
    - 因为有许多相似的内容，所以可以创建一个文档，把第一次填写完的内容复制出来。为后面的填写做准备。或者打开浏览器的自动填充功能。
    - 写完一定要检查。重点检查一些细节,比如：
        1. 时间的自洽（毕业时间和毕业证时间的一致）
        2. 文件的格式（上传后能否预览？预览效果是否适合？）
        3. 导师等人的姓名
        4. 学校机构的名称（大小写特殊符号）

提交了申请材料后，还可以：

1. 继续套磁

   可以继续调研SOP中提及的faculty，给老师发邮件告诉他“我很喜欢你的研究，我在SOP里提及到了你的名字。期待与你的交流。”   如果你提前跟老师打过招呼、争取过交流机会，老师对你的印象就会加深许多。

   试想如果你是老师，面对那么多陌生的材料，如果看到一个熟悉的名字与话题，会不会好感立马就上来许多？所以，材料提交后也可以继续套瓷、邀约老师。

2. 准备面试

    - 提前准备PPT演示，包括自我介绍，自己的研究内容、研究经历与研究兴趣
    - 找同项目的学长和老师，请他们帮你模拟面试流程。
    - 对意向导师再做一些功课。至少保证熟悉他们的研究方向，能表达自己的观点。`,
	},
	{
		DisplayName:       `企鹅栗子`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | rl.md`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：rl.md。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 推荐信

推荐信（Reference Letter, RL）是申请材料中非常重要的一个部分，推荐信的作用是从第三方的视角向招生官表述申请者的能力，是你申请材料中唯一（程序上）不经你手的部分。推荐信意味着你和某位学者（业内人士）有联系有过合作，并且ta愿意推荐你，意味着你在ta那里表现的还不错。别人承认你的“好”，而不是自卖自夸。

以下会简单介绍推荐信的类型、联系推荐人、草拟结构等。

!!! note
    不是所有申请都需要推荐信，典型代表为德语区的大部分授课型 master。

## 推荐信概述

推荐信通常分为学术推和业界推，分别由你的学校教授、老师和业界老板、同事撰写。一般要求申请时至少有一封学术推（具体情况请 [查询各项目官网](../../preface/location/) 上了解）。推荐人可以是各种与你有实质性交集的人，最好能要有一定职位，但更重要的是对你比较熟悉 / 有一些了解，能够接受你的邀请，可以是你的任课老师（课程推）、科研导师（科研推）、实习主管（业界推）等。

前面提到过，在申请系统中推荐信都是不经手学生的，通常是直接学生在申请系统中提交推荐人联系方式后由推荐人直接提交推荐信。但实操上国内老师的推荐信几乎都是由学生自己撰写 / 草拟，由教授签字 / 修改后提交或者将提交链接给学生自己提交，有些比较认真的老师会找你详细了解情况。

!!! note "一些tips"

    -   申请提交的时间在每年 10 月到次年 2 月间，因此建议尽量保证在10月之前完成推荐人联系和提供草稿（如果需要的话），如果迫近 ddl 而推荐人还没有提交的话适当发邮件提醒。
    -   选择推荐人时可以找 3~5 人，防止有教授不同意或反悔跑路，导致推荐信数量不够。
    -   建议联系推荐人时可以附上你申请用的成绩单和 CV，尤其如果你和推荐人没有特别深的了解的话（例如 do well in class）。
    -   尽量找关系近的推荐人。 **谨防黑推！！！** 如果不太确定，一些策略是在询问推荐人时就确认好推的强度，如“您能给我一封较有支持性的推荐信吗”等等。
    -   现在推荐人提交推荐信的时候一般还需要填写一些选择题，大致就是“你有多推荐这位学生”的定量选择题，由于国人特有的谦逊和折中可能会有些推荐人都填写中庸选项，所以最好提醒一下这些选择题都选top / best。


## 推荐信结构

Recommendation letter 的结构主要包括以下三个部分:

1.  推荐人与申请者的关系介绍

    推荐者（教授）在开头部分需要介绍他与被推荐者（学生）的关系，以及两人结识的方式和时间长短。这部分内容可以反映出推荐者与被推荐者的熟悉程度，从侧面反映出学生的被重视程度。如果是在国内外都享有一定学术资历与威望的教授，他作为推荐者与学生的关系很好，那么这封推荐信的价值与意义就不言而喻了。

2.  推荐人阐述具体的合作内容与申请者的个人特质

    在推荐信的 body 部分，推荐者介绍学生具备的优点及能力。在这一部分，结合具体实例进行解释的方式是最直接、最有说服力的证据。比如，教授介绍了你参与过的研究或项目，在其中你扮演了什么样的角色，作出了怎样的贡献，突显出了你所具备的综合素质与能力有哪些。

3.  综合概述推荐人对申请者申请专业的看法

    简要总结为什么要推荐这位学生。

    - “我向committee推荐你。总结来说，该同学的xxx特质满足你们招生的需求，我相信，xxx是你们想找的人。”

## 推荐信内容

在内容上，可以表达以下几个方面：

1. 头脑灵活，有很多想法
2. 对研究的兴趣与热爱
3. 做事态度，做事方法
4. 取得的成果（可以少一点，因为CV和SOP一定会提及到）
5. 个性与性格：善于合作，善于沟通，好相处

??? example "推荐人&角度"
      - 国外大牛。一起做过科研的，重点描述大牛与你工作的体验感受，大牛感受到了你对科研的兴趣与热爱。可以偏general一些，因为如果太细节反而会让人觉得有点奇怪。大牛很忙，和大牛见面的频次不太可能让大牛对我们有很具体的印象。
      - 国外小老师，一起做过科研的。重点描述工作状态与工作方式。比如与你合作的环节，如何分工，我们如何我们把事情做好，可以偏细节一点。遇到了什么问题，如何想到解决方案，并且把困难解决。
      - 你的本科/硕士导师。和你在一起最久的人。可以多描述几段经历，每段经历最好体现你的不同方面。并且可以有一些下定义的句子。比如你是一个怎样的人，你将会是一个怎样的人。
      - 给你上过课的老师，你上过他的课。重点描述学习态度。这堂课老师与你的互动。比如你的主动性，主动回答问题，主动思考如何把作业做好？什么作业让老师对你印象深刻，做过助教的你如何把老师交代的任务做好，还可以与sop你提及到的研究兴趣相匹配。比如正是这门课，启发你对某一方向的热爱，让你开始尝试科研。


## 录取后

记得在你确定去向后向推荐人表示感谢，维持良好的礼节和 connection。`,
	},
	{
		DisplayName:       `努力的兔兔`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | 选校定位`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：选校定位。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 选校定位

> ***选择比努力更重要***

!!! question "选校需要考虑什么？"

笼统来说“选校”需要考虑两个部分：一是项目是否能录取你，二是假如录取了你会不会去。一般来说我们谈论的更多的是前者，也就是所谓的项目 bar（或者有时笼统地称为项目 tier），但是研究生作为你人生中一个重要的阶段，后者也是值得谨慎考虑的，比如如果你很想未来读 PhD 结果申请了一大堆就业导向的 master 那就有些南辕北辙了，就算收割了一大堆 offer 也是比较尴尬的。

评价一个项目会有很多值得考虑的点，比如录取难度、学校 title、项目导向、院系实力、项目 cohort size、找工区位、开销、生活环境和生活节奏、安全因素，并需要结合一些客观情况，包括社会大环境（note: 尤其是你毕业时的环境）、家庭经济压力、你未来的规划等。下面会介绍一些相关因素以及如何考虑他们的重要性：

## 录取难度

项目难度大致可以分为三个等级：彩票、主申、保底。建议每个等级选择 3-4 个项目，进行合理的分配，让自己不至于失学的同时更可能拿到好的 offer。关于项目的录取 bar 可以根据项目要求与符合情况，往年录取情况等信息综合做出判断，

- 	彩票：个人水平低于平均录取情况，招生人数较少，竞争非常大，录取可能性比较小（像中彩票一样）。
- 	主申 / 冲刺：与往年平均录取水平接近，与项目要求比较符合，有希望被录取。
- 	保底：个人背景高于平均录取水平，有很大希望被录取。

	!!! note
		保底校不应该选得 tier 太低，避免出现 overqualified.


请注意影响项目 bar 的因素很多，就像供需关系一样有很多变数，甚至还有一些就是不喜欢招某学校的学生或是每年定点从某学校招几个人的例子，所以我们建议选校时直接多参考往届样本。

## 学校 title

学校的 title 是否好需要结合你的未来规划考虑：如果打算回国那需要考虑在国内的 title 以及各类大学排名，如果打算留外那直接考虑在当地的 reputation 即可。具体来说学校 title 影响着求职时的背景、校友网络、~~你爸妈出去吹牛是否有面~~ 等问题。不过通常来说学校 title 是最后几个需要被考虑的因素（例如虽然藤校[Ivy League](https://en.wikipedia.org/wiki/Ivy_League)其实是个体育联盟，但国内就认这个，或者是一些偏科学校的排名会很低），你自己水平够硬才是比较重要的。

- [QS排名](https://www.topuniversities.com/university-rankings/world-university-rankings/2023)
- [U.S. News排名](https://www.usnews.com/education/best-global-universities/rankings)
- [Times泰晤士排名](https://www.timeshighereducation.com/cn/world-university-rankings/2023/world-ranking#!/length/25/sort_by/rank/sort_order/asc/cols/stats)
- [上海软科ARWU排名](https://www.shanghairanking.cn/rankings/arwu/2022)

## 项目导向


当然要挑选适合你未来职业规划的项目！可以通过往届学生去向、课程设置来了解。比如“往届学生基本都大量实习最后去了业界 + 学校提供丰富的 career service + 处于产业发达的大城市”，一般意味着适合就业导向；“往届学生转申情况良好 + 课程硬度大理论性强 + 科研机会丰富教授指导多”，一般意味着适合学术导向等。


## 院系实力

直观来说参考 USNews 或 QS 的专业排行足够提供初步印象。更具体来说可以看看他们的 faculty size 和 bg、近年有无影响力成果发表、在业界或学界的校友网等等。如果申请 PhD 的话需要着重参考这一点。

> 当然院系强和项目好有时候也没什么关系，比如 Columbia Stat 院系水平挺强的，但是它的 master 项目评价上就比较多元化了。

## 开销

不同地区的项目开销是不一样的，具体来说开销包括学费和生活费。学费随国家地区、公私校变化，生活费则主要受学校区位（当然还有个人生活方式）影响。下面是一些典型地区的介绍（可能包含印象流）：

-   美国：大城市 + 私立校 = 贵，以 NYC 的 Columbia 为例，经常可以按照每年 RMB 80W 预计总花费（学费 50 + 生活费 30+ 上不封顶）；公立校的学费相比会便宜一些，比如 UCB 可能只有 30W 学费，但加州生活费还是很贵；在村里的学校生活费会很便宜，比如玉米地可能只需要 20W 就能过的很滋润了。
-   英国：跟美国情况类似，但好在学制比较短，所以一般开销尚可
-   新加坡 & 香港：这两个比较像，学费较便宜（~20W），生活成本常比国内高，但比欧美低。
-   欧陆：学费经常很低甚至没有，至多跟清华差不多的水平；房租适中，日常生活开销视地区而定。

参考阅读:[抠门留学指北](https://www.douban.com/note/829963274/?_i=8025124y_pcX1X,7101359lLsB6F7)

## 生活环境

主要包括人文环境和自然环境。比如你如果喜欢晒太阳、喜欢 party 的话那很可能会想要去加州这种地方，而不是去北部的小城市。另外所在地区的中国元素含量也值得考虑，比如华人多的地方经常容易买到习惯的东西 / 吃到中国菜。尤其对于读 PhD 这种长时间项目的情况，考虑生活环境还是很重要的。

## Tips

-   请根据个人实际情况确定选校，没有等级和项目数量的标准答案。
-   不是说彩票就不会录取，保底也不是百分百录取。
-   如果感到太难以考虑，可以挑选几个自己觉得重要的因素，据此笼统地排除一些，之后多方了解信息，几轮筛选下来得到一个最终 list。
-   当然多投点项目肯定能降低失学概率，所以钱&时间&RL足够多可以海投。

参考帮助：[申请表格整理](./help/summarytable/)`,
	},
	{
		DisplayName:       `可可泡咖啡`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | touch`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：touch。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 套瓷

所谓“套瓷”，就是和教授主动通过书信往来建立联系和彼此印象，从而加大录取和拿奖学金可能性的一种行为。

只有 PhD / Mphil 申请者需要套瓷，一般授课 master 几乎不需要，具体来说有些学科的 doctor 也不流行，可以多向老师或学长学姐了解。

!!! note "关于要不要套瓷的笼统标准"
    大多数项目的招生经由招生委员会进行，所以存在两种情况（或介于两者之间）：所谓的“强 committee 制”和“强 faculty 制”。对于 master 来说，尤其是授课型硕士来说你的培养都是由院系进行的，招生自然也是强 committee，这时套瓷就没有什么用。而对于需要在教授手下做科研的情况来说，他需要负责你的培养，甚至是 funding，那可能就会在是否招生上有更多的话语权。
## 目的

 套瓷的目的包括：

 1. 了解教授的招生计划 / 名额（不招生就别申了）。
 2. 提前向教授展示自己，提高录取概率。
 3. 了解教授的招生意向，为后续工作做铺垫。

!!! note
    套瓷的核心是“确认老师今年招生，让老师知道你”，如果可以让老师对你感兴趣就更好了！毕竟每年套瓷的学生是海量的，你能在提交申请材料前，争取到跟老师交流的机会，建立在老师心中的初步印象是对申请非常有利的。

具体套瓷的方式其实和 [联系助研](../../experience/research/) 差不多，大家要 **自信主动交流**。

!!! tip
    邮件发出去，没有收到即时回复很正常。一是老师忙，很难做到马上回复。二是我们和老师还是陌生人，老师收到邮件后，也需要做一些功课与调研，再决定是否安排时间与我们交流。

    若较长时间没有回复，可以重新编辑邮件再次发送。

## 内容

套瓷信的内容不需要太长。具体来说，可以写:

1. 介绍自己是谁。自己写邮件的目的是询问博士名额+邀约老师聊聊。（1-2句）
2. 自己对哪个研究话题感兴趣（1-2句）
3. 老师和自己研究的match点是什么？（2-5句）
4. 发出邀请。请老师可以方便的时候一起聊聊（1-2句）

## 策略

关于第三点有两种策略：

- 一种偏保守，可以描述对老师研究内容的兴趣，启发了我们什么？对该研究方向的判断哪些与老师是一致的，非常认可老师的哪个观点？
- 另一种策略偏激进。可以描述一下自己觉得老师的哪个工作可以进一步做？也就是，自己如何让老师的这份工作做的更好？

!!! example "🌰"
    1. “我看到了你的这份工作，我觉得还可以通过xxx手段提高xxx，还可以结合xxx，这样可以实现xxx的效果。这个手段是我熟悉的内容。如果你感兴趣，我们可以进一步聊聊。”
    2. “我看到了你发表的这份工作，我有一个新思路，可以进一步完善它，让它的局限性变小。我的专业和它相关，我按照这个想法做了一个demo，如果你感兴趣，我可以带着demo去找你聊聊。”


> 务必使用 .edu 邮箱发送套瓷邮件，教授们每天都会被大量邮件轰炸，用教育邮箱能减少因被当作 spam 而被忽略的概率。`,
	},
	{
		DisplayName:       `甜甜的可颂`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | research`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：research。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 科研

科研经历对于申请 doctor 和学术型的 master （例如英联邦地区的 MPhil 项目）至关重要。它的用途主要是证明你参与过科研项目，至少是了解了科研是怎么回事。

如果能在助研（ undergraduate / gap year research assistant 等）期间有学术产出就属于锦上添花；具体是否有产出、有多少产出对于申请的助力随学科不同变化较大，建议你直接参考类似项目的往届录取情况。

!!! success "评价参考"
    一作顶刊/顶会 > n作顶刊顶会 > 一段长时间且海外科研经历 >= 其他论文 > 一段短时间海外科研经历 > 一段任意地方的科研经历

    (长时间海外科研经历很可能拿到海外推荐信)

授课型 master 对科研经历的要求较低。

## 寻求科研机会

### 校内科研

**自信主动交流** 通过院系官网等找到对应方向 faculty 的联系方式，发邮件表达学术兴趣，询问是否有本科生科研机会，预约面谈或实验室参观。也有一些教授会主动招本科生到组里助研。

即使最差的情况，你不了解各个老师的细节方向，也不知道自己的知识技能背景适合哪些方向，也可以先找一个你熟悉的老师，请他给你一些实用的建议，don't be shy!

如果你已经确定要出国，并希望 faculty 给你写推荐信，最好在开始表达清楚，询问他的意见。

通常教授不会拒绝本科生的请求，但也不必太期望得到亲自指导，通常教授会指派课题组的研究生指导你，所以如果想真正了解怎么做学术、取得成果的话，希望你一旦开始就投入足够的精力。有了实际的成效，在联系推荐信时会更容易，推荐信也会更有内容并能够成为一封强推。

!!! tip

    选择有海外学术职务 / 有海外背景 / 晋升期的青年教师等机会更多；尤其是海归新 AP，他们也更可能有时间指导本科生。

!!! note "寻求助研机会邮件结构"
    1.  自我介绍，并讲明来意（如希望进组科研，或是想了解研究方向，或是想寻求建议）；
    2.  你的背景（过往科研经历、相关课程 / 知识、技能）；
    3.  （若有）自己的研究兴趣、期望的方向；
    4.  如果想约时间面谈，多提供几个可用时间；
    5.  邮件附件成绩单和 ` + "`" + `.pdf` + "`" + ` 格式个人简历。


### 校外科研

本质上很多与校内科研差不多，除了自信主动交流以外，也可以通过本校参加过助研的教授介绍和推荐。

**无论是什么机会，想要做出成果都必须自己付出努力** ~~虽然努力了也未必有成果~~

## 进行科研入门

!!! example "个人经验向，请谨慎判别"

    如何进行科研是一个比较复杂的问题，个体差异也比较大。这里笔者尝试讨论比较初级的本科助研的开始阶段，为刚准备开始参加科研训练的同学提供一些个人见解，欢迎大家批评指正。

近些年来就笔者的观察而言，开始本科助研的时间在总体意义上来说越来越早了（可能有强基鼓励的原因），经常有同学在大二甚至大一就在了解“该有什么前置准备”“怎么找老师”之类的问题。关于是不是应该本科低年级就开始科研这点笔者不作评判，因为个体差异较大，且受学科影响，既有低年级就能做出优秀工作的，又有因为过早接触而被劝退的样本。这里仅对于打算开始科研（特指大二 / 大三的时候开始）的同学提供一些行动或心理准备上的建议，希望能帮你更好地入门科研。

科研可以说是和上课很不一样的体验，一般来说由少量的满足感和大量的挫败感交替进行。大多数时候会有工作内容很 dirty 没有美感、没有进展担心被导师拷打、文献看不懂全是疑惑、~~看着朋友们都和 npy 出去嗨皮了而自己只能孤独地猫在实验室~~ 的挫折，甚至更糟糕的被导师 PUA 或是完全放养没有指导的糟糕情况；但偶尔产生突破了、被导师表扬了、~~找到 npy 了（科研无关）~~ 也会非常有自豪感和成就感。所以很大可能从事科研要做好准备打持久战。

具体在上手阶段，一个首先的困难是：科研需要的能力和上课做题时很不一样的，所以一开始会经历一个陡峭的知识 / 技能学习时间，包括专业知识补习、相关和前沿文献阅读、meeting 上的学术交流、仪器或代码操作等等，你很可能会有大量东西要学，之后当你大致对相关的基本知识技能上手了、熟悉了你手头的课题了才能进入比较稳定的科研时期。这个陡峭的学习期很可能会是比较劝退的，你可能会感到处处碰壁，也没有产出，而且会感觉这条路遥遥无期，从而更没有动力继续推进，陷入一种糟糕的恶性循环中。因此笔者有如下一些建议：

-   多和导师（也可能是负责带自己的博士生）沟通进度，交流困难，寻求建议。
-   每周确保足量的时间精力投入，并 push 自己多思考科研相关内容（但是如果实在碰壁了，别太自责或急着死磕，你还在起步阶段！没有进展不是需要感到羞耻的事，可以参照第一条）
-   自己记录每周进展，比如维护一个小文档。能让你看到自己在推进科研内容，以后有疑惑了或是想回忆实验结果也方便查阅。
-   如果渐渐发现不是自己感兴趣的方向，甚至产生了厌恶情绪，也不必羞于提出更换题目或是换个组。实在搞不下去的时候可以择机和导师谈谈自己的课题及兴趣想法等。
-   不做科研并不是失败者。笔者经常观察到园子里的同学将科研 - 读博作为最优甚至唯一的选择，但人生是有很多有趣的可能性的，大家可能只是被园子里的科研氛围裹挟了。如果感到自己不适合做科研，不妨尝试选择其它人生路径（& 很多博士生毕业了最后还是要考虑前往业界谋职之类的的问题）。

> 也可能有些同学天赋异禀如鱼得水，或是能够乐在其中，这一点笔者不怀疑。这里只是就笔者经历或接触身边人的情况讲述一些情况。希望能为大家提供一些参照。`,
	},
	{
		DisplayName:       `馒头奶茶`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | aps`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：aps。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `为打击学历造假，德国设置了留德人员审核部，面向中、印等个别国家的公民进行**学历审查**，**兼具面签功能**。审核机构及审核证书均可简称为 APS （Akademische Prüfstelle）。APS 审核在“[德国驻华使馆文化处留德人员审核部](https://www.aps.org.cn/zh/)”进行，正常 master 申请需通过[一般国内申请人审核程序](https://www.aps.org.cn/zh/verfahren-und-services-deutschland/chinaverfahren)。

APS 材料繁多，建议从大三暑假开始准备。一些典型材料有：

> - 小学/初中/高中的毕业证复印件。前两者可用九年义务教育证明代替。
> - 录取花名册：在本科生招办开，地址在二校门西边小老虎处
> - 中英文成绩单密封件：需要**六个学期的有效成绩**，挂专业课且未重修有材料不通过的风险（重修且过了可以）。密封件的开具方式为在 C 楼自行付费打印中英文成绩单后上楼去注册中心装袋贴标签。
> - 部分材料的英语/德语翻译公证件：任意找一家涉外公证处就可以，注意办理公证需要**身份证原件**、**户口本原件**/**集体户口笔者户口页原件+首页复印件**。一般建议办至少两份以防以后需要用的情况。
> - 语言水平证明复印件。接受 CET-4 与 CET-6。

上交的材料原件不会退回。材料审查约需 1-2 个月。

材料审查通过后有一个面谈程序，进行约 20 min 的一个简单笔试和约 20 min 的面试。从材料提交到面谈需要排队，**一般排2个月及以上**（疫情期间是约时间不排队）。
> 此面谈兼具面签功能。面谈连续三次未通过则终生不可获得 APS 证书。
>
> 面谈语言可选英语/德语/英德双语。笔试现场有词典可以查。
>
> 面谈内容一般是问为什么要去德国（**一定不要说移民**），想去的学校，德语水平，以及在成绩单上**随便**挑几门基础课/专业课问主要内容或学习重点（有纸笔可以画图）甚至一些细节内容。
>
> 面谈难度存在学科差异，以面试官对本学科的了解程度而定。

面谈通过后发放纸质（10 张）或电子版审核证书，二者具有相同效力。拿到 APS 证书后即可着手申请与签证。

在毕业后需进行 APS 补审以获得补审证书，仅有材料审查。

!!! note
    为保证在递签前得到审核证书，请提前至少四个月申请 APS。
    PhD 不属于学签范围，一般无需 APS。`,
	},
	{
		DisplayName:       `泡芙棉花糖`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | 学信网认证成绩单催促邮件模板`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：学信网认证成绩单催促邮件模板。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 学信网认证成绩单催促邮件模板

申请中有些项目需要提供学信网认证的成绩单，但是学信网效率非常低，处理时间非常长。为了避免影响申请进程，尽量早处理这些文书，并可以选择电话和邮件催促。路径：[学信网出国教育背景信息服务](https://www.chsi.com.cn/wssq/) $\\to$ 「*点击进入网上申请系统（Start an Application）*」

!!! tip "清华成绩单录入 tips"
    -   秋季为第 1 学期，春季为第 2 学期，夏季为第 3 学期，所以军训是在 \\*\\*\\*\\*年第三学期
    -   虽然清华的成绩单上是有明文写出学分-学时对应的，但是学信网方面认为没有在列表条目中出现，所以不要录入学时信息。
    -   “分数”一栏应填的是等级制成绩 A, A-, etc.
    -   学信网的上传格式是图片，所以从电脑上截电子版成绩单的屏时请使用合适的截屏工具避免电子签名章消失；或者直接拍纸质成绩单避免这个问题。


!!! example "催促邮件例子"

    尊敬的学信网客服您好，

    我的学信网ID是XXXXX，我的申请单号是XXXXX， 为加快审核的速度，现提供如下信息：

    以下是我院教务处老师的信息：

    名字：

    电子邮箱：

    电话：

    工作时间：

    您也可直接联系注册中心审核成绩单：

    主任：尹佳

    电子邮箱：[邮箱已隐藏].edu.cn

    电话：01062788616

    工作时间：上午9.00-11.30,下午13.30-5.00

    以下是我的教务处账号：

    名字：XXXXXXXX

    密码：XXXXXXXX

    网站：https://webvpn.tsinghua.edu.cn/login, http://info.tsinghua.edu.cn

    先登陆vpn, 再选择info, info登陆后可在左边快捷搜索栏-学习-成绩-中文/英文成绩单查阅到我的成绩单（均见附件）。`,
	},
	{
		DisplayName:       `抹茶石榴`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | toefl home`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：toefl home。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `标化考试方面，TOEFL 和 GRE 近年都推出了家考服务，且疫情期间愈发成为线下考场紧缺下的一种选择。家考的好处是显而易见的：适用于紧急需要语言成绩的场景（如交换项目申请、conditional offer 需要刷分）、免于通勤排队等，因此我们在此为你提供一些家考的经验和注意事项，希望能帮助你判断是否需要选择家考以及进行准备。如果有遗漏的细节或是日后程序有更新可以随时修正或补充。

!!! note
    由于家考无法解决作弊导致的置信度问题，之后可能会不被认可（23fall 已经有部分案例）。目前 TOEFL 的线下考和家考成绩单 **有区分**，GRE 暂时不区分，所以在 TOEFL 家考方面需要谨慎勘对项目官网要求。

1. 关于电脑环境：家考监考通过一个叫 ProctorU 的远程监控软件进行，能够监视电脑情况或必要时远程操控电脑，考试前由考生预装，考试时连线线上监考进行考试。最好弄个新的或者重装下系统，没法的一定要删除各种奇怪软件，以及一定要防止弹窗广告之类的。奇怪的软件包括向日葵/teamviewer 等远程软件、zoom/腾讯会议等会议软件，后者不想删记得一定清理后台，前者一定要删除。还有微信/QQ等即时软件，这个注意关闭就行了。考前一定注意清理后台，proctor 会展开右下角小图标挨个看，把能引起怀疑的都关闭，可能打开任务管理器什么的看。

2. 浏览器要用chrome，但最好也装个firefox备用，防止chrome出突发玄学问题。

3. 考前可以进入读秒的界面找一个 test equipment，检测摄像头、拾音、录屏、网速之类的，四个绿灯都亮就都ok，如果网络不行最好插网线。

4. 考试环境必须是全封闭的环境，背后需要是房间的门且能让摄像头看到，考试期间这个门如果开了基本就寄了，所以千万注意锁好门，也可以在外面贴张纸别让别人进来。

5. 桌面最好都清理干净，可以留点卫生纸/水（理论上不行，但留了也都没事），最好别在考试的时候喝水/用卫生纸（理论上不行）。

6. 考试的时候不能说话（理论上不能小声念叨题目），眼神一直要在屏幕内，头不能太贴近屏幕，不能低头太长时间，思考时眼神到处飘也不行，所以思考 / 记笔记的时候最好大多数时候抬头，偶尔记笔记，敲作文盲打最好。

7. break 的时候最好别动弹，尤其最好别出门，喝水啥的 ok，提前 1 分钟回来喊监考官一嗓子，没回应可以 alt+tab 切出对话框打字。

8. 小动作理论上不能有（瓜田李下）。

9. 有个可能有用的小 tips：进入考场之后就有个 download 按钮，这个界面不往下走可以停好几个小时（比如2点半的考试在5点才点download也都是ok的），可以用这个时间处理突发问题（网断了/突然肚子疼/忘记拿白板etc）。

10. 考试不能戴耳环项链手表啥的，全程基本都要让 proctor 看到头和脖子。

11. 个人怀疑和 proctor 对话失败会导致被 hold。

12. 房间温度最好调好，防止忘开空调了或者空调太冷了考试很难受，还有展示的时候可以做作一点。

13. 记得设置输入法仅限英文，电脑界面也最好调成英文，尤其注意关闭自动联想。`,
	},
	{
		DisplayName:       `年糕奶酪`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | Curriculum Vitae/Resume 简历`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：Curriculum Vitae/Resume 简历。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# Curriculum Vitae/Resume 简历

一份结构化的材料，将你的基本情况和履历浓缩在 1~2 页内，让 committee 能迅速对你有一个轮廓性的认识。

## 内容

简历的内容可以包括：个人基础信息、教育背景、研究成果、出版经历、研究经历、工作经历、助教经历、获奖情况、参展/参会情况、擅长领域（技能）等等。

学术 CV 需要包含教育史、工作和研究经历、pub、项目、教学、学术获奖、talks 等，还可以包含上过的课、技能/语言/证书等。

!!! tip
    1. 内容务必与在申请网站上填写的信息保持一致
    2. 写教育背景的时候，可以罗列一些代表性课程：课程名称 + 成绩
    3. 写工作经历的时候，用带有数据的结果描述更有信服力


如果是第一次编写 CV 最好在 [Overleaf - CV](https://www.overleaf.com/latex/templates/tagged/cv) 上找个模板慢慢改，可以使用 [Github CV Tsinghua Template](https://github.com/K-Wu/CV-tsinghua-template)（有 [THUOverleaf 项目](https://overleaf.tsinghua.edu.cn/templates/)，校园网访问）。

!!! note
    不同国家和地区对 CV 的要求存在些许差异。以德国为例，CV 需包含自小学开始的所有教育经历。

参考资料：

- [UIUC CV samples](https://grad.illinois.edu/sites/default/files/pdfs/cvsamples.pdf)。`,
	},
	{
		DisplayName:       `泡芙种花中`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | Personal Statement/Statement of Purpose/Motivation`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：Personal Statement/Statement o。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# Personal Statement/Statement of Purpose/Motivation Letter 个人陈述/目的陈述/动机信

PS / SOP / ML 是文书的重要环节，是学校的命题作文，学校项目会给出内容的要求。

PS 通常包括自己的家庭情况、爱好特长，向 committee 展示自己的特质。

SOP 侧重 purpose，有时候 PS / SOP 这两个材料不会区分，这个时候更建议你按照 SOP 的方式来写。一般 SOP 中可以包含选择这个专业/项目的原因，过往的相关经历，从经历中获得了什么，感兴趣的方向，未来发展规划等。如果不知如何下手的话可以参照自己的 CV 撰写，但可以额外强调一些不出现在 CV 中的内容，比如一些特殊 outreach、学术志趣、未来规划等。

ML 为欧陆称谓，等价于 SOP。

## SOP（Statement of Purpose）

SOP的价值是更加具象的展示你，展示你的思维、研究兴趣和研究收获。在通过CV展示基础信息和成果之后，你需要SOP来展示你的科研成果的研究过程，你对研究产生兴趣的过程，你对自己的期待与未来的想法。

具体来说，比较常见的内容：

1. 第一段：描述一下自己研究的起步。对研究在怎样一个契机的情况下开始的，是对某件事开始好奇？还是听过某节课开始受到启发？还是听到某个讲座内容，觉得想深入理解
2. 第二段：描述有代表性的科研经历1。比如可以是一段暑研经历。在经历里具体做了什么，通过这段经历收获了什么，学习到了什么，哪些方面开始提高？
3. 第三段：描述代表性的科研经历2。可以开始讲自己持续对某个话题感兴趣，所以又怎样想到了第二个idea，开始继续深入理解了某个研究方向？对研究方向的发展和期待是哪些？未来还想围绕着哪些话题进行讨论与设计？你对该研究方向是否有哪些具体的idea？
4. 第四段：描述自己和心仪导师的联系。比如对某个老师有兴趣，ta的研究方向里，有哪些独特的观点让你着迷，让你觉得认同。对某个老师的实验室感兴趣，ta们组的愿景和研究内容让你向往。如果你加入到了这个lab，你打算贡献什么？你能给实验室带来哪些独特的话题与视角？可以写1-3个老师。每个老师可以都展开讲一下，也可以详细1个，简略提2个。
5. 第五段：描述自己和未来学校的match程度。给出充分理由让对方院校committee觉得你是做过功课的。比如对方学校是研究型大学，研究方向里关注将某个方向结合某个趋势。你对这个趋势也是认可的。再比如，这个学校里的校友资源、实验室设施、课程与培养计划等都可以成为你描述的主要对象。最后讲一下自己未来规划。比如进入工业界还是学术界？贵学校的哪些教育资源有助于你实现你的学术生涯与梦想。

## PS

PS希望传达的信息是：是什么塑造了今天的你。

PS比较好的落脚点是将个人性格与经历，和研究兴趣与研究的理解结合起来。让读者读完自然的得出结论：你是一个xxx的人，对研究有兴趣，有成为优秀研究生的潜力，具体来说:

1. 可以是你从小是一个xxx性格的人，这种性格的塑造来源于某次事件。通过这个事件，你确信了自己心里的某个想法。于是你开始好奇，想更多的了解这个想法。
2. 也可以是通过某个科研经历，发现了自己很擅长哪部分工作。通过这段经历，学到了哪些个人能力，加深了对某个事物的理解。
3. 或者是某一节课和老师的交流，让你开始关注一个事物的另一个角度。你开始自己思考，如何将这个角度扩展开，
4. 也可以自己做过的一次有争议的选择。自己决定放弃了什么，坚持了什么。为什么想坚持？自己相信什么？这件事带来的结果是什么？
5. 介绍自己的家庭背景。比如自己出生在一个怎样的家庭背景。父母的哪些观念与行为塑造了今天的你，让你开始对哪些事务着迷？这些事务与你感兴趣的研究方向有怎样的联系？
6. 介绍自己的教育背景。你从教育中收获了哪些？你对教育的理解是什么？自己从哪次教育中受益？比如哪堂课受到了什么启发？哪本书自己奉为圣经？
7. 介绍自己读博动机。是什么事情的发生让你开始想读博？为此你做过哪些准备与努力？过程中收获了哪些心得与能力？未来想做什么，想成为什么样的人？申请博士与未来想成为的人之间的联系是什么？为什么这种联系是必然的？

就一些身边统计学的观察而言，陆本同学经常不是很擅长展示自己，大家可以多广泛地想想自己有哪些可以写的，慢慢组织出基本架构后找 ChatGPT / 文书中介润色文字，找推荐人 / 学长学姐提提内容建议等，让你的 SOP 内容更丰富和精炼。

参考资料：

- [UCB SOP写作指导](https://grad.berkeley.edu/admissions/steps-to-apply/requirements/statement-purpose/)

- [UCSD SOP写作指导](https://grad.ucsd.edu/admissions/requirements/statement-of-purpose.html)

!!! example "学术 SOP 个人建议"
    大家可能在一些地方查到的 SOP 案例写得文学气质满满，并给自己的申请赋予崇高的意义 etc. 在调查和咨询了一些申请者和老师后似乎可以认为没什么必要，可能不如正常写一篇结构清晰、学术相关 highlight 出色的简历式文章。`,
	},
	{
		DisplayName:       `西瓜oo`,
		School:            `清华大学`,
		MajorLine:         `留学申请`,
		ArticleTitle:      `清华飞跃 | 成绩单、学位证`,
		LongBioPrefix:     thuFlyLongBioPrefix,
		ShortBio:          `来自清华大学飞跃手册：成绩单、学位证。`,
		Audience:          thuFlyAudience,
		WelcomeMessage:    `你好，欢迎问我关于清华大学留学申请的问题。`,
		Education:         thuFlyEducation,
		MajorLabel:        thuFlyMajorLabel,
		KnowledgeCategory: thuFlyKnowledgeCat,
		KnowledgeTags:     thuFlyKnowledgeTags,
		SampleQuestions: []string{`清华出国读PhD怎么准备？`, `怎么选留学方向？`, `留学申请时间线？`},
		ExpertiseTags: []string{`留学`, `清华`, `PhD申请`, `留学申请`},
		Source: `清华大学飞跃手册`,
		KnowledgeBody: `# 成绩单、学位证

## 常用材料及准备周期

-   学信网 + WES 认证成绩单：随办理时间不同业务周期会有不小的变化，这个部分一般包含三个业务：一是学信网做好成绩单认证，二是学信网将认证成绩发送到 WES，三是 WES 将成绩单发送给你要申请的项目。保险起见建议至少提前三个月着手进行。

    - 具体对于常见的 fall 入学批次来说，可以视情况决定是否等暑假小学期成绩出来再办理（建议包含到大三结束为止的完整成绩），但是如果你的项目 11 月就截止了，而 9 月中旬开学了还没有登小学期的分，那还是赶快着手办理 WES 吧。

    - [学信网认证成绩单 tips 和催促邮件模板](../help/chsi/)


-   成绩单、在学证明：直接在 C 楼或六教 A0 打印即可。本科生（官方中 / 英文）电子成绩单从info上获取，由注册中心发送到指定邮箱。需要提及的是，在填写申请系统时你提交的不管是不是一份“官方成绩”，都是作为 unofficial transcript 看待，以为你的申请录取提供参照。等到你正式被录取了你决定入学的话还需要从注册中心弄一份密封件成绩单届时带过去 / 邮过去，那个才是作为 official transcript。

-   标化考试成绩：一般都可以发送在线成绩，几天就可办好，但是如果有些项目不支持电子成绩单发送，只能邮寄，那可以预留 2 周左右（因为你不知道邮寄速度会有多慢）。

-   高中学历公证：用自己的高中毕业证在学信网对应窗口办理即可，用学信网的认证证书提交系统。`,
	},
}
