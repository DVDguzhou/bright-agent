import { centsToYuanInput, yuanInputToCents } from "@/lib/price";

export type ManageProfile = {
  id: string;
  displayName: string;
  headline: string;
  shortBio: string;
  longBio: string;
  audience: string;
  welcomeMessage: string;
  notSuitableFor?: string;
  pricePerQuestion: number;
  expertiseTags: string[];
  sampleQuestions: string[];
  education?: string;
  income?: string;
  job?: string;
  school?: string;
  country?: string;
  province?: string;
  city?: string;
  county?: string;
  regions?: string[];
  verificationStatus?: string;
  mbti?: string;
  personaArchetype?: string;
  toneStyle?: string;
  responseStyle?: string;
  forbiddenPhrases?: string[];
  exampleReplies?: string[];
  published: boolean;
  voiceCloneId?: string | null;
  hasVoiceClone?: boolean;
  coverImageUrl?: string;
  coverPresetKey?: string;
  coverUrl?: string;
  apiInvokeEnabled?: boolean;
  apiPriceFollowsConsultation?: boolean;
  apiPricePerCallCents?: number | null;
  effectiveApiPricePerCallCents?: number;
  apiTotalCalls?: number;
  knowledgeEntries: Array<{
    id: string;
    category: string;
    title: string;
    content: string;
    tags: string[];
  }>;
};

export type ManageData = {
  profile: ManageProfile;
  stats: {
    totalRevenue: number;
    soldPacks: number;
    sessionCount: number;
  };
  feedback?: {
    counts: { helpful: number; notSpecific: number; notSuitable: number };
    ratings?: {
      averageScore: number;
      raters: number;
      recent: Array<{
        id: string;
        score: number;
        comment?: string | null;
        updatedAt: string;
      }>;
    };
    recent: Array<{
      id: string;
      feedbackType: string;
      assistantExcerpt?: string | null;
      comment?: string | null;
      createdAt: string;
    }>;
  };
  questionPacks: Array<{
    id: string;
    questionCount: number;
    questionsUsed: number;
    amountPaid: number;
    createdAt: string;
    buyer: { email: string; name: string | null };
  }>;
  chatSessions: Array<{
    id: string;
    title: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
    buyer: { email: string; name: string | null };
  }>;
};

export type FormState = {
  displayName: string;
  headline: string;
  shortBio: string;
  longBio: string;
  education: string;
  school: string;
  job: string;
  income: string;
  regions: string;
  country: string;
  province: string;
  city: string;
  county: string;
  audience: string;
  welcomeMessage: string;
  notSuitableFor: string;
  pricePerQuestion: string;
  expertiseTags: string;
  sampleQuestions: string;
  mbti: string;
  personaArchetype: string;
  toneStyle: string;
  responseStyle: string;
  forbiddenPhrases: string;
  exampleReply1: string;
  exampleReply2: string;
  exampleReply3: string;
  published: boolean;
  coverImageUrl: string;
};

export const MBTI_OPTIONS = [
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

export const PERSONA_OPTIONS = ["学长学姐型", "朋友陪聊型", "前辈导师型", "冷静分析型", "过来人型", "本地熟人型"];
export const TONE_OPTIONS = ["直接一点", "温柔一点", "理性克制", "接地气一点", "像朋友聊天", "稳重耐心"];
export const RESPONSE_STYLE_OPTIONS = [
  "先给判断再解释",
  "先理解处境再建议",
  "多举自己的例子",
  "短一点别太满",
  "先拆选项再给建议",
  "像微信聊天少分点",
];
export const REGION_OPTIONS = ["温州", "杭州", "宁波", "台州", "绍兴", "上海", "北京", "深圳", "广州", "东京", "大阪", "新加坡"];

export function createFormState(profile: ManageProfile): FormState {
  return {
    displayName: profile.displayName,
    headline: profile.headline,
    shortBio: profile.shortBio,
    longBio: profile.longBio,
    education: profile.education ?? "",
    school: profile.school ?? "",
    job: profile.job ?? "",
    income: profile.income ?? "",
    regions: Array.isArray(profile.regions) ? profile.regions.join(", ") : "",
    country: profile.country ?? "",
    province: profile.province ?? "",
    city: profile.city ?? "",
    county: profile.county ?? "",
    audience: profile.audience,
    welcomeMessage: profile.welcomeMessage,
    notSuitableFor: profile.notSuitableFor ?? "",
    pricePerQuestion: centsToYuanInput(profile.pricePerQuestion),
    expertiseTags: Array.isArray(profile.expertiseTags) ? profile.expertiseTags.join(", ") : "",
    sampleQuestions: Array.isArray(profile.sampleQuestions) ? profile.sampleQuestions.join("\n") : "",
    mbti: profile.mbti ?? "",
    personaArchetype: profile.personaArchetype ?? "过来人型",
    toneStyle: profile.toneStyle ?? "像朋友聊天",
    responseStyle: profile.responseStyle ?? "先理解处境再建议",
    forbiddenPhrases: Array.isArray(profile.forbiddenPhrases) ? profile.forbiddenPhrases.join("\n") : "",
    exampleReply1: Array.isArray(profile.exampleReplies) ? profile.exampleReplies[0] ?? "" : "",
    exampleReply2: Array.isArray(profile.exampleReplies) ? profile.exampleReplies[1] ?? "" : "",
    exampleReply3: Array.isArray(profile.exampleReplies) ? profile.exampleReplies[2] ?? "" : "",
    published: profile.published,
    coverImageUrl: profile.coverImageUrl ?? "",
  };
}

export function regionsFromForm(form: FormState) {
  return form.regions
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildProfilePayload(form: FormState, voiceSamplePending?: string | null) {
  const exampleReplies = [form.exampleReply1, form.exampleReply2, form.exampleReply3]
    .map((s) => s.trim())
    .filter(Boolean);
  const displayName = form.displayName.trim();
  if (displayName.length < 1 || displayName.length > 10) {
    return { error: "Agent 名称长度需为 1 到 10 个字" } as const;
  }
  const regions = regionsFromForm(form);
  if (regions.length > 2) {
    return { error: "地区最多保留 2 个" } as const;
  }
  const pricePerQuestion = yuanInputToCents(form.pricePerQuestion);
  if (pricePerQuestion === null) {
    return { error: "请填写大于 0 的金额，单位是元，最多保留 2 位小数" } as const;
  }

  return {
    payload: {
      ...form,
      displayName,
      headline: form.headline.trim(),
      education: form.education || undefined,
      school: form.school || undefined,
      job: form.job || undefined,
      income: form.income || undefined,
      regions,
      country: form.country || undefined,
      province: form.province || undefined,
      city: form.city || undefined,
      county: form.county || undefined,
      pricePerQuestion,
      mbti: form.mbti || undefined,
      expertiseTags: form.expertiseTags
        .split(/[,，\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      sampleQuestions: form.sampleQuestions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      forbiddenPhrases: form.forbiddenPhrases
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      exampleReplies,
      coverImageUrl: form.coverImageUrl.trim(),
      ...(voiceSamplePending ? { voiceSampleBase64: voiceSamplePending } : {}),
    },
  } as const;
}

export function buildPatchPayloadFromProfile(profile: ManageProfile) {
  return {
    displayName: profile.displayName,
    headline: profile.headline,
    shortBio: profile.shortBio,
    longBio: profile.longBio,
    audience: profile.audience,
    welcomeMessage: profile.welcomeMessage,
    notSuitableFor: profile.notSuitableFor ?? "",
    pricePerQuestion: profile.pricePerQuestion,
    expertiseTags: profile.expertiseTags ?? [],
    sampleQuestions: profile.sampleQuestions ?? [],
    education: profile.education ?? "",
    income: profile.income ?? "",
    job: profile.job ?? "",
    school: profile.school ?? "",
    country: profile.country ?? "",
    province: profile.province ?? "",
    city: profile.city ?? "",
    county: profile.county ?? "",
    regions: profile.regions ?? [],
    mbti: profile.mbti ?? "",
    personaArchetype: profile.personaArchetype ?? "",
    toneStyle: profile.toneStyle ?? "",
    responseStyle: profile.responseStyle ?? "",
    forbiddenPhrases: profile.forbiddenPhrases ?? [],
    exampleReplies: profile.exampleReplies ?? [],
    published: profile.published,
    coverImageUrl: profile.coverImageUrl ?? "",
  };
}

export function summarizeProfileChanges(prev: ManageProfile, next: ManageProfile) {
  const summary: string[] = [];
  if (prev.displayName !== next.displayName || prev.headline !== next.headline) summary.push("名称或一句话介绍");
  if (prev.welcomeMessage !== next.welcomeMessage) summary.push("欢迎语");
  if ((prev.expertiseTags ?? []).join("|") !== (next.expertiseTags ?? []).join("|")) summary.push("擅长标签");
  if ((prev.sampleQuestions ?? []).join("|") !== (next.sampleQuestions ?? []).join("|")) summary.push("示例问题");
  if ((prev.exampleReplies ?? []).join("|") !== (next.exampleReplies ?? []).join("|")) summary.push("示范回答");
  if (
    prev.personaArchetype !== next.personaArchetype ||
    prev.toneStyle !== next.toneStyle ||
    prev.responseStyle !== next.responseStyle
  ) {
    summary.push("人设与语气");
  }
  if ((prev.knowledgeEntries ?? []).length !== (next.knowledgeEntries ?? []).length) summary.push("知识条目");
  if (prev.notSuitableFor !== next.notSuitableFor) summary.push("不适合回答的问题");
  return summary.length > 0 ? summary : ["资料内容"];
}

export function computeCompletion(profile: ManageProfile) {
  const checks = [
    Boolean(profile.displayName.trim()),
    Boolean(profile.headline.trim()),
    Boolean(profile.shortBio.trim()),
    Boolean(profile.welcomeMessage.trim()),
    (profile.expertiseTags ?? []).length >= 3,
    (profile.sampleQuestions ?? []).length >= 3,
    (profile.exampleReplies ?? []).length >= 2,
    (profile.knowledgeEntries ?? []).length >= 3,
    Boolean(profile.coverUrl || profile.coverImageUrl || profile.coverPresetKey),
    Boolean(profile.hasVoiceClone),
    Boolean(profile.regions?.length),
    profile.published,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function extractTopKeywords(texts: string[], limit = 6) {
  const counter = new Map<string, number>();
  for (const text of texts) {
    const normalized = text
      .replace(/[，。！？、,.!?/\\|()（）[\]{}:;"'“”‘’]/g, " ")
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
    for (const token of normalized) {
      if (token.length < 2) continue;
      counter.set(token, (counter.get(token) ?? 0) + 1);
    }
  }
  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("zh-CN");
}

export function formatShortTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "昨天";
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export async function fetchManageData(id: string) {
  try {
    const res = await fetch(`/api/life-agents/${id}/manage`, { credentials: "include" });
    if (res.status === 401 || res.status === 403) {
      return { data: null, error: "无权查看该 Agent" as const };
    }
    if (!res.ok) {
      return { data: null, error: "加载失败，请稍后重试" as const };
    }
    const data = (await res.json().catch(() => null)) as ManageData | null;
    if (!data?.profile) {
      return { data: null, error: "未获取到 Agent 数据" as const };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: "网络错误，请检查连接后重试" as const };
  }
}

export function buildOptimizationSuggestions(data: ManageData) {
  const suggestions: string[] = [];
  const completion = computeCompletion(data.profile);
  const feedback = data.feedback?.counts ?? { helpful: 0, notSpecific: 0, notSuitable: 0 };
  if (completion < 70) {
    suggestions.push(`资料完成度约 ${completion}%，建议优先补齐封面、欢迎语、示范回答和知识条目。`);
  }
  if ((data.profile.exampleReplies ?? []).length < 2) {
    suggestions.push("示范回答偏少，建议至少补 2 条，能明显提升像你本人的程度。");
  }
  if ((data.profile.knowledgeEntries ?? []).length < 3) {
    suggestions.push("知识条目不足 3 条，用户更容易觉得回答不够具体。");
  }
  if (feedback.notSpecific > feedback.helpful) {
    suggestions.push("近期“不够具体”偏多，建议在对话调教里补充真实案例和决策过程。");
  }
  if (!data.profile.hasVoiceClone) {
    suggestions.push("还没有可用音色，补一个语音样本能提升陪伴感与转化。");
  }
  if (!data.profile.apiInvokeEnabled) {
    suggestions.push("可以开启开放 API，让别人直接调用你的 Agent 并查看调用数据。");
  }
  if (!data.profile.published) {
    suggestions.push("当前处于未发布状态，确认资料后可重新上架。");
  }
  return suggestions.slice(0, 4);
}
