"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { resolveLifeAgentCoverDisplayUrl } from "@/lib/life-agent-covers";
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

/**
 * 杂志风卡片：
 *  - 没有外框、没有阴影、没有圆角
 *  - 封面图保持 4:5 编辑挑选比，浅米衬底
 *  - 标题用 serif（衬线），副信息用 sans
 *  - 价格用 oxblood 强调，tabular-nums 让数字对齐
 *  - 不做入场动画，hover 仅图片轻微变暗
 */
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
  const ratingScore =
    profile.ratings && profile.ratings.raters > 0 ? profile.ratings.averageScore.toFixed(1) : null;

  return (
    <article className="min-h-0 [contain-intrinsic-size:auto_300px]">
      <Link
        href={profileHref(profile.id)}
        className="group block focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink"
      >
        {/* 封面：4:5 编辑挑选比 */}
        <div className="relative w-full overflow-hidden bg-paper-200" style={{ aspectRatio: "4 / 5" }}>
          <LifeAgentCoverImage
            src={coverUrl}
            alt=""
            fill
            className="object-cover transition-opacity duration-200 group-hover:opacity-90"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
            priority={globalIndex < 6}
            loading={globalIndex < 6 ? undefined : "lazy"}
          />
          {typeof profile.published === "boolean" && profile.published === false ? (
            <div className="absolute left-0 top-0 bg-paper px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
              未发布
            </div>
          ) : null}
        </div>

        {/* 文字区：发丝线起，editorial caption */}
        <div className="border-t border-hairline pt-2.5">
          {/* 大标题：作者主头像名 */}
          <h3 className="font-serif text-[15px] font-medium leading-tight text-ink line-clamp-1 sm:text-base">
            {profile.displayName}
            {verified ? (
              <span className="ml-1 align-middle text-[10px] tracking-widest text-olive-500" aria-label="已认证">
                ✓
              </span>
            ) : null}
          </h3>

          {/* 副标题：headline，serif italic 给杂志感 */}
          <p className="mt-0.5 line-clamp-2 min-h-[2.5em] font-serif text-[12.5px] italic leading-snug text-ink-400">
            {headlineShown}
          </p>

          {/* 元数据条：地区 · 评分 / 价格 */}
          <div className="mt-2 flex items-baseline justify-between gap-2 text-[11px] text-ink-300">
            <span className="truncate">
              {[areaLabel || null, profile.creator.name ?? anonymous]
                .filter(Boolean)
                .join(" · ") || anonymous}
              {ratingScore ? <span className="text-ink-400"> · {ratingScore}★</span> : null}
            </span>
            <span className="shrink-0 font-serif text-[15px] font-medium tabular-nums text-oxblood-500">
              ¥{(profile.pricePerQuestion / 100).toFixed(0)}
              <span className="ml-0.5 text-[10px] font-normal not-italic text-ink-300">/问</span>
            </span>
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
    estimateSize: () => 360,
    overscan: 4,
    gap: 28,
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
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="min-h-0">
            <div className="w-full animate-pulse bg-paper-200" style={{ aspectRatio: "4 / 5" }} />
            <div className="mt-2.5 border-t border-hairline pt-2.5 space-y-1.5">
              <div className="h-3.5 w-3/5 animate-pulse bg-paper-200" />
              <div className="h-3 w-full animate-pulse bg-paper-200" />
              <div className="h-3 w-2/3 animate-pulse bg-paper-200" />
            </div>
          </div>
        ))}
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
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">
          {toRender.map((profile, index) => (
            <LifeAgentDiscoverCard key={profile.id} profile={profile} globalIndex={index} profileHref={profileHref} />
          ))}
        </div>
        {windowed && hasMore ? (
          <div ref={sentinelRef} className="flex min-h-[52px] items-center justify-center py-2" aria-hidden>
            <span className="font-serif text-xs italic text-ink-300">继续阅读</span>
          </div>
        ) : null}
        {onLoadMore && (hasMoreFromServer || loadingMore) ? (
          <div ref={loadMoreSentinelRef} className="flex min-h-[52px] items-center justify-center py-2" aria-hidden>
            <span className="font-serif text-xs italic text-ink-300">
              {loadingMore ? "正在加载…" : "继续阅读"}
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  const totalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="space-y-6">
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
                className="grid gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-9"
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
          <span className="font-serif text-xs italic text-ink-300">
            {loadingMore ? "正在加载…" : hasMoreFromServer ? "继续阅读" : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
