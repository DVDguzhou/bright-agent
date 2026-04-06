"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowedSlice } from "@/lib/use-windowed-slice";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { VerificationBadge } from "@/components/VerificationBadge";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";
import { getFavoriteAgentIds } from "@/lib/life-agent-favorites";
import { LifeAgentDiscoverCardGrid } from "@/components/LifeAgentDiscoverCardGrid";
import { rankLifeAgentsBySearchQuery, type LifeAgentListItem } from "@/lib/life-agent-feed-search";
import { fetchAllPublishedLifeAgents, fetchLifeAgentsPage } from "@/lib/life-agents-list-api";

type PurchasedAgentRow = {
  id: string;
  displayName: string;
  headline: string;
  pricePerQuestion: number;
  remainingQuestions: number;
  verificationStatus?: string;
};

const UI = {
  loading: "加载中...",
  countSuffix: "个",
  emptyTitle: "还没有人生 Agent",
  emptySubtitle:
    "创建第一个，把你的经验变成可对话的咨询页",
  school: "学校",
  education: "学历",
  job: "工作",
  income: "收入",
  area: "地区",
  unrated: "暂无评分",
  ratersSuffix: "人评分",
  perQuestion: "每次提问",
  knowledgeCount: "知识条目",
  soldQuestionPacks: "已售提问包",
  sessionCount: "聊天场次",
  audience: "适合人群",
  anonymous: "佚",
} as const;

function LifeAgentsPageContent() {
  const searchParams = useSearchParams();
  const feedTab = searchParams.get("tab");
  const [discoverItems, setDiscoverItems] = useState<LifeAgentListItem[]>([]);
  const [discoverNextCursor, setDiscoverNextCursor] = useState<string | null>(null);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [discoverLoadingMore, setDiscoverLoadingMore] = useState(false);
  const [favoritesSource, setFavoritesSource] = useState<LifeAgentListItem[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesFetched, setFavoritesFetched] = useState(false);

  const discoverItemsRef = useRef(discoverItems);
  discoverItemsRef.current = discoverItems;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedAgentRow[]>([]);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [purchasedUnauthorized, setPurchasedUnauthorized] = useState(false);

  useEffect(() => {
    const sync = () => setFavoriteIds(getFavoriteAgentIds());
    sync();
    window.addEventListener("la-favorite-change", sync);
    return () => window.removeEventListener("la-favorite-change", sync);
  }, []);

  useEffect(() => {
    if (feedTab !== "purchased") return;
    let cancelled = false;
    setPurchasedLoading(true);
    setPurchasedUnauthorized(false);
    fetch("/api/life-agents/purchased", { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401) {
          return { unauthorized: true as const, items: [] as PurchasedAgentRow[] };
        }
        const d = await r.json().catch(() => []);
        const raw = Array.isArray(d) ? d : [];
        const items: PurchasedAgentRow[] = raw.map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ""),
          displayName: String(row.displayName ?? ""),
          headline: String(row.headline ?? ""),
          pricePerQuestion: typeof row.pricePerQuestion === "number" ? row.pricePerQuestion : 0,
          remainingQuestions: typeof row.remainingQuestions === "number" ? row.remainingQuestions : 0,
          verificationStatus: typeof row.verificationStatus === "string" ? row.verificationStatus : undefined,
        })).filter((row) => row.id);
        return { unauthorized: false as const, items };
      })
      .catch(() => ({ unauthorized: false as const, items: [] as PurchasedAgentRow[] }))
      .then((res) => {
        if (cancelled) return;
        setPurchasedUnauthorized(res.unauthorized);
        setPurchasedItems(res.items);
        setPurchasedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [feedTab]);

  useEffect(() => {
    if (feedTab === "favorites" || feedTab === "purchased") {
      setDiscoverLoading(false);
      return;
    }
    if (discoverItemsRef.current.length > 0) {
      setDiscoverLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    setLoadError(null);
    setDiscoverLoading(true);
    fetchLifeAgentsPage(48, undefined, controller.signal)
      .then(({ items, nextCursor }) => {
        setDiscoverItems(items);
        setDiscoverNextCursor(nextCursor || null);
        setLoadError(null);
      })
      .catch((err) => {
        setDiscoverItems([]);
        setDiscoverNextCursor(null);
        setLoadError(
          err.name === "AbortError"
            ? "请求超时，请检查后端是否启动或稍后重试"
            : "加载失败，请刷新页面重试",
        );
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setDiscoverLoading(false);
      });
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [feedTab]);

  useEffect(() => {
    if (feedTab !== "favorites") return;
    if (favoritesFetched) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    setFavoritesLoading(true);
    setLoadError(null);
    fetchAllPublishedLifeAgents(controller.signal)
      .then((all) => {
        setFavoritesSource(all);
        setLoadError(null);
      })
      .catch((err) => {
        setFavoritesSource([]);
        setLoadError(
          err.name === "AbortError"
            ? "请求超时，请检查后端是否启动或稍后重试"
            : "加载失败，请刷新页面重试",
        );
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setFavoritesLoading(false);
        setFavoritesFetched(true);
      });
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [feedTab, favoritesFetched]);

  const loadMoreDiscover = useCallback(async () => {
    if (!discoverNextCursor || discoverLoadingMore) return;
    setDiscoverLoadingMore(true);
    try {
      const { items, nextCursor } = await fetchLifeAgentsPage(48, discoverNextCursor);
      setDiscoverItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const it of items) {
          if (!seen.has(it.id)) {
            seen.add(it.id);
            merged.push(it);
          }
        }
        return merged;
      });
      setDiscoverNextCursor(nextCursor || null);
    } catch {
      // 静默失败；用户可继续滚动重试
    } finally {
      setDiscoverLoadingMore(false);
    }
  }, [discoverNextCursor, discoverLoadingMore]);

  const displayProfiles = useMemo(() => {
    if (feedTab === "favorites") {
      const idSet = new Set(favoriteIds);
      return rankLifeAgentsBySearchQuery(
        favoritesSource.filter((p) => idSet.has(p.id)),
        "",
      );
    }
    if (feedTab === "purchased") return [];
    return rankLifeAgentsBySearchQuery(discoverItems, "");
  }, [feedTab, favoriteIds, favoritesSource, discoverItems]);

  const gridLoading =
    feedTab === "favorites" ? favoritesLoading : feedTab === "purchased" ? false : discoverLoading;

  const feedWindowKey = feedTab === "favorites" ? "favorites" : feedTab === "purchased" ? "purchased" : "discover";

  return (
    <div className="-mx-1 space-y-4 pb-4 sm:mx-0 sm:space-y-5">
      <section>
        {feedTab === "favorites" ? (
          <div className="mb-3 rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-900">
            <p className="font-medium">我的收藏</p>
            <p className="mt-1 text-xs text-rose-800/90">在 Agent 详情页封面右上角点星形即可收藏，数据保存在本机浏览器。</p>
          </div>
        ) : feedTab === "purchased" ? (
          <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
            <p className="font-medium">已购买咨询额度</p>
            <p className="mt-1 text-xs text-emerald-900/90">以下为仍有剩余提问次数的 Agent，点击卡片可进入对话。</p>
          </div>
        ) : null}

        {feedTab === "favorites" || feedTab === "purchased" ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              {feedTab === "favorites" ? "我的收藏" : "已购买"}
            </h2>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600 sm:text-xs">
              {feedTab === "purchased"
                ? purchasedLoading
                  ? UI.loading
                  : `${purchasedItems.length}${UI.countSuffix}`
                : gridLoading
                  ? UI.loading
                  : `${displayProfiles.length}/${favoritesSource.length}${UI.countSuffix}`}
            </span>
          </div>
        ) : null}

        {loadError && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800">
            {loadError}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-3 text-sm font-medium text-amber-700 underline hover:no-underline"
            >
              刷新页面
            </button>
          </div>
        )}
        {feedTab === "purchased" ? (
          purchasedLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60"
                >
                  <div className="aspect-[4/5] w-full shrink-0 animate-pulse bg-gradient-to-br from-slate-100 to-slate-200/90" />
                  <div className="flex flex-1 flex-col gap-2 p-2.5">
                    <div className="min-h-[2.75rem] animate-pulse rounded-md bg-slate-100" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 animate-pulse rounded bg-slate-50" />
                  </div>
                </div>
              ))}
            </div>
          ) : purchasedUnauthorized ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-slate-900">请先登录</p>
              <p className="mt-2 text-sm text-slate-500">登录后可查看你已购买提问额度的 Agent。</p>
              <Link
                href="/login"
                className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white"
              >
                去登录
              </Link>
            </div>
          ) : purchasedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-slate-900">暂无已购额度</p>
              <p className="mt-2 text-sm text-slate-500">购买提问包后，对应 Agent 会出现在这里。</p>
              <Link href="/life-agents" className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:underline">
                去发现页逛逛
              </Link>
            </div>
          ) : (
            <PurchasedAgentsWindowedGrid rows={purchasedItems} />
          )
        ) : (
          <LifeAgentDiscoverCardGrid
            profiles={displayProfiles}
            loading={gridLoading}
            emptyTitle={loadError ? "加载失败" : feedTab === "favorites" ? "暂无收藏" : UI.emptyTitle}
            emptySubtitle={
              loadError
                ? "请确认 Go 后端已启动（默认端口 8080），或刷新页面重试"
                : feedTab === "favorites"
                  ? "去「发现」逛逛，在喜欢的 Agent 详情页点亮收藏。"
                  : UI.emptySubtitle
            }
            windowResetKey={feedWindowKey}
            onLoadMore={feedTab !== "favorites" && feedTab !== "purchased" ? loadMoreDiscover : undefined}
            hasMoreFromServer={feedTab !== "favorites" && feedTab !== "purchased" && !!discoverNextCursor}
            loadingMore={discoverLoadingMore}
          />
        )}
      </section>
    </div>
  );
}

/** 已购列表：与发现页一致，分批挂载卡片，避免一次渲染过多 */
function PurchasedAgentsWindowedGrid({ rows }: { rows: PurchasedAgentRow[] }) {
  const { slice, hasMore, sentinelRef } = useWindowedSlice(rows, { initial: 12, page: 12 });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {slice.map((row, index) => {
          const coverUrl = resolveLifeAgentCoverUrl(undefined, undefined);
          return (
            <motion.article
              key={row.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index < 8 ? index * 0.04 : 0 }}
              className="min-h-0 [content-visibility:auto] [contain-intrinsic-size:auto_300px]"
            >
              <Link href={`/life-agents/${row.id}/chat`} className="group flex h-full min-h-0">
                <div className="flex h-full min-h-[280px] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition duration-200 group-hover:shadow-md group-hover:ring-emerald-200/70 sm:min-h-[300px]">
                  <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-slate-100">
                    <LifeAgentCoverImage
                      src={coverUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                      priority={index < 6}
                      loading={index < 6 ? undefined : "lazy"}
                    />
                    {(row.verificationStatus === "verified" || row.verificationStatus === "pending") && (
                      <div className="absolute right-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
                        <VerificationBadge status={row.verificationStatus ?? "none"} size="sm" />
                      </div>
                    )}
                    <div className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      剩余 {row.remainingQuestions} 次
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent p-2.5 pt-12">
                      <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-white drop-shadow-md">
                        {row.headline}
                      </span>
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2 sm:p-3">
                    <h3 className="line-clamp-2 min-h-[2.75rem] text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">
                      {row.displayName}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-400">点击进入对话</p>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                      <span>按次咨询</span>
                      <span className="font-bold text-emerald-600">
                        ¥{(row.pricePerQuestion / 100).toFixed(0)}
                        <span className="text-[10px] font-medium text-slate-400">/问</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>
      {hasMore ? (
        <div ref={sentinelRef} className="flex min-h-[52px] items-center justify-center py-2" aria-hidden>
          <span className="text-xs text-slate-400">向下滑动加载更多…</span>
        </div>
      ) : null}
    </div>
  );
}

export default function LifeAgentsPage() {
  return (
    <Suspense
      fallback={
        <div className="-mx-1 grid grid-cols-2 gap-2 pb-4 sm:mx-0 sm:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-slate-200/80" />
          ))}
        </div>
      }
    >
      <LifeAgentsPageContent />
    </Suspense>
  );
}