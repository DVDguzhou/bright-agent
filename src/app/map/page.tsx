"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MapAgentMarker } from "@/components/LifeAgentsMapView";
import { agentCategoryColor } from "@/lib/life-agent-category";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBoundLifeAgents, type BoundLifeAgent } from "@/lib/bound-life-agents";
import { startMapGeolocationWatch, type MapGeoWatchHandle } from "@/lib/map-geolocation-watch";
import {
  agentsWithinKm,
  NEARBY_RADIUS_FUZZY_KM,
  openAgentOnMap,
  type AgentWithDistance,
} from "@/lib/map-pin-distance";
import {
  clearMapGpsPreferences,
  clearMapUserLocation,
  readMapShareEnabled,
  readMapShareProfileId,
  readMapUserLocation,
  writeMapShareEnabled,
  writeMapShareProfileId,
  writeMapUserLocation,
} from "@/lib/map-gps-storage";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";
import { getLifeAgentLatLng } from "@/lib/life-agent-map-coords";

const LifeAgentsMapView = dynamic(() => import("@/components/LifeAgentsMapView"), {
  ssr: false,
  loading: () => (
    <div
      className="h-full min-h-[min(62dvh,520px)] w-full animate-pulse bg-paper-300/80"
      aria-hidden
    />
  ),
});

export default function MapPage() {
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<MapAgentMarker[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [boundAgents, setBoundAgents] = useState<BoundLifeAgent[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [userLatLng, setUserLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapLayoutNonce, setMapLayoutNonce] = useState(0);
  const geoWatchRef = useRef<MapGeoWatchHandle | null>(null);
  const firstGeoFitRef = useRef(false);
  const [sheetPortalReady, setSheetPortalReady] = useState(false);
  const [exploreAgents, setExploreAgents] = useState<AgentWithDistance<MapAgentMarker>[]>([]);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [exploreTitle, setExploreTitle] = useState("此区域的 Agent");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setSheetPortalReady(true);
  }, []);

  useEffect(() => {
    if (!sheetOpen && !exploreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen, exploreOpen]);

  useEffect(() => {
    setSelectedProfileId(readMapShareProfileId());
    setShareEnabled(readMapShareEnabled());
    const saved = readMapUserLocation();
    if (saved && readMapShareEnabled()) {
      setUserLatLng(saved);
    }
  }, []);

  useEffect(() => {
    fetch("/api/life-agents/map-pins", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: unknown) => {
        const list = Array.isArray(data) ? data : [];
        const mapped: MapAgentMarker[] = list.map((r: Record<string, unknown>) => ({
          id: String(r.id ?? ""),
          displayName: String(r.displayName ?? "Agent"),
          headline: typeof r.headline === "string" ? r.headline : undefined,
          school: typeof r.school === "string" ? r.school : undefined,
          city: typeof r.city === "string" ? r.city : undefined,
          province: typeof r.province === "string" ? r.province : undefined,
          county: typeof r.county === "string" ? r.county : undefined,
          regions: Array.isArray(r.regions) ? r.regions.filter((x: unknown): x is string => typeof x === "string") : undefined,
          coverImageUrl: typeof r.coverImageUrl === "string" ? r.coverImageUrl : undefined,
          coverPresetKey: typeof r.coverPresetKey === "string" ? r.coverPresetKey : undefined,
        }));
        setAgents(mapped);
        setLoadError(null);
      })
      .catch(() => {
        setAgents([]);
        setLoadError("地图数据加载失败，请稍后重试");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      setMapLayoutNonce((n) => n + 1);
    }
  }, [loading]);

  useEffect(() => {
    if (!user) {
      setBoundAgents([]);
      return;
    }
    const ac = new AbortController();
    fetchBoundLifeAgents(ac.signal)
      .then(setBoundAgents)
      .catch(() => setBoundAgents([]));
    return () => ac.abort();
  }, [user]);

  useEffect(() => {
    if (!user || boundAgents.length === 0) return;
    const id = readMapShareProfileId();
    if (id && !boundAgents.some((b) => b.id === id)) {
      writeMapShareProfileId(null);
      setSelectedProfileId(null);
    }
  }, [user, boundAgents]);

  const stopWatch = useCallback(async () => {
    const h = geoWatchRef.current;
    geoWatchRef.current = null;
    if (h) await h.stop();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setSelectedProfileId(readMapShareProfileId());
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!shareEnabled) {
      void stopWatch();
      setUserLatLng(null);
      firstGeoFitRef.current = false;
      return;
    }

    let cancelled = false;
    setLocating(true);

    void (async () => {
      try {
        await stopWatch();
        if (cancelled) return;
        setGeoError(null);
        firstGeoFitRef.current = false;
        const handle = await startMapGeolocationWatch({
          onSuccess: (c) => {
            if (cancelled) return;
            setUserLatLng(c);
            writeMapUserLocation(c.lat, c.lng);
            setGeoError(null);
            setLocating(false);
            if (!firstGeoFitRef.current) {
              firstGeoFitRef.current = true;
              setMapLayoutNonce((n) => n + 1);
            }
          },
          onError: (msg) => {
            if (cancelled) return;
            setGeoError(msg);
            setShareEnabled(false);
            writeMapShareEnabled(false);
            clearMapUserLocation();
            setLocating(false);
            void stopWatch();
            setUserLatLng(null);
          },
        });
        if (cancelled) {
          await handle.stop();
          return;
        }
        geoWatchRef.current = handle;
      } catch (e) {
        if (cancelled) return;
        setGeoError(e instanceof Error ? e.message : "定位启动失败");
        setShareEnabled(false);
        writeMapShareEnabled(false);
        setLocating(false);
      }
    })();

    return () => {
      cancelled = true;
      void stopWatch();
    };
  }, [shareEnabled, stopWatch]);

  const rememberedAgentLabel = useMemo(() => {
    if (!selectedProfileId) return null;
    const a = agents.find((x) => x.id === selectedProfileId);
    return a?.displayName ?? "已保存的 Agent（地图上若未展示则无法高亮）";
  }, [agents, selectedProfileId]);

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        (a.headline && a.headline.toLowerCase().includes(q))
    );
  }, [agents, search]);

  const nearbyAgents = useMemo(() => {
    if (!shareEnabled || !userLatLng) return [];
    return agentsWithinKm(filteredAgents, userLatLng.lat, userLatLng.lng, NEARBY_RADIUS_FUZZY_KM);
  }, [shareEnabled, userLatLng, filteredAgents]);

  const nearbyLabel = useMemo(() => {
    if (!shareEnabled || !userLatLng) return null;
    if (nearbyAgents.length > 0) return `大致附近 ${nearbyAgents.length} 个 Agent`;
    return `${NEARBY_RADIUS_FUZZY_KM} 公里内暂无 Agent`;
  }, [shareEnabled, userLatLng, nearbyAgents.length]);

  const isLikelyWeChat = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /MicroMessenger/i.test(navigator.userAgent);
  }, []);

  const [isNativeApp, setIsNativeApp] = useState(false);
  useEffect(() => {
    void import("@capacitor/core").then(({ Capacitor }) => {
      setIsNativeApp(Capacitor.isNativePlatform());
    });
  }, []);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const handleExploreArea = useCallback(
    (visible: MapAgentMarker[]) => {
      if (shareEnabled && userLatLng) {
        setExploreAgents(
          agentsWithinKm(visible, userLatLng.lat, userLatLng.lng, NEARBY_RADIUS_FUZZY_KM)
        );
      } else {
        setExploreAgents(
          visible.map((a) => {
            const [mapLat, mapLng] = getLifeAgentLatLng(a);
            return {
              ...a,
              mapLat,
              mapLng,
              distanceKm: 0,
              distanceLabel: "",
            };
          })
        );
      }
      setExploreTitle("此区域的 Agent");
      setExploreOpen(true);
    },
    [shareEnabled, userLatLng]
  );

  const openNearbyList = useCallback(() => {
    if (!nearbyAgents.length) {
      openSheet();
      return;
    }
    setExploreAgents(nearbyAgents);
    setExploreTitle("身边的 Agent");
    setExploreOpen(true);
  }, [nearbyAgents, openSheet]);

  const handleExplorePress = useCallback((): boolean => {
    if (shareEnabled && nearbyAgents.length > 0) {
      setExploreAgents(nearbyAgents);
      setExploreTitle("身边的 Agent");
      setExploreOpen(true);
      return true;
    }
    return false;
  }, [shareEnabled, nearbyAgents]);
  const closeExplore = useCallback(() => setExploreOpen(false), []);

  const pickAgent = (id: string) => {
    setGeoError(null);
    setSelectedProfileId(id);
    writeMapShareProfileId(id);
  };

  const enableSharing = () => {
    setGeoError(null);
    setShareEnabled(true);
    writeMapShareEnabled(true);
  };

  const disableSharing = () => {
    void stopWatch();
    setShareEnabled(false);
    writeMapShareEnabled(false);
    clearMapUserLocation();
    setUserLatLng(null);
    firstGeoFitRef.current = false;
    setMapLayoutNonce((n) => n + 1);
  };

  const clearBinding = () => {
    void stopWatch();
    clearMapGpsPreferences();
    setSelectedProfileId(null);
    setShareEnabled(false);
    setUserLatLng(null);
    setGeoError(null);
    firstGeoFitRef.current = false;
    setMapLayoutNonce((n) => n + 1);
  };

  const highlightId = selectedProfileId;

  return (
    <div className="relative -mx-4 flex min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.5rem)] flex-col bg-paper-200 max-lg:-mx-4 max-lg:pb-20 sm:mx-0 sm:min-h-[70vh] sm:rounded-2xl sm:ring-1 sm:ring-hairline/80">
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-[500] px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2 rounded-2xl bg-paper/95 px-3 py-2 shadow-md ring-1 ring-hairline/40 backdrop-blur-sm">
          <span className="text-oxblood-500" aria-hidden>
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索地图上的 Agent"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-300 focus:outline-none"
            enterKeyHint="search"
          />
        </div>
      </div>

      <div className="relative mt-14 flex flex-1 flex-col overflow-hidden sm:mt-16">
        {loadError && (
          <div className="absolute left-3 right-3 top-2 z-[480] rounded-xl border border-oxblood-200 bg-paper-200 px-3 py-2 text-sm text-ink shadow-sm">
            {loadError}
          </div>
        )}

        {loading || authLoading ? (
          <div className="flex flex-1 items-center justify-center bg-paper-300/50" aria-busy>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-oxblood-500 border-t-transparent" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-base font-semibold text-ink">
              {agents.length === 0 ? "暂无 Agent 可展示" : "没有匹配的 Agent"}
            </p>
            <p className="mt-2 text-sm text-ink-400">
              {agents.length === 0 ? "去发现页看看是否有新入驻的创作者。" : "试试其他关键词。"}
            </p>
            {agents.length === 0 ? (
              <Link
                href="/life-agents"
                className="mt-5 inline-flex rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-paper active:opacity-90"
              >
                去发现
              </Link>
            ) : null}
          </div>
        ) : (
          <LifeAgentsMapView
            agents={filteredAgents}
            allAgents={agents}
            className="flex-1 rounded-none ring-0"
            highlightAgentId={highlightId}
            userLatLng={shareEnabled ? userLatLng : null}
            nearbyLabel={nearbyLabel}
            onNearbyBannerClick={openNearbyList}
            onLocatePress={openSheet}
            onExplorePress={handleExplorePress}
            onExploreArea={handleExploreArea}
            showLocateButton
            mapHeightClass="h-[calc(100dvh-env(safe-area-inset-bottom)-7.5rem)] min-h-[320px] sm:h-[min(72vh,640px)]"
            rounded={false}
            mapLayoutNonce={mapLayoutNonce}
          />
        )}
      </div>

      {sheetPortalReady
        ? createPortal(
            <AnimatePresence>
              {sheetOpen ? (
                <>
                  <motion.button
                    key="map-gps-backdrop"
                    type="button"
                    aria-label="关闭"
                    className="fixed inset-0 z-[10000] bg-ink/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeSheet}
                  />
                  <motion.div
                    key="map-gps-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="map-gps-sheet-title"
                    className="fixed inset-x-0 bottom-0 z-[10001] flex max-h-[min(88dvh,600px)] flex-col rounded-t-3xl bg-paper shadow-2xl ring-1 ring-hairline/40"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  >
                    <div className="shrink-0 px-4 pb-2 pt-3">
                      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-paper-300" />
                      <h2 id="map-gps-sheet-title" className="text-lg font-bold text-ink">
                        附近 Agent
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-ink-400">
                        开启定位后，地图会显示你的大致位置，并按距离列出附近的 Agent，便于了解当地有谁可以咨询。位置仅在本机使用，不会上传服务器。
                      </p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2">
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-ink">查看身边的 Agent</p>
                        {shareEnabled && nearbyLabel ? (
                          <p className="text-sm text-ink-500">
                            {nearbyLabel}
                            <span className="text-ink-400">（大致范围）</span>
                          </p>
                        ) : null}
                        {geoError ? (
                          <div className="space-y-2 rounded-xl border border-oxblood-200 bg-paper-200/90 px-3 py-3 text-sm">
                            <p className="text-oxblood-700">{geoError}</p>
                            <button
                              type="button"
                              className="w-full rounded-xl bg-paper py-2.5 text-sm font-semibold text-oxblood-500 ring-1 ring-oxblood-500/40 active:bg-oxblood-50"
                              onClick={() => {
                                setGeoError(null);
                                enableSharing();
                              }}
                            >
                              重新尝试定位
                            </button>
                          </div>
                        ) : null}
                        {!shareEnabled ? (
                          <button
                            type="button"
                            disabled={locating}
                            className="w-full rounded-2xl bg-oxblood-500 py-3.5 text-sm font-semibold text-paper active:opacity-90 disabled:opacity-60"
                            onClick={enableSharing}
                          >
                            {locating ? "定位中…" : "开启附近定位"}
                          </button>
                        ) : (
                          <>
                            {nearbyAgents.length > 0 ? (
                              <button
                                type="button"
                                className="w-full rounded-2xl bg-oxblood-500 py-3.5 text-sm font-semibold text-paper active:opacity-90"
                                onClick={() => {
                                  openNearbyList();
                                  closeSheet();
                                }}
                              >
                                查看身边 {nearbyAgents.length} 个 Agent
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="w-full rounded-2xl bg-paper-200 py-3.5 text-sm font-semibold text-ink-700 active:bg-paper-300"
                              onClick={disableSharing}
                            >
                              关闭定位
                            </button>
                          </>
                        )}
                      </div>

                      <div className="my-5 h-px bg-hairline/50" />

                      <p className="text-sm font-semibold text-ink">高亮我创建的 Agent（可选）</p>
                      {!user ? (
                        <div className="mt-3 space-y-4">
                          <p className="text-sm text-ink-500">
                            登录后可选择你创建的 Agent，在地图上高亮显示。
                          </p>
                          {selectedProfileId ? (
                            <div className="rounded-2xl border border-oxblood-100 bg-oxblood-50/70 px-3 py-3 text-sm text-ink-600">
                              <p className="font-semibold text-ink">本机记住的高亮</p>
                              <p className="mt-1">{rememberedAgentLabel}</p>
                            </div>
                          ) : null}
                          <Link
                            href={`/login?next=${encodeURIComponent("/map")}`}
                            className="flex w-full items-center justify-center rounded-2xl bg-oxblood-500 py-3.5 text-sm font-semibold text-paper active:opacity-90"
                            onClick={closeSheet}
                          >
                            去登录
                          </Link>
                          {selectedProfileId ? (
                            <button
                              type="button"
                              className="w-full rounded-2xl border border-hairline py-3 text-sm font-medium text-ink-500 active:bg-paper-50"
                              onClick={() => {
                                clearBinding();
                                closeSheet();
                              }}
                            >
                              清除高亮与定位
                            </button>
                          ) : null}
                        </div>
                      ) : boundAgents.length === 0 ? (
                        <div className="mt-3 space-y-4">
                          <p className="text-sm text-ink-500">
                            你还没有自己创建的人生 Agent。创建后可在地图高亮显示。
                          </p>
                          <Link
                            href="/life-agents/create"
                            className="flex w-full items-center justify-center rounded-2xl bg-paper-200 py-3.5 text-sm font-semibold text-ink-700 active:bg-paper-300"
                            onClick={closeSheet}
                          >
                            去创建
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-col gap-2 pr-1">
                          <p className="pb-1 text-xs font-medium text-ink-500">
                            点选下方一项即可在地图上高亮。
                          </p>
                          {boundAgents.map((b) => {
                            const checked = selectedProfileId === b.id;
                            return (
                              <label
                                key={b.id}
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition ${
                                  checked ? "border-oxblood-500 bg-oxblood-50/80" : "border-hairline bg-paper active:bg-paper-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="map-bound-agent"
                                  className="mt-1 h-4 w-4 accent-[#0091ff]"
                                  checked={checked}
                                  onChange={() => pickAgent(b.id)}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="font-semibold text-ink">{b.displayName}</span>
                                  {b.headline ? (
                                    <span className="mt-0.5 block text-xs text-ink-400">
                                      {cleanLifeAgentIntroText(b.headline, b.displayName)}
                                    </span>
                                  ) : null}
                                </span>
                              </label>
                            );
                          })}
                          {selectedProfileId ? (
                            <button
                              type="button"
                              className="mt-2 w-full rounded-2xl border border-hairline py-3 text-sm font-medium text-ink-500 active:bg-paper-50"
                              onClick={clearBinding}
                            >
                              清除高亮与定位
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 space-y-3 border-t border-hairline/50 bg-paper px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
                      <p className="text-center text-[11px] leading-snug text-ink-400">
                        {isNativeApp ? (
                          <>
                            <span className="font-semibold text-ink-500">BrightAgent App：</span>
                            使用系统模糊定位，首次会弹出授权。
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-ink-500">浏览器：</span>
                            请用 https 打开并允许位置权限；定位精度为大致范围，非精确 GPS。
                            {isLikelyWeChat ? (
                              <span className="mt-1 block text-oxblood-700">
                                微信内可能限制网页定位，请「在浏览器中打开」。
                              </span>
                            ) : null}
                          </>
                        )}
                      </p>

                      <button
                        type="button"
                        className="w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-paper active:opacity-90"
                        onClick={closeSheet}
                      >
                        完成
                      </button>
                      <p className="pb-1 text-center text-xs text-ink-300">也可点击上方空白处关闭</p>
                    </div>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}

      {sheetPortalReady
        ? createPortal(
            <AnimatePresence>
              {exploreOpen ? (
                <>
                  <motion.button
                    key="explore-backdrop"
                    type="button"
                    aria-label="关闭"
                    className="fixed inset-0 z-[10000] bg-ink/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeExplore}
                  />
                  <motion.div
                    key="explore-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="explore-sheet-title"
                    className="fixed inset-x-0 bottom-0 z-[10001] flex max-h-[min(80dvh,600px)] flex-col rounded-t-3xl bg-paper shadow-2xl ring-1 ring-hairline/40"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  >
                    <div className="shrink-0 px-4 pb-2 pt-3">
                      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-paper-300" />
                      <div className="flex items-center justify-between">
                        <h2 id="explore-sheet-title" className="text-lg font-bold text-ink">
                          {exploreTitle}
                        </h2>
                        <span className="text-sm text-ink-300">{exploreAgents.length} 个</span>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      {exploreAgents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                          <p className="text-sm text-ink-400">当前视野内暂无 Agent</p>
                          <p className="mt-1 text-xs text-ink-300">试试缩小地图或移动到其他区域</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-hairline/50">
                          {exploreAgents.map((a) => {
                            const coverSrc = resolveLifeAgentCoverUrl(a.coverImageUrl, a.coverPresetKey);
                            const catColor = agentCategoryColor(a.headline, a.displayName);
                            return (
                              <Link
                                key={a.id}
                                href={`/life-agents/${encodeURIComponent(a.id)}`}
                                className="flex items-center gap-3 px-4 py-3 transition active:bg-paper-50"
                                onClick={closeExplore}
                              >
                                <img
                                  src={coverSrc}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-2xl bg-paper-200 object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: catColor }} />
                                    <span className="truncate text-sm font-semibold text-ink">{a.displayName}</span>
                                  </div>
                                  {a.headline ? (
                                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-400">
                                      {cleanLifeAgentIntroText(a.headline, a.displayName)}
                                    </p>
                                  ) : null}
                                  {a.distanceLabel ? (
                                    <p className="mt-0.5 text-[11px] font-medium text-oxblood-600">{a.distanceLabel}</p>
                                  ) : a.school ? (
                                    <p className="mt-0.5 truncate text-[11px] text-ink-300">{a.school}</p>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                  {Number.isFinite(a.mapLat) && Number.isFinite(a.mapLng) ? (
                                    <button
                                      type="button"
                                      className="text-[11px] font-semibold text-oxblood-600"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openAgentOnMap({
                                          displayName: a.displayName,
                                          mapLat: a.mapLat,
                                          mapLng: a.mapLng,
                                          city: a.city,
                                          province: a.province,
                                        });
                                      }}
                                    >
                                      查看位置
                                    </button>
                                  ) : null}
                                  <svg className="h-4 w-4 text-ink-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 border-t border-hairline/50 bg-paper px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                      <button
                        type="button"
                        className="w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-paper active:opacity-90"
                        onClick={closeExplore}
                      >
                        关闭
                      </button>
                    </div>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  );
}
