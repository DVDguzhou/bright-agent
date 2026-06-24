export const NIGHTOWL_CAT_COVER_URL = "/life-agent-cover-presets/nightowl-cat.png";

export function overrideLifeAgentCoverUrlByDisplayName(_displayName?: string | null): string | null {
  // 封面以 DB cover_image_url 为准；预设图见 NIGHTOWL_CAT_COVER_URL / public 静态资源。
  return null;
}
