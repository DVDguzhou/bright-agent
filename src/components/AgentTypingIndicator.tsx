"use client";

export function AgentTypingIndicator({ label = "正在输入…" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600" aria-live="polite" aria-label={label}>
      <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden>
        <span className="absolute h-4 w-4 animate-spin rounded-[4px] border-2 border-slate-300 border-t-slate-800" />
        <span className="h-1.5 w-1.5 rounded-[2px] bg-slate-800" />
      </span>
      <span>{label}</span>
    </div>
  );
}
