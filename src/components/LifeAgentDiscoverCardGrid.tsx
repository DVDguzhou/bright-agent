"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight } from "lucide-react";
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

function LifeAgentDiscoverCard({
  profile,
  globalIndex,
  profileHref,
  showPulse,
}: {
  profile: LifeAgentListItem;
  globalIndex: number;
  profileHref: (id: string) => string;
  skipMountAnimation?: boolean;
  showPulse?: boolean;
}) {
  const areaLabel = [profile.city, profile.province]
    .filter(Boolean)
    .filter((seg, i, arr) => i === 0 || arr[i - 1] !== seg)
    .join(" · ");
  const coverUrl = resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey);
  const headlineShown = cleanLifeAgentIntroText(profile.headline, profile.displayName);
  const sampleQuestionShown =
    (profile.sampleQuestions ?? [])
      .map((q) => cleanLifeAgentIntroText(q, profile.displayName))
      .filter(Boolean)[0] ?? null;
  const verified = profile.verificationStatus === "verified";
  const showPrice = lifeAgentShowsPurchaseUi();
  const hasRating = !!(profile.ratings && profile.ratings.raters > 0);
  const ratingScore = hasRating ? profile.ratings!.averageScore.toFixed(1) : null;
  const expertiseTagsShown = (profile.expertiseTags ?? []).slice(0, 2);
  const sessionCount = profile.sessionCount ?? 0;
  const isActiveAgent = sessionCount >= 10;

  return (
    <article
      className={`group mb-3 break-inside-avoid rounded-lg border bg-paper-50 p-1.5 shadow-glow-sm transition-[border-color,box-shadow,transform] duration-200 [contain-intrinsic-size:auto_310px] last:mb-0 hover:-translate-y-0.5 hover:shadow-glow motion-reduce:hover:translate-y-0 sm:mb-4 ${
        hasRating
          ? "border-signal-200 hover:border-signal-300"
          : "border-hairline/60 hover:border-hairline"
      }`}
    >
      <div
        className="relative w-full overflow-hidden rounded-md border border-hairline bg-paper-200 transition-colors duration-200 group-hover:border-hairline/80"
        style={{ aspectRatio: "4 / 5" }}
      >
        {showPulse && (
          <div className="pointer-events-none absolute right-2.5 top-2.5 z-20 flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal-600" />
            </span>
            <span className="rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-paper backdrop-blur-sm">
              点击开始
            </span>
          </div>
        )}
        <Link
          href={profileHref(profile.id)}
          className="pressable group block h-full focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink"
        >
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
        </Link>
        {typeof profile.mindScore === "number" ? (
          <div className="absolute bottom-0 left-0 z-10 p-1.5">
            <MindScoreBadge value={profile.mindScore} size="xs" className="shadow-sm" />
          </div>
        ) : null}
      </div>

      <Link
        href={profileHref(profile.id)}
        className="pressable group block focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink"
      >
        <div className="pt-2.5">
          {/* Name row with rating chip */}
          <div className="flex items-baseline gap-1.5">
            <h3 className="min-w-0 flex-1 truncate font-serif text-base font-medium leading-5 text-ink">
              {profile.displayName}
              {verified ? (
                <span className="ml-1 align-middle text-[10px] tracking-widest text-signal-600" aria-label="已认证">
                  ✓
                </span>
              ) : null}
            </h3>
            {ratingScore ? (
              <span className="shrink-0 rounded-sm bg-signal-50 px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums text-signal-600">
                ★{ratingScore}
              </span>
            ) : null}
          </div>

          {/* Expertise tags — first tag uses brand accent */}
          {expertiseTagsShown.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {expertiseTagsShown.map((tag, i) => (
                <span
                  key={tag}
                  className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                    i === 0 ? "bg-signal-50 text-signal-600" : "bg-paper-200 text-ink-400"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* Headline */}
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-ink-500">
            {headlineShown}
          </p>

          {/* Sample question — 1 only */}
          {sampleQuestionShown ? (
            <p className="mt-1.5 line-clamp-1 rounded-sm bg-paper-200 px-2 py-1 text-[11px] leading-4 text-ink-400">
              {sampleQuestionShown}
            </p>
          ) : null}

          {/* Footer: location + session count / price */}
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-hairline/70 pt-1.5 text-[10.5px] text-ink-300">
            <span className="truncate">
              {[areaLabel || null, profile.creator.name ?? anonymous]
                .filter(Boolean)
                .join(" · ") || anonymous}
            </span>
            {showPrice && profile.pricePerQuestion > 0 ? (
              <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-ink">
                ¥{(profile.pricePerQuestion / 100).toFixed(0)}
                <span className="ml-0.5 text-[10px] font-normal text-ink-300">/问</span>
              </span>
            ) : sessionCount > 0 ? (
              <span className={`shrink-0 tabular-nums ${isActiveAgent ? "font-medium text-signal-600" : ""}`}>
                {sessionCount}次
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

/**
 * 推荐卡：feed 第一位放大处理，打破均质网格，但不做杂志头版。
 */
function LifeAgentLeadCard({
  profile,
  profileHref,
  showPulse,
}: {
  profile: LifeAgentListItem;
  profileHref: (id: string) => string;
  showPulse?: boolean;
}) {
  const areaLabel = [profile.city, profile.province]
    .filter(Boolean)
    .filter((seg, i, arr) => i === 0 || arr[i - 1] !== seg)
    .join(" · ");
  const coverUrl = resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey);
  const headlineShown = cleanLifeAgentIntroText(profile.headline, profile.displayName);
  const sampleQuestionsShown = (profile.sampleQuestions ?? [])
    .map((q) => cleanLifeAgentIntroText(q, profile.displayName))
    .filter(Boolean)
    .slice(0, 2);
  const verified = profile.verificationStatus === "verified";
  const showPrice = lifeAgentShowsPurchaseUi();
  const ratingScore =
    profile.ratings && profile.ratings.raters > 0 ? profile.ratings.averageScore.toFixed(1) : null;

  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white text-ink shadow-glow-sm transition duration-200 hover:border-ink/20 hover:shadow-glow">
      <Link
        href={profileHref(profile.id)}
        className="pressable group block focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-signal-600"
      >
        <div className="grid gap-0 sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
          <div className="relative w-full overflow-hidden border-b border-hairline bg-paper-200 sm:border-b-0 sm:border-r" style={{ aspectRatio: "4 / 3" }}>
            {showPulse && (
              <div className="pointer-events-none absolute right-2.5 top-2.5 z-20 flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal-600" />
                </span>
                <span className="rounded-md border border-white/70 bg-white/75 px-2 py-0.5 text-[10px] font-medium text-ink shadow-[0_6px_16px_rgba(17,21,19,0.10)] supports-[backdrop-filter]:backdrop-blur-md">
                  点击开始
                </span>
              </div>
            )}
            <LifeAgentCoverImage
              src={coverUrl}
              alt=""
              fill
              className="object-cover transition duration-300 ease-out group-hover:scale-[1.015]"
              sizes="(max-width: 640px) 92vw, 40vw"
              priority
            />
            <span className="absolute left-2 top-2 rounded-md border border-white/70 bg-white/75 px-2 py-1 text-[11px] font-semibold leading-none text-ink shadow-[0_8px_18px_rgba(17,21,19,0.12)] supports-[backdrop-filter]:backdrop-blur-md">
              精选推荐
            </span>
            {typeof profile.mindScore === "number" ? (
              <div className="absolute bottom-0 left-0 z-10 p-1.5">
                <MindScoreBadge value={profile.mindScore} size="xs" className="shadow-sm" />
              </div>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col p-3.5 sm:p-4">
            <div className="mb-1 flex min-w-0 items-center gap-2 text-xs text-ink-400">
              <span className="truncate">
                {[areaLabel || null, profile.creator.name ?? anonymous].filter(Boolean).join(" · ") || anonymous}
              </span>
              {ratingScore ? (
                <span className="shrink-0 text-ink-500">{ratingScore}<span className="text-signal-500">★</span></span>
              ) : null}
            </div>
            <h3 className="font-serif text-2xl font-medium leading-8 text-ink sm:text-[28px] sm:leading-9 [text-wrap:balance]">
              {profile.displayName}
              {verified ? (
                <span className="ml-1.5 align-middle text-[11px] tracking-widest text-signal-600" aria-label="已认证">
                  ✓
                </span>
              ) : null}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-500">
              {headlineShown}
            </p>
            {sampleQuestionsShown.length > 0 ? (
              <ul className="mt-3 space-y-1.5" aria-label="你可以问">
                {sampleQuestionsShown.map((q, i) => (
                  <li
                    key={i}
                    className="line-clamp-1 rounded-md border border-hairline/80 bg-paper/70 px-2.5 py-1.5 text-xs leading-5 text-ink-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:backdrop-blur-md"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-hairline/80 pt-3 text-xs text-ink-400">
              <span className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-3 text-xs font-semibold text-paper-50 transition duration-200 group-hover:bg-signal-600">
                查看经历
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </span>
              {showPrice ? (
                <span className="shrink-0 text-lg font-semibold tabular-nums text-ink">
                  ¥{(profile.pricePerQuestion / 100).toFixed(0)}
                  <span className="ml-0.5 text-[10px] font-normal text-ink-400">/问</span>
                </span>
              ) : null}
            </div>
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
  showFirstCardPulse?: boolean;
  /** 为 true 时第一条用「头条卡」全宽头版处理，其余进网格 */
  lead?: boolean;
  /** 外部指定推荐卡，常用于从精选合集里抽推荐，不影响下方普通列表 */
  leadProfile?: LifeAgentListItem | null;
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
  showFirstCardPulse = false,
  lead = false,
  leadProfile: leadProfileProp,
}: Props) {
  const virtualized = virtualizedProp ?? windowed !== false;
  const colCount = useGridColumnCount();
  const leadProfile =
    leadProfileProp !== undefined ? leadProfileProp ?? undefined : lead && profiles.length > 0 ? profiles[0] : undefined;
  const gridProfiles = useMemo(
    () => (leadProfile ? profiles.filter((profile) => profile.id !== leadProfile.id) : profiles),
    [leadProfile, profiles],
  );
  const globalIndexOffset = leadProfile ? 1 : 0;
  const rows = useMemo(() => chunkIntoRows(gridProfiles, colCount), [gridProfiles, colCount]);
  const rowKeys = useMemo(() => rows.map((r, i) => `${i}:${r.map((p) => p.id).join("|")}`), [rows]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 400,
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

  const { slice, hasMore, sentinelRef } = useWindowedSlice(gridProfiles, {
    enabled: !virtualized && windowed,
    resetKey: windowResetKey,
    initial: 12,
    page: 12,
  });
  const toRender = !virtualized && windowed ? slice : gridProfiles;

  if (loading) {
    return (
      <div className="space-y-7">
        {lead ? (
          <div className="rounded-lg border border-hairline bg-paper-50 p-2.5 sm:p-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] sm:gap-4">
              <div className="w-full animate-pulse rounded-md bg-paper-200" style={{ aspectRatio: "4 / 3" }} />
              <div className="space-y-2">
                <div className="h-3 w-24 animate-pulse bg-paper-200" />
                <div className="h-6 w-1/2 animate-pulse bg-paper-200" />
                <div className="h-3.5 w-4/5 animate-pulse bg-paper-200" />
                <div className="h-3 w-2/3 animate-pulse bg-paper-200" />
              </div>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-7 lg:grid-cols-4 xl:grid-cols-5">
          {(lead ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6]).map((item) => (
            <div key={item} className="min-h-0">
              <div className="w-full animate-pulse bg-paper-200" style={{ aspectRatio: "4 / 5" }} />
              <div className="mt-2.5 border-t border-hairline pt-2.5 space-y-1.5">
                <div className="h-3.5 w-3/5 animate-pulse bg-paper-200" />
                <div className="h-3 w-full animate-pulse bg-paper-200" />
                <div className="h-3 w-2/3 animate-pulse bg-paper-200" />
                <div className="h-2.5 w-4/5 animate-pulse bg-paper-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-paper-50 px-6 py-14 text-center">
        <p className="text-lg font-semibold text-ink">{emptyTitle}</p>
        <p className="mt-2 text-sm leading-6 text-ink-500">{emptySubtitle}</p>
      </div>
    );
  }

  if (!virtualized) {
    return (
      <div className="space-y-6">
        {leadProfile ? (
          <LifeAgentLeadCard profile={leadProfile} profileHref={profileHref} showPulse={showFirstCardPulse} />
        ) : null}
        <div className="columns-2 gap-x-2.5 sm:columns-3 sm:gap-x-4 lg:columns-4 xl:columns-5">
          {toRender.map((profile, index) => (
            <LifeAgentDiscoverCard
              key={profile.id}
              profile={profile}
              globalIndex={index + globalIndexOffset}
              profileHref={profileHref}
              showPulse={!leadProfile && showFirstCardPulse && index === 0}
            />
          ))}
        </div>
        {windowed && hasMore ? (
          <div ref={sentinelRef} className="flex min-h-[52px] items-center justify-center py-2" aria-hidden>
            <span className="text-xs font-medium text-ink-400">继续阅读</span>
          </div>
        ) : null}
        {onLoadMore && (hasMoreFromServer || loadingMore) ? (
          <div ref={loadMoreSentinelRef} className="flex min-h-[52px] items-center justify-center py-2" aria-hidden>
            <span className="text-xs font-medium text-ink-400">
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
      {leadProfile ? (
        <LifeAgentLeadCard profile={leadProfile} profileHref={profileHref} showPulse={showFirstCardPulse} />
      ) : null}
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
                className="grid gap-x-2.5 gap-y-4 sm:gap-x-3.5 sm:gap-y-6"
                style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
              >
                {row.map((profile, colIdx) => {
                  const globalIndex = virtualRow.index * colCount + colIdx;
                  return (
                    <LifeAgentDiscoverCard
                      key={profile.id}
                      profile={profile}
                      globalIndex={globalIndex + globalIndexOffset}
                      profileHref={profileHref}
                      skipMountAnimation
                      showPulse={!leadProfile && showFirstCardPulse && globalIndex === 0}
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
          <span className="text-xs font-medium text-ink-400">
            {loadingMore ? "正在加载…" : hasMoreFromServer ? "继续阅读" : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
