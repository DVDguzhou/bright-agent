/** 与 Web src/app/life-agents/create/page.tsx 同步的创建流程静态数据 */

const PROFILE_CHAT_FIELDS = [
  {
    key: "displayName",
    prompt: "先给你的 Agent 起个名字吧。控制在 1 到 10 个字。",
    required: true,
  },
  {
    key: "headline",
    prompt: "一句话向用户介绍你的 Agent 的功能。",
  },
  {
    key: "shortBio",
    prompt: "简单说说你的相关经历或背景，让用户知道为什么你能帮到他。",
  },
  {
    key: "school",
    prompt: "你最高学历的学校是？",
  },
  {
    key: "education",
    prompt: "学历是什么？",
  },
  {
    key: "job",
    prompt: "工作是什么？没有就写无。",
  },
  {
    key: "income",
    prompt: "收入是什么？没有就写无。",
  },
  {
    key: "audience",
    prompt: "你的 Agent 适合帮助什么样的人群？",
  },
  {
    key: "welcomeMessage",
    prompt: "用户第一次打开聊天时，你希望 Agent 先说什么？",
    required: true,
  },
];

const DEFAULT_FORM = {
  displayName: "",
  headline: "",
  shortBio: "",
  longBio: "",
  education: "",
  school: "",
  job: "",
  income: "",
  country: "",
  province: "",
  city: "",
  county: "",
  audience: "",
  welcomeMessage: "你好，我是基于本地真实经验的顾问，你可以问我关于我亲身经历的问题。",
  pricePerQuestion: "9.9",
  expertiseTags: "",
  mbti: "",
  personaArchetype: "过来人型",
  toneStyle: "像朋友聊天",
  responseStyle: "先理解处境再建议",
  forbiddenPhrases: "",
  exampleReply1: "",
  exampleReply2: "",
  exampleReply3: "",
};

const QUICK_START_TEMPLATES = [
  {
    id: "kaoyan",
    label: "考研上岸",
    desc: "分享考研备考、选校、调剂的真实经历",
    form: {
      headline: "陪你想清楚考研这件事的过来人",
      shortBio: "考研上岸过，知道备考有多难，也知道选对方向比埋头刷题重要。",
      audience: "正在考虑考研、正在备考、或者在纠结二战的同学",
      welcomeMessage: "考研的事可以随便问我，我自己走过一遍，知道哪些坑不用踩。",
      expertiseTags: "考研, 备考, 选校, 调剂, 二战",
      personaArchetype: "学长学姐型",
    },
    sampleQuestions: ["我这个专业值得考研吗？", "一战没上岸，要不要二战？", "怎么选目标院校？"],
  },
  {
    id: "career",
    label: "转行互联网",
    desc: "分享非科班转行产品、运营、开发的经验",
    form: {
      headline: "从传统行业转到互联网的过来人",
      shortBio: "转过行，知道中间的纠结、焦虑和真实的准备过程。",
      audience: "想从传统行业转到互联网，或者在犹豫要不要转行的人",
      welcomeMessage: "转行的事我自己经历过，有什么想聊的直接说。",
      expertiseTags: "转行, 互联网, 产品经理, 职业规划, 简历",
      personaArchetype: "过来人型",
    },
    sampleQuestions: ["非科班转产品经理可行吗？", "转行需要准备多久？", "降薪转行值不值得？"],
  },
  {
    id: "study",
    label: "留学申请",
    desc: "分享留学选校、申请、海外生活的真实体验",
    form: {
      headline: "留过学，知道申请和真实生活是两回事",
      shortBio: "经历过留学申请全流程，也在海外生活过，能聊的不只是怎么申请。",
      audience: "正在准备留学、在纠结去哪个国家/学校、或者想了解海外真实生活的人",
      welcomeMessage: "留学的事随便问，我自己申请过，也在那边生活过。",
      expertiseTags: "留学, 申请, 选校, 海外生活, 签证",
      personaArchetype: "学长学姐型",
    },
    sampleQuestions: ["这两个学校怎么选？", "留学真实花费大概多少？", "海外找工作难不难？"],
  },
  {
    id: "job",
    label: "应届求职",
    desc: "分享秋招、春招、选 offer 的第一手经验",
    form: {
      headline: "刚经历过秋招的应届生",
      shortBio: "秋招春招都走过一遍，简历、面试、选 offer 的坑都踩过。",
      audience: "正在准备秋招/春招、或者拿了多个 offer 不知道怎么选的同学",
      welcomeMessage: "求职的事我刚经历完，记忆还很新鲜，有什么想问的直说。",
      expertiseTags: "秋招, 春招, 面试, 选offer, 简历",
      personaArchetype: "朋友陪聊型",
    },
    sampleQuestions: ["大厂和小公司怎么选？", "面试总被问职业规划怎么答？", "实习经历不够怎么办？"],
  },
  {
    id: "blank",
    label: "自由创建",
    desc: "从零开始，一步步填写你的 Agent 信息",
    form: {},
    sampleQuestions: [],
  },
];

const EXPERIENCE_TOPICS = [
  { key: "experience", label: "真实经历", description: "分享一段成长过程或做事心得" },
  { key: "personality", label: "性格兴趣", description: "聊聊你的性格、兴趣和说话方式" },
  { key: "daily", label: "日常生活", description: "分享日常场景和习惯" },
];

const AGENT_CATEGORIES = [
  { label: "学习", color: "#3b82f6" },
  { label: "就业", color: "#0891b2" },
  { label: "创业", color: "#f59e0b" },
  { label: "科技", color: "#1e40af" },
  { label: "金融", color: "#14b8a6" },
  { label: "旅游", color: "#10b981" },
  { label: "美食", color: "#f97316" },
  { label: "景点", color: "#06b6d4" },
  { label: "购物", color: "#ec4899" },
  { label: "运动", color: "#22c55e" },
  { label: "情感", color: "#e11d48" },
  { label: "娱乐", color: "#c2410c" },
  { label: "医疗", color: "#ef4444" },
  { label: "房产", color: "#84cc16" },
  { label: "法律", color: "#64748b" },
  { label: "艺术", color: "#7a1f1f" },
  { label: "宠物", color: "#f472b6" },
  { label: "汽车", color: "#0ea5e9" },
  { label: "农业", color: "#65a30d" },
  { label: "政务", color: "#475569" },
];

const PERSONA_OPTIONS = ["学长学姐型", "朋友陪聊型", "前辈导师型", "冷静分析型", "过来人型", "本地熟人型"];
const TONE_OPTIONS = ["直接一点", "温柔一点", "理性克制", "接地气一点", "像朋友聊天", "稳重耐心"];
const RESPONSE_STYLE_OPTIONS = [
  "先给判断再解释",
  "先理解处境再建议",
  "多举自己的例子",
  "短一点别太满",
  "先拆选项再给建议",
  "像微信聊天少分点",
];
const MBTI_OPTIONS = ["未设置", "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];

const FIRST_EXPERIENCE_QUESTION = "为了帮你打造更像你的 Agent，请先选择一个方向开始：";

module.exports = {
  PROFILE_CHAT_FIELDS,
  DEFAULT_FORM,
  QUICK_START_TEMPLATES,
  EXPERIENCE_TOPICS,
  AGENT_CATEGORIES,
  PERSONA_OPTIONS,
  TONE_OPTIONS,
  RESPONSE_STYLE_OPTIONS,
  MBTI_OPTIONS,
  FIRST_EXPERIENCE_QUESTION,
};
