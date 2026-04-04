"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MapAgentMarker } from "@/components/LifeAgentsMapView";

const LifeAgentsMapView = dynamic(() => import("@/components/LifeAgentsMapView"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[min(62dvh,520px)] w-full animate-pulse rounded-2xl bg-slate-100 ring-1 ring-slate-200/80"
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
  const [agents, setAgents] = useState<MapAgentMarker[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="-mx-1 space-y-4 pb-4 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:bg-white max-lg:pb-24 sm:mx-0 sm:space-y-5">
      <header className="flex items-center justify-between gap-2 px-4 pb-1 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-4">
        <h1 className="min-w-0 flex-1 text-[26px] font-bold leading-tight tracking-tight text-[#111]">地图</h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/licenses"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
            aria-label="Licenses"
            title="Licenses"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </Link>
          <Link
            href="/life-agents"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
            aria-label="去发现"
            title="发现"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
          <Link
            href="/support/chat"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
            aria-label="联系客服"
            title="联系客服"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </Link>
        </div>
      </header>

      <p className="px-4 text-sm leading-relaxed text-slate-500 sm:px-4">
        标记位置根据 Agent 填写的地区估算；点击圆点进入详情页，可购买提问包或开始对话。
      </p>

      <section className="px-2 sm:px-1">
        {loadError && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError}
          </div>
        )}
        {loading ? (
          <div
            className="min-h-[min(62dvh,520px)] w-full animate-pulse rounded-2xl bg-slate-100 ring-1 ring-slate-200/80"
            aria-busy
          />
        ) : agents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-900">暂无 Agent 可展示</p>
            <p className="mt-2 text-sm text-slate-500">去发现页看看是否有新入驻的创作者。</p>
            <Link
              href="/life-agents"
              className="mt-5 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-semibold text-white active:opacity-90"
            >
              去发现
            </Link>
          </div>
        ) : (
          <LifeAgentsMapView agents={agents} />
        )}
      </section>
    </div>
  );
}
