"use client";

import { MindScoreInfoButton } from "@/components/MindScoreInfoButton";

const SIZE_CLASS = {
  xs: "gap-0.5 rounded-md px-2 py-1 text-[10px]",
  sm: "gap-1 rounded-md px-2.5 py-1 text-xs",
  md: "gap-1 rounded-md px-3 py-1.5 text-sm",
  lg: "gap-1.5 rounded-lg px-3 py-2 text-2xl font-black leading-none",
} as const;

type MindScoreBadgeProps = {
  value: number;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  /** 默认「心智」；传空字符串则只显示数字 */
  prefix?: string;
};

export function MindScoreBadge({
  value,
  size = "sm",
  className = "",
  prefix = "心智",
}: MindScoreBadgeProps) {
  const label = prefix ? `${prefix} ${value.toLocaleString("zh-CN")}` : value.toLocaleString("zh-CN");

  return (
    <span
      className={`inline-flex items-center border border-ink/10 bg-white/80 font-semibold tabular-nums text-ink shadow-[0_8px_18px_rgba(17,21,19,0.08)] supports-[backdrop-filter]:backdrop-blur-md ${SIZE_CLASS[size]} ${className}`}
    >
      <span>{label}</span>
      <MindScoreInfoButton className="text-ink-600/80 hover:text-ink-800" />
    </span>
  );
}
