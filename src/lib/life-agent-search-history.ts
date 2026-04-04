const STORAGE_KEY = "la:search-history";
const MAX = 20;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function write(items: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX)));
}

export function getSearchHistory(): string[] {
  return read();
}

export function addSearchHistory(term: string) {
  const t = term.trim();
  if (!t) return;
  const next = [t, ...read().filter((x) => x !== t)];
  write(next);
}

export function clearSearchHistory() {
  write([]);
}
