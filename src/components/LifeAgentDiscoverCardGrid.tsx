"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { resolveLifeAgentCoverDisplayUrl } from "@/lib/life-agent-covers";
import type { LifeAgentListItem } from "@/lib/life-agent-feed-search";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { lifeAgentShowsPurchaseUi } from "@/lib/life-agent-commerce";
import { useWindowedSlice } from "@/lib/use-windowed-slice";
import { MindScoreBadge } from "@/components/MindScoreBadge";
import { cn } from "@/lib/utils";

const anonymous = "佚";

function useGridColumnCount() {
  const [n, setN] = useState(2);
  useEffect(() => {
    const read = () => {
      if (typeof window === "undefined") return 2;
      if (window.matchMedia("(min-width: 1280px)").matches) return 5;
      if (window.matchMedia("(min-width: 1024px)").matches) return 4;
      if (window.matchMedia("(min-width: 640px)").matches) return 3;
      return 2;
    };
    const update = () => setN(read());
    update();
    const mqs = [
      window.matchMedia("(min-width: 1280px)"),
      window.matchMedia("(min-width: 1024px)"),
      window.matchMedia("(min-width: 640px)"),
    ];
    const handler = () => update();
    mqs.forEach((m) => {
      if (m.addEventListener) m.addEventListener("change", handler);
      else m.addListener(handler);
    });
    return () =>
      mqs.forEach((m) => {
        if (m.removeEventListener) m.removeEventListener("change", handler);
        else m.removeListener(handler);
      });
  }, []);
  return n;
}

function chunkIntoRows<T>(items: T[], cols: number): T[][] {
  if (cols < 1) return [];
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}

/** 单张卡片 — 图片全宽，文字悬浮在底部渐变上 */
function LifeAgentDiscoverCard({
  profile,
  globalIndex,
  profileHref,
  large = false,
}: {
  profile: LifeAgentListItem;
  globalIndex: number;
  profileHref: (id: string) => string;
  large?: boolean;
  skipMountAnimation?: boolean;
}) {
  const coverUrl = resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey);
  const headlineShown = cleanLifeAgentIntroText(profile.headline, profile.displayName);
  const areaLabel = [profile.city, profile.province].filter(Boolean).join(" · ");
  const verified = profile.verificationStatus === "verified";
  const showPrice = lifeAgentShowsPurchaseUi();
  const ratingScore =
    profile.ratings && profile.ratings.raters > 0 ? profile.ratings.averageScore.toFixed(1) : null;
  const firstQ = (profile.sampleQuestions ?? []).find((q) => q.trim());

  return (
    <article className={cn("min-h-0 group/card", large && "col-span-2 sm:col-span-2")}>
      <Link
        href={profileHref(profile.id)}
        className="block focus:outline-none focus-visible:ring-1 focus-visible:ring-ink"
      >
        {/* Cover image — full bleed, tall portrait */}
        <div
          className={cn(
            "relative w-full overflow-hidden bg-paper-300",
            large ? "aspect-[3/4] sm:aspect-[16/9]" : "aspect-[3/4]",
          )}
        >
          <LifeAgentCoverImage
            src={coverUrl}
            alt={profile.displayName}
            fill
            className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover/card:scale-[1.06]"
            sizes={
              large
                ? "(max-width: 640px) 98vw, 80vw"
                : "(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 22vw"
            }
            priority={globalIndex < 4}
            loading={globalIndex < 4 ? undefined : "lazy"}
          />

          {/* Bottom gradient → name overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-16 pb-3 px-3">
            <h3 className={cn(
              "font-serif font-medium leading-tight text-paper line-clamp-1 drop-shadow-sm",
              large ? "text-[22px] sm:text-[28px]" : "text-[16px] sm:text-[18px]",
            )}>
              {profile.displayName}
              {verified && (
                <span className="ml-1.5 align-middle text-[10px] tracking-widest text-olive-300" aria-label="已认证">
                  ✓
                </span>
              )}
            </h3>
            {large && headlineShown && (
              <p className="mt-1 font-serif text-[13px] italic leading-snug text-paper/70 line-clamp-2">
                {headlineShown}
              </p>
            )}
          </div>

          {/* MindScore — top-right */}
          {typeof profile.mindScore === "number" && (
            <div className="absolute right-2 top-2 z-10">
              <MindScoreBadge value={profile.mindScore} size="xs" />
            </div>
          )}

          {/* Unpublished badge */}
          {typeof profile.published === "boolean" && profile.published === false && (
            <div className="absolute left-0 top-0 bg-paper px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
              未发布
            </div>
          )}
        </div>

        {/* Below-image: headline + meta (for non-large cards) */}
        {!large && (
          <div className="pt-2">
            <p className="font-serif text-[12px] italic leading-snug text-ink-400 line-clamp-2 min-h-[2em]">
              {headlineShown}
            </p>
            <div className="mt-1.5 flex items-baseline justify-between text-[11px] text-ink-400">
              <span className="truncate">
                {areaLabel || profile.creator.name || anonymous}
                {ratingScore && <span className="text-ink-500"> · {ratingScore}★</span>}
              </span>
              {showPrice && profile.pricePerQuestion > 0 && (
                <span className="ml-1 shrink-0 font-serif text-[14px] font-medium tabular-nums text-oxblood-500">
                  ¥{(profile.pricePerQuestion / 100).toFixed(0)}
                  <span className="ml-0.5 text-[9px] font-normal not-italic text-ink-300">/问</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Large card: meta row below image */}
        {large && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-400">
            <span className="truncate">
              {areaLabel || profile.creator.name || anonymous}
              {ratingScore && <span className="text-ink-500"> · {ratingScore}★</span>}
            </span>
            <div className="ml-2 flex shrink-0 items-center gap-3">
              {firstQ && (
                <span className="hidden sm:inline text-ink-300 line-clamp-1 max-w-[200px]">
                  「{firstQ}」
                </span>
              )}
              {showPrice && profile.pricePerQuestion > 0 && (
                <span className="font-serif text-[14px] font-medium tabular-nums text-oxblood-500">
                  ¥{(profile.pricePerQuestion / 100).toFixed(0)}
                  <span className="ml-0.5 text-[9px] font-normal not-italic text-ink-300">/问</span>
                </span>
              )}
            </div>
          </div>
        )}
      </Link>
    </article>
  );
}

type Props = {
  profiles: LifeAgentListItem[];
  loading: boolean;
  emptyTitle: string;
  emptySubtitle: string;
  profileHref?: (id: string) => string;
  windowResetKey?: string | number;
  windowed?: boolean;
  virtualized?: boolean;
  onLoadMore?: () => void | Promise<void>;
  hasMoreFromServer?: boolean;
  loadingMore?: boolean;
};

export function LifeAgentDiscoverCardGrid({
  profiles,
  loading,
  emptyTitle,
  emptySubtitle,
  profileHref = (id) => `/life-agents/${id}`,
  windowResetKey,
  windowed = true,
  virtualized: virtualizedProp,
  onLoadMore,
  hasMoreFromServer = false,
  loadingMore = false,
}: Props) {
  const virtualized = virtualizedProp ?? windowed !== false;
  const colCount = useGridColumnCount();
  const rows = useMemo(() => chunkIntoRows(profiles, colCount), [profiles, colCount]);
  const rowKeys = useMemo(() => rows.map((r, i) => `${i}:${r.map((p) => p.id).join("|")}`), [rows]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 480,
    overscan: 4,
    gap: 32,
    enabled: virtualized && !loading && profiles.length > 0,
    getItemKey: (i) => rowKeys[i] ?? String(i),
  });

  useLayoutEffect(() => {
    rowVirtualizer.shouldAdjustScrollPositionOnItemSizeChange = () => false;
  }, [rowVirtualizer]);

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const tryLoadMore = useCallback(() => {
    const fn = onLoadMoreRef.current;
    if (!fn || !hasMoreFromServer || loadingMore) return;
    void Promise.resolve(fn());
  }, [hasMoreFromServer, loadingMore]);

  useEffect(() => {
    if (!hasMoreFromServer || !onLoadMore) return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => { debounce = null; tryLoadMore(); }, 200);
      },
      { root: null, rootMargin: "480px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => { if (debounce) clearTimeout(debounce); io.disconnect(); };
  }, [hasMoreFromServer, onLoadMore, tryLoadMore, rows.length, loadingMore]);

  const { slice, hasMore, sentinelRef } = useWindowedSlice(profiles, {
    enabled: !virtualized && windowed,
    resetKey: windowResetKey,
    initial: 12,
    page: 12,
  });
  const toRender = !virtualized && windowed ? slice : profiles;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-2">
        {/* Hero skeleton */}
        <div className="animate-pulse bg-paper-300 w-full" style={{ aspectRatio: "3/4" }} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="animate-pulse bg-paper-300 w-full" style={{ aspectRatio: "3/4" }} />
              <div className="h-3 w-3/4 animate-pulse bg-paper-200" />
              <div className="h-3 w-1/2 animate-pulse bg-paper-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (profiles.length === 0) {
    return (
      <div className="border-t border-b border-hairline px-6 py-16 text-center">
        <p className="font-serif text-xl font-medium text-ink">{emptyTitle}</p>
        <p className="mt-2 font-serif text-sm italic text-ink-400">{emptySubtitle}</p>
      </div>
    );
  }

  /* ── Non-virtualized: hero first card + 2-col grid ── */
  if (!virtualized) {
    const [hero, ...rest] = toRender;
    return (
      <div className="space-y-2">
        {/* Hero — full-width large card */}
        {hero && (
          <LifeAgentDiscoverCard
            profile={hero}
            globalIndex={0}
            profileHref={profileHref}
            large
          />
        )}

        {/* 2-col masonry-like grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rest.map((profile, index) => (
            <LifeAgentDiscoverCard
              key={profile.id}
              profile={profile}
              globalIndex={index + 1}
              profileHref={profileHref}
            />
          ))}
        </div>

        {windowed && hasMore && (
          <div ref={sentinelRef} className="flex min-h-[52px] items-center justify-center py-4" aria-hidden>
            <span className="font-serif text-xs italic text-ink-300">继续阅读</span>
          </div>
        )}
        {onLoadMore && (hasMoreFromServer || loadingMore) && (
          <div ref={loadMoreSentinelRef} className="flex min-h-[52px] items-center justify-center py-4" aria-hidden>
            <span className="font-serif text-xs italic text-ink-300">
              {loadingMore ? "正在加载…" : "继续阅读"}
            </span>
          </div>
        )}
      </div>
    );
  }

  /* ── Virtualized path ── */
  const totalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div>
      <div className="relative w-full" style={{ height: totalSize }}>
        {virtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
              >
                {row.map((profile, colIdx) => (
                  <LifeAgentDiscoverCard
                    key={profile.id}
                    profile={profile}
                    globalIndex={virtualRow.index * colCount + colIdx}
                    profileHref={profileHref}
                    skipMountAnimation
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {onLoadMore && (hasMoreFromServer || loadingMore) && (
        <div ref={loadMoreSentinelRef} className="flex min-h-[52px] items-center justify-center py-4" aria-hidden>
          <span className="font-serif text-xs italic text-ink-300">
            {loadingMore ? "正在加载…" : hasMoreFromServer ? "继续阅读" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
