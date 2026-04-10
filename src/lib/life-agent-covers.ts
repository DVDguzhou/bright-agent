/** 与 backend lifeAgentDefaultCoverURL 一致：接口仍可能返回 PNG 路径；前端优先用自包含 SVG，避免 CDN/代理对 PNG 的 Range 响应异常（如 206 + Content-Length 错位） */
export const DEFAULT_COVER_PNG_URL = "/life-agent-cover-presets/default-cover.png";

/** 自包含矢量默认图（不内嵌引用 default-cover.png，避免二次请求坏链） */
export const DEFAULT_COVER_SVG_URL = "/life-agent-cover-presets/default-cover.svg";

/** 前端统一主默认：SVG */
export const DEFAULT_COVER_URL = DEFAULT_COVER_SVG_URL;

function isDefaultCoverPathname(p: string): boolean {
  return p.endsWith("/default-cover.png") || p.endsWith("/default-cover.svg");
}

export function isLifeAgentDefaultCoverUrl(src: string): boolean {
  const s = src.trim();
  if (s === DEFAULT_COVER_PNG_URL || s === DEFAULT_COVER_SVG_URL) return true;
  try {
    const abs = s.startsWith("http://") || s.startsWith("https://") ? new URL(s) : new URL(s, "https://placeholder.local");
    return isDefaultCoverPathname(abs.pathname);
  } catch {
    return false;
  }
}

/** PNG、SVG 均加载失败时的最后占位（极小 data URL） */
export const DEFAULT_COVER_FINAL_FALLBACK_SRC =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="10" viewBox="0 0 8 10"><rect width="8" height="10" fill="#e2e8f0"/></svg>`,
  );

/** 加载失败时的下一级回退：自定义坏链 → 自包含 SVG → 内联占位；（直连 PNG 失败时再试 SVG） */
export function nextLifeAgentCoverFallbackSrc(current: string): string {
  const s = current.trim();
  if (s === DEFAULT_COVER_FINAL_FALLBACK_SRC) return s;
  if (s === DEFAULT_COVER_PNG_URL) return DEFAULT_COVER_SVG_URL;
  if (s === DEFAULT_COVER_SVG_URL) return DEFAULT_COVER_FINAL_FALLBACK_SRC;
  return DEFAULT_COVER_SVG_URL;
}

/**
 * 将接口返回的默认路径（或空）规范为主默认 SVG；
 * 历史 PNG 默认路径也改指向自包含 SVG，绕开部分环境下对 PNG 的 Range/Content-Length 问题。
 */
export function normalizeLifeAgentCoverImgSrc(src: string | null | undefined): string {
  const s = (src ?? "").trim();
  if (!s) return DEFAULT_COVER_SVG_URL;
  if (s.startsWith("data:image/")) return s;
  if (s === DEFAULT_COVER_PNG_URL || s.endsWith("/default-cover.png")) return DEFAULT_COVER_SVG_URL;
  if (s === DEFAULT_COVER_SVG_URL || s.endsWith("/default-cover.svg")) {
    return DEFAULT_COVER_SVG_URL;
  }
  try {
    const abs = s.startsWith("http://") || s.startsWith("https://") ? new URL(s) : new URL(s, "https://placeholder.local");
    const p = abs.pathname;
    if (p.endsWith("/default-cover.png")) return DEFAULT_COVER_SVG_URL;
    if (p.endsWith("/default-cover.svg")) return DEFAULT_COVER_SVG_URL;
  } catch {
    /* ignore */
  }
  return s;
}

/**
 * 已随前端部署的预设 PNG（public/life-agent-cover-presets/{key}.png 真实存在）。
 * 须与 backend internal/handler/life_agents.go 的 lifeAgentShippedCoverPresetPNGs 同步追加。
 */
export const SHIPPED_LIFE_AGENT_PRESET_PNG_KEYS = new Set<string>([
  // 例如: "03-scholar-owl",
]);

/**
 * 解析封面地址：自定义上传 →（仅对已部署 PNG 的 preset）预设图 → 主默认 SVG。
 */
export function resolveLifeAgentCoverUrl(coverImageUrl?: string | null, coverPresetKey?: string | null): string {
  const img = (coverImageUrl ?? "").trim();
  if (img) return normalizeLifeAgentCoverImgSrc(img);
  const preset = (coverPresetKey ?? "").trim();
  if (preset && SHIPPED_LIFE_AGENT_PRESET_PNG_KEYS.has(preset)) {
    return `/life-agent-cover-presets/${preset}.png`;
  }
  return DEFAULT_COVER_SVG_URL;
}

/**
 * 列表页与详情页统一使用的最终封面地址。
 * 优先信任持久化字段 `coverImageUrl` / `coverPresetKey`，仅在缺失时再回退到接口直出 `coverUrl`。
 */
export function resolveLifeAgentCoverDisplayUrl(
  coverUrl?: string | null,
  coverImageUrl?: string | null,
  coverPresetKey?: string | null,
): string {
  const persisted = resolveLifeAgentCoverUrl(coverImageUrl, coverPresetKey);
  if (!isLifeAgentDefaultCoverUrl(persisted)) return persisted;
  const direct = normalizeLifeAgentCoverImgSrc(coverUrl);
  if (!isLifeAgentDefaultCoverUrl(direct)) return direct;
  return persisted;
}

export function lifeAgentCoverShouldBypassOptimizer(src: string): boolean {
  const s = src.trim();
  return (
    s.startsWith("/uploads/") ||
    s.startsWith("/api/upload/life-agent-cover/") ||
    s.startsWith("/life-agent-cover-presets/")
  );
}
