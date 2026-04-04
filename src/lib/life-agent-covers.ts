/** 与 public/life-agent-cover-presets/*.png 及 Go allowedLifeAgentCoverPresets 保持一致 */

export const LIFE_AGENT_COVER_PRESETS = [
  { key: "01-student-panda", label: "学业成长", file: "/life-agent-cover-presets/01-student-panda.png" },
  { key: "02-robot-pro", label: "职场求职", file: "/life-agent-cover-presets/02-robot-pro.png" },
  { key: "03-scholar-owl", label: "考试升学", file: "/life-agent-cover-presets/03-scholar-owl.png" },
  { key: "04-social-fox", label: "语言社交", file: "/life-agent-cover-presets/04-social-fox.png" },
  { key: "05-achiever-dino", label: "创业进阶", file: "/life-agent-cover-presets/05-achiever-dino.png" },
  { key: "06-wellness-cloud", label: "情绪陪伴", file: "/life-agent-cover-presets/06-wellness-cloud.png" },
  { key: "07-city-bear", label: "本地生活", file: "/life-agent-cover-presets/07-city-bear.png" },
  { key: "08-service-dog", label: "通用助手", file: "/life-agent-cover-presets/08-service-dog.png" },
] as const;

export type LifeAgentCoverPresetKey = (typeof LIFE_AGENT_COVER_PRESETS)[number]["key"];

export const DEFAULT_COVER_PRESET_KEY: LifeAgentCoverPresetKey = "01-student-panda";

export function isAllowedPresetKey(k: string): k is LifeAgentCoverPresetKey {
  return LIFE_AGENT_COVER_PRESETS.some((p) => p.key === k);
}

export function resolveLifeAgentCoverUrl(coverImageUrl?: string | null, coverPresetKey?: string | null): string | null {
  const img = (coverImageUrl ?? "").trim();
  if (img) return img;
  const key = (coverPresetKey ?? "").trim();
  if (key && isAllowedPresetKey(key)) return `/life-agent-cover-presets/${key}.png`;
  return null;
}
