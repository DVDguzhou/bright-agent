export type LifeAgentGrowthEvent = {
  id: string;
  type: string;
  visibility: "public" | "owner" | "system" | string;
  title: string;
  summary: string;
  payload?: Record<string, unknown>;
  sourceId?: string | null;
  createdAt: string;
  freshDays: number;
};

export type LifeAgentGrowthSummary = {
  total: number;
  publicTotal: number;
  publicLoaded: number;
  weekCount: number;
  followerCount: number;
  unread: number;
  following: boolean;
  latestTitle?: string;
  lastSeenAt?: string | null;
};

export type LifeAgentGrowthLog = {
  events: LifeAgentGrowthEvent[];
  summary: LifeAgentGrowthSummary;
};

export const LIFE_AGENT_GROWTH_CATEGORY_LABELS: Record<string, string> = {
  general: "综合",
  market: "行情",
  job: "求职",
  life: "生活",
  study: "升学",
  housing: "居住",
  policy: "政策",
  resource: "资源",
  cost: "物价",
  community: "社区",
  transport: "交通",
  weather: "气候",
};

export const LIFE_AGENT_GROWTH_TYPE_LABELS: Record<string, string> = {
  live_update: "公开近况",
  co_edit_applied: "记忆维护",
  feedback_fixed: "反馈修复",
  knowledge_added: "知识新增",
  knowledge_revised: "知识修订",
  profile_polished: "资料完善",
  milestone: "成长节点",
};

export function formatGrowthFreshDays(freshDays: number) {
  if (freshDays <= 0) return "今天";
  if (freshDays === 1) return "昨天";
  return `${freshDays} 天前`;
}

export function growthEventCategory(event: LifeAgentGrowthEvent) {
  const raw = event.payload?.category;
  return typeof raw === "string" && raw.trim() ? raw : "general";
}

export function growthEventLocation(event: LifeAgentGrowthEvent) {
  const raw = event.payload?.location;
  return typeof raw === "string" && raw.trim() ? raw : "";
}

export function isSyntheticGrowthEvent(event: LifeAgentGrowthEvent) {
  return event.payload?.synthetic === true || !event.summary.trim();
}

export function buildGrowthQuestion(event: LifeAgentGrowthEvent, displayName?: string) {
  const subject = displayName ? `${displayName}，` : "";
  const summary = event.summary.trim();
  if (summary) {
    const clipped = summary.length > 42 ? `${summary.slice(0, 42)}...` : summary;
    return `${subject}你最近提到「${clipped}」，能结合我的情况讲讲吗？`;
  }
  const sampleQuestion =
    typeof event.payload?.sampleQuestion === "string" ? event.payload.sampleQuestion.trim() : "";
  if (sampleQuestion) {
    const clipped = sampleQuestion.length > 48 ? `${sampleQuestion.slice(0, 48)}...` : sampleQuestion;
    return `${subject}关于「${clipped}」，你能结合自己的经历讲讲吗？`;
  }
  const category = growthEventCategory(event);
  const categoryLabel = LIFE_AGENT_GROWTH_CATEGORY_LABELS[category] ?? category;
  return `${subject}最近在${categoryLabel}这块有什么新的想法？能结合我的情况说说吗？`;
}

export async function fetchLifeAgentGrowthLog(profileId: string, includeCredentials = true): Promise<LifeAgentGrowthLog | null> {
  const res = await fetch(`/api/life-agents/${profileId}/growth-log`, {
    credentials: includeCredentials ? "include" : "same-origin",
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as LifeAgentGrowthLog | null;
  if (!json || !Array.isArray(json.events)) return null;
  return json;
}

export async function markLifeAgentGrowthSeen(profileId: string): Promise<void> {
  await fetch(`/api/life-agents/${profileId}/growth-log/mark-seen`, {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
}
