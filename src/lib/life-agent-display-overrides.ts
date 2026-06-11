export const NIGHTOWL_CAT_COVER_URL = "/life-agent-cover-presets/nightowl-cat.jpg";

export function overrideLifeAgentCoverUrlByDisplayName(displayName?: string | null): string | null {
  if ((displayName ?? "").trim() === "凌晨四点半") return NIGHTOWL_CAT_COVER_URL;
  return null;
}
