"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MapAgentMarker } from "@/components/LifeAgentsMapView";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBoundLifeAgents, type BoundLifeAgent } from "@/lib/bound-life-agents";
import {
  clearMapGpsPreferences,
  readMapShareEnabled,
  readMapShareProfileId,
  writeMapShareEnabled,
  writeMapShareProfileId,
} from "@/lib/map-gps-storage";

const LifeAgentsMapView = dynamic(() => import("@/components/LifeAgentsMapView"), {
  ssr: false,
  loading: () => (
    <div
      className="h-full min-h-[min(62dvh,520px)] w-full animate-pulse bg-slate-200/80"
      aria-hidden
    />
  ),
});

type ApiAgent = {
  id: string;
  displayName: string;
  headline?: string;
  city?: string;
  province?: string;
  county?: string;
  regions?: string[];
};

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
  const watchIdRef = useRef<number | null>(null);
  const firstGeoFitRef = useRef(false);
  const [sheetPortalReady, setSheetPortalReady] = useState(false);

  useEffect(() => {
    setSheetPortalReady(true);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  useEffect(() => {
    setSelectedProfileId(readMapShareProfileId());
  }, []);

  useEffect(() => {
    fetch("/api/life-agents", { credentials: "include" })
      .then((r) => r.json())
      .then((data: unknown) => {
        const list = Array.isArray(data) ? data : [];
        const mapped: MapAgentMarker[] = (list as ApiAgent[]).map((row) => ({
          id: String(row.id ?? ""),
          displayName: String(row.displayName ?? "Agent"),
          headline: row.headline,
          city: row.city,
          province: row.province,
          county: row.county,
          regions: row.regions,
        })).filter((a) => a.id);
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

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      stopWatch();
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
      stopWatch();
      setUserLatLng(null);
      firstGeoFitRef.current = false;
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("当前环境不支持定位");
      setShareEnabled(false);
      writeMapShareEnabled(false);
      return;
    }

    setGeoError(null);
    firstGeoFitRef.current = false;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLatLng({ lat, lng });
        if (!firstGeoFitRef.current) {
          firstGeoFitRef.current = true;
          setMapLayoutNonce((n) => n + 1);
        }
      },
      () => {
        setGeoError("无法获取位置，请检查浏览器或系统定位权限");
        setShareEnabled(false);
        writeMapShareEnabled(false);
        stopWatch();
        setUserLatLng(null);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
    watchIdRef.current = id;
    return () => {
      navigator.geolocation.clearWatch(id);
      watchIdRef.current = null;
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

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

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
    stopWatch();
    setShareEnabled(false);
    writeMapShareEnabled(false);
    setUserLatLng(null);
    firstGeoFitRef.current = false;
    setMapLayoutNonce((n) => n + 1);
  };

  const clearBinding = () => {
    stopWatch();
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
    <div className="relative -mx-4 flex min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.5rem)] flex-col bg-[#e8ecf0] max-lg:-mx-4 max-lg:pb-20 sm:mx-0 sm:min-h-[70vh] sm:rounded-2xl sm:ring-1 sm:ring-slate-200/80">
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-[500] px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-md ring-1 ring-black/5 backdrop-blur-sm">
          <span className="text-[#0091ff]" aria-hidden>
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索地图上的 Agent"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            enterKeyHint="search"
          />
          <Link
            href="/support/chat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition active:bg-slate-100"
            aria-label="联系客服"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0118 0v6" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="relative mt-14 flex flex-1 flex-col overflow-hidden sm:mt-16">
        {loadError && (
          <div className="absolute left-3 right-3 top-2 z-[480] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-sm">
            {loadError}
          </div>
        )}

        {loading || authLoading ? (
          <div className="flex flex-1 items-center justify-center bg-slate-200/50" aria-busy>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#0091ff] border-t-transparent" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-base font-semibold text-slate-900">
              {agents.length === 0 ? "暂无 Agent 可展示" : "没有匹配的 Agent"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {agents.length === 0 ? "去发现页看看是否有新入驻的创作者。" : "试试其他关键词。"}
            </p>
            {agents.length === 0 ? (
              <Link
                href="/life-agents"
                className="mt-5 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-semibold text-white active:opacity-90"
              >
                去发现
              </Link>
            ) : null}
          </div>
        ) : (
          <LifeAgentsMapView
            agents={filteredAgents}
            className="flex-1 rounded-none ring-0"
            highlightAgentId={highlightId}
            userLatLng={userLatLng}
            onLocatePress={openSheet}
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
                    className="fixed inset-0 z-[10000] bg-black/40"
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
                    className="fixed inset-x-0 bottom-0 z-[10001] flex max-h-[min(88dvh,600px)] flex-col rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  >
                    <div className="shrink-0 px-4 pb-2 pt-3">
                      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
                      <h2 id="map-gps-sheet-title" className="text-lg font-bold text-slate-900">
                        位置与绑定 Agent
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        只能绑定<strong className="font-semibold text-slate-700">你自己创建</strong>
                        的人生 Agent，不能选别人的。仅在本页显示大致位置并高亮该 Agent；同一时间只能选一个；坐标不会上传服务器。
                      </p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2">
                      {!user ? (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600">
                            登录后可从<strong className="font-semibold text-slate-800">你自己创建的</strong>
                            人生 Agent 里选择并开启定位。未登录时仍会本机记住上次选中项，用于地图高亮（须是地图上仍展示的 Agent）。
                          </p>
                          {selectedProfileId ? (
                            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-3 text-sm text-slate-700">
                              <p className="font-semibold text-slate-900">本机记住的高亮</p>
                              <p className="mt-1">{rememberedAgentLabel}</p>
                            </div>
                          ) : null}
                          <Link
                            href={`/login?next=${encodeURIComponent("/map")}`}
                            className="flex w-full items-center justify-center rounded-2xl bg-[#0091ff] py-3.5 text-sm font-semibold text-white active:opacity-90"
                            onClick={closeSheet}
                          >
                            去登录
                          </Link>
                          {selectedProfileId ? (
                            <button
                              type="button"
                              className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-600 active:bg-slate-50"
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
                          <p className="text-sm text-slate-600">
                            你还没有自己创建的人生 Agent。创建后即可在此绑定地图高亮与定位。
                          </p>
                          <Link
                            href="/life-agents/create"
                            className="flex w-full items-center justify-center rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-800 active:bg-slate-200"
                            onClick={closeSheet}
                          >
                            去创建
                          </Link>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 pr-1">
                          <p className="pb-1 text-xs font-medium text-slate-600">
                            点选下方一项即保存并高亮地图，无需再点「确定」。
                          </p>
                          {boundAgents.map((b) => {
                            const checked = selectedProfileId === b.id;
                            return (
                              <label
                                key={b.id}
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition ${
                                  checked ? "border-[#0091ff] bg-sky-50/80" : "border-slate-200 bg-white active:bg-slate-50"
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
                                  <span className="font-semibold text-slate-900">{b.displayName}</span>
                                  {b.headline ? (
                                    <span className="mt-0.5 block text-xs text-slate-500">{b.headline}</span>
                                  ) : null}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 space-y-3 border-t border-slate-100 bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
                      {user && boundAgents.length > 0 ? (
                        <>
                          <p className="text-center text-xs leading-relaxed text-slate-500">
                            选好后可点「开启定位」显示蓝点；或先点「完成」关闭面板，稍后再来开定位。
                          </p>
                          {geoError ? (
                            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{geoError}</p>
                          ) : null}
                          {!shareEnabled ? (
                            <button
                              type="button"
                              className="w-full rounded-2xl bg-[#0091ff] py-3.5 text-sm font-semibold text-white active:opacity-90"
                              onClick={enableSharing}
                            >
                              开启定位
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="w-full rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-800 active:bg-slate-200"
                              onClick={disableSharing}
                            >
                              关闭定位
                            </button>
                          )}
                          <button
                            type="button"
                            className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-600 active:bg-slate-50"
                            onClick={clearBinding}
                          >
                            清除选中 Agent 与定位偏好
                          </button>
                        </>
                      ) : null}

                      <button
                        type="button"
                        className="w-full rounded-2xl bg-[#111] py-3.5 text-sm font-semibold text-white active:opacity-90"
                        onClick={closeSheet}
                      >
                        完成
                      </button>
                      <p className="pb-1 text-center text-xs text-slate-400">也可点击上方空白处关闭</p>
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
