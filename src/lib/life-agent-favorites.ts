const STORAGE_KEY = "la:favorite-agent-ids";

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function getFavoriteAgentIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseIds(localStorage.getItem(STORAGE_KEY));
}

function persist(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 200)));
  window.dispatchEvent(new Event("la-favorite-change"));
}

export function toggleFavoriteAgentId(id: string): boolean {
  const cur = getFavoriteAgentIds();
  const set = new Set(cur);
  if (set.has(id)) {
    set.delete(id);
    persist(Array.from(set));
    return false;
  }
  set.add(id);
  persist(Array.from(set));
  return true;
}

export function isFavoriteAgentId(id: string): boolean {
  return getFavoriteAgentIds().includes(id);
}
