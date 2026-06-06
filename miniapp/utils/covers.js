const config = require("../config");

const DEFAULT_COVER_SVG = "/life-agent-cover-presets/default-cover.svg?v=2";
const DEFAULT_COVER_PNG = "/life-agent-cover-presets/default-cover.png";

function isDefaultCoverPath(path) {
  return path.endsWith("/default-cover.png") || path.endsWith("/default-cover.svg");
}

function isDefaultCoverUrl(src) {
  const s = (src || "").trim();
  if (!s) return true;
  if (s === DEFAULT_COVER_SVG || s === DEFAULT_COVER_PNG) return true;
  return isDefaultCoverPath(s);
}

function absUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("data:image/")) return path;
  const isUpload =
    path.startsWith("/api/upload/life-agent-cover/") ||
    path.startsWith("/uploads/life-agent-covers/") ||
    path.startsWith("/life-agent-cover-presets/");
  const base = isUpload && config.CDN_BASE ? config.CDN_BASE : config.API_BASE;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeCoverSrc(src) {
  const s = (src || "").trim();
  if (!s) return absUrl(DEFAULT_COVER_SVG);
  if (s.startsWith("data:image/")) return s;
  if (isDefaultCoverUrl(s)) return absUrl(DEFAULT_COVER_SVG);
  return absUrl(s);
}

function resolveCoverUrl(coverImageUrl, coverPresetKey) {
  const img = (coverImageUrl || "").trim();
  if (img) return normalizeCoverSrc(img);
  return normalizeCoverSrc(DEFAULT_COVER_SVG);
}

function resolveLifeAgentCoverDisplayUrl(coverUrl, coverImageUrl, coverPresetKey) {
  const persisted = resolveCoverUrl(coverImageUrl, coverPresetKey);
  if (!isDefaultCoverUrl(persisted)) return persisted;
  const direct = normalizeCoverSrc(coverUrl);
  if (!isDefaultCoverUrl(direct)) return direct;
  return persisted;
}

function nextCoverFallback(current) {
  const s = (current || "").trim();
  if (s.includes("default-cover.svg")) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="10" viewBox="0 0 8 10"><rect width="8" height="10" fill="#ebe3d4"/></svg>'
    );
  }
  return absUrl(DEFAULT_COVER_SVG);
}

module.exports = {
  resolveLifeAgentCoverDisplayUrl,
  nextCoverFallback,
  isDefaultCoverUrl,
};
