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
  clearMapGpsPreferences,
  readMapShareEnabled,
  readMapShareProfileId,
  writeMapShareEnabled,
  writeMapShareProfileId,
} from "@/lib/map-gps-storage";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";

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
  const [exploreAgents, setExploreAgents] = useState<MapAgentMarker[]>([]);
  const [exploreOpen, setExploreOpen] = useState(false);

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
      clearMapGpsPreferences();
      setSelectedProfileId(null);
      setShareEnabled(false);
      setUserLatLng(null);
    }
  }, [user, boundAgents]);

  const stopWatch = useCallback(async () => {
    const h = geoWatchRef.current;
    geoWatchRef.current = null;
    if (h) await h.stop();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void stopWatch();
      setUserLatLng(null);
      setShareEnabled(false);
      setSelectedProfileId(readMapShareProfileId());
      return;
    }
    setSelectedProfileId(readMapShareProfileId());
    setShareEnabled(readMapShareEnabled());
  }, [user, authLoading, stopWatch]);

  useEffect(() => {
    if (!shareEnabled || !selectedProfileId || !user) {
      void stopWatch();
      setUserLatLng(null);
      firstGeoFitRef.current = false;
      return;
    }

    let cancelled = false;

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
            setGeoError(null);
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
      }
    })();

    return () => {
      cancelled = true;
      void stopWatch();
    };
  }, [shareEnabled, selectedProfileId, user, stopWatch]);

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

  const handleExploreArea = useCallback((visible: MapAgentMarker[]) => {
    setExploreAgents(visible);
    setExploreOpen(true);
  }, []);
  const closeExplore = useCallback(() => setExploreOpen(false), []);

  const pickAgent = (id: string) => {
    setGeoError(null);
    setSelectedProfileId(id);
    writeMapShareProfileId(id);
  };

  const enableSharing = () => {
    if (!selectedProfileId) {
      setGeoError("请先选择一个你自己创建的 Agent");
      return;
    }
    setGeoError(null);
    setShareEnabled(true);
    writeMapShareEnabled(true);
  };

  const disableSharing = () => {
    void stopWatch();
    setShareEnabled(false);
    writeMapShareEnabled(false);
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
            userLatLng={userLatLng}
            onLocatePress={openSheet}
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
                        位置与绑定 Agent
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-ink-400">
                        只能绑定<strong className="font-semibold text-ink-600">你自己创建</strong>
                        的人生 Agent，不能选别人的。仅在本页显示大致位置并高亮该 Agent；同一时间只能选一个；坐标不会上传服务器。
                      </p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2">
                      {!user ? (
                        <div className="space-y-4">
                          <p className="text-sm text-ink-500">
                            登录后可从<strong className="font-semibold text-ink-700">你自己创建的</strong>
                            人生 Agent 里选择并开启定位。未登录时仍会本机记住上次选中项，用于地图高亮（须是地图上仍展示的 Agent）。
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
                              清除本机记住的 Agent
                            </button>
                          ) : null}
                        </div>
                      ) : boundAgents.length === 0 ? (
                        <div className="space-y-4">
                          <p className="text-sm text-ink-500">
                            你还没有自己创建的人生 Agent。创建后即可在此绑定地图高亮与定位。
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
                        <div className="flex flex-col gap-2 pr-1">
                          <p className="pb-1 text-xs font-medium text-ink-500">
                            点选下方一项即保存并高亮地图，无需再点「确定」。
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
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 space-y-3 border-t border-hairline/50 bg-paper px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
                      {user && boundAgents.length > 0 ? (
                        <>
                          <p className="text-center text-xs leading-relaxed text-ink-400">
                            选 Agent 会马上保存并高亮地图。<strong className="font-semibold text-ink-500">「开启定位」</strong>
                            只负责显示你的蓝点，失败也不影响已选 Agent；可随时点「完成」关闭。
                          </p>
                          <p className="text-center text-[11px] leading-snug text-ink-400">
                            {isNativeApp ? (
                              <>
                                <span className="font-semibold text-ink-500">BrightAgent App：</span>
                                定位走系统接口，首次会弹出授权。若一直失败，请到系统设置里为 BrightAgent 打开「位置」；若你刚更新了安装包仍不行，请确认已用最新版 App。
                              </>
                            ) : (
                              <>
                                <span className="font-semibold text-ink-500">手机浏览器：</span>
                                尽量用 Safari / Chrome，并确认是 <strong className="text-ink-600">https</strong>
                                ；系统「定位服务」总开关需开启。
                                {isLikelyWeChat ? (
                                  <span className="mt-1 block text-oxblood-700">
                                    当前疑似在微信内：微信常限制网页定位，请点右上角「⋯」→「在浏览器中打开」。
                                  </span>
                                ) : null}
                              </>
                            )}
                          </p>
                          {geoError ? (
                            <div className="space-y-2 rounded-xl border border-oxblood-200 bg-paper-200/90 px-3 py-3 text-sm">
                              <p className="font-medium text-ink">已选中的 Agent 仍有效，仅「我的位置」蓝点未开启。</p>
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
                              className="w-full rounded-2xl bg-oxblood-500 py-3.5 text-sm font-semibold text-paper active:opacity-90"
                              onClick={enableSharing}
                            >
                              开启定位（可选）
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="w-full rounded-2xl bg-paper-200 py-3.5 text-sm font-semibold text-ink-700 active:bg-paper-300"
                              onClick={disableSharing}
                            >
                              关闭定位
                            </button>
                          )}
                          <button
                            type="button"
                            className="w-full rounded-2xl border border-hairline py-3 text-sm font-medium text-ink-500 active:bg-paper-50"
                            onClick={clearBinding}
                          >
                            清除选中 Agent 与定位偏好
                          </button>
                        </>
                      ) : null}

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
                          此区域的 Agent
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
                                  {a.school ? (
                                    <p className="mt-0.5 truncate text-[11px] text-ink-300">{a.school}</p>
                                  ) : null}
                                </div>
                                <svg className="h-4 w-4 shrink-0 text-ink-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
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
