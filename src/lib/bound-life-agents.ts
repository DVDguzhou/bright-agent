export type BoundLifeAgent = {
  id: string;
  displayName: string;
  headline?: string;
};

type PurchasedRow = {
  id?: string;
  displayName?: string;
  headline?: string;
};

type ChatSessionRow = {
  profile?: {
    id?: string;
    displayName?: string;
    headline?: string;
  };
};

/**
 * 合并「买过额度」与「有过对话」的人生 Agent，按 profile id 去重。
 */
export async function fetchBoundLifeAgents(signal?: AbortSignal): Promise<BoundLifeAgent[]> {
  const [pRes, cRes] = await Promise.all([
    fetch("/api/life-agents/purchased", { credentials: "include", signal }),
    fetch("/api/life-agents/chat-sessions", { credentials: "include", signal }),
  ]);

  const byId = new Map<string, BoundLifeAgent>();

  if (pRes.ok) {
    const purchased = (await pRes.json()) as unknown;
    if (Array.isArray(purchased)) {
      for (const row of purchased as PurchasedRow[]) {
        const id = String(row.id ?? "").trim();
        if (!id) continue;
        byId.set(id, {
          id,
          displayName: String(row.displayName ?? "Agent"),
          headline: row.headline,
        });
      }
    }
  }

  if (cRes.ok) {
    const sessions = (await cRes.json()) as unknown;
    if (Array.isArray(sessions)) {
      for (const s of sessions as ChatSessionRow[]) {
        const p = s.profile;
        if (!p?.id) continue;
        const id = String(p.id).trim();
        if (!id || byId.has(id)) continue;
        byId.set(id, {
          id,
          displayName: String(p.displayName ?? "Agent"),
          headline: p.headline,
        });
      }
    }
  }

  return [...byId.values()];
}
