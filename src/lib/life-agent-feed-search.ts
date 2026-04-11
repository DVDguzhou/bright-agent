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
  ["985", "211", "c9", "双一流", "顶尖高校"],
  ["双非", "普通本科", "二本", "三本"],
  ["PhD", "博士", "直博", "读博", "博士申请"],
  ["硕士", "Master", "MS", "研究生"],
];

const SCHOOL_TIERS: Record<string, string[]> = {
  "985": [
    "北京大学", "清华大学", "复旦大学", "上海交通大学", "浙江大学",
    "南京大学", "中国科学技术大学", "哈尔滨工业大学", "西安交通大学",
    "北京理工大学", "南开大学", "天津大学", "东南大学", "武汉大学",
    "华中科技大学", "中山大学", "厦门大学", "山东大学", "四川大学",
    "吉林大学", "大连理工大学", "中南大学", "湖南大学", "重庆大学",
    "电子科技大学", "西北工业大学", "兰州大学", "东北大学",
    "华南理工大学", "北京航空航天大学", "同济大学", "中国人民大学",
    "北京师范大学", "中国农业大学", "国防科技大学", "中央民族大学",
    "华东师范大学", "西北农林科技大学", "中国海洋大学",
  ],
  "211": [
    "北京邮电大学", "北京交通大学", "北京科技大学", "北京化工大学",
    "北京林业大学", "北京中医药大学", "中国传媒大学", "中央财经大学",
    "对外经济贸易大学", "华北电力大学", "中国政法大学", "中国矿业大学",
    "中国石油大学", "中国地质大学", "南京航空航天大学", "南京理工大学",
    "河海大学", "南京师范大学", "苏州大学", "江南大学", "南京农业大学",
    "中国药科大学", "上海财经大学", "上海外国语大学", "华东理工大学",
    "东华大学", "上海大学", "武汉理工大学", "华中农业大学",
    "华中师范大学", "中南财经政法大学", "西南大学", "西南交通大学",
    "暨南大学", "华南师范大学", "郑州大学", "合肥工业大学",
    "安徽大学", "福州大学", "西安电子科技大学", "长安大学",
    "太原理工大学", "哈尔滨工程大学", "南昌大学", "云南大学",
    "广西大学", "贵州大学", "海南大学", "内蒙古大学", "新疆大学",
    "西藏大学", "青海大学", "宁夏大学", "石河子大学", "延边大学",
    "四川农业大学",
  ],
  "c9": [
    "北京大学", "清华大学", "复旦大学", "上海交通大学", "浙江大学",
    "南京大学", "中国科学技术大学", "哈尔滨工业大学", "西安交通大学",
  ],
};

function schoolTierTags(school: string | undefined): string[] {
  if (!school) return [];
  const s = school.trim();
  if (!s) return [];
  const tags: string[] = [];
  const is985 = SCHOOL_TIERS["985"].some((u) => s.includes(u) || u.includes(s));
  const is211 = is985 || SCHOOL_TIERS["211"].some((u) => s.includes(u) || u.includes(s));
  const isC9 = SCHOOL_TIERS["c9"].some((u) => s.includes(u) || u.includes(s));
  if (isC9) tags.push("c9");
  if (is985) tags.push("985", "双一流");
  if (is211) tags.push("211", "双一流");
  if (!is211) tags.push("双非", "普通本科");
  return tags;
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function splitKeywords(input: string) {
  return input
    .split(/[\s,\u3001\uFF0C;\/]+/)
    .map((item) => normalizeSearchText(item))
    .filter(Boolean);
}

function buildExpandedTerms(rawQuery: string) {
  const normalizedQuery = normalizeSearchText(rawQuery);
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
  const query = rawQuery.trim();
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
      ...schoolTierTags(profile.school),
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
