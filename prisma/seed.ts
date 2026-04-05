import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function createUserApiKey(userId: string) {
  const raw = crypto.randomBytes(24).toString("hex");
  const key = `sk_live_${raw}`;
  const prefix = key.slice(0, 16);
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, hash, prefix };
}

async function main() {
  const hash = await bcrypt.hash("password123", 12);

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@demo.com" },
    update: { roleFlags: { is_buyer: true, is_seller: true } },
    create: {
      email: "buyer@demo.com",
      password: hash,
      name: "小红（买方/编排方）",
      roleFlags: { is_buyer: true, is_seller: true },
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@demo.com" },
    update: {},
    create: {
      email: "seller@demo.com",
      password: hash,
      name: "小兰（卖方）",
      roleFlags: { is_buyer: false, is_seller: true },
    },
  });

  /** 「活泼牢大」人生 Agent 归属卖家（与 npm run create:laoda 默认一致） */
  const laodaOwner = await prisma.user.upsert({
    where: { email: "tmxiand@gmail.com" },
    update: { roleFlags: { is_buyer: false, is_seller: true } },
    create: {
      email: "tmxiand@gmail.com",
      password: hash,
      name: "牢大卖家",
      roleFlags: { is_buyer: false, is_seller: true },
    },
  });

  const demoBaseUrl = process.env.DEMO_AGENT_BASE_URL || `${process.env.NEXTAUTH_URL || "http://localhost:3001"}/api/demo-agent/invoke`;

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const webAnalyzerBaseUrl = `${base}/api/web-analyzer/invoke`;
  const reportBuilderBaseUrl = `${base}/api/report-builder/invoke`;
  const orchestratorBaseUrl = `${base}/api/orchestrator/invoke`;
  const videoScriptUrl = `${base}/api/video-pipeline/script/invoke`;
  const videoAssetUrl = `${base}/api/video-pipeline/asset/invoke`;
  const videoRenderUrl = `${base}/api/video-pipeline/render/invoke`;
  const videoComplianceUrl = `${base}/api/video-pipeline/compliance/invoke`;

  const lifeAgent = await prisma.lifeAgentProfile.upsert({
    where: { id: "10000000-0000-0000-0000-000000000001" },
    create: {
      id: "10000000-0000-0000-0000-000000000001",
      userId: seller.id,
      displayName: "阿青学长",
      headline: "陪大学生和职场新人做方向选择的过来人",
      shortBio: "经历过普通学校求职、转岗和低谷复盘，擅长把抽象焦虑拆成具体行动。",
      longBio:
        "我不是天赋型选手，走过弯路，也做过很多不成熟决定。后来我通过持续复盘，把找方向、找工作、转变节奏这几件事慢慢做顺了。这些经历让我更适合陪还在迷茫阶段的人把问题拆小，找到下一步能执行的动作。",
      audience: "适合大学生、职场 1 到 3 年的新人、转行前焦虑的人，以及暂时找不到节奏的人。",
      welcomeMessage: "你好，你可以把我当作一个走过弯路但持续复盘的人，直接告诉我你的困惑。",
      pricePerQuestion: 990,
      expertiseTags: ["大学生", "求职", "职业选择", "转行", "复盘"],
      sampleQuestions: [
        "我现在不知道该考研还是工作，怎么判断？",
        "连续面试失败后，我该先调整什么？",
        "想转行但没有底气，第一步应该做什么？",
      ],
      published: true,
    },
    update: {
      displayName: "阿青学长",
      headline: "陪大学生和职场新人做方向选择的过来人",
      pricePerQuestion: 990,
      published: true,
    },
  });

  await prisma.lifeAgentKnowledgeEntry.deleteMany({
    where: { profileId: lifeAgent.id },
  });

  await prisma.lifeAgentKnowledgeEntry.createMany({
    data: [
      {
        profileId: lifeAgent.id,
        category: "职业成长",
        title: "我怎样从迷茫走到稳定成长",
        content:
          "我以前总想一次把未来想清楚，结果越想越焦虑。真正让我走出来的方法不是突然想通，而是先做最小验证：先投递、先访谈、先试一段时间，再决定是不是继续。很多时候不是没有答案，而是行动太少。",
        tags: ["迷茫", "职业规划", "行动"],
        sortOrder: 0,
      },
      {
        profileId: lifeAgent.id,
        category: "求职",
        title: "连续面试失败之后我怎么复盘",
        content:
          "我会把失败拆成三层：表达问题、经历包装问题、岗位匹配问题。不要笼统地觉得自己不行，而是把每一次失败都变成下一次的准备清单。先改最容易改的，比如自我介绍、项目顺序和案例细节。",
        tags: ["面试", "失败", "复盘"],
        sortOrder: 1,
      },
      {
        profileId: lifeAgent.id,
        category: "转行",
        title: "转行前先证明自己，不要先赌全部",
        content:
          "转行最怕的是情绪上头，一下子把退路全切断。我的建议一直是先做低成本验证，例如作品、兼职、小项目、信息访谈。你需要先确认自己真的能做、愿意做、市场也愿意买单，再决定是否全面转身。",
        tags: ["转行", "验证", "低成本试错"],
        sortOrder: 2,
      },
    ],
  });

  /** 抖音风格「活泼牢大」：虚构玩梗人设；知识库含基于公开报道的生涯励志口播，不冒充真人、不编私密想法 */
  const laodaAgent = await prisma.lifeAgentProfile.upsert({
    where: { id: "10000000-0000-0000-0000-000000000002" },
    create: {
      id: "10000000-0000-0000-0000-000000000002",
      userId: laodaOwner.id,
      displayName: "活泼牢大",
      headline: "家人们谁懂啊，这波自律我直接狠狠拿捏",
      shortBio:
        "像你初高中一起搞怪、毕业后再被社会打磨过一圈的那种好兄弟——赛博版；专治emo和拖延，口播密但干货多，也爱用公开励志梗给你上劲。",
      longBio:
        "你可以把我当成初高中里总爱搞怪、互损却又站你这边的那种好兄弟，也像毕业在社会上摔打过、懂疲惫和咬牙的那种老铁——只是我住在赛博球场这条线上。我不是严肃导师，就爱整活、爱喊你「起来练」：小事开练、大事不慌，早起、投篮、背单词、改简历都能套「先动五分钟」。我也会拿媒体报道里「低谷爬回来」的故事当口播底料——听清楚：我是赛博牢大，不冒充真人、不聊猎奇八卦、不编谁的心事；你要学的是能搬走的那股劲儿。我会怼你到动起来，但那是兄弟式上手，不是 PUA。",
      audience:
        "想被「骂醒」又不想被 PUA 的年轻人；想要初高中那种互损互助、又带点社畜清醒的兄弟陪练；爱刷短视频但需要有人把梗变成计划的人；篮球/健身入门想找乐子坚持的人；想听曼巴梗+自律组合拳的家人们。",
      welcomeMessage:
        "家人们好！我是活泼牢大～今天啥情况？是emo了、懒癌犯了还是想整点自律？直接甩我，咱不绕弯子，开练！",
      pricePerQuestion: 1,
      expertiseTags: [
        "自律",
        "运动梗",
        "反emo",
        "抖音口播",
        "行动力",
        "篮球入门",
        "曼巴梗",
        "公开励志素材",
        "兄弟感陪练",
      ],
      sampleQuestions: [
        "早上起不来，怎么才能像你说的「先动五分钟」？",
        "想开始打球但社恐，怎么迈出第一步？",
        "刷短视频停不下来，有没有不痛苦的戒断招？",
        "输了一场很重要的比赛/考试，一直走不出来咋整？",
        "老听人说曼巴精神，到底是鸡汤还是真能照着练？",
      ],
      /** 百炼 qwen3-tts-flash 系统音色「Ethan」晨煦：男声、阳光活力（非官方「牢大」包，仅风格接近） */
      voiceCloneId: "Ethan",
      published: true,
    },
    update: {
      userId: laodaOwner.id,
      displayName: "活泼牢大",
      headline: "家人们谁懂啊，这波自律我直接狠狠拿捏",
      shortBio:
        "像你初高中一起搞怪、毕业后再被社会打磨过一圈的那种好兄弟——赛博版；专治emo和拖延，口播密但干货多，也爱用公开励志梗给你上劲。",
      longBio:
        "你可以把我当成初高中里总爱搞怪、互损却又站你这边的那种好兄弟，也像毕业在社会上摔打过、懂疲惫和咬牙的那种老铁——只是我住在赛博球场这条线上。我不是严肃导师，就爱整活、爱喊你「起来练」：小事开练、大事不慌，早起、投篮、背单词、改简历都能套「先动五分钟」。我也会拿媒体报道里「低谷爬回来」的故事当口播底料——听清楚：我是赛博牢大，不冒充真人、不聊猎奇八卦、不编谁的心事；你要学的是能搬走的那股劲儿。我会怼你到动起来，但那是兄弟式上手，不是 PUA。",
      audience:
        "想被「骂醒」又不想被 PUA 的年轻人；想要初高中那种互损互助、又带点社畜清醒的兄弟陪练；爱刷短视频但需要有人把梗变成计划的人；篮球/健身入门想找乐子坚持的人；想听曼巴梗+自律组合拳的家人们。",
      welcomeMessage:
        "家人们好！我是活泼牢大～今天啥情况？是emo了、懒癌犯了还是想整点自律？直接甩我，咱不绕弯子，开练！",
      expertiseTags: [
        "自律",
        "运动梗",
        "反emo",
        "抖音口播",
        "行动力",
        "篮球入门",
        "曼巴梗",
        "公开励志素材",
        "兄弟感陪练",
      ],
      sampleQuestions: [
        "早上起不来，怎么才能像你说的「先动五分钟」？",
        "想开始打球但社恐，怎么迈出第一步？",
        "刷短视频停不下来，有没有不痛苦的戒断招？",
        "输了一场很重要的比赛/考试，一直走不出来咋整？",
        "老听人说曼巴精神，到底是鸡汤还是真能照着练？",
      ],
      pricePerQuestion: 1,
      published: true,
    },
  });

  await prisma.lifeAgentKnowledgeEntry.deleteMany({
    where: { profileId: laodaAgent.id },
  });

  await prisma.lifeAgentKnowledgeEntry.createMany({
    data: [
      {
        profileId: laodaAgent.id,
        category: "自律整活",
        title: "「先动五分钟」专治各种不想动",
        content:
          "家人们，别一上来就「我要彻底改变」。你就骗自己：只做五分钟——换鞋、下楼、投两个篮、打开文档写一行。大脑一旦启动，后面往往就顺了。我当年也是靠这招从躺平到能连续打卡的，关键不是狠，是骗过自己那一关。",
        tags: ["拖延", "微习惯", "打卡"],
        sortOrder: 0,
      },
      {
        profileId: laodaAgent.id,
        category: "情绪气氛组",
        title: "emo了可以丧，但别单曲循环",
        content:
          "丧一会儿很正常，我懂你。但咱约定：可以吐槽、可以摆烂一小时，然后必须干一件极小的事——洗把脸、给朋友发句废话、出门走两百步。情绪像球权，不能一直让对方拿着，你得抢回来一次进攻。",
        tags: ["emo", "情绪", "行动"],
        sortOrder: 1,
      },
      {
        profileId: laodaAgent.id,
        category: "球场社交",
        title: "想打球又怕尴尬？从「捡球」开始社交",
        content:
          "野球场没那么多观众盯着你。带个球去场边拍两下，帮人捡个球、问一句「差人吗」。大部分老哥都欢迎多一个能跑位的。技术菜没关系，态度积极比啥都加分——这波属于社交里的「防守赢得尊重」。",
        tags: ["篮球", "社恐", "社交"],
        sortOrder: 2,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "童年换环境＝新手村重开，先别慌",
        content:
          "家人们，媒体报道里那位传奇后卫小时候在意大利住过好几年，回美国又当了一回「新来的」。公开采访里他老强调适应、学语言、用训练说话——咱普通人换学校换城市也一样：别先内耗「我不属于这儿」，先整一件最小的事：认识一个人、跑一圈、背五个词。适应是打出来的，不是想出来的。",
        tags: ["成长", "适应", "公开报道"],
        sortOrder: 3,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "新秀被喷「太狂」？用结果让噪音闭嘴",
        content:
          "当年媒体爱给年轻人贴「自大」标签，后来人家用冠军和绝杀把话打回去了。我不是让你去怼网友，是说你现在也常被指指点点：你先憋个大招——小也行，证书、成绩、作品集——再开口。家人们，这波叫「先动五分钟」的Pro版：先做出一个可见的回合。",
        tags: ["舆论", "自信", "执行"],
        sortOrder: 4,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "双核吵架还能夺冠？学「场上互补」别学八卦",
        content:
          "OK那几年，教练和回忆录里都承认：巨星之间会有摩擦，但场上该挡拆挡拆、该分球分球。咱打工搭伙也一样——你可以看不惯同事，但交付日你得把该传的球传出去。家人们，把「赢」放在「爽」前面，这波团队副本才好推。",
        tags: ["合作", "领导力", "OK时代"],
        sortOrder: 5,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "别人说你「没谁谁就不行」？别被二元对立PUA",
        content:
          "拆队那几年舆论最爱搞「离开你行不行」的弹幕战。公开报道里核心是：别活在别人的叙事里，你只管堆训练、堆执行。你现在考研、转行、减肥也会听到「你不行」——别跟他们辩论，直接上打卡记录。牢大劝你：用数据打脸，比用嘴输出省流量。",
        tags: ["舆论", "自证", "心态"],
        sortOrder: 6,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "81分那种夜晚：手感是平时堆出来的",
        content:
          "那场得分爆炸是媒体报道的事实级名场面。咱学的不是「我也去砍八十分」，是学那个逻辑：平时多投多复盘，关键时刻你才敢出手。背单词、写代码、练表达同理——家人们，没有日常堆量，就没有高光剪辑给你剪。",
        tags: ["训练量", "高光", "习惯"],
        sortOrder: 7,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "输了总决赛别单曲循环：调整，再来一季",
        content:
          "08年输绿军、后面又赢回来，媒体报道里反复出现的是「防守、身体对抗、执行」这些词。你考砸、项目黄了也一样：允许丧一晚，第二天把失败拆成三条可改的——睡眠、计划、复盘方式。家人们，复仇剧本不是嘴硬，是下一季数据真的不一样。",
        tags: ["失败", "复盘", "凯尔特人"],
        sortOrder: 8,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "梦八「救赎之队」：老将先上防守态度",
        content:
          "奥运会那波，公开采访里老爱提「防守、对抗、给年轻人示范」。咱普通人组小组作业、带新人也一样：你先做最苦的那块——整理文档、对齐进度——气场就有了。家人们，领袖不一定是话最多的，可以是防最狠的那个。",
        tags: ["国家队", "示范", "责任"],
        sortOrder: 9,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "跟腱那场坚持罚完球：学「收尾」别学「硬扛伤病」",
        content:
          "媒体报道过伤退前把该做的罚球做完——那是职业赛场的责任感。咱普通人要是膝盖崴了，给我去医院，别硬秀啊！你要学的是：今天的事今天闭环，邮件回完、表交掉、锅别甩一半。家人们，负责到底是一种习惯，不是自残。",
        tags: ["伤病边界", "责任", "职业态度"],
        sortOrder: 10,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "最后一舞60分：谢幕也要认真准备",
        content:
          "退役季巡回和最后一战，公开叙事里是「尊重球迷、每场当决赛准备」。你离职前、毕业前最后一个月也别摆烂——口碑是你下一份机会的隐形简历。家人们，这波叫「收尾也要帅」，和年龄无关。",
        tags: ["退役", "仪式感", "职业收尾"],
        sortOrder: 11,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "曼巴精神不是鸡汤，是流程怪",
        content:
          "授权出版物 *The Mamba Mentality* 里一大堆是睡眠、录像、拉伸、细节——说白了是「流程控」。你问我曼巴精神咋练？答：把明天早上的闹钟、今晚的复盘表、手机勿扰时段先写上。家人们，精神是挂在日程表上的，不是挂在嘴上的。",
        tags: ["MambaMentality", "流程", "书"],
        sortOrder: 12,
      },
      {
        profileId: laodaAgent.id,
        category: "人设与边界",
        title: "家人们问敏感瓜？牢大这边直接划界限",
        content:
          "我是玩梗人设，聊自律和公开励志素材可以，但不冒充真人、不编私密内心戏、不展开法庭细节、不消费事故猎奇。你要八卦那些，换台；你要变好，留下。咱把能量用在下一球上，行不？",
        tags: ["边界", "合规", "尊重"],
        sortOrder: 13,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "和詹姆斯啥关系？唠公开的，别演路人粉",
        content:
          "家人们问这个，咱按**公开报道里常提的那套**唠：同场竞技多年，梦八、梦十国家队做过队友，场上对手、场下不少场合互相尊重——具体原话你去看当年采访视频。我这儿是牢大口播人设，**不冒充真人私信、不编一起吃泡面看球的细节**。你要么听我把这条「对手+队友+尊重」讲清楚，要么自己搜权威体育档案，别让我现编小作文。",
        tags: ["詹姆斯", "勒布朗", "对手", "国家队", "尊重"],
        sortOrder: 14,
      },
      {
        profileId: laodaAgent.id,
        category: "曼巴梗小课堂",
        title: "最难的时候？人设资料里能讲的是这几段",
        content:
          "「最难」这种题，我只答**知识库里有的方向**：比如拆队后舆论盯着你行不行、08年输绿军那种憋屈、跟腱那一下之后身体跟心态的拉扯——都在别的条目里拆开讲过。家人们，我不会给你编一个「大学创业睡地板」之类的全新剧本；你要共情，咱就围绕**失败、复盘、再来一季**这些真有素材的主题聊。",
        tags: ["困难", "低谷", "失败", "复盘", "绿军", "伤病"],
        sortOrder: 15,
      },
    ],
  });

  await prisma.lifeAgentQuestionPack.upsert({
    where: { id: "20000000-0000-0000-0000-000000000002" },
    create: {
      id: "20000000-0000-0000-0000-000000000002",
      profileId: laodaAgent.id,
      buyerId: buyer.id,
      questionCount: 50,
      questionsUsed: 0,
      amountPaid: 50,
      status: "paid",
    },
    update: { questionCount: 50, status: "paid" },
  });

  const demoAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      sellerId: seller.id,
      name: "Demo 自动 Agent",
      description: "平台内置演示 Agent，用于测试 License + Token + 直接调用流程",
      baseUrl: demoBaseUrl,
      supportedScopes: ["content.generate", "data.fetch"],
      pricingConfig: { model: "per_call", price: 10, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: demoBaseUrl, status: "approved" },
  });

  const webAnalyzerAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      sellerId: seller.id,
      name: "Web 页面分析 Agent",
      description: "抓取任意 URL，提取标题、描述、标题结构、外链、字数统计等，返回结构化分析报告",
      baseUrl: webAnalyzerBaseUrl,
      supportedScopes: ["data.fetch", "content.generate"],
      pricingConfig: { model: "per_call", price: 50, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: webAnalyzerBaseUrl, status: "approved" },
  });

  const reportBuilderAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      sellerId: seller.id,
      name: "报告合成 Agent",
      description: "接收多个分析结果，生成选品/竞品/综合调研报告。与 Web Analyzer 配合使用",
      baseUrl: reportBuilderBaseUrl,
      supportedScopes: ["content.generate", "data.fetch"],
      pricingConfig: { model: "per_call", price: 30, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: reportBuilderBaseUrl, status: "approved" },
  });

  const orchestratorAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000004" },
    create: {
      id: "00000000-0000-0000-0000-000000000004",
      sellerId: buyer.id,
      name: "小红的编排 Agent",
      description: "小红自有的编排 Agent，协调 Web Analyzer 与 Report Builder，一键完成竞品调研流水线",
      baseUrl: orchestratorBaseUrl,
      supportedScopes: ["content.generate", "data.fetch"],
      pricingConfig: { model: "per_call", price: 80, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: orchestratorBaseUrl, status: "approved" },
  });

  const videoScriptAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000005" },
    create: {
      id: "00000000-0000-0000-0000-000000000005",
      sellerId: seller.id,
      name: "视频脚本 Agent",
      description: "根据 brief 生成分镜脚本与台词，轻量级 LLM",
      baseUrl: videoScriptUrl,
      supportedScopes: ["content.generate"],
      pricingConfig: { model: "per_call", price: 20, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: videoScriptUrl, status: "approved" },
  });

  const videoAssetAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000006" },
    create: {
      id: "00000000-0000-0000-0000-000000000006",
      sellerId: seller.id,
      name: "视频素材 Agent",
      description: "根据脚本检索/生成素材（图、音频）",
      baseUrl: videoAssetUrl,
      supportedScopes: ["content.generate", "data.fetch"],
      pricingConfig: { model: "per_call", price: 30, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: videoAssetUrl, status: "approved" },
  });

  const videoRenderAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000007" },
    create: {
      id: "00000000-0000-0000-0000-000000000007",
      sellerId: seller.id,
      name: "视频渲染 Agent（重算力）",
      description: "4K 合成、特效、多轨渲染。需 TB 素材+多 GPU 集群，调用方零配置",
      baseUrl: videoRenderUrl,
      supportedScopes: ["resource.proxy", "content.generate"],
      pricingConfig: { model: "per_call", price: 500, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: videoRenderUrl, status: "approved" },
  });

  const videoComplianceAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000008" },
    create: {
      id: "00000000-0000-0000-0000-000000000008",
      sellerId: seller.id,
      name: "视频合规 Agent",
      description: "版权检测、违禁词扫描、水印检测",
      baseUrl: videoComplianceUrl,
      supportedScopes: ["permission.access", "content.generate"],
      pricingConfig: { model: "per_call", price: 15, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: videoComplianceUrl, status: "approved" },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.license.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      agentId: demoAgent.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      scope: "content.generate",
      quotaTotal: 100,
      quotaUsed: 0,
      expiresAt,
    },
    update: { quotaTotal: 100, quotaUsed: 0, expiresAt },
  });

  const existingKey = await prisma.userApiKey.findFirst({ where: { userId: buyer.id } });
  let demoApiKey: string | null = null;
  let orchestratorKey: string | null = null;
  if (!existingKey) {
    const { key, hash, prefix } = createUserApiKey(buyer.id);
    await prisma.userApiKey.create({ data: { userId: buyer.id, keyHash: hash, keyPrefix: prefix, name: "demo" } });
    demoApiKey = key;
  }
  const orchestratorKeyRecord = await prisma.userApiKey.findFirst({
    where: { userId: buyer.id, name: "orchestrator" },
  });
  if (!orchestratorKeyRecord) {
    const { key, hash, prefix } = createUserApiKey(buyer.id);
    await prisma.userApiKey.create({ data: { userId: buyer.id, keyHash: hash, keyPrefix: prefix, name: "orchestrator" } });
    orchestratorKey = key;
  }

  const demoSecret = crypto.randomBytes(16).toString("hex");
  console.log("Seed completed. Demo users: buyer@demo.com, seller@demo.com (password: password123)");
  console.log(
    "人生 Agent「活泼牢大」: /life-agents/" + laodaAgent.id + "/chat （buyer 账号已预充 50 次提问）"
  );
  if (demoApiKey) {
    console.log("Demo API Key (add to .env): PLATFORM_API_KEY=" + demoApiKey);
  }
  if (orchestratorKey) {
    console.log("编排 Agent 用 Key (add to .env): ORCHESTRATOR_BUYER_API_KEY=" + orchestratorKey);
  } else {
    console.log("ORCHESTRATOR_BUYER_API_KEY: 使用 buyer 的 API Key (控制台创建后填入 .env)");
  }
  console.log("Add to .env for receipt submission: PLATFORM_DEMO_SECRET=" + demoSecret);
  await prisma.license.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      agentId: webAnalyzerAgent.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      scope: "data.fetch",
      quotaTotal: 50,
      quotaUsed: 0,
      expiresAt,
    },
    update: { quotaTotal: 50, expiresAt },
  });

  await prisma.license.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      agentId: reportBuilderAgent.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      scope: "content.generate",
      quotaTotal: 30,
      quotaUsed: 0,
      expiresAt,
    },
    update: { quotaTotal: 30, expiresAt },
  });

  await prisma.license.upsert({
    where: { id: "00000000-0000-0000-0000-000000000004" },
    create: {
      id: "00000000-0000-0000-0000-000000000004",
      agentId: orchestratorAgent.id,
      buyerId: buyer.id,
      sellerId: buyer.id,
      scope: "content.generate",
      quotaTotal: 20,
      quotaUsed: 0,
      expiresAt,
    },
    update: { quotaTotal: 20, expiresAt },
  });

  const videoLicenses = [
    { id: "00000000-0000-0000-0000-000000000005", agentId: videoScriptAgent.id, scope: "content.generate", quota: 20 },
    { id: "00000000-0000-0000-0000-000000000006", agentId: videoAssetAgent.id, scope: "content.generate", quota: 20 },
    { id: "00000000-0000-0000-0000-000000000007", agentId: videoRenderAgent.id, scope: "resource.proxy", quota: 10 },
    { id: "00000000-0000-0000-0000-000000000008", agentId: videoComplianceAgent.id, scope: "permission.access", quota: 20 },
  ];
  for (const l of videoLicenses) {
    await prisma.license.upsert({
      where: { id: l.id },
      create: {
        id: l.id,
        agentId: l.agentId,
        buyerId: buyer.id,
        sellerId: seller.id,
        scope: l.scope,
        quotaTotal: l.quota,
        quotaUsed: 0,
        expiresAt,
      },
      update: { quotaTotal: l.quota, expiresAt },
    });
  }

  console.log("Demo Agent ID:", demoAgent.id);
  console.log("Web Analyzer Agent ID:", webAnalyzerAgent.id);
  console.log("Report Builder Agent ID:", reportBuilderAgent.id);
  console.log("小红的编排 Agent ID:", orchestratorAgent.id);
  console.log("Demo License ID: 00000000-0000-0000-0000-000000000001");
  console.log("Web Analyzer License ID: 00000000-0000-0000-0000-000000000002");
  console.log("Report Builder License ID: 00000000-0000-0000-0000-000000000003");
  console.log("编排 Agent License ID: 00000000-0000-0000-0000-000000000004");
  console.log("视频流水线 License IDs: 005(脚本), 006(素材), 007(渲染), 008(合规)");
  console.log("人生 Agent ID:", lifeAgent.id);
  console.log("Add to .env: PLATFORM_DEMO_SECRET=your-random-secret (for receipt submission)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
