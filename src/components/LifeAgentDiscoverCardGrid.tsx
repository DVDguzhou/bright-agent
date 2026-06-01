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

/** 横向特写卡：首屏第一张；占满整行，左图右文字 */
function LifeAgentFeaturedCard({
  profile,
  profileHref,
}: {
  profile: LifeAgentListItem;
  profileHref: (id: string) => string;
}) {
  const coverUrl = resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey);
  const headlineShown = cleanLifeAgentIntroText(profile.headline, profile.displayName);
  const areaLabel = [profile.city, profile.province].filter(Boolean).join(" · ");
  const ratingScore =
    profile.ratings && profile.ratings.raters > 0 ? profile.ratings.averageScore.toFixed(1) : null;
  const verified = profile.verificationStatus === "verified";
  const showPrice = lifeAgentShowsPurchaseUi();
  const firstQ = (profile.sampleQuestions ?? []).find((q) => q.trim());

  return (
    <article className="min-h-0 border-b border-hairline pb-6 mb-2">
      <Link
        href={profileHref(profile.id)}
        className="group grid grid-cols-[45%_55%] sm:grid-cols-[42%_58%] focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink"
      >
        {/* Image */}
        <div className="relative overflow-hidden bg-paper-200" style={{ aspectRatio: "3 / 4" }}>
          <LifeAgentCoverImage
            src={coverUrl}
            alt={profile.displayName}
            fill
            className="object-cover object-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 45vw, 40vw"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-paper/30" />
        </div>

        {/* Content */}
        <div className="flex flex-col border border-l-0 border-hairline bg-paper p-4 sm:p-5">
          {verified && (
            <span className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-olive-500">
              已认证
            </span>
          )}
          <h3 className="font-serif text-[22px] font-medium leading-tight text-ink sm:text-[26px] [text-wrap:balance]">
            {profile.displayName}
          </h3>
          <p className="mt-2 font-serif text-[13px] italic leading-snug text-ink-400 line-clamp-4 sm:text-[14px]">
            {headlineShown}
          </p>

          {firstQ && (
            <p className="mt-auto border-t border-hairline pt-3 text-[11px] leading-relaxed text-ink-400 line-clamp-2">
              「{firstQ}」
            </p>
          )}

          <div className="mt-3 flex items-baseline justify-between text-[11px] text-ink-400">
            <span className="truncate">
              {areaLabel || profile.creator.name || anonymous}
              {ratingScore ? <span className="text-ink-500"> · {ratingScore}★</span> : null}
            </span>
            {showPrice && profile.pricePerQuestion > 0 ? (
              <span className="ml-2 shrink-0 font-serif text-[15px] font-medium tabular-nums text-oxblood-500">
                ¥{(profile.pricePerQuestion / 100).toFixed(0)}
                <span className="ml-0.5 text-[10px] font-normal not-italic text-ink-300">/问</span>
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

/** 常规卡：2:3 竖版，图像主导，名字下方 */
function LifeAgentDiscoverCard({
  profile,
  globalIndex,
  profileHref,
}: {
  profile: LifeAgentListItem;
  globalIndex: number;
  profileHref: (id: string) => string;
  skipMountAnimation?: boolean;
}) {
  const areaLabel = [profile.city, profile.province].filter(Boolean).join(" · ");
  const coverUrl = resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey);
  const headlineShown = cleanLifeAgentIntroText(profile.headline, profile.displayName);
  const verified = profile.verificationStatus === "verified";
  const showPrice = lifeAgentShowsPurchaseUi();
  const ratingScore =
    profile.ratings && profile.ratings.raters > 0 ? profile.ratings.averageScore.toFixed(1) : null;

  return (
    <article className="min-h-0 [contain-intrinsic-size:auto_400px]">
      {/* Cover image: 2:3 portrait */}
      <div className="relative overflow-hidden bg-paper-200" style={{ aspectRatio: "2 / 3" }}>
        <Link
          href={profileHref(profile.id)}
          className="group block h-full focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink"
        >
          <LifeAgentCoverImage
            src={coverUrl}
            alt={profile.displayName}
            fill
            className="object-cover object-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 22vw"
            priority={globalIndex < 6}
            loading={globalIndex < 6 ? undefined : "lazy"}
          />
          {/* Hover darkening */}
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/8" />

          {typeof profile.published === "boolean" && profile.published === false ? (
            <div className="absolute left-0 top-0 bg-paper px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
              未发布
            </div>
          ) : null}
        </Link>

        {/* MindScore — bottom-left of image, typographic not pill */}
        {typeof profile.mindScore === "number" ? (
          <div className="absolute bottom-0 left-0 z-10 p-1.5">
            <MindScoreBadge value={profile.mindScore} size="xs" />
          </div>
        ) : null}
      </div>

      {/* Text below image — no separator line, image flows into text */}
      <Link
        href={profileHref(profile.id)}
        className="group block focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink"
      >
        <div className="pt-3">
          <h3 className="font-serif text-[17px] font-medium leading-tight text-ink line-clamp-1 transition-colors duration-150 group-hover:text-ink-600 sm:text-[19px]">
            {profile.displayName}
            {verified ? (
              <span className="ml-1 align-middle text-[10px] tracking-widest text-olive-500" aria-label="已认证">
                ✓
              </span>
            ) : null}
          </h3>

          <p className="mt-1 font-serif text-[12px] italic leading-snug text-ink-400 line-clamp-2 min-h-[2em]">
            {headlineShown}
          </p>

          <div className="mt-2 flex items-baseline justify-between text-[11px] text-ink-400">
            <span className="truncate">
              {(areaLabel || profile.creator.name || anonymous)}
              {ratingScore ? <span className="text-ink-500"> · {ratingScore}★</span> : null}
            </span>
            {showPrice && profile.pricePerQuestion > 0 ? (
              <span className="ml-1 shrink-0 font-serif text-[15px] font-medium tabular-nums text-oxblood-500">
                ¥{(profile.pricePerQuestion / 100).toFixed(0)}
                <span className="ml-0.5 text-[10px] font-normal not-italic text-ink-300">/问</span>
              </span>
            ) : null}
          </div>
        </div>
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
  const rows = useMemo(() => {
    // Virtualized path: skip featured card, chunk normally
    return chunkIntoRows(profiles, colCount);
  }, [profiles, colCount]);
  const rowKeys = useMemo(() => rows.map((r, i) => `${i}:${r.map((p) => p.id).join("|")}`), [rows]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 480,
    overscan: 4,
    gap: 40,
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
        debounce = setTimeout(() => {
          debounce = null;
          tryLoadMore();
        }, 200);
      },
      { root: null, rootMargin: "480px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => {
      if (debounce) clearTimeout(debounce);
      io.disconnect();
    };
  }, [hasMoreFromServer, onLoadMore, tryLoadMore, rows.length, loadingMore]);

  const { slice, hasMore, sentinelRef } = useWindowedSlice(profiles, {
    enabled: !virtualized && windowed,
    resetKey: windowResetKey,
    initial: 12,
    page: 12,
  });
  const toRender = !virtualized && windowed ? slice : profiles;

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Featured card skeleton */}
        <div className="grid grid-cols-[45%_55%] border-b border-hairline pb-6">
          <div className="animate-pulse bg-paper-200" style={{ aspectRatio: "3 / 4" }} />
          <div className="flex flex-col border border-l-0 border-hairline p-4 space-y-3">
            <div className="h-7 w-3/4 animate-pulse bg-paper-200" />
            <div className="h-4 w-full animate-pulse bg-paper-200" />
            <div className="h-4 w-5/6 animate-pulse bg-paper-200" />
            <div className="mt-auto h-3 w-1/2 animate-pulse bg-paper-200" />
          </div>
        </div>
        {/* Regular card skeletons */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-9 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-11 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="min-h-0">
              <div className="w-full animate-pulse bg-paper-200" style={{ aspectRatio: "2 / 3" }} />
              <div className="space-y-2 pt-3">
                <div className="h-4 w-3/4 animate-pulse bg-paper-200" />
                <div className="h-3 w-full animate-pulse bg-paper-200" />
                <div className="h-3 w-2/3 animate-pulse bg-paper-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="border-t border-b border-hairline px-6 py-16 text-center">
        <p className="font-serif text-xl font-medium text-ink">{emptyTitle}</p>
        <p className="mt-2 font-serif text-sm italic text-ink-400">{emptySubtitle}</p>
      </div>
    );
  }

  if (!virtualized) {
    const [featuredProfile, ...regularProfiles] = toRender;
    return (
      <div className="space-y-0">
        {/* Featured first card */}
        {featuredProfile && (
          <LifeAgentFeaturedCard
            profile={featuredProfile}
            profileHref={profileHref}
          />
        )}

        {/* Regular grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-9 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-11 lg:grid-cols-4 xl:grid-cols-5">
          {regularProfiles.map((profile, index) => (
            <LifeAgentDiscoverCard
              key={profile.id}
              profile={profile}
              globalIndex={index + 1}
              profileHref={profileHref}
            />
          ))}
        </div>

        {windowed && hasMore ? (
          <div ref={sentinelRef} className="flex min-h-[52px] items-center justify-center py-4" aria-hidden>
            <span className="font-serif text-xs italic text-ink-300">继续阅读</span>
          </div>
        ) : null}
        {onLoadMore && (hasMoreFromServer || loadingMore) ? (
          <div ref={loadMoreSentinelRef} className="flex min-h-[52px] items-center justify-center py-4" aria-hidden>
            <span className="font-serif text-xs italic text-ink-300">
              {loadingMore ? "正在加载…" : "继续阅读"}
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  // Virtualized path: no featured card, pure performance grid
  const totalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="space-y-0">
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
                className="grid gap-x-2 gap-y-9 sm:gap-x-3 sm:gap-y-11"
                style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
              >
                {row.map((profile, colIdx) => {
                  const globalIndex = virtualRow.index * colCount + colIdx;
                  return (
                    <LifeAgentDiscoverCard
                      key={profile.id}
                      profile={profile}
                      globalIndex={globalIndex}
                      profileHref={profileHref}
                      skipMountAnimation
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {onLoadMore && (hasMoreFromServer || loadingMore) ? (
        <div ref={loadMoreSentinelRef} className="flex min-h-[52px] items-center justify-center py-4" aria-hidden>
          <span className="font-serif text-xs italic text-ink-300">
            {loadingMore ? "正在加载…" : hasMoreFromServer ? "继续阅读" : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
