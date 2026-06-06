const PROFILE_KEY = "lifeAgentMapShareProfileId";
const ENABLED_KEY = "lifeAgentMapShareEnabled";
const USER_LOC_KEY = "lifeAgentMapUserLocation";

export type StoredMapUserLocation = { lat: number; lng: number };

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

export function readMapUserLocation(): StoredMapUserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_LOC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: number; lng?: number };
    if (
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lng)
    ) {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeMapUserLocation(lat: number, lng: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_LOC_KEY, JSON.stringify({ lat, lng }));
  } catch {
    /* ignore */
  }
}

export function clearMapUserLocation(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_LOC_KEY);
  } catch {
    /* ignore */
  }
}

export function clearMapGpsPreferences(): void {
  writeMapShareProfileId(null);
  writeMapShareEnabled(false);
  clearMapUserLocation();
}
