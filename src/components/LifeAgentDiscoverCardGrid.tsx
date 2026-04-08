"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";
import type { LifeAgentListItem } from "@/lib/life-agent-feed-search";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { useWindowedSlice } from "@/lib/use-windowed-slice";

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

function LifeAgentDiscoverCard({
  profile,
  globalIndex,
  profileHref,
  /** 虚拟列表回收节点时禁用入场动画，避免反复 mount 触发动效与布局抖动 */
  skipMountAnimation,
}: {
  profile: LifeAgentListItem;
  globalIndex: number;
  profileHref: (id: string) => string;
  skipMountAnimation?: boolean;
}) {
  const areaLabel = [profile.city, profile.province].filter(Boolean).join(" · ");
  const tags = (profile.expertiseTags ?? []).slice(0, 2);
  const coverUrl = profile.coverUrl || resolveLifeAgentCoverUrl(profile.coverImageUrl, profile.coverPresetKey);
  const headlineShown = cleanLifeAgentIntroText(profile.headline, profile.displayName);
  const stagger = globalIndex < 8;
  const shellClass = "min-h-0 [content-visibility:auto] [contain-intrinsic-size:auto_300px]";
  const inner = (
    <Link href={profileHref(profile.id)} className="group flex h-full min-h-0">
        <div className="flex h-full min-h-[280px] w-full flex-col overflow-hidden rounded-[22px] border border-purple-200/[0.22] bg-white/[0.98] shadow-[0_5px_28px_-8px_rgba(124,58,237,0.09)] backdrop-blur-sm transition duration-200 group-hover:border-fuchsia-200/35 group-hover:shadow-[0_10px_36px_-10px_rgba(168,139,235,0.14)] sm:min-h-[300px]">
          <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-violet-100/40">
            {typeof profile.published === "boolean" && (
              <div
                className={`absolute left-2 top-2 z-[1] rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm ${
                  profile.published ? "bg-emerald-600 text-white" : "bg-white/95 text-slate-600 ring-1 ring-slate-200/80"
                }`}
              >
                {profile.published ? "已发布" : "未发布"}
              </div>
            )}
            <LifeAgentCoverImage
              src={coverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
              priority={globalIndex < 6}
              loading={globalIndex < 6 ? undefined : "lazy"}
            />
            {(profile.verificationStatus === "verified" || profile.verificationStatus === "pending") && (
              <div className="absolute right-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
                <VerificationBadge status={profile.verificationStatus ?? "none"} size="sm" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent p-2.5 pt-12">
              <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-white drop-shadow-md">
                {headlineShown}
              </span>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2 sm:p-3">
            <h3 className="line-clamp-2 min-h-[2.75rem] text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">
              {profile.displayName}
            </h3>
            <p className="line-clamp-1 min-h-[1.125rem] text-[11px] text-slate-400">{areaLabel || "\u00a0"}</p>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 text-[10px] font-bold text-purple-800">
                  {(profile.displayName ?? anonymous).slice(0, 1)}
                </span>
                <span className="truncate">{profile.creator.name ?? anonymous}</span>
              </div>
              <span className="shrink-0 text-sm font-bold text-purple-700">
                ¥{(profile.pricePerQuestion / 100).toFixed(0)}
                <span className="text-[10px] font-medium text-slate-400">/问</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 border-t border-purple-100/60 pt-2 text-[11px] text-slate-500">
              <RatingStars score={profile.ratings?.averageScore ?? 0} size="sm" />
              <span>
                {profile.ratings && profile.ratings.raters > 0 ? profile.ratings.averageScore.toFixed(1) : "—"}
              </span>
              {profile.ratings && profile.ratings.raters > 0 ? (
                <span className="text-slate-400">· {profile.ratings.raters} 人评</span>
              ) : null}
            </div>
            <div className="flex-1" aria-hidden />
            <div className="flex min-h-[1.375rem] flex-wrap content-end gap-1">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md bg-violet-50/90 px-1.5 py-0.5 text-[10px] font-medium text-purple-700/90"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
  );
  if (skipMountAnimation) {
    return <article className={shellClass}>{inner}</article>;
  }
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: stagger ? globalIndex * 0.04 : 0, duration: stagger ? 0.4 : 0.18 }}
      className={shellClass}
    >
      {inner}
    </motion.article>
  );
}

type Props = {
  profiles: LifeAgentListItem[];
  loading: boolean;
  emptyTitle: string;
  emptySubtitle: string;
  profileHref?: (id: string) => string;
  windowResetKey?: string | number;
  /** 为 false 时一次性渲染全部（管理页等） */
  windowed?: boolean;
  /**
   * 为 true 时用窗口级虚拟列表按「行」回收离屏 DOM；
   * 未传时：与 windowed 联动，`windowed={false}`（管理页）默认关虚拟列表。
   */
  virtualized?: boolean;
  /** 分页：触底加载下一页（与 hasMoreFromServer 配合） */
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
    estimateSize: () => 328,
    overscan: 4,
    gap: 12,
    enabled: virtualized && !loading && profiles.length > 0,
    getItemKey: (i) => rowKeys[i] ?? String(i),
  });

  // 库在「上方行」高度实测与估算不一致时会改 window.scrollY；向上滑时与惯性滚动对抗，体感像减速（该选项不在 VirtualizerOptions 里，需写实例属性）
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-purple-200/[0.18] bg-white/[0.96] shadow-[0_4px_22px_rgba(124,58,237,0.06)]"
          >
            <div className="aspect-[4/5] w-full shrink-0 animate-pulse bg-gradient-to-br from-violet-100/80 to-fuchsia-100/50" />
            <div className="flex flex-1 flex-col gap-2 p-2.5">
              <div className="min-h-[2.75rem] animate-pulse rounded-md bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-4 animate-pulse rounded bg-slate-50" />
              <div className="h-6 animate-pulse rounded bg-slate-50" />
              <div className="min-h-[1.375rem] animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-purple-200/40 bg-white/[0.97] px-6 py-12 text-center shadow-[0_6px_28px_rgba(124,58,237,0.06)] backdrop-blur-sm">
        <p className="text-base font-semibold text-purple-950/90">{emptyTitle}</p>
        <p className="mt-2 text-sm text-slate-500">{emptySubtitle}</p>
      </div>
    );
  }

  if (!virtualized) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {toRender.map((profile, index) => (
            <LifeAgentDiscoverCard key={profile.id} profile={profile} globalIndex={index} profileHref={profileHref} />
          ))}
        </div>
        {windowed && hasMore ? (
          <div ref={sentinelRef} className="flex min-h-[52px] items-center justify-center py-2" aria-hidden>
            <span className="text-xs text-slate-400">向下滑动加载更多…</span>
          </div>
        ) : null}
      </div>
    );
  }

  const totalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="space-y-3">
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
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className="grid gap-2 sm:gap-3"
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
        <div ref={loadMoreSentinelRef} className="flex min-h-[52px] items-center justify-center py-2" aria-hidden>
          <span className="text-xs text-slate-400">
            {loadingMore ? "加载更多…" : hasMoreFromServer ? "向下滑动加载更多…" : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
