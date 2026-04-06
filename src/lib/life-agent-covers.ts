/** 统一默认封面（无上传、无预设时；与后端 lifeAgentDefaultCoverURL 一致） */

export const DEFAULT_COVER_URL = "/life-agent-cover-presets/default-cover.svg";

/**
 * 解析封面地址：自定义上传 → 预设键 → 统一默认图。
 * coverUrl 来自接口时通常已含默认值，此处保证仅拿到 image/preset 字段时行为一致。
 */
export function resolveLifeAgentCoverUrl(coverImageUrl?: string | null, coverPresetKey?: string | null): string {
  const img = (coverImageUrl ?? "").trim();
  if (img) return img;
  const preset = (coverPresetKey ?? "").trim();
  if (preset) return `/life-agent-cover-presets/${preset}.png`;
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
