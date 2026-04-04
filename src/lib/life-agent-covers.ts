/** 统一默认封面（无分类预设） */

export const DEFAULT_COVER_URL = "/life-agent-cover-presets/default-cover.png";

/**
 * 解析封面地址：优先自定义上传 → 否则返回统一默认封面。
 * 兼容历史数据中仍存在的 coverPresetKey，全部 fallback 到 DEFAULT_COVER_URL。
 */
export function resolveLifeAgentCoverUrl(coverImageUrl?: string | null, _coverPresetKey?: string | null): string {
  const img = (coverImageUrl ?? "").trim();
  if (img) return img;
  return DEFAULT_COVER_URL;
}

export function lifeAgentCoverShouldBypassOptimizer(src: string): boolean {
  const s = src.trim();
  return s.startsWith("/uploads/") || s.startsWith("/life-agent-cover-presets/");
}
