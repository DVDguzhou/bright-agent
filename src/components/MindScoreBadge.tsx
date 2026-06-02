"use client";

import { MindScoreInfoButton } from "@/components/MindScoreInfoButton";

const SIZE_CLASS = {
  xs: "gap-0.5 rounded-md px-2 py-1 text-[10px]",
  sm: "gap-1 rounded-lg px-2.5 py-1 text-xs",
  md: "gap-1 rounded-lg px-3 py-1.5 text-sm",
  lg: "gap-1.5 rounded-xl px-3 py-2 text-2xl font-black leading-none",
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
      className={`inline-flex items-center bg-paper-200 font-medium tabular-nums text-ink-800 ring-1 ring-hairline/70 ${SIZE_CLASS[size]} ${className}`}
    >
      <span>{label}</span>
      <MindScoreInfoButton className="text-ink-600/80 hover:text-ink-800" />
    </span>
  );
}
