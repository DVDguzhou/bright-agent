import { resolveCdnUrl } from "@/lib/cdn";
import { DEFAULT_COVER_PNG_URL } from "@/lib/life-agent-covers";

export function getDisplayAvatar(params: {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  if (params.avatarUrl && params.avatarUrl.trim()) return resolveCdnUrl(params.avatarUrl);
  return resolveCdnUrl(DEFAULT_COVER_PNG_URL);
}
