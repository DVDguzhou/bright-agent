/**
 * 将相对路径（如 /api/upload/...）解析为可访问的完整 URL。
 * 配置了 NEXT_PUBLIC_CDN_URL 时，站内静态资源与上传路径走 CDN 域名。
 */
export function resolveCdnUrl(url: string | null | undefined): string {
  const s = (url ?? "").trim();
  if (!s) return "";
  if (s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }

  const cdn = (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/+$/, "");
  if (s.startsWith("/")) {
    return cdn ? `${cdn}${s}` : s;
  }
  return cdn ? `${cdn}/${s}` : `/${s}`;
}

/** public/ 静态资源（图标、manifest 等）的 CDN 地址 */
export function cdnAsset(path: string): string {
  return resolveCdnUrl(path);
}
