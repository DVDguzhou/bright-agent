/** 接口与后端 lifeAgentDefaultCoverURL 仍使用此路径；前端展示请用 DEFAULT_COVER_INLINE_SRC 或 normalizeLifeAgentCoverImgSrc */
export const DEFAULT_COVER_URL = "/life-agent-cover-presets/default-cover.svg";

/** 不发起 HTTP 请求，避免静态资源未同步、反代、Capacitor 等环境下裂图 */
export const DEFAULT_COVER_INLINE_SRC =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e8eeff"/><stop offset="55%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#cffafe"/></linearGradient></defs><rect width="800" height="1000" fill="url(#g)"/><circle cx="400" cy="380" r="120" fill="#93c5fd" opacity="0.35"/><circle cx="520" cy="300" r="56" fill="#67e8f9" opacity="0.4"/><text x="400" y="560" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="36" font-weight="600" fill="#1e3a8a">人生 Agent</text><text x="400" y="620" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" fill="#475569">默认封面</text></svg>`,
  );

/** 将接口返回的默认路径（或空）换成内联图，保证任意部署形态下都能显示 */
export function normalizeLifeAgentCoverImgSrc(src: string | null | undefined): string {
  const s = (src ?? "").trim();
  if (!s) return DEFAULT_COVER_INLINE_SRC;
  if (s.startsWith("data:image/")) return s;
  if (s === DEFAULT_COVER_URL || s.endsWith("/default-cover.svg")) {
    return DEFAULT_COVER_INLINE_SRC;
  }
  try {
    const abs = s.startsWith("http://") || s.startsWith("https://") ? new URL(s) : new URL(s, "https://placeholder.local");
    if (abs.pathname.endsWith("/default-cover.svg")) return DEFAULT_COVER_INLINE_SRC;
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
  return DEFAULT_COVER_INLINE_SRC;
}

export function lifeAgentCoverShouldBypassOptimizer(src: string): boolean {
  const s = src.trim();
  return (
    s.startsWith("/uploads/") ||
    s.startsWith("/api/upload/life-agent-cover/") ||
    s.startsWith("/life-agent-cover-presets/")
  );
}
