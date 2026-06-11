"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowedSlice } from "@/lib/use-windowed-slice";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { fetchFavoriteLifeAgents, fetchLifeAgentsPage } from "@/lib/life-agents-list-api";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { useAuth } from "@/contexts/AuthContext";
import { useLifeAgentsFeedGestures, useMobileTouchNavEnabled } from "@/hooks/use-life-agents-feed-gestures";
import { lifeAgentShowsPurchaseUi } from "@/lib/life-agent-commerce";
import { OnboardingSheet, useOnboarding } from "@/components/OnboardingSheet";

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
const INITIAL_VISIBLE_IMAGE_COUNT_MOBILE = 2;
const INITIAL_VISIBLE_IMAGE_COUNT_DESKTOP = 4;


type FeedTabKey = "favorites" | "discover" | "purchased";

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

function tabIndexFromFeedTab(tab: string | null): number {
  if (tab === "purchased") return 1;
  return 0;
}

function pathForTabIndex(i: number): string {
  if (i === 1) return "/life-agents?tab=purchased";
  return "/life-agents";
}

/** 目标 scrollLeft：panel 左沿在滚动容器内容坐标系中的位置（相对 getBoundingClientRect，不依赖 offsetParent）。 */
function feedPanelScrollLeft(
  scrollEl: HTMLDivElement,
  panels: readonly (HTMLElement | null)[],
  idx: number,
  fallbackViewportW: number,
): number {
  const p = panels[idx];
  if (!p) return idx * Math.max(1, fallbackViewportW);
  const sr = scrollEl.getBoundingClientRect();
  const pr = p.getBoundingClientRect();
  return pr.left - sr.left + scrollEl.scrollLeft;
}

/** 视口中心落在哪一屏（与 feedPanelScrollLeft 同一套几何）。 */
function feedTabIndexFromScrollEl(el: HTMLDivElement, panels: readonly (HTMLElement | null)[]): number {
  const cx = el.scrollLeft + el.clientWidth / 2;
  const sr = el.getBoundingClientRect();
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (!p) continue;
    const pr = p.getBoundingClientRect();
    const L = pr.left - sr.left + el.scrollLeft;
    const R = L + pr.width;
    if (cx >= L && cx < R) return i;
  }
  const w = el.clientWidth;
  return Math.min(panels.length - 1, Math.max(0, Math.round(el.scrollLeft / Math.max(1, w))));
}

function feedPagerProgress(
  scrollEl: HTMLDivElement,
  scrollLeft: number,
  panels: readonly (HTMLElement | null)[],
  viewportW: number,
): number {
  const p0 = panels[0];
  if (p0) {
    const step = p0.getBoundingClientRect().width;
    if (step > 0) return scrollLeft / step;
  }
  return scrollLeft / Math.max(1, viewportW);
}

function normalizeFeedTab(tab: string | null): FeedTabKey {
  if (tab === "favorites") return "favorites";
  if (tab === "purchased") return "purchased";
  return "discover";
}

function preloadLifeAgentCover(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const seen = new Set<string>();

    const attempt = (candidate: string) => {
      const normalized = normalizeLifeAgentCoverImgSrc(candidate);
      if (seen.has(normalized)) {
        resolve();
        return;
      }
      seen.add(normalized);

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


/** 页级骨架：与 LifeAgentDiscoverCard 的真实形态一致（4:5 平面封面 + 发丝线 + 文字行），避免加载前后换形 */
function LifeAgentsPageLoadingState({ title = "加载中…" }: { title?: string }) {
  return (
    <div className="-mx-1 space-y-4 pb-4 sm:mx-0 sm:space-y-5" aria-live="polite">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-1 pb-3">
        <p className="text-sm text-ink-400">{title}</p>
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-hairline border-t-ink" aria-hidden />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="min-h-0">
            <div className="w-full animate-pulse bg-paper-200" style={{ aspectRatio: "4 / 5" }} />
            <div className="mt-2.5 space-y-1.5 border-t border-hairline pt-2.5">
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

function LifeAgentsPageContent() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedTab = searchParams.get("tab");
  const showPurchaseUi = lifeAgentShowsPurchaseUi();
  const initialFeedTabRef = useRef<FeedTabKey>(normalizeFeedTab(feedTab));
  const [discoverItems, setDiscoverItems] = useState<LifeAgentListItem[]>([]);
  const [discoverNextCursor, setDiscoverNextCursor] = useState<string | null>(null);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [discoverLoadingMore, setDiscoverLoadingMore] = useState(false);
  const [favoritesSource, setFavoritesSource] = useState<LifeAgentListItem[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesFetched, setFavoritesFetched] = useState(false);

  const discoverItemsRef = useRef(discoverItems);
  discoverItemsRef.current = discoverItems;

  const discoverSeedRef = useRef((Math.random() * 2147483647) | 0);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedAgentRow[]>([]);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [purchasedUnauthorized, setPurchasedUnauthorized] = useState(false);
  const [purchasedFetched, setPurchasedFetched] = useState(false);
  const [initialPageReady, setInitialPageReady] = useState(false);

  const touchNavEnabled = useMobileTouchNavEnabled();
  const { open: onboardingOpen, pulsing: firstCardPulsing, dismiss: dismissOnboarding } = useOnboarding();

  const [visitedMask, setVisitedMask] = useState(() => 1 << tabIndexFromFeedTab(feedTab));
  const pagerRef = useRef<HTMLDivElement>(null);
  /** 横向两屏 DOM，用于按真实几何滚动（避免仅用 clientWidth 乘 index 对不齐） */
  const feedPanelElsRef = useRef<(HTMLElement | null)[]>([null, null]);
  const [panelWidth, setPanelWidth] = useState(0);
  /** 程序化 scrollTo 完成前关闭 snap，避免 snap-mandatory 把位置吸回第一屏 */
  const [feedPagerSnapEnabled, setFeedPagerSnapEnabled] = useState(false);
  const skipScrollFromUrlRef = useRef(false);
  const replaceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPagerIdxRef = useRef(-1);
  const purchasedLastLoadedAtRef = useRef(0);
  const purchasedRequestInFlightRef = useRef(false);
  const initialFeedTab = initialFeedTabRef.current;

  useEffect(() => {
    if (showPurchaseUi || feedTab !== "purchased") return;
    router.replace("/life-agents", { scroll: false });
  }, [showPurchaseUi, feedTab, router]);


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

  useLayoutEffect(() => {
    if (!touchNavEnabled) {
      setFeedPagerSnapEnabled(false);
      return;
    }
    const el = pagerRef.current;
    if (!el) return;
    let raf1 = 0;
    let raf2 = 0;
    let cancelled = false;
    const panels = () => feedPanelElsRef.current;
    const enableSnapSoon = () => {
      requestAnimationFrame(() => {
        if (!cancelled) setFeedPagerSnapEnabled(true);
      });
    };
    setFeedPagerSnapEnabled(false);
    const measure = () => {
      const vw = el.clientWidth;
      const p0 = panels()[0];
      const pw = p0 ? p0.getBoundingClientRect().width : vw;
      setPanelWidth(pw > 0 ? pw : vw);
      if (vw > 0) {
        const idx = tabIndexFromFeedTab(feedTab);
        const left = feedPanelScrollLeft(el, panels(), idx, vw);
        el.scrollTo({ left, behavior: "auto" });
        lastPagerIdxRef.current = idx;
        visitPanel(idx);
      }
    };
    measure();
    raf1 = requestAnimationFrame(() => {
      if (cancelled) return;
      measure();
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        measure();
        enableSnapSoon();
      });
    });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro.disconnect();
    };
  }, [touchNavEnabled, feedTab, visitPanel, initialPageReady]);

  useLayoutEffect(() => {
    if (!touchNavEnabled || panelWidth <= 0) return;
    const el = pagerRef.current;
    if (!el) return;
    if (skipScrollFromUrlRef.current) {
      skipScrollFromUrlRef.current = false;
      return;
    }
    const idx = tabIndexFromFeedTab(feedTab);
    const left = feedPanelScrollLeft(el, feedPanelElsRef.current, idx, el.clientWidth);
    el.scrollTo({ left, behavior: "auto" });
    lastPagerIdxRef.current = idx;
    visitPanel(idx);
  }, [touchNavEnabled, feedTab, panelWidth, visitPanel]);

  useEffect(() => {
    if (!touchNavEnabled || panelWidth <= 0) return;
    const el = pagerRef.current;
    if (!el) return;

    const onScroll = () => {
      const panels = feedPanelElsRef.current;
      const idx = feedTabIndexFromScrollEl(el, panels);
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
            progress: feedPagerProgress(el, el.scrollLeft, panels, el.clientWidth),
          },
        }),
      );

      if (replaceDebounceRef.current) clearTimeout(replaceDebounceRef.current);
      replaceDebounceRef.current = setTimeout(() => {
        replaceDebounceRef.current = null;
        const i = feedTabIndexFromScrollEl(el, feedPanelElsRef.current);
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
  }, [touchNavEnabled, panelWidth, router, visitPanel, initialPageReady]);

  /** snap / 晚一拍的布局有时会盖掉首次 scrollTo，延迟再对齐一次（仅当与 URL 不一致时）。 */
  useEffect(() => {
    if (!touchNavEnabled) return;
    const el = pagerRef.current;
    if (!el) return;
    const want = tabIndexFromFeedTab(feedTab);
    const fix = () => {
      const cur = feedTabIndexFromScrollEl(el, feedPanelElsRef.current);
      if (cur !== want) {
        setFeedPagerSnapEnabled(false);
        el.scrollTo({
          left: feedPanelScrollLeft(el, feedPanelElsRef.current, want, el.clientWidth),
          behavior: "auto",
        });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setFeedPagerSnapEnabled(true));
        });
      }
    };
    const t = window.setTimeout(fix, 80);
    const t2 = window.setTimeout(fix, 280);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [touchNavEnabled, feedTab, initialPageReady]);

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
      const all = await fetchFavoriteLifeAgents(controller.signal);
      setFavoritesSource(all);
      setLoadError(null);
    } catch (err) {
      setFavoritesSource([]);
      setLoadError(
        err instanceof Error && err.name === "AbortError"
          ? "请求超时，请稍后重试"
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
    discoverSeedRef.current = (Math.random() * 2147483647) | 0;
    const seed = discoverSeedRef.current;
    setLoadError(null);
    setDiscoverLoading(true);
    setDiscoverItems([]);
    setDiscoverNextCursor(null);
    return fetchLifeAgentsPage(48, undefined, controller.signal, seed)
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
            ? "请求超时，请稍后重试"
            : "加载失败，请刷新页面重试",
        );
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setDiscoverLoading(false);
      });
  }, []);

  const onPullRefresh = useCallback(async () => {
    if (feedTab === "favorites") {
      await loadFavoritesFullList();
      return;
    }
    if (feedTab === "purchased") {
      await loadPurchasedList({ force: true, background: purchasedFetched || purchasedUnauthorized || purchasedItems.length > 0 });
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
    window.addEventListener("la-favorite-change", sync);
    return () => window.removeEventListener("la-favorite-change", sync);
  }, []);

  useEffect(() => {
    if ((visitedMask & 2) === 0) return;
    if (!touchNavEnabled && feedTab !== "purchased") return;
    const hasSnapshot = purchasedFetched || purchasedUnauthorized || purchasedItems.length > 0;
    void loadPurchasedList({ background: hasSnapshot });
  }, [visitedMask & 2, touchNavEnabled, feedTab, loadPurchasedList, purchasedFetched, purchasedUnauthorized, purchasedItems.length]);

  useEffect(() => {
    if ((visitedMask & 1) === 0) return;
    if (!touchNavEnabled && feedTab === "purchased") {
      setDiscoverLoading(false);
      return;
    }
    if (discoverItemsRef.current.length > 0) {
      setDiscoverLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const seed = discoverSeedRef.current;
    setLoadError(null);
    setDiscoverLoading(true);
    fetchLifeAgentsPage(48, undefined, controller.signal, seed)
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
            ? "请求超时，请稍后重试"
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
  }, [visitedMask & 1, touchNavEnabled, feedTab]);

  useEffect(() => {
    if (feedTab !== "favorites") return;
    if (favoritesFetched) return;
    void loadFavoritesFullList();
  }, [feedTab, favoritesFetched, loadFavoritesFullList]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [feedTab]);

  const loadMoreDiscover = useCallback(async () => {
    if (!discoverNextCursor || discoverLoadingMore) return;
    setDiscoverLoadingMore(true);
    try {
      const { items, nextCursor } = await fetchLifeAgentsPage(
        48, discoverNextCursor, undefined, discoverSeedRef.current,
      );
      setDiscoverItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const newItems: LifeAgentListItem[] = [];
        for (const it of items) {
          if (!seen.has(it.id)) {
            seen.add(it.id);
            newItems.push(it);
          }
        }
        return [...prev, ...newItems];
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

  const displayProfilesDiscover = discoverItems;

  const displayProfilesDesktop = useMemo(() => {
    if (feedTab === "favorites") return displayProfilesFavorites;
    if (feedTab === "purchased") return [];
    return displayProfilesDiscover;
  }, [feedTab, displayProfilesFavorites, displayProfilesDiscover]);

  const initialVisibleImageCount = touchNavEnabled ? INITIAL_VISIBLE_IMAGE_COUNT_MOBILE : INITIAL_VISIBLE_IMAGE_COUNT_DESKTOP;

  const initialFeedImageUrls = useMemo(() => {
    if (initialFeedTab === "favorites") {
      return displayProfilesFavorites
        .slice(0, initialVisibleImageCount)
        .map((profile) =>
          resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey),
        );
    }
    if (initialFeedTab === "purchased") {
      return purchasedItems
        .slice(0, initialVisibleImageCount)
        .map((row) => resolveLifeAgentCoverDisplayUrl(row.coverUrl, row.coverImageUrl, row.coverPresetKey));
    }
    return displayProfilesDiscover
      .slice(0, initialVisibleImageCount)
      .map((profile) =>
        resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey),
      );
  }, [displayProfilesDiscover, displayProfilesFavorites, initialFeedTab, initialVisibleImageCount, purchasedItems]);

  const initialFeedDataReady =
    initialFeedTab === "purchased"
      ? purchasedFetched || purchasedUnauthorized
      : initialFeedTab === "favorites"
        ? favoritesFetched
        : !discoverLoading;

  useEffect(() => {
    // 首屏请求失败也要离开骨架屏，否则报错横幅和重试入口永远不可见
    if (!initialPageReady && (initialFeedDataReady || loadError)) {
      setInitialPageReady(true);
    }
  }, [initialFeedDataReady, initialPageReady, loadError]);

  useEffect(() => {
    const urls = initialFeedImageUrls.filter(Boolean);
    if (urls.length === 0) return;
    void Promise.all(urls.map((url) => preloadLifeAgentCover(url)));
  }, [initialFeedImageUrls]);

  const gridLoadingDesktop =
    feedTab === "favorites" ? favoritesLoading : feedTab === "purchased" ? false : discoverLoading;

  const feedWindowKeyDesktop =
    feedTab === "favorites" ? "favorites" : feedTab === "purchased" ? "purchased" : "discover";

  const loadErrorBanner = loadError ? (
    <div className="mb-6 rounded-sm border border-oxblood-200 bg-paper-100 px-4 py-3 text-oxblood-700">
      {loadError}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="pressable ml-3 text-sm font-medium text-oxblood-600 underline hover:no-underline"
      >
        刷新页面
      </button>
    </div>
  ) : null;

  const favoritesIntro = (
    <div className="mb-3 rounded-sm border border-hairline bg-paper-50 px-4 py-3 text-sm text-ink">
      <p className="font-medium">我的收藏</p>
      <p className="mt-1 text-xs text-ink-500">
        {authUser
          ? "在 Agent 详情页封面右上角点星形即可收藏，已登录时收藏会保存到你的账号。"
          : "在 Agent 详情页封面右上角点星形即可收藏；登录后收藏会同步到账号，未登录时仅保存在本机浏览器。"}
      </p>
    </div>
  );

  const purchasedIntro = (
    <div className="mb-3 rounded-sm border border-hairline bg-paper-50 px-4 py-3 text-sm text-ink">
      <p className="font-medium">已购买咨询额度</p>
      <p className="mt-1 text-xs text-ink-500">以下为仍有剩余提问次数的 Agent，点击卡片可进入对话。</p>
    </div>
  );

  const favoritesHeading = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
      <h2 className="text-base font-semibold text-ink sm:text-lg">我的收藏</h2>
      <span className="shrink-0 border border-hairline px-2 py-0.5 text-[11px] text-ink-500 sm:text-xs">
        {favoritesLoading ? UI.loading : `${displayProfilesFavorites.length}/${favoritesSource.length}${UI.countSuffix}`}
      </span>
    </div>
  );

  const purchasedHeading = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
      <h2 className="text-base font-semibold text-ink sm:text-lg">已购买</h2>
      <span className="shrink-0 border border-hairline px-2 py-0.5 text-[11px] text-ink-500 sm:text-xs">
        {purchasedLoading ? UI.loading : `${purchasedItems.length}${UI.countSuffix}`}
      </span>
    </div>
  );

  const purchasedBody =
    purchasedLoading ? (
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="min-h-0">
            <div className="w-full animate-pulse bg-paper-200" style={{ aspectRatio: "4 / 5" }} />
            <div className="mt-2.5 space-y-1.5 border-t border-hairline pt-2.5">
              <div className="h-3.5 w-3/5 animate-pulse bg-paper-200" />
              <div className="h-3 w-full animate-pulse bg-paper-200" />
              <div className="h-3 w-2/3 animate-pulse bg-paper-200" />
            </div>
          </div>
        ))}
      </div>
    ) : purchasedUnauthorized ? (
      <div className="border-t border-b border-hairline px-6 py-16 text-center">
        <p className="font-serif text-xl font-medium text-ink">请先登录</p>
        <p className="mt-2 font-serif text-sm italic text-ink-400">登录后可查看你已购买提问额度的 Agent。</p>
        <Link href="/login" className="btn-primary pressable mt-6 inline-flex">
          去登录
        </Link>
      </div>
    ) : purchasedItems.length === 0 ? (
      <div className="border-t border-b border-hairline px-6 py-16 text-center">
        <p className="font-serif text-xl font-medium text-ink">暂无已购额度</p>
        <p className="mt-2 font-serif text-sm italic text-ink-400">购买提问包后，对应 Agent 会出现在这里。</p>
        <Link href="/life-agents" className="pressable mt-5 inline-block text-sm font-medium text-ink-600 underline decoration-hairline underline-offset-2 hover:text-ink">
          去发现页逛逛
        </Link>
      </div>
    ) : (
      <PurchasedAgentsWindowedGrid rows={purchasedItems} />
    );


  const pagerSectionClass =
    "box-border w-full min-w-[100%] shrink-0 basis-full grow-0 space-y-4 px-1 sm:px-0 max-lg:snap-start max-lg:snap-always";

  if (!initialPageReady) {
    return <LifeAgentsPageLoadingState />;
  }

  return (
    <div className="-mx-1 space-y-4 pb-4 sm:mx-0 sm:space-y-5">
      <OnboardingSheet open={onboardingOpen} onDismiss={dismissOnboarding} />
      <>
        {(pullOffset > 0 || pullRefreshing) && (
          <div
            className="pointer-events-none fixed inset-x-0 z-[45] flex justify-center"
            style={{ top: "calc(env(safe-area-inset-top) + 48px)" }}
            aria-live="polite"
          >
            <div
              className="flex items-center gap-2 rounded-full border border-hairline/50 bg-paper/95 px-3 py-1.5 text-xs font-medium text-ink-500 shadow-lg backdrop-blur-md"
              style={{
                transform: `translateY(${Math.min(12, pullOffset * 0.12)}px)`,
                opacity: pullRefreshing ? 1 : Math.min(1, pullOffset / 72 + 0.2),
              }}
            >
              {pullRefreshing ? (
                <>
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-hairline border-t-ink"
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

      {touchNavEnabled && feedTab !== "favorites" ? (
        <>
          {loadErrorBanner}
          <div className="w-full overflow-hidden">
            <div
              ref={pagerRef}
              className={`flex overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x_pan-y] ${
                feedPagerSnapEnabled ? "snap-x snap-mandatory" : "snap-none"
              }`}
            >
            <section
              ref={(node) => {
                feedPanelElsRef.current[0] = node;
              }}
              className={pagerSectionClass}
              aria-label="发现"
            >
                <LifeAgentDiscoverCardGrid
                profiles={displayProfilesDiscover}
                loading={discoverLoading}
                emptyTitle={loadError ? "加载失败" : UI.emptyTitle}
                emptySubtitle={
                  loadError ? "网络连接不稳定，请下拉刷新或稍后重试" : UI.emptySubtitle
                }
                windowResetKey="discover"
                onLoadMore={loadMoreDiscover}
                hasMoreFromServer={!!discoverNextCursor}
                loadingMore={discoverLoadingMore}
                virtualized={false}
                showFirstCardPulse={firstCardPulsing}
              />
            </section>
            {showPurchaseUi ? (
            <section
              ref={(node) => {
                feedPanelElsRef.current[1] = node;
              }}
              className={pagerSectionClass}
              aria-label="已购买"
            >
              {purchasedIntro}
              {purchasedHeading}
              {purchasedBody}
            </section>
            ) : null}
            </div>
          </div>
        </>
      ) : (
        <section>
          {feedTab === "favorites" ? favoritesIntro : feedTab === "purchased" && showPurchaseUi ? purchasedIntro : null}
          {feedTab === "favorites" || (feedTab === "purchased" && showPurchaseUi) ? (
            feedTab === "favorites" ? favoritesHeading : purchasedHeading
          ) : null}
          {loadErrorBanner}
          {feedTab === "purchased" && showPurchaseUi ? (
            purchasedBody
          ) : (
            <LifeAgentDiscoverCardGrid
              profiles={displayProfilesDesktop}
              loading={gridLoadingDesktop}
              emptyTitle={loadError ? "加载失败" : feedTab === "favorites" ? "暂无收藏" : UI.emptyTitle}
              emptySubtitle={
                loadError
                  ? "网络连接不稳定，请下拉刷新或稍后重试"
                  : feedTab === "favorites"
                    ? "去「发现」逛逛，在喜欢的 Agent 详情页点亮收藏。"
                    : UI.emptySubtitle
              }
              windowResetKey={feedWindowKeyDesktop}
              onLoadMore={feedTab !== "favorites" && feedTab !== "purchased" ? loadMoreDiscover : undefined}
              hasMoreFromServer={feedTab !== "favorites" && feedTab !== "purchased" && !!discoverNextCursor}
              loadingMore={discoverLoadingMore}
              virtualized={false}
              showFirstCardPulse={firstCardPulsing && feedTab !== "favorites" && feedTab !== "purchased"}
            />
          )}
        </section>
      )}
    </div>
  );
}

/** 已购列表：卡片形态与发现页 LifeAgentDiscoverCard 同一套（4:5 平面封面 + 发丝线 + serif 标题），分批挂载避免一次渲染过多 */
function PurchasedAgentsWindowedGrid({ rows }: { rows: PurchasedAgentRow[] }) {
  const showPrice = lifeAgentShowsPurchaseUi();
  const { slice, hasMore, sentinelRef } = useWindowedSlice(rows, { initial: 12, page: 12 });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">
        {slice.map((row, index) => {
          const coverUrl = resolveLifeAgentCoverDisplayUrl(row.coverUrl, row.coverImageUrl, row.coverPresetKey);
          const headlineShown = cleanLifeAgentIntroText(row.headline, row.displayName);
          return (
            <article key={row.id} className="min-h-0 [contain-intrinsic-size:auto_340px]">
              <Link
                href={`/life-agents/${row.id}/chat`}
                className="pressable group block focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink"
              >
                <div className="relative w-full overflow-hidden bg-paper-200" style={{ aspectRatio: "4 / 5" }}>
                  <LifeAgentCoverImage
                    src={coverUrl}
                    alt=""
                    fill
                    className="object-cover transition-opacity duration-200 group-hover:opacity-90"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                    priority={index < 6}
                    loading={index < 6 ? undefined : "lazy"}
                  />
                  {(row.verificationStatus === "verified" || row.verificationStatus === "pending") && (
                    <div className="absolute right-2 top-2 rounded-full bg-paper/90 px-1.5 py-0.5 backdrop-blur-sm">
                      <VerificationBadge status={row.verificationStatus ?? "none"} size="sm" />
                    </div>
                  )}
                  {showPrice ? (
                    <div className="absolute left-2 top-2 rounded-full bg-olive-600 px-2 py-0.5 text-[10px] font-medium text-paper">
                      剩余 {row.remainingQuestions} 次
                    </div>
                  ) : null}
                </div>
                <div className="border-t border-hairline pt-2.5">
                  <h3 className="font-serif text-[15px] font-medium leading-tight text-ink line-clamp-1 sm:text-base">
                    {row.displayName}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 min-h-[2.5em] font-serif text-[12.5px] italic leading-snug text-ink-400">
                    {headlineShown}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between gap-2 text-[11px] text-ink-300">
                    <span className="truncate">点击进入对话</span>
                    {showPrice ? (
                      <span className="shrink-0 font-serif text-[15px] font-medium tabular-nums text-oxblood-500">
                        ¥{(row.pricePerQuestion / 100).toFixed(0)}
                        <span className="ml-0.5 text-[10px] font-normal not-italic text-ink-300">/问</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
      {hasMore ? (
        <div ref={sentinelRef} className="flex min-h-[52px] items-center justify-center py-2" aria-hidden>
          <span className="font-serif text-xs italic text-ink-300">继续阅读</span>
        </div>
      ) : null}
    </div>
  );
}

export default function LifeAgentsPage() {
  return (
    <Suspense
      fallback={<LifeAgentsPageLoadingState />}
    >
      <LifeAgentsPageContent />
    </Suspense>
  );
}
