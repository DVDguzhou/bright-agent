/**
 * 广场列表项的类型定义。
 *
 * 历史备注：此文件原本包含一整套前端词法 + 业务分打分逻辑（`searchLifeAgentsInMarketplace` 等），
 * 已迁移到后端 `GET /api/life-agents/search`（见 `@/backend/internal/handler/life_agent_search.go`）。
 *
 * 现在只保留：
 *   1. `LifeAgentListItem` 类型（广场列表项，跨多个页面复用）。
 *   2. `rankLifeAgentsBySearchQuery` —— 仅供收藏页使用的"按业务分排序"工具。
 *      （收藏列表只需要固定顺序，不需要关键词搜索，调用时传空字符串即可。）
 */

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
  mindScore?: number;
  mindScoreLevel?: number;
  mindScoreLevelLabel?: string;
  /** 精选排序：越小越靠前；null/undefined=不精选 */
  featuredRank?: number | null;
  /** 专题/校园合集 key（如 kaoyan/liuxue/qiuzhi）；空=不属于任何合集 */
  featuredCollection?: string | null;
};

function clamp01(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  return v > 1 ? 1 : v;
}

/** 与后端 `scoreBusiness` 保持同一套权重，便于前端本地再排序时结果一致。 */
function businessScore(p: LifeAgentListItem): number {
  const sold = clamp01(p.soldQuestionPacks / 80);
  const sessions = clamp01(p.sessionCount / 120);
  const knowledge = clamp01(p.knowledgeCount / 40);
  const ratingAvg = clamp01((p.ratings?.averageScore ?? 0) / 5);
  const ratingTrust = clamp01((p.ratings?.raters ?? 0) / 50);
  return sold * 0.42 + sessions * 0.18 + knowledge * 0.12 + ratingAvg * 0.18 + ratingTrust * 0.10;
}

/** 与后端 `scoreCompleteness` 对齐：档案完整度兜底分（0..1），缓解新 Agent 冷启动。 */
function completenessScore(p: LifeAgentListItem): number {
  let s = 0;
  if ((p.shortBio ?? "").trim() !== "") s += 0.25;
  const hasCover =
    (p.coverImageUrl ?? "").trim() !== "" ||
    (p.coverUrl ?? "").trim() !== "" ||
    (p.coverPresetKey ?? "").trim() !== "";
  if (hasCover) s += 0.2;
  if ((p.expertiseTags?.length ?? 0) > 0) s += 0.2;
  if (p.knowledgeCount >= 3) s += 0.35;
  else if (p.knowledgeCount > 0) s += 0.15;
  return s > 1 ? 1 : s;
}

/**
 * 按业务分排序。搜索相关的词法匹配已下沉到后端，此处不再做关键词过滤。
 * 保留函数名以减少调用方改动；`rawQuery` 仅用于向后兼容，不再被消费。
 */
export function rankLifeAgentsBySearchQuery(
  profiles: LifeAgentListItem[],
  _rawQuery: string,
): LifeAgentListItem[] {
  const scored = profiles.map((p) => ({ p, s: businessScore(p) * 0.7 + completenessScore(p) * 0.3 }));
  scored.sort((a, b) => b.s - a.s);
  return scored.map(({ p }) => p);
}
