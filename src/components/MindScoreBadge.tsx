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

  // xs — mint green pill chip (dark mode accent)
  return (
    <span
      className={`inline-flex items-baseline gap-0.5 px-2 py-0.5 ${className}`}
      style={{ background: "var(--accent)", borderRadius: "var(--radius-badge)", color: "#0a2018" }}
    >
      <span className="text-[12px] font-bold tabular-nums leading-none">
        {value.toLocaleString("zh-CN")}
      </span>
      <span className="text-[9px] font-medium leading-none opacity-70">分</span>
    </span>
  );
}
