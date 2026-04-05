const PROFILE_KEY = "lifeAgentMapShareProfileId";
const ENABLED_KEY = "lifeAgentMapShareEnabled";

export function readMapShareProfileId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(PROFILE_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function writeMapShareProfileId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(PROFILE_KEY, id);
    else localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

export function readMapShareEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeMapShareEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) localStorage.setItem(ENABLED_KEY, "1");
    else localStorage.removeItem(ENABLED_KEY);
  } catch {
    /* ignore */
  }
}

export function clearMapGpsPreferences(): void {
  writeMapShareProfileId(null);
  writeMapShareEnabled(false);
}
