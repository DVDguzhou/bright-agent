const STORAGE_KEY = "la:favorite-agent-ids";

/** Logged-in: favorites come from DB (see `/api/life-agents/favorites`). Guest: localStorage only. */
let serverMode = false;
let serverIds: string[] = [];

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Call when session ends so UI reads localStorage again. */
export function clearServerFavoriteCache(): void {
  serverMode = false;
  serverIds = [];
}

/** Avoid briefly showing another session’s localStorage stars after login. */
export function beginServerFavoriteSession(): void {
  serverMode = true;
  serverIds = [];
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("la-favorite-change"));
  }
}

function persistLocal(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 200)));
  window.dispatchEvent(new Event("la-favorite-change"));
}

async function importLocalFavoritesToServer(localIds: string[]): Promise<void> {
  if (localIds.length === 0) return;
  await fetch("/api/life-agents/favorites", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileIds: localIds }),
  });
}

/** Load favorites from API and merge local-only ids into the account once. */
export async function hydrateServerFavorites(): Promise<void> {
  if (typeof window === "undefined") return;
  const res = await fetch("/api/life-agents/favorites", { credentials: "include" });
  if (res.status === 401) {
    clearServerFavoriteCache();
    window.dispatchEvent(new Event("la-favorite-change"));
    return;
  }
  if (!res.ok) return;

  const data = (await res.json()) as { ids?: unknown };
  let ids = Array.isArray(data.ids) ? data.ids.filter((x): x is string => typeof x === "string") : [];
  serverMode = true;
  serverIds = ids;

  const local = parseIds(localStorage.getItem(STORAGE_KEY));
  const toMerge = local.filter((id) => !serverIds.includes(id));
  if (toMerge.length > 0) {
    await importLocalFavoritesToServer(toMerge);
    const res2 = await fetch("/api/life-agents/favorites", { credentials: "include" });
    if (res2.ok) {
      const d2 = (await res2.json()) as { ids?: unknown };
      ids = Array.isArray(d2.ids) ? d2.ids.filter((x): x is string => typeof x === "string") : serverIds;
      serverIds = ids;
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serverIds.slice(0, 200)));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("la-favorite-change"));
}

export function getFavoriteAgentIds(): string[] {
  if (typeof window === "undefined") return [];
  if (serverMode) return serverIds.slice();
  return parseIds(localStorage.getItem(STORAGE_KEY));
}

function toggleFavoriteAgentIdLocal(id: string): boolean {
  const cur = parseIds(localStorage.getItem(STORAGE_KEY));
  const set = new Set(cur);
  let favorited: boolean;
  if (set.has(id)) {
    set.delete(id);
    favorited = false;
  } else {
    set.add(id);
    favorited = true;
  }
  persistLocal(Array.from(set));
  return favorited;
}

export async function toggleFavoriteAgentId(id: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (serverMode) {
    const res = await fetch("/api/life-agents/favorites", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id }),
    });
    if (res.status === 401) {
      clearServerFavoriteCache();
      return toggleFavoriteAgentIdLocal(id);
    }
    if (!res.ok) {
      return isFavoriteAgentId(id);
    }
    const data = (await res.json()) as { favorited?: boolean };
    const favorited = data.favorited === true;
    if (favorited) {
      serverIds = Array.from(new Set([id, ...serverIds]));
    } else {
      serverIds = serverIds.filter((x) => x !== id);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serverIds.slice(0, 200)));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("la-favorite-change"));
    return favorited;
  }

  return toggleFavoriteAgentIdLocal(id);
}

export function isFavoriteAgentId(id: string): boolean {
  return getFavoriteAgentIds().includes(id);
}

/** Sync serverIds from externally-fetched favorite IDs so the display filter works immediately. */
export function syncFavoriteIdsFromFetch(ids: string[]): void {
  if (typeof window === "undefined") return;
  serverMode = true;
  serverIds = ids;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 200)));
  } catch { /* ignore */ }
  window.dispatchEvent(new Event("la-favorite-change"));
}
