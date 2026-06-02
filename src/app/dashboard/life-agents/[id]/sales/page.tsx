"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchManageData, formatDateTime, formatShortTime, type ManageData } from "@/app/dashboard/life-agents/_lib/manage";

type RangeKey = "7d" | "30d" | "all";

export default function LifeAgentSalesPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchManageData(id).then((result) => {
      if (cancelled) return;
      setData(result.data);
      setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const filtered = useMemo(() => {
    const list = data?.questionPacks ?? [];
    if (range === "all") return list;
    const days = range === "7d" ? 7 : 30;
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return list.filter((item) => {
      const ms = Date.parse(item.createdAt);
      return Number.isNaN(ms) ? false : ms >= threshold;
    });
  }, [data?.questionPacks, range]);

  const summary = useMemo(() => {
    const buyers = new Set(filtered.map((item) => item.buyer.email || item.buyer.name || item.id));
    const asked = filtered.reduce((sum, item) => sum + item.questionCount, 0);
    return {
      buyers: buyers.size,
      asked,
      heat: buyers.size + asked,
    };
  }, [filtered]);

  if (loading) {
    return <div className="mx-auto h-56 max-w-4xl animate-pulse bg-paper-100/60" />;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-[15px] text-ink-400">{error ?? "加载失败"}</p>
        <Link href={`/dashboard/life-agents/${id}`} className="mt-6 inline-flex rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper">
          返回工作台
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl divide-y divide-hairline/30 max-lg:-mx-4 max-lg:px-4 max-lg:pb-24">
      <section className="pb-4 pt-3">
        <Link href={`/dashboard/life-agents/${id}`} className="text-sm font-medium text-ink-400 transition hover:text-ink">
          ← 返回工作台
        </Link>
        <h1 className="mt-3 text-[28px] font-black tracking-tight text-ink">互动记录</h1>
        <p className="mt-1 text-sm text-ink-400">{data.profile.displayName} 的用户提问与对话互动</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: "7d", label: "近 7 天" },
            { key: "30d", label: "近 30 天" },
            { key: "all", label: "全部" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRange(item.key as RangeKey)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                range === item.key ? "bg-ink text-paper" : "bg-paper-200 text-ink-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 border-hairline/30 [&>*:not(:last-child)]:border-r [&>*]:border-hairline/30">
        <div className="px-3 py-3 text-center">
          <p className="text-2xl font-black leading-none text-ink">{summary.buyers}</p>
          <p className="mt-2 text-[11px] font-medium text-ink-600">互动用户</p>
          <p className="mt-0.5 text-[10px] text-ink-300">人</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-2xl font-black leading-none text-ink">{summary.asked}</p>
          <p className="mt-2 text-[11px] font-medium text-ink-600">被提问</p>
          <p className="mt-0.5 text-[10px] text-ink-300">次</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-2xl font-black leading-none text-oxblood-700">{summary.heat}</p>
          <p className="mt-2 text-[11px] font-medium text-ink-600">热度指数</p>
          <p className="mt-0.5 text-[10px] text-ink-300">综合</p>
        </div>
      </section>

      <section className="py-4">
        <h2 className="text-lg font-semibold text-ink">互动明细</h2>
        <p className="mt-1 text-sm text-ink-400">
          {range === "7d" ? "近 7 天" : range === "30d" ? "近 30 天" : "全部"} · {filtered.length} 条
        </p>
        {filtered.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-300">当前筛选下暂无互动记录</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline/30">
            {filtered.map((item) => (
              <li key={item.id} className="py-4 text-sm first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">{item.buyer.name || item.buyer.email}</p>
                  <span className="shrink-0 text-xs text-ink-300">{formatShortTime(item.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-ink-400">
                  提问 {item.questionCount} 次，已对话 {item.questionsUsed} 次
                </p>
                <p className="mt-1 text-xs text-ink-300">{formatDateTime(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
