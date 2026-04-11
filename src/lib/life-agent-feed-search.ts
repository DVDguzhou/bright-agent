/** 发现流 / 搜索共用的列表项类型与关键词排序 */

export type LifeAgentListItem = {
  id: string;
  displayName: string;
  headline: string;
  shortBio: string;
  audience: string;
  welcomeMessage: string;
  pricePerQuestion: number;
  expertiseTags: string[];
  sampleQuestions: string[];
  education?: string;
  income?: string;
  job?: string;
  school?: string;
  regions?: string[];
  country?: string;
  province?: string;
  city?: string;
  county?: string;
  verificationStatus?: string;
  knowledgeCount: number;
  soldQuestionPacks: number;
  sessionCount: number;
  ratings?: {
    averageScore: number;
    raters: number;
  };
  creator: {
    name: string | null;
  };
  coverUrl?: string;
  coverImageUrl?: string;
  coverPresetKey?: string;
  /** 创作者「我的人生 Agent」列表用：是否在广场发布 */
  published?: boolean;
};

const RELATED_TERM_GROUPS: string[][] = [
  ["考研", "就业", "读研", "保研", "调剂"],
  ["求职", "秋招", "春招", "面试", "简历"],
  ["转行", "offer", "跳槽"],
  ["职业规划", "副业", "创业"],
  ["体制内", "考公", "考编"],
  ["留学", "托福", "雅思", "申请", "文书", "GRE", "TOEFL", "IELTS"],
  ["实习", "校招", "社招", "内推"],
  ["产品", "运营", "开发", "设计"],
  ["金融", "互联网", "咨询"],
  ["北京", "上海", "广州", "深圳"],
  ["杭州", "成都", "南京", "武汉"],
  ["远程", "居家", "线下", "兼职"],
  ["大厂", "初创", "外企"],
  ["离职", "offer", "裸辞"],
  ["涨薪", "晋升", "转岗"],
  ["985", "211", "双一流", "双非", "海外院校"],
  ["QS前50", "QS前100", "QS前200", "QS200以下"],
  ["美国", "英国", "澳大利亚", "加拿大", "新加坡", "日本", "韩国"],
  ["欧洲", "北美", "亚洲", "大洋洲"],
  ["中国香港", "中国台湾"],
  ["PhD", "博士", "直博", "读博", "博士申请"],
  ["硕士", "Master", "MS", "研究生"],
];

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Query alias rules: maps common user input variations to canonical tag forms.
 * Each rule is [regex, replacement]. Applied sequentially to the raw query.
 */
const QUERY_ALIAS_RULES: [RegExp, string][] = [
  // "qs50" / "qs 50" / "QS Top50" / "qs top 50" → "qs前50"  (and 100, 200)
  [/qs\s*(?:top\s*)?(\d+)/gi, "qs前$1"],
  // "top50" (without qs prefix) → "qs前50"
  [/(?:^|\s)top\s*(\d+)(?:\s|$)/gi, " qs前$1 "],
  // "前50" → "qs前50"
  [/(?:^|\s)前(\d+)(?:\s|$)/gi, " qs前$1 "],
  // "shuangfei" → "双非"
  [/shuang\s*fei/gi, "双非"],
  // "shuangyiliu" → "双一流"
  [/shuang\s*yi\s*liu/gi, "双一流"],
];

function normalizeQuery(raw: string): string {
  let q = raw;
  for (const [pattern, replacement] of QUERY_ALIAS_RULES) {
    q = q.replace(pattern, replacement);
  }
  return q.trim();
}

function splitKeywords(input: string) {
  return input
    .split(/[\s,\u3001\uFF0C;\/]+/)
    .map((item) => normalizeSearchText(item))
    .filter(Boolean);
}

function buildExpandedTerms(rawQuery: string) {
  const normalizedQuery = normalizeSearchText(normalizeQuery(rawQuery));
  const originalTerms = Array.from(new Set([normalizedQuery, ...splitKeywords(normalizedQuery)].filter(Boolean)));
  const originalSet = new Set(originalTerms);
  const relatedSet = new Set<string>();

  for (const group of RELATED_TERM_GROUPS) {
    const normalizedGroup = group.map((term) => normalizeSearchText(term));
    const isMatched = normalizedGroup.some(
      (term) =>
        normalizedQuery.includes(term) ||
        originalTerms.some((keyword) => keyword.includes(term) || term.includes(keyword)),
    );
    if (!isMatched) continue;
    for (const term of normalizedGroup) {
      if (!originalSet.has(term)) {
        relatedSet.add(term);
      }
    }
  }

  return {
    originalTerms,
    relatedTerms: Array.from(relatedSet),
  };
}

function searchScore(profile: LifeAgentListItem, rawQuery: string) {
  const query = normalizeQuery(rawQuery.trim());
  if (!query) return 1;

  const fullText = normalizeSearchText(
    [
      profile.displayName,
      profile.headline,
      profile.shortBio,
      profile.audience,
      profile.school,
      profile.education,
      ...(profile.regions ?? []),
      profile.country,
      profile.province,
      profile.city,
      profile.county,
      ...(profile.expertiseTags ?? []),
      ...(profile.sampleQuestions ?? []),
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const { originalTerms, relatedTerms } = buildExpandedTerms(query);
  let score = 0;
  let directHits = 0;
  let relatedHits = 0;

  const normalizedQuery = normalizeSearchText(query);
  if (fullText.includes(normalizedQuery)) {
    score += 12;
  }

  for (const term of originalTerms) {
    if (term && fullText.includes(term)) {
      directHits += 1;
      score += 5;
    }
  }

  for (const term of relatedTerms) {
    if (term && fullText.includes(term)) {
      relatedHits += 1;
      score += 2;
    }
  }

  if (directHits > 1) {
    score += 4;
  }
  if (directHits === 0 && relatedHits >= 2) {
    score += 3;
  }
  if (directHits === originalTerms.length && originalTerms.length > 1) {
    score += 6;
  }

  return score;
}

export function rankLifeAgentsBySearchQuery(profiles: LifeAgentListItem[], rawQuery: string): LifeAgentListItem[] {
  return [...profiles]
    .map((profile) => ({ profile, score: searchScore(profile, rawQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.profile.soldQuestionPacks ?? 0) - (a.profile.soldQuestionPacks ?? 0);
    })
    .map(({ profile }) => profile);
}
