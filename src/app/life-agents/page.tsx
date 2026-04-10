"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowedSlice } from "@/lib/use-windowed-slice";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { VerificationBadge } from "@/components/VerificationBadge";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import {
  nextLifeAgentCoverFallbackSrc,
  normalizeLifeAgentCoverImgSrc,
  resolveLifeAgentCoverDisplayUrl,
} from "@/lib/life-agent-covers";
import { getFavoriteAgentIds } from "@/lib/life-agent-favorites";
import { LifeAgentDiscoverCardGrid } from "@/components/LifeAgentDiscoverCardGrid";
import { rankLifeAgentsBySearchQuery, type LifeAgentListItem } from "@/lib/life-agent-feed-search";
import { fetchAllPublishedLifeAgents, fetchLifeAgentsPage } from "@/lib/life-agents-list-api";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { useAuth } from "@/contexts/AuthContext";
import { useLifeAgentsFeedGestures, useMobileTouchNavEnabled } from "@/hooks/use-life-agents-feed-gestures";

type PurchasedAgentRow = {
  id: string;
  displayName: string;
  headline: string;
  pricePerQuestion: number;
  remainingQuestions: number;
  verificationStatus?: string;
  coverUrl?: string;
  coverImageUrl?: string;
  coverPresetKey?: string;
};

const PURCHASED_CACHE_TTL_MS = 90_000;
const INITIAL_BOOT_IMAGE_COUNT = 6;

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

type FeedTabKey = "favorites" | "discover" | "purchased";

function tabIndexFromFeedTab(tab: string | null): number {
  if (tab === "favorites") return 0;
  if (tab === "purchased") return 2;
  return 1;
}

function normalizeFeedTab(tab: string | null): FeedTabKey {
  if (tab === "favorites") return "favorites";
  if (tab === "purchased") return "purchased";
  return "discover";
}

function pathForTabIndex(i: number): string {
  if (i === 0) return "/life-agents?tab=favorites";
  if (i === 2) return "/life-agents?tab=purchased";
  return "/life-agents";
}

function preloadLifeAgentCover(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const loaded = new Set<string>();

    const attempt = (candidate: string) => {
      const normalized = normalizeLifeAgentCoverImgSrc(candidate);
      if (loaded.has(normalized)) {
        resolve();
        return;
      }
      loaded.add(normalized);

      const img = new window.Image();
      img.decoding = "async";
      img.onload = () => resolve();
      img.onerror = () => {
        const next = nextLifeAgentCoverFallbackSrc(normalized);
        if (next === normalized) {
          resolve();
          return;
        }
        attempt(next);
      };
      img.src = normalized;
      if (img.complete && img.naturalWidth > 0) {
        resolve();
      }
    };

    attempt(src);
  });
}

function LifeAgentsPageLoadingState({ title = "页面加载中..." }: { title?: string }) {
  return (
    <div className="-mx-1 space-y-4 pb-4 sm:mx-0 sm:space-y-5" aria-live="polite">
      <div className="rounded-[24px] border border-purple-200/40 bg-white/95 px-4 py-3 shadow-[0_10px_36px_-18px_rgba(124,58,237,0.14)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-purple-950/90">{title}</p>
            <p className="mt-1 text-xs text-slate-500">首屏内容和封面资源准备好后再展示页面</p>
          </div>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700" aria-hidden />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-purple-200/[0.18] bg-white/[0.96] shadow-[0_4px_22px_rgba(124,58,237,0.06)]"
          >
            <div className="aspect-square w-full shrink-0 animate-pulse bg-gradient-to-br from-violet-100/80 to-fuchsia-100/50" />
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
    </div>
  );
}

function LifeAgentsPageContent() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedTab = searchParams.get("tab");
  const initialBootTabRef = useRef<FeedTabKey>(normalizeFeedTab(feedTab));
  const [discoverItems, setDiscoverItems] = useState<LifeAgentListItem[]>([]);
  const [discoverNextCursor, setDiscoverNextCursor] = useState<string | null>(null);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [discoverLoadingMore, setDiscoverLoadingMore] = useState(false);
  const [favoritesSource, setFavoritesSource] = useState<LifeAgentListItem[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesFetched, setFavoritesFetched] = useState(false);
  const [favoriteIdsHydrated, setFavoriteIdsHydrated] = useState(false);

  const discoverItemsRef = useRef(discoverItems);
  discoverItemsRef.current = discoverItems;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedAgentRow[]>([]);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [purchasedUnauthorized, setPurchasedUnauthorized] = useState(false);
  const [purchasedFetched, setPurchasedFetched] = useState(false);
  const [pageBootImagesReady, setPageBootImagesReady] = useState(false);
  const [pageBootReady, setPageBootReady] = useState(false);
  const [pagerReady, setPagerReady] = useState(false);

  const touchNavEnabled = useMobileTouchNavEnabled();
  const initialBootTab = initialBootTabRef.current;
  const initialBootReady =
    initialBootTab === "favorites"
      ? favoritesFetched && favoriteIdsHydrated
      : initialBootTab === "purchased"
        ? purchasedFetched || purchasedUnauthorized
        : !discoverLoading;

  const [visitedMask, setVisitedMask] = useState(() => 1 << tabIndexFromFeedTab(feedTab));
  const pagerRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(0);
  const skipScrollFromUrlRef = useRef(false);
  const replaceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPagerIdxRef = useRef(-1);
  const purchasedLastLoadedAtRef = useRef(0);
  const purchasedRequestInFlightRef = useRef(false);

  const visitPanel = useCallback((i: number) => {
    setVisitedMask((m) => {
      let n = m | (1 << i);
      if (i > 0) n |= 1 << (i - 1);
      if (i < 2) n |= 1 << (i + 1);
      return n;
    });
  }, []);

  useEffect(() => {
    if (touchNavEnabled) return;
    setVisitedMask(1 << tabIndexFromFeedTab(feedTab));
  }, [touchNavEnabled, feedTab]);

  useEffect(() => {
    if (pageBootReady) return;
    if (loadError || (initialBootReady && pageBootImagesReady)) {
      setPageBootReady(true);
    }
  }, [pageBootReady, loadError, initialBootReady, pageBootImagesReady]);

  useLayoutEffect(() => {
    if (!touchNavEnabled) return;
    const el = pagerRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      setPanelWidth(width);
      if (width > 0) {
        const idx = tabIndexFromFeedTab(feedTab);
        el.scrollLeft = idx * width;
        lastPagerIdxRef.current = idx;
        visitPanel(idx);
        setPagerReady(true);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [touchNavEnabled, feedTab, visitPanel]);

  useEffect(() => {
    if (!touchNavEnabled) {
      setPagerReady(false);
      return;
    }
    setPagerReady(false);
  }, [touchNavEnabled, feedTab]);

  useLayoutEffect(() => {
    if (!touchNavEnabled || panelWidth <= 0) return;
    const el = pagerRef.current;
    if (!el) return;
    if (skipScrollFromUrlRef.current) {
      skipScrollFromUrlRef.current = false;
      return;
    }
    const idx = tabIndexFromFeedTab(feedTab);
    el.scrollTo({ left: idx * panelWidth, behavior: "auto" });
    lastPagerIdxRef.current = idx;
    visitPanel(idx);
    setPagerReady(true);
  }, [touchNavEnabled, feedTab, panelWidth, visitPanel]);

  useEffect(() => {
    if (!touchNavEnabled || panelWidth <= 0) return;
    const el = pagerRef.current;
    if (!el) return;

    const onScroll = () => {
      const idx = Math.min(2, Math.max(0, Math.round(el.scrollLeft / panelWidth)));
      if (idx !== lastPagerIdxRef.current) {
        lastPagerIdxRef.current = idx;
        visitPanel(idx);
      }
      window.dispatchEvent(
        new CustomEvent("la-feed-pager", {
          detail: {
            scrollLeft: el.scrollLeft,
            panelWidth,
            index: idx,
            progress: el.scrollLeft / Math.max(1, panelWidth),
          },
        }),
      );

      if (replaceDebounceRef.current) clearTimeout(replaceDebounceRef.current);
      replaceDebounceRef.current = setTimeout(() => {
        replaceDebounceRef.current = null;
        const i = Math.min(2, Math.max(0, Math.round(el.scrollLeft / panelWidth)));
        const href = pathForTabIndex(i);
        const cur = `${window.location.pathname}${window.location.search}`;
        if (href !== cur) {
          skipScrollFromUrlRef.current = true;
          router.replace(href, { scroll: false });
        }
      }, 100);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (replaceDebounceRef.current) clearTimeout(replaceDebounceRef.current);
    };
  }, [touchNavEnabled, panelWidth, router, visitPanel]);

  const loadPurchasedList = useCallback(async (opts?: { force?: boolean; background?: boolean }) => {
    const force = opts?.force ?? false;
    const background = opts?.background ?? false;
    const hasSnapshot = purchasedFetched || purchasedUnauthorized || purchasedItems.length > 0;
    const isFresh = purchasedFetched && Date.now() - purchasedLastLoadedAtRef.current < PURCHASED_CACHE_TTL_MS;
    if (!force && isFresh) return;
    if (purchasedRequestInFlightRef.current) return;
    purchasedRequestInFlightRef.current = true;
    if (!background && !hasSnapshot) setPurchasedLoading(true);
    try {
      const r = await fetch("/api/life-agents/purchased", { credentials: "include" });
      if (r.status === 401) {
        setPurchasedUnauthorized(true);
        setPurchasedItems([]);
        setPurchasedFetched(true);
        purchasedLastLoadedAtRef.current = Date.now();
        return;
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
        coverUrl: typeof row.coverUrl === "string" ? row.coverUrl : undefined,
        coverImageUrl: typeof row.coverImageUrl === "string" ? row.coverImageUrl : undefined,
        coverPresetKey: typeof row.coverPresetKey === "string" ? row.coverPresetKey : undefined,
      })).filter((row) => row.id);
      setPurchasedUnauthorized(false);
      setPurchasedItems(items);
      setPurchasedFetched(true);
      purchasedLastLoadedAtRef.current = Date.now();
    } catch {
      setPurchasedUnauthorized(false);
      setPurchasedFetched(true);
      if (!hasSnapshot) {
        setPurchasedItems([]);
      }
    } finally {
      setPurchasedLoading(false);
      purchasedRequestInFlightRef.current = false;
    }
  }, [purchasedFetched, purchasedUnauthorized, purchasedItems.length]);

  const loadFavoritesFullList = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    setFavoritesLoading(true);
    setLoadError(null);
    try {
      const all = await fetchAllPublishedLifeAgents(controller.signal);
      setFavoritesSource(all);
      setLoadError(null);
    } catch (err) {
      setFavoritesSource([]);
      setLoadError(
        err instanceof Error && err.name === "AbortError"
          ? "请求超时，请检查后端是否启动或稍后重试"
          : "加载失败，请刷新页面重试",
      );
    } finally {
      clearTimeout(timeoutId);
      setFavoritesLoading(false);
      setFavoritesFetched(true);
    }
  }, []);

  const refreshDiscover = useCallback(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    setLoadError(null);
    setDiscoverLoading(true);
    setDiscoverItems([]);
    setDiscoverNextCursor(null);
    return fetchLifeAgentsPage(48, undefined, controller.signal)
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
  }, []);

  const onPullRefresh = useCallback(async () => {
    if (feedTab === "purchased") {
      await loadPurchasedList({ force: true, background: purchasedFetched || purchasedUnauthorized || purchasedItems.length > 0 });
      return;
    }
    if (feedTab === "favorites") {
      await loadFavoritesFullList();
      return;
    }
    await refreshDiscover();
  }, [feedTab, loadFavoritesFullList, loadPurchasedList, refreshDiscover, purchasedFetched, purchasedUnauthorized, purchasedItems.length]);

  const { pullOffset, refreshing: pullRefreshing } = useLifeAgentsFeedGestures({
    enabled: true,
    onPullRefresh,
  });

  useEffect(() => {
    const sync = () => setFavoriteIds(getFavoriteAgentIds());
    sync();
    setFavoriteIdsHydrated(true);
    window.addEventListener("la-favorite-change", sync);
    return () => window.removeEventListener("la-favorite-change", sync);
  }, []);

  useEffect(() => {
    if ((visitedMask & 4) === 0) return;
    if (!touchNavEnabled && feedTab !== "purchased") return;
    const hasSnapshot = purchasedFetched || purchasedUnauthorized || purchasedItems.length > 0;
    void loadPurchasedList({ background: hasSnapshot });
  }, [visitedMask & 4, touchNavEnabled, feedTab, loadPurchasedList, purchasedFetched, purchasedUnauthorized, purchasedItems.length]);

  useEffect(() => {
    if ((visitedMask & 2) === 0) return;
    if (!touchNavEnabled && (feedTab === "favorites" || feedTab === "purchased")) {
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
  }, [visitedMask & 2, touchNavEnabled, feedTab]);

  useEffect(() => {
    if ((visitedMask & 1) === 0) return;
    if (!touchNavEnabled && feedTab !== "favorites") return;
    if (favoritesFetched) return;
    void loadFavoritesFullList();
  }, [visitedMask & 1, touchNavEnabled, feedTab, favoritesFetched, loadFavoritesFullList]);

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

  const displayProfilesFavorites = useMemo(() => {
    const idSet = new Set(favoriteIds);
    return rankLifeAgentsBySearchQuery(
      favoritesSource.filter((p) => idSet.has(p.id)),
      "",
    );
  }, [favoriteIds, favoritesSource]);

  const displayProfilesDiscover = useMemo(
    () => rankLifeAgentsBySearchQuery(discoverItems, ""),
    [discoverItems],
  );

  const displayProfilesDesktop = useMemo(() => {
    if (feedTab === "favorites") return displayProfilesFavorites;
    if (feedTab === "purchased") return [];
    return displayProfilesDiscover;
  }, [feedTab, displayProfilesFavorites, displayProfilesDiscover]);

  const initialBootCoverUrls = useMemo(() => {
    if (initialBootTab === "favorites") {
      return displayProfilesFavorites
        .slice(0, INITIAL_BOOT_IMAGE_COUNT)
        .map((profile) =>
          resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey),
        );
    }
    if (initialBootTab === "purchased") {
      return purchasedItems
        .slice(0, INITIAL_BOOT_IMAGE_COUNT)
        .map((row) => resolveLifeAgentCoverDisplayUrl(row.coverUrl, row.coverImageUrl, row.coverPresetKey));
    }
    return displayProfilesDiscover
      .slice(0, INITIAL_BOOT_IMAGE_COUNT)
      .map((profile) =>
        resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey),
      );
  }, [displayProfilesDiscover, displayProfilesFavorites, initialBootTab, purchasedItems]);

  useEffect(() => {
    if (!initialBootReady || loadError) return;
    if (pageBootImagesReady) return;

    let cancelled = false;
    const urls = initialBootCoverUrls.filter(Boolean);

    if (urls.length === 0) {
      setPageBootImagesReady(true);
      return;
    }

    Promise.all(urls.map((url) => preloadLifeAgentCover(url))).then(() => {
      if (!cancelled) setPageBootImagesReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [initialBootReady, initialBootCoverUrls, loadError, pageBootImagesReady]);

  const gridLoadingDesktop =
    feedTab === "favorites" ? favoritesLoading : feedTab === "purchased" ? false : discoverLoading;

  const feedWindowKeyDesktop =
    feedTab === "favorites" ? "favorites" : feedTab === "purchased" ? "purchased" : "discover";

  const loadErrorBanner = loadError ? (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
      {loadError}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="ml-3 text-sm font-medium text-amber-700 underline hover:no-underline"
      >
        刷新页面
      </button>
    </div>
  ) : null;

  const favoritesIntro = (
    <div className="mb-3 rounded-[20px] border border-fuchsia-200/[0.35] bg-gradient-to-r from-fuchsia-50/[0.85] to-violet-50/[0.75] px-4 py-3 text-sm text-purple-950/90 shadow-[0_4px_22px_rgba(124,58,237,0.06)] backdrop-blur-sm">
      <p className="font-medium">我的收藏</p>
      <p className="mt-1 text-xs text-purple-900/75">
        {authUser
          ? "在 Agent 详情页封面右上角点星形即可收藏，已登录时收藏会保存到你的账号。"
          : "在 Agent 详情页封面右上角点星形即可收藏；登录后收藏会同步到账号，未登录时仅保存在本机浏览器。"}
      </p>
    </div>
  );

  const purchasedIntro = (
    <div className="mb-3 rounded-[20px] border border-purple-200/[0.28] bg-gradient-to-r from-violet-50/[0.9] to-fuchsia-50/[0.7] px-4 py-3 text-sm text-purple-950/90 shadow-[0_4px_22px_rgba(124,58,237,0.06)] backdrop-blur-sm">
      <p className="font-medium">已购买咨询额度</p>
      <p className="mt-1 text-xs text-purple-900/75">以下为仍有剩余提问次数的 Agent，点击卡片可进入对话。</p>
    </div>
  );

  const favoritesHeading = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
      <h2 className="text-base font-semibold text-purple-950/90 sm:text-lg">我的收藏</h2>
      <span className="shrink-0 rounded-full bg-violet-100/90 px-2.5 py-0.5 text-[11px] text-purple-800 sm:text-xs">
        {favoritesLoading ? UI.loading : `${displayProfilesFavorites.length}/${favoritesSource.length}${UI.countSuffix}`}
      </span>
    </div>
  );

  const purchasedHeading = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
      <h2 className="text-base font-semibold text-purple-950/90 sm:text-lg">已购买</h2>
      <span className="shrink-0 rounded-full bg-violet-100/90 px-2.5 py-0.5 text-[11px] text-purple-800 sm:text-xs">
        {purchasedLoading ? UI.loading : `${purchasedItems.length}${UI.countSuffix}`}
      </span>
    </div>
  );

  const purchasedBody =
    purchasedLoading ? (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-purple-200/[0.18] bg-white/[0.96] shadow-[0_4px_22px_rgba(124,58,237,0.06)]"
          >
            <div className="aspect-square w-full shrink-0 animate-pulse bg-gradient-to-br from-violet-100/80 to-fuchsia-100/50" />
            <div className="flex flex-1 flex-col gap-2 p-2.5">
              <div className="min-h-[2.75rem] animate-pulse rounded-md bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-4 animate-pulse rounded bg-slate-50" />
            </div>
          </div>
        ))}
      </div>
    ) : purchasedUnauthorized ? (
      <div className="rounded-[22px] border border-dashed border-purple-200/40 bg-white/[0.97] px-6 py-12 text-center shadow-[0_6px_28px_rgba(124,58,237,0.06)] backdrop-blur-sm">
        <p className="text-base font-semibold text-purple-950/90">请先登录</p>
        <p className="mt-2 text-sm text-slate-500">登录后可查看你已购买提问额度的 Agent。</p>
        <Link href="/login" className="btn-primary mt-5 inline-flex">
          去登录
        </Link>
      </div>
    ) : purchasedItems.length === 0 ? (
      <div className="rounded-[22px] border border-dashed border-purple-200/40 bg-white/[0.97] px-6 py-12 text-center shadow-[0_6px_28px_rgba(124,58,237,0.06)] backdrop-blur-sm">
        <p className="text-base font-semibold text-purple-950/90">暂无已购额度</p>
        <p className="mt-2 text-sm text-slate-500">购买提问包后，对应 Agent 会出现在这里。</p>
        <Link href="/life-agents" className="mt-5 inline-block text-sm font-semibold text-purple-700 underline decoration-purple-300/70 underline-offset-2 hover:text-purple-900">
          去发现页逛逛
        </Link>
      </div>
    ) : (
      <PurchasedAgentsWindowedGrid rows={purchasedItems} />
    );

  const pagerSectionClass =
    "box-border w-full min-w-[100%] shrink-0 space-y-4 px-1 sm:px-0 max-lg:snap-center max-lg:snap-always";

  if (!pageBootReady || (touchNavEnabled && !pagerReady)) {
    return <LifeAgentsPageLoadingState />;
  }

  return (
    <div className="-mx-1 space-y-4 pb-4 sm:mx-0 sm:space-y-5">
      <>
        {(pullOffset > 0 || pullRefreshing) && (
          <div
            className="pointer-events-none fixed inset-x-0 z-[45] flex justify-center"
            style={{ top: "calc(env(safe-area-inset-top) + 48px)" }}
            aria-live="polite"
          >
            <div
              className="flex items-center gap-2 rounded-full border border-purple-200/50 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-lg backdrop-blur-md"
              style={{
                transform: `translateY(${Math.min(12, pullOffset * 0.12)}px)`,
                opacity: pullRefreshing ? 1 : Math.min(1, pullOffset / 72 + 0.2),
              }}
            >
              {pullRefreshing ? (
                <>
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700"
                    aria-hidden
                  />
                  刷新中…
                </>
              ) : (
                <>松手刷新</>
              )}
            </div>
          </div>
        )}
      </>

      {touchNavEnabled ? (
        <>
          {loadErrorBanner}
          <div className="w-full overflow-hidden">
            <div
              ref={pagerRef}
              className="flex overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory [touch-action:pan-x_pan-y]"
            >
            <section className={pagerSectionClass} aria-label="收藏">
              {favoritesIntro}
              {favoritesHeading}
              <LifeAgentDiscoverCardGrid
                profiles={displayProfilesFavorites}
                loading={favoritesLoading}
                emptyTitle={loadError ? "加载失败" : "暂无收藏"}
                emptySubtitle={
                  loadError
                    ? "请确认 Go 后端已启动（默认端口 8080），或刷新页面重试"
                    : "去「发现」逛逛，在喜欢的 Agent 详情页点亮收藏。"
                }
                windowResetKey="favorites"
                virtualized={false}
              />
            </section>
            <section className={pagerSectionClass} aria-label="发现">
              <LifeAgentDiscoverCardGrid
                profiles={displayProfilesDiscover}
                loading={discoverLoading}
                emptyTitle={loadError ? "加载失败" : UI.emptyTitle}
                emptySubtitle={
                  loadError ? "请确认 Go 后端已启动（默认端口 8080），或刷新页面重试" : UI.emptySubtitle
                }
                windowResetKey="discover"
                onLoadMore={loadMoreDiscover}
                hasMoreFromServer={!!discoverNextCursor}
                loadingMore={discoverLoadingMore}
                virtualized={false}
              />
            </section>
            <section className={pagerSectionClass} aria-label="已购买">
              {purchasedIntro}
              {purchasedHeading}
              {purchasedBody}
            </section>
            </div>
          </div>
        </>
      ) : (
        <section>
          {feedTab === "favorites" ? favoritesIntro : feedTab === "purchased" ? purchasedIntro : null}
          {feedTab === "favorites" || feedTab === "purchased" ? (
            feedTab === "favorites" ? favoritesHeading : purchasedHeading
          ) : null}
          {loadErrorBanner}
          {feedTab === "purchased" ? (
            purchasedBody
          ) : (
            <LifeAgentDiscoverCardGrid
              profiles={displayProfilesDesktop}
              loading={gridLoadingDesktop}
              emptyTitle={loadError ? "加载失败" : feedTab === "favorites" ? "暂无收藏" : UI.emptyTitle}
              emptySubtitle={
                loadError
                  ? "请确认 Go 后端已启动（默认端口 8080），或刷新页面重试"
                  : feedTab === "favorites"
                    ? "去「发现」逛逛，在喜欢的 Agent 详情页点亮收藏。"
                    : UI.emptySubtitle
              }
              windowResetKey={feedWindowKeyDesktop}
              onLoadMore={feedTab !== "favorites" && feedTab !== "purchased" ? loadMoreDiscover : undefined}
              hasMoreFromServer={feedTab !== "favorites" && feedTab !== "purchased" && !!discoverNextCursor}
              loadingMore={discoverLoadingMore}
            />
          )}
        </section>
      )}
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
          const coverUrl = resolveLifeAgentCoverDisplayUrl(row.coverUrl, row.coverImageUrl, row.coverPresetKey);
          const headlineShown = cleanLifeAgentIntroText(row.headline, row.displayName);
          return (
            <motion.article
              key={row.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index < 8 ? index * 0.04 : 0 }}
              className="min-h-0 [contain-intrinsic-size:auto_300px]"
            >
              <Link href={`/life-agents/${row.id}/chat`} className="group flex h-full min-h-0">
                <div className="flex h-full min-h-[260px] w-full flex-col overflow-hidden rounded-[22px] border border-purple-200/[0.22] bg-white/[0.98] shadow-[0_5px_28px_-8px_rgba(124,58,237,0.09)] backdrop-blur-sm transition duration-200 group-hover:border-fuchsia-200/35 group-hover:shadow-[0_10px_36px_-10px_rgba(168,139,235,0.14)] sm:min-h-[280px]">
                  <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-violet-100/40">
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
                        {headlineShown}
                      </span>
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2 sm:p-3">
                    <h3 className="line-clamp-2 min-h-[2.75rem] text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">
                      {row.displayName}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-400">点击进入对话</p>
                    <div className="mt-auto flex items-center justify-between border-t border-purple-100/60 pt-2 text-[11px] text-slate-500">
                      <span>按次咨询</span>
                      <span className="font-bold text-purple-700">
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
      fallback={<LifeAgentsPageLoadingState title="页面初始化中..." />}
    >
      <LifeAgentsPageContent />
    </Suspense>
  );
}