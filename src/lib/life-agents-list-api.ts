import type { LifeAgentListItem } from "@/lib/life-agent-feed-search";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function asNum(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** 将 /api/life-agents 单条 JSON 规范为列表项（兼容旧版与分页）。 */
export function normalizeLifeAgentListRow(row: unknown): LifeAgentListItem | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = r.id;
  if (typeof id !== "string" || !id.trim()) return null;

  let creatorName: string | null = null;
  const c = r.creator;
  if (c && typeof c === "object" && c !== null && "name" in c) {
    const n = (c as { name?: unknown }).name;
    creatorName = typeof n === "string" ? n : n == null ? null : String(n);
  }

  let averageScore = 0;
  let raters = 0;
  const ratings = r.ratings;
  if (ratings && typeof ratings === "object" && ratings !== null) {
    const ra = ratings as Record<string, unknown>;
    averageScore = asNum(ra.averageScore, 0);
    raters = asNum(ra.raters, 0);
  }

  return {
    id,
    displayName: typeof r.displayName === "string" ? r.displayName : "",
    headline: typeof r.headline === "string" ? r.headline : "",
    shortBio: typeof r.shortBio === "string" ? r.shortBio : "",
    audience: typeof r.audience === "string" ? r.audience : "",
    welcomeMessage: typeof r.welcomeMessage === "string" ? r.welcomeMessage : "",
    pricePerQuestion: asNum(r.pricePerQuestion, 0),
    expertiseTags: asStringArray(r.expertiseTags),
    sampleQuestions: asStringArray(r.sampleQuestions),
    education: typeof r.education === "string" ? r.education : undefined,
    income: typeof r.income === "string" ? r.income : undefined,
    job: typeof r.job === "string" ? r.job : undefined,
    school: typeof r.school === "string" ? r.school : undefined,
    regions: asStringArray(r.regions),
    country: typeof r.country === "string" ? r.country : undefined,
    province: typeof r.province === "string" ? r.province : undefined,
    city: typeof r.city === "string" ? r.city : undefined,
    county: typeof r.county === "string" ? r.county : undefined,
    verificationStatus: typeof r.verificationStatus === "string" ? r.verificationStatus : undefined,
    knowledgeCount: asNum(r.knowledgeCount, 0),
    soldQuestionPacks: asNum(r.soldQuestionPacks, 0),
    sessionCount: asNum(r.sessionCount, 0),
    ratings: { averageScore, raters },
    creator: { name: creatorName },
    coverUrl: typeof r.coverUrl === "string" ? r.coverUrl : undefined,
    coverImageUrl: typeof r.coverImageUrl === "string" ? r.coverImageUrl : undefined,
    coverPresetKey: typeof r.coverPresetKey === "string" ? r.coverPresetKey : undefined,
    published: typeof r.published === "boolean" ? r.published : undefined,
  };
}

/** 兼容无 limit 时的 JSON 数组，或分页对象 `{ items, nextCursor }`。 */
export function parsePublishedLifeAgentsPayload(data: unknown): LifeAgentListItem[] {
  if (Array.isArray(data)) {
    return data.map(normalizeLifeAgentListRow).filter(Boolean) as LifeAgentListItem[];
  }
  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items.map(normalizeLifeAgentListRow).filter(Boolean) as LifeAgentListItem[];
    }
  }
  return [];
}

export async function fetchLifeAgentsPage(
  limit: number,
  cursor: string | undefined,
  signal?: AbortSignal,
  seed?: number,
): Promise<{ items: LifeAgentListItem[]; nextCursor: string }> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (seed != null) {
    params.set("seed", String(seed));
    if (cursor) {
      params.set("offset", cursor);
      params.set("cursor", cursor);
    }
  } else {
    if (cursor) params.set("cursor", cursor);
  }
  const res = await fetch(`/api/life-agents?${params.toString()}`, {
    credentials: "include",
    signal,
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "FETCH_ERROR";
    throw new Error(msg);
  }
  if (Array.isArray(data)) {
    return { items: parsePublishedLifeAgentsPayload(data), nextCursor: "" };
  }
  const items = parsePublishedLifeAgentsPayload(data);
  const next =
    data && typeof data === "object" && data !== null && typeof (data as { nextCursor?: unknown }).nextCursor === "string"
      ? (data as { nextCursor: string }).nextCursor
      : "";
  return { items, nextCursor: next };
}

/** 地图、搜索排序、收藏全量筛选等需要完整列表时顺序拉取。 */
export async function fetchAllPublishedLifeAgents(signal?: AbortSignal): Promise<LifeAgentListItem[]> {
  const res = await fetch("/api/life-agents", { credentials: "include", signal });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) return [];
  return parsePublishedLifeAgentsPayload(data);
}
