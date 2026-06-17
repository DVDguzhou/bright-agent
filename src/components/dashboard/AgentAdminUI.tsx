"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

export function AdminPage({
  children,
  narrow = false,
  wide = false,
}: {
  children: ReactNode;
  narrow?: boolean;
  wide?: boolean;
}) {
  const widthClass = narrow ? "max-w-3xl" : wide ? "max-w-7xl" : "max-w-5xl";
  const padClass = wide ? "px-0 sm:px-2 lg:px-0" : "px-4 sm:px-6 lg:px-0";
  return (
    <main
      className={`mx-auto w-full ${widthClass} ${padClass} pb-24 pt-3 lg:pb-10`}
    >
      {children}
    </main>
  );
}

export function BackLink({ href, children = "返回工作台" }: { href: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-ink-400 transition hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-5 border-b border-hairline/70 pb-5">
      {backHref ? <BackLink href={backHref}>{backLabel}</BackLink> : null}
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1 text-xs font-medium text-signal-700">{eyebrow}</p>
          ) : null}
          <h1 className="font-serif text-[30px] font-medium leading-tight tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{description}</p>
          ) : null}
          {meta ? <div className="mt-3">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-hairline/70 bg-paper-50 shadow-glow-sm ${className}`}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-hairline/60 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-ink-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatStrip({
  items,
  columns = 3,
}: {
  items: Array<{ label: string; value: ReactNode; sub?: string; tone?: "default" | "signal" | "olive" | "danger" }>;
  columns?: 2 | 3 | 4;
}) {
  const grid =
    columns === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "grid-cols-2"
        : "grid-cols-3";
  return (
    <div className={`grid ${grid} overflow-hidden rounded-lg border border-hairline/70 bg-paper-50 shadow-glow-sm`}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="border-r border-t border-hairline/50 px-3 py-4 text-center first:border-l-0 first:border-t-0 sm:px-4">
          <p
            className={`text-2xl font-semibold leading-none tabular-nums ${
              item.tone === "signal"
                ? "text-signal-700"
                : item.tone === "olive"
                  ? "text-olive-600"
                  : item.tone === "danger"
                    ? "text-oxblood-600"
                    : "text-ink"
            }`}
          >
            {item.value}
          </p>
          <p className="mt-2 text-[11px] font-medium text-ink-600">{item.label}</p>
          {item.sub ? <p className="mt-0.5 text-[11px] text-ink-400">{item.sub}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "signal" | "olive" | "danger";
}) {
  const cls =
    tone === "signal"
      ? "bg-signal-100 text-signal-800"
      : tone === "olive"
        ? "bg-olive-400/20 text-olive-700"
        : tone === "danger"
          ? "bg-oxblood-100 text-oxblood-700"
          : "bg-paper-200 text-ink-500";
  return <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label = "搜索",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-shell pl-9 text-sm"
        aria-label={label}
      />
    </label>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-hairline/70 bg-paper-50 p-1 shadow-glow-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-h-9 rounded px-3 text-sm font-medium transition ${
            value === option.value ? "bg-ink text-paper-50" : "text-ink-500 hover:bg-paper-200 hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-hairline/80 bg-paper-50 px-5 py-12 text-center">
      <Sparkles className="mx-auto h-5 w-5 text-signal-600" aria-hidden />
      <p className="mt-3 text-base font-semibold text-ink">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingBlock({ label = "正在加载" }: { label?: string }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-hairline/70 bg-paper-50">
      <div className="flex items-center gap-2 text-sm text-ink-400">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {label}
      </div>
    </div>
  );
}

export function RowLink({
  href,
  title,
  description,
  meta,
}: {
  href: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-3 px-4 py-3.5 transition hover:bg-paper-100 sm:px-5"
    >
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        {description ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-500">{description}</p> : null}
        {meta ? <div className="mt-2 text-xs text-ink-400">{meta}</div> : null}
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-signal-700" />
    </Link>
  );
}

export function formatShortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}
