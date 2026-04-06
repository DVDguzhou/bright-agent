/** 统一默认封面（无上传、无预设时；与后端 lifeAgentDefaultCoverURL 一致） */

export const DEFAULT_COVER_URL = "/life-agent-cover-presets/default-cover.svg";

/**
 * 已随前端部署的预设 PNG（public/life-agent-cover-presets/{key}.png 真实存在）。
 * 须与 backend internal/handler/life_agents.go 的 lifeAgentShippedCoverPresetPNGs 同步追加。
 */
export const SHIPPED_LIFE_AGENT_PRESET_PNG_KEYS = new Set<string>([
  // 例如: "03-scholar-owl",
]);

/**
 * 解析封面地址：自定义上传 →（仅对已部署 PNG 的 preset）预设图 → 统一默认图。
 * coverUrl 来自接口时通常已含默认值；此处保证仅拿到 image/preset 字段时与后端一致。
 */
export function resolveLifeAgentCoverUrl(coverImageUrl?: string | null, coverPresetKey?: string | null): string {
  const img = (coverImageUrl ?? "").trim();
  if (img) return img;
  const preset = (coverPresetKey ?? "").trim();
  if (preset && SHIPPED_LIFE_AGENT_PRESET_PNG_KEYS.has(preset)) {
    return `/life-agent-cover-presets/${preset}.png`;
  }
  return DEFAULT_COVER_URL;
}

export function lifeAgentCoverShouldBypassOptimizer(src: string): boolean {
  const s = src.trim();
  return (
    s.startsWith("/uploads/") ||
    s.startsWith("/api/upload/life-agent-cover/") ||
    s.startsWith("/life-agent-cover-presets/")
  );
}
