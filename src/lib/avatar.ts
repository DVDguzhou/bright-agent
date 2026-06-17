import { resolveCdnUrl } from "@/lib/cdn";
import {
  DEFAULT_COVER_FINAL_FALLBACK_SRC,
  DEFAULT_COVER_URL,
  nextLifeAgentCoverFallbackSrc,
  normalizeLifeAgentCoverImgSrc,
} from "@/lib/life-agent-covers";

/** 用户/作者展示头像：与人生 Agent 封面 URL 规则对齐（默认 PNG → SVG，避免裂图） */
export function getDisplayAvatar(params: {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  if (params.avatarUrl && params.avatarUrl.trim()) {
    return normalizeLifeAgentCoverImgSrc(params.avatarUrl);
  }
  return resolveCdnUrl(DEFAULT_COVER_URL);
}

export function nextDisplayAvatarFallbackSrc(current: string): string {
  return nextLifeAgentCoverFallbackSrc(current);
}

export { DEFAULT_COVER_FINAL_FALLBACK_SRC };
