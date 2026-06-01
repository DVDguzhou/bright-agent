"use client";

import { MindScoreInfoButton } from "@/components/MindScoreInfoButton";

type MindScoreBadgeProps = {
  value: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  prefix?: string;
};

export function MindScoreBadge({
  value,
  size = "sm",
  className = "",
}: MindScoreBadgeProps) {
  if (size === "lg") {
    return (
      <span className={`inline-flex items-baseline gap-1 ${className}`}>
        <span className="font-serif text-4xl font-medium tabular-nums text-ink leading-none">
          {value.toLocaleString("zh-CN")}
        </span>
        <span className="font-serif text-sm italic text-ink-400 leading-none">分</span>
        <MindScoreInfoButton className="text-ink-400 hover:text-ink self-center" />
      </span>
    );
  }

  if (size === "md") {
    return (
      <span className={`inline-flex items-baseline gap-0.5 ${className}`}>
        <span className="font-serif text-xl font-medium tabular-nums text-ink">{value.toLocaleString("zh-CN")}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-ink-400">分</span>
        <MindScoreInfoButton className="text-ink-400 hover:text-ink self-center" />
      </span>
    );
  }

  if (size === "sm") {
    return (
      <span className={`inline-flex items-baseline gap-0.5 ${className}`}>
        <span className="font-serif text-sm font-medium tabular-nums text-ink">{value.toLocaleString("zh-CN")}</span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-ink-400">分</span>
        <MindScoreInfoButton className="text-ink-400 hover:text-ink self-center" />
      </span>
    );
  }

  // xs — on image overlay: compact typographic, paper bg for readability
  return (
    <span className={`inline-flex items-baseline gap-px bg-paper/88 px-1.5 py-0.5 ${className}`}>
      <span className="font-serif text-[12px] font-medium tabular-nums text-ink leading-none">
        {value.toLocaleString("zh-CN")}
      </span>
      <span className="text-[8px] font-medium uppercase tracking-wider text-ink-400 leading-none">分</span>
    </span>
  );
}
