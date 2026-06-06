const { get } = require("./request");

const MBTI_OPTIONS = [
  "",
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
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
const REGION_OPTIONS = ["温州", "杭州", "宁波", "台州", "绍兴", "上海", "北京", "深圳", "广州", "东京", "大阪", "新加坡"];

const MANAGE_SUB_PAGES = {
  coedit: "agent-manage-coedit",
  edit: "agent-manage-edit",
  sales: "agent-manage-sales",
  sessions: "agent-manage-sessions",
  feedback: "agent-manage-feedback",
  topics: "agent-manage-topics",
  blindspots: "agent-manage-blind-spots",
};

function centsToYuanInput(cents) {
  if (!isFinite(cents)) return "";
  const yuan = (Number(cents) / 100).toFixed(2);
  return yuan.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function yuanInputToCents(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const yuan = Number(normalized);
  if (!isFinite(yuan) || yuan <= 0) return null;
  return Math.round(yuan * 100);
}

function regionsFromForm(form) {
  return String(form.regions || "")
    .split(/[,，\n]/)
    .map(function (item) {
      return item.trim();
    })
    .filter(Boolean);
}

function createFormState(profile) {
  return {
    displayName: profile.displayName || "",
    headline: profile.headline || "",
    shortBio: profile.shortBio || "",
    longBio: profile.longBio || "",
    education: profile.education || "",
    school: profile.school || "",
    job: profile.job || "",
    income: profile.income || "",
    regions: Array.isArray(profile.regions) ? profile.regions.join(", ") : "",
    country: profile.country || "",
    province: profile.province || "",
    city: profile.city || "",
    county: profile.county || "",
    audience: profile.audience || "",
    welcomeMessage: profile.welcomeMessage || "",
    notSuitableFor: profile.notSuitableFor || "",
    pricePerQuestion: centsToYuanInput(profile.pricePerQuestion),
    expertiseTags: Array.isArray(profile.expertiseTags) ? profile.expertiseTags.join(", ") : "",
    sampleQuestions: Array.isArray(profile.sampleQuestions) ? profile.sampleQuestions.join("\n") : "",
    mbti: profile.mbti || "",
    personaArchetype: profile.personaArchetype || "过来人型",
    toneStyle: profile.toneStyle || "像朋友聊天",
    responseStyle: profile.responseStyle || "先理解处境再建议",
    forbiddenPhrases: Array.isArray(profile.forbiddenPhrases) ? profile.forbiddenPhrases.join("\n") : "",
    exampleReply1: Array.isArray(profile.exampleReplies) ? profile.exampleReplies[0] || "" : "",
    exampleReply2: Array.isArray(profile.exampleReplies) ? profile.exampleReplies[1] || "" : "",
    exampleReply3: Array.isArray(profile.exampleReplies) ? profile.exampleReplies[2] || "" : "",
    published: !!profile.published,
    coverImageUrl: profile.coverImageUrl || "",
  };
}

function buildProfilePayload(form, voiceSamplePending) {
  const exampleReplies = [form.exampleReply1, form.exampleReply2, form.exampleReply3]
    .map(function (s) {
      return String(s || "").trim();
    })
    .filter(Boolean);
  const displayName = String(form.displayName || "").trim();
  if (displayName.length < 1 || displayName.length > 10) {
    return { error: "Agent 名称长度需为 1 到 10 个字" };
  }
  const regions = regionsFromForm(form);
  if (regions.length > 2) {
    return { error: "地区最多保留 2 个" };
  }
  const priceInput = String(form.pricePerQuestion || "").trim();
  let pricePerQuestion;
  if (priceInput) {
    pricePerQuestion = yuanInputToCents(form.pricePerQuestion);
    if (pricePerQuestion === null) {
      return { error: "请填写大于 0 的金额，单位是元，最多保留 2 位小数" };
    }
  }
  const payload = {
    displayName: displayName,
    headline: String(form.headline || "").trim(),
    shortBio: form.shortBio,
    longBio: form.longBio,
    audience: form.audience,
    welcomeMessage: form.welcomeMessage,
    notSuitableFor: form.notSuitableFor,
    published: form.published,
    education: form.education || undefined,
    school: form.school || undefined,
    job: form.job || undefined,
    income: form.income || undefined,
    regions: regions,
    country: form.country || undefined,
    province: form.province || undefined,
    city: form.city || undefined,
    county: form.county || undefined,
    mbti: form.mbti || undefined,
    personaArchetype: form.personaArchetype,
    toneStyle: form.toneStyle,
    responseStyle: form.responseStyle,
    expertiseTags: String(form.expertiseTags || "")
      .split(/[,，\n]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean),
    sampleQuestions: String(form.sampleQuestions || "")
      .split("\n")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean),
    forbiddenPhrases: String(form.forbiddenPhrases || "")
      .split("\n")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean),
    exampleReplies: exampleReplies,
    coverImageUrl: String(form.coverImageUrl || "").trim(),
  };
  if (pricePerQuestion !== undefined) {
    payload.pricePerQuestion = pricePerQuestion;
  }
  if (voiceSamplePending) {
    payload.voiceSampleBase64 = voiceSamplePending;
  }
  return { payload: payload };
}

function buildPatchPayloadFromProfile(profile) {
  return {
    displayName: profile.displayName,
    headline: profile.headline,
    shortBio: profile.shortBio,
    longBio: profile.longBio,
    audience: profile.audience,
    welcomeMessage: profile.welcomeMessage,
    notSuitableFor: profile.notSuitableFor || "",
    pricePerQuestion: profile.pricePerQuestion,
    expertiseTags: profile.expertiseTags || [],
    sampleQuestions: profile.sampleQuestions || [],
    education: profile.education || "",
    income: profile.income || "",
    job: profile.job || "",
    school: profile.school || "",
    country: profile.country || "",
    province: profile.province || "",
    city: profile.city || "",
    county: profile.county || "",
    regions: profile.regions || [],
    mbti: profile.mbti || "",
    personaArchetype: profile.personaArchetype || "",
    toneStyle: profile.toneStyle || "",
    responseStyle: profile.responseStyle || "",
    forbiddenPhrases: profile.forbiddenPhrases || [],
    exampleReplies: profile.exampleReplies || [],
    published: profile.published,
    coverImageUrl: profile.coverImageUrl || "",
  };
}

function summarizeProfileChanges(prev, next) {
  const summary = [];
  if (prev.displayName !== next.displayName || prev.headline !== next.headline) {
    summary.push("名称或一句话介绍");
  }
  if (prev.welcomeMessage !== next.welcomeMessage) summary.push("欢迎语");
  if ((prev.expertiseTags || []).join("|") !== (next.expertiseTags || []).join("|")) {
    summary.push("擅长标签");
  }
  if ((prev.sampleQuestions || []).join("|") !== (next.sampleQuestions || []).join("|")) {
    summary.push("示例问题");
  }
  if ((prev.exampleReplies || []).join("|") !== (next.exampleReplies || []).join("|")) {
    summary.push("示范回答");
  }
  if (
    prev.personaArchetype !== next.personaArchetype ||
    prev.toneStyle !== next.toneStyle ||
    prev.responseStyle !== next.responseStyle
  ) {
    summary.push("人设与语气");
  }
  if ((prev.knowledgeEntries || []).length !== (next.knowledgeEntries || []).length) {
    summary.push("知识条目");
  }
  if (prev.notSuitableFor !== next.notSuitableFor) summary.push("不适合回答的问题");
  return summary.length > 0 ? summary : ["资料内容"];
}

function extractTopKeywords(texts, limit) {
  const max = limit || 6;
  const counter = {};
  for (let i = 0; i < texts.length; i++) {
    const normalized = String(texts[i] || "")
      .replace(/[，。！？、,.!?/\\|()（）[\]{}:;"'“”‘’]/g, " ")
      .split(/\s+/)
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
    for (let j = 0; j < normalized.length; j++) {
      const token = normalized[j];
      if (token.length < 2) continue;
      counter[token] = (counter[token] || 0) + 1;
    }
  }
  return Object.keys(counter)
    .sort(function (a, b) {
      return counter[b] - counter[a];
    })
    .slice(0, max);
}

function loadManageData(id) {
  return get("/api/life-agents/" + id + "/manage")
    .then(function (res) {
      const data = res.data || {};
      if (!data.profile || !data.profile.displayName) {
        return { data: null, error: "加载失败或无权访问" };
      }
      return { data: data, error: null };
    })
    .catch(function () {
      return { data: null, error: "加载失败，请稍后重试" };
    });
}

function navigateToManageSub(id, page) {
  const slug = MANAGE_SUB_PAGES[page];
  if (!slug || !id) return;
  wx.navigateTo({ url: "/pages/" + slug + "/" + slug + "?id=" + encodeURIComponent(id) });
}

function goBackToManage(id) {
  wx.navigateBack({
    fail: function () {
      wx.redirectTo({ url: "/pages/agent-manage/agent-manage?id=" + encodeURIComponent(id) });
    },
  });
}

function coEditStorageKey(id) {
  return "life-agent-co-edit:" + id;
}

function computeCompletion(profile) {
  if (!profile) return 0;
  const checks = [
    Boolean(String(profile.displayName || "").trim()),
    Boolean(String(profile.headline || "").trim()),
    Boolean(String(profile.shortBio || "").trim()),
    Boolean(String(profile.welcomeMessage || "").trim()),
    (profile.expertiseTags || []).length >= 3,
    (profile.sampleQuestions || []).length >= 3,
    (profile.exampleReplies || []).length >= 2,
    (profile.knowledgeEntries || []).length >= 3,
    Boolean(
      (profile.coverImageUrl && String(profile.coverImageUrl).trim()) ||
        (profile.coverPresetKey && String(profile.coverPresetKey).trim())
    ),
    Boolean(profile.hasVoiceClone),
    Boolean(profile.regions && profile.regions.length),
    Boolean(profile.published),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function formatDateTime(iso) {
  if (!iso) return "暂无记录";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleString("zh-CN");
}

function formatShortTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    const h = d.getHours();
    const m = d.getMinutes();
    return `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "昨天";
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function feedbackTypeLabel(type) {
  if (type === "helpful") return "有帮助";
  if (type === "not_specific") return "不够具体";
  if (type === "factual_error") return "事实错误";
  if (type === "contradiction") return "前后矛盾";
  if (type === "too_confident") return "过度自信";
  return "不适合我";
}

function alertPriorityLabel(priority) {
  if (priority === "urgent") return "紧急";
  if (priority === "high") return "重要";
  if (priority === "medium") return "建议";
  return "参考";
}

function buildOptimizationSuggestions(data) {
  const suggestions = [];
  const profile = data.profile || {};
  const completion = computeCompletion(profile);
  const feedback = (data.feedback && data.feedback.counts) || {
    helpful: 0,
    notSpecific: 0,
    notSuitable: 0,
  };
  if (completion < 70) {
    suggestions.push(
      "资料完成度约 " + completion + "%，建议优先补齐封面、欢迎语、示范回答和知识条目。"
    );
  }
  if ((profile.exampleReplies || []).length < 2) {
    suggestions.push("示范回答偏少，建议至少补 2 条，能明显提升像你本人的程度。");
  }
  if ((profile.knowledgeEntries || []).length < 3) {
    suggestions.push("知识条目不足 3 条，用户更容易觉得回答不够具体。");
  }
  if ((profile.structuredFacts || []).length < 4) {
    suggestions.push("结构化事实还偏少，建议补齐学校、职业、城市和关键经历名词，能明显降低编造。");
  }
  if ((profile.topicSummaries || []).length < 2) {
    suggestions.push("Topic 摘要还偏少，建议继续补充可复用的经历主题，让检索更容易命中具体场景。");
  }
  if (feedback.notSpecific > feedback.helpful) {
    suggestions.push("近期「不够具体」偏多，建议在对话调教里补充真实案例和决策过程。");
  }
  if ((feedback.factualError || 0) + (feedback.contradiction || 0) > 0) {
    suggestions.push("近期出现事实错误或前后矛盾，建议优先检查结构化事实和相关知识条目。");
  }
  if (!profile.hasVoiceClone) {
    suggestions.push("还没有可用音色，补一个语音样本能提升陪伴感与转化。");
  }
  if ((data.stats && data.stats.blindSpotCount) > 0) {
    suggestions.push(
      "有 " + data.stats.blindSpotCount + " 个用户问题你的 Agent 答不好，建议查看「盲区问题」并补充相关经验。"
    );
  }
  if (!profile.apiInvokeEnabled) {
    suggestions.push("可以开启开放 API，让别人直接调用你的 Agent 并查看调用数据。");
  }
  if (!profile.published) {
    suggestions.push("当前处于未发布状态，确认资料后可重新上架。");
  }
  return suggestions.slice(0, 4);
}

const LIVE_CATEGORIES = [
  { value: "general", label: "综合" },
  { value: "market", label: "行情" },
  { value: "job", label: "求职/秋招" },
  { value: "life", label: "生活" },
  { value: "study", label: "升学/考试" },
  { value: "housing", label: "房产" },
  { value: "policy", label: "当地政策" },
  { value: "cost", label: "物价/开销" },
  { value: "community", label: "社区/小区" },
  { value: "transport", label: "交通/通勤" },
  { value: "weather", label: "气候/环境" },
  { value: "resource", label: "本地资源" },
];

const QUICK_ACTIONS = [
  {
    id: "coedit",
    title: "对话调教",
    desc: "像聊天一样修改欢迎语、风格和知识内容",
    iconClass: "action-icon-oxblood",
    icon: "coedit",
  },
  {
    id: "edit",
    title: "编辑资料",
    desc: "分组修改封面、人设、示范回答与地区信息",
    iconClass: "action-icon-paper",
    icon: "edit",
  },
  {
    id: "sales",
    title: "互动记录",
    desc: "查看近 7 天、30 天和全部用户提问互动",
    iconClass: "action-icon-olive",
    icon: "sales",
  },
  {
    id: "sessions",
    title: "聊天记录",
    desc: "按会话搜索，了解用户最近在问什么",
    iconClass: "action-icon-paper-light",
    icon: "sessions",
  },
  {
    id: "feedback",
    title: "反馈诊断",
    desc: "看评分、轻反馈类型和近期差评关键词",
    iconClass: "action-icon-oxblood",
    icon: "feedback",
  },
  {
    id: "topics",
    title: "Topic 管理",
    desc: "审核 candidate，合并重复主题，并人工修正文案",
    iconClass: "action-icon-olive",
    icon: "topics",
  },
  {
    id: "blindspots",
    title: "盲区问题",
    desc: "用户问了但 Agent 答不好的问题，补充后提升回答质量",
    iconClass: "action-icon-paper",
    icon: "blindspots",
    titleSuffixFrom: "blindSpotCount",
  },
  {
    id: "api",
    title: "开放 API",
    desc: "管理调用 Key 与调用数据，让别人直接调用你的 Agent",
    iconClass: "action-icon-oxblood",
    icon: "api",
  },
];

function liveCategoryLabel(value) {
  for (let i = 0; i < LIVE_CATEGORIES.length; i++) {
    if (LIVE_CATEGORIES[i].value === value) return LIVE_CATEGORIES[i].label;
  }
  return value || "综合";
}

module.exports = {
  computeCompletion,
  formatDateTime,
  formatShortTime,
  feedbackTypeLabel,
  alertPriorityLabel,
  buildOptimizationSuggestions,
  liveCategoryLabel,
  LIVE_CATEGORIES,
  QUICK_ACTIONS,
  MBTI_OPTIONS,
  PERSONA_OPTIONS,
  TONE_OPTIONS,
  RESPONSE_STYLE_OPTIONS,
  REGION_OPTIONS,
  MANAGE_SUB_PAGES,
  createFormState,
  buildProfilePayload,
  buildPatchPayloadFromProfile,
  summarizeProfileChanges,
  extractTopKeywords,
  loadManageData,
  navigateToManageSub,
  goBackToManage,
  coEditStorageKey,
  centsToYuanInput,
  yuanInputToCents,
  regionsFromForm,
};
