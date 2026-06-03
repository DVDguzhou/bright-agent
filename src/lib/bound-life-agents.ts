export type BoundLifeAgent = {
  id: string;
  displayName: string;
  headline?: string;
};

type MineRow = {
  id?: string;
  displayName?: string;
  headline?: string;
};

/**
 * 地图绑定用列表：仅当前用户**自己创建**的人生 Agent（不可选他人）。
 */
export async function fetchBoundLifeAgents(signal?: AbortSignal): Promise<BoundLifeAgent[]> {
  const res = await fetch("/api/life-agents/mine", { credentials: "include", signal });
  if (!res.ok) return [];
  const rows = (await res.json()) as unknown;
  if (!Array.isArray(rows)) return [];
  const out: BoundLifeAgent[] = [];
  for (const row of rows as MineRow[]) {
    const id = String(row.id ?? "").trim();
    if (!id) continue;
    out.push({
      id,
      displayName: String(row.displayName ?? "Agent"),
      headline: row.headline,
    });
  }
  return out;
}

export const LIFE_AGENT_OWNED_CHANGE_EVENT = "life-agent-owned-change";

/** 创建/删除名下 Agent 后通知全局 UI（如发现页 FAB）刷新绑定列表。 */
export function notifyLifeAgentOwnedChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LIFE_AGENT_OWNED_CHANGE_EVENT));
}
