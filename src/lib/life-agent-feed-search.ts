/** 广场 / 发现流使用的 marketplace search，不与对话期检索共用评分模型。 */

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

export type LifeAgentMarketplaceSearchFilters = {
  publishedOnly?: boolean;
  verificationStatuses?: string[];
  minPricePerQuestion?: number;
  maxPricePerQuestion?: number;
  regions?: string[];
  expertiseTags?: string[];
};

export type LifeAgentMarketplaceSearchOptions = {
  filters?: LifeAgentMarketplaceSearchFilters;
};

export type LifeAgentMarketplaceSearchResult = {
  profile: LifeAgentListItem;
  score: number;
  lexicalScore: number;
  businessScore: number;
  matchedFields: string[];
};

type SearchField = {
  name: string;
  value: string;
  weight: number;
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
  ["qs前50", "qs前100", "qs前200", "qs200以下"],
  ["美国", "英国", "澳大利亚", "加拿大", "新加坡", "日本", "韩国"],
  ["欧洲", "北美", "亚洲", "大洋洲"],
  ["中国香港", "中国台湾"],
  ["phd", "博士", "直博", "读博", "博士申请"],
  ["硕士", "master", "ms", "研究生"],
];

const QUERY_ALIAS_RULES: [RegExp, string][] = [
  [/qs\s*(?:top\s*)?(\d+)/gi, "qs前$1"],
  [/(?:^|\s)top\s*(\d+)(?:\s|$)/gi, " qs前$1 "],
  [/(?:^|\s)前(\d+)(?:\s|$)/gi, " qs前$1 "],
  [/shuang\s*fei/gi, "双非"],
  [/shuang\s*yi\s*liu/gi, "双一流"],
];

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

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
    .filter((item) => item.length >= 2);
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
    normalizedQuery,
    originalTerms,
    relatedTerms: Array.from(relatedSet),
  };
}

function collectMarketplaceSearchFields(profile: LifeAgentListItem): SearchField[] {
  return [
    { name: "displayName", value: profile.displayName, weight: 8 },
    { name: "headline", value: profile.headline, weight: 5.5 },
    { name: "shortBio", value: profile.shortBio, weight: 4.5 },
    { name: "audience", value: profile.audience, weight: 3 },
    { name: "welcomeMessage", value: profile.welcomeMessage, weight: 1.5 },
    { name: "school", value: profile.school ?? "", weight: 4 },
    { name: "education", value: profile.education ?? "", weight: 3.5 },
    { name: "job", value: profile.job ?? "", weight: 4 },
    { name: "income", value: profile.income ?? "", weight: 1.5 },
    { name: "country", value: profile.country ?? "", weight: 2.5 },
    { name: "province", value: profile.province ?? "", weight: 2.5 },
    { name: "city", value: profile.city ?? "", weight: 2.5 },
    { name: "county", value: profile.county ?? "", weight: 2 },
    { name: "regions", value: (profile.regions ?? []).join(" "), weight: 3 },
    { name: "expertiseTags", value: (profile.expertiseTags ?? []).join(" "), weight: 7 },
    { name: "sampleQuestions", value: (profile.sampleQuestions ?? []).join(" "), weight: 5 },
    { name: "creatorName", value: profile.creator.name ?? "", weight: 1.5 },
  ];
}

function scoreMarketplaceField(
  field: SearchField,
  normalizedQuery: string,
  directTerms: string[],
  relatedTerms: string[],
) {
  const normalizedField = normalizeSearchText(field.value);
  if (!normalizedField) {
    return { score: 0, matched: false };
  }

  let score = 0;
  let directHits = 0;
  let relatedHits = 0;

  if (normalizedQuery && normalizedField.includes(normalizedQuery)) {
    score += field.weight * 1.8;
  }

  for (const term of directTerms) {
    if (!term) continue;
    if (normalizedField.includes(term)) {
      directHits += 1;
      score += field.weight;
    }
  }

  for (const term of relatedTerms) {
    if (!term) continue;
    if (normalizedField.includes(term)) {
      relatedHits += 1;
      score += field.weight * 0.35;
    }
  }

  if (directHits > 1) {
    score += field.weight * 0.6;
  }
  if (directHits === directTerms.length && directTerms.length > 1) {
    score += field.weight * 0.8;
  }
  if (directHits === 0 && relatedHits >= 2) {
    score += field.weight * 0.4;
  }

  return { score, matched: score > 0 };
}

function normalizeBusinessMetric(value: number, scale: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(1, value / scale);
}

function scoreMarketplaceBusiness(profile: LifeAgentListItem) {
  const sold = normalizeBusinessMetric(profile.soldQuestionPacks ?? 0, 80);
  const sessions = normalizeBusinessMetric(profile.sessionCount ?? 0, 120);
  const knowledge = normalizeBusinessMetric(profile.knowledgeCount ?? 0, 40);
  const ratingScore = normalizeBusinessMetric(profile.ratings?.averageScore ?? 0, 5);
  const ratingTrust = normalizeBusinessMetric(profile.ratings?.raters ?? 0, 50);

  return sold * 0.42 + sessions * 0.18 + knowledge * 0.12 + ratingScore * 0.18 + ratingTrust * 0.10;
}

function matchesAny(values: string[], expected: string[]) {
  if (expected.length === 0) return true;
  const normalizedValues = values.map(normalizeSearchText).filter(Boolean);
  return expected.some((term) => normalizedValues.some((value) => value.includes(term) || term.includes(value)));
}

function matchesMarketplaceFilters(profile: LifeAgentListItem, filters?: LifeAgentMarketplaceSearchFilters) {
  if (!filters) return true;

  if (filters.publishedOnly && profile.published === false) {
    return false;
  }

  if (
    filters.verificationStatuses?.length &&
    !filters.verificationStatuses.includes(profile.verificationStatus ?? "none")
  ) {
    return false;
  }

  if (
    typeof filters.minPricePerQuestion === "number" &&
    profile.pricePerQuestion < filters.minPricePerQuestion
  ) {
    return false;
  }

  if (
    typeof filters.maxPricePerQuestion === "number" &&
    profile.pricePerQuestion > filters.maxPricePerQuestion
  ) {
    return false;
  }

  const normalizedRegions = (filters.regions ?? []).map(normalizeSearchText).filter(Boolean);
  if (
    normalizedRegions.length &&
    !matchesAny(
      [profile.country, profile.province, profile.city, profile.county, ...(profile.regions ?? [])].filter(
        (value): value is string => Boolean(value),
      ),
      normalizedRegions,
    )
  ) {
    return false;
  }

  const normalizedTags = (filters.expertiseTags ?? []).map(normalizeSearchText).filter(Boolean);
  if (normalizedTags.length && !matchesAny(profile.expertiseTags ?? [], normalizedTags)) {
    return false;
  }

  return true;
}

export function searchLifeAgentsInMarketplace(
  profiles: LifeAgentListItem[],
  rawQuery: string,
  options?: LifeAgentMarketplaceSearchOptions,
): LifeAgentMarketplaceSearchResult[] {
  const { normalizedQuery, originalTerms, relatedTerms } = buildExpandedTerms(rawQuery);
  const queryEmpty = !normalizedQuery;

  return profiles
    .filter((profile) => matchesMarketplaceFilters(profile, options?.filters))
    .map((profile) => {
      const matchedFields = new Set<string>();
      let lexicalScore = 0;

      for (const field of collectMarketplaceSearchFields(profile)) {
        const { score, matched } = scoreMarketplaceField(field, normalizedQuery, originalTerms, relatedTerms);
        lexicalScore += score;
        if (matched) {
          matchedFields.add(field.name);
        }
      }

      if (!queryEmpty && originalTerms.some((term) => (profile.expertiseTags ?? []).some((tag) => normalizeSearchText(tag) === term))) {
        lexicalScore += 6;
        matchedFields.add("expertiseTags");
      }

      if (
        !queryEmpty &&
        originalTerms.some((term) =>
          (profile.sampleQuestions ?? []).some((question) => normalizeSearchText(question).includes(term)),
        )
      ) {
        lexicalScore += 3;
        matchedFields.add("sampleQuestions");
      }

      const businessScore = scoreMarketplaceBusiness(profile);
      const score = queryEmpty ? businessScore : lexicalScore * 0.9 + businessScore * 10;

      return {
        profile,
        score,
        lexicalScore,
        businessScore,
        matchedFields: Array.from(matchedFields),
      };
    })
    .filter((item) => queryEmpty || item.lexicalScore > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.lexicalScore !== a.lexicalScore) return b.lexicalScore - a.lexicalScore;
      if (b.businessScore !== a.businessScore) return b.businessScore - a.businessScore;
      return (b.profile.soldQuestionPacks ?? 0) - (a.profile.soldQuestionPacks ?? 0);
    });
}

export function rankLifeAgentsBySearchQuery(
  profiles: LifeAgentListItem[],
  rawQuery: string,
  options?: LifeAgentMarketplaceSearchOptions,
): LifeAgentListItem[] {
  return searchLifeAgentsInMarketplace(profiles, rawQuery, options).map(({ profile }) => profile);
}
