"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchManageData, formatDateTime, type ManageData } from "@/app/dashboard/life-agents/_lib/manage";

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
    return {
      buyers: buyers.size,
      sold: filtered.reduce((sum, item) => sum + item.questionCount, 0),
      revenue: filtered.reduce((sum, item) => sum + item.amountPaid, 0),
    };
  }, [filtered]);

  if (loading) {
    return <div className="mx-auto h-56 max-w-4xl animate-pulse rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]" />;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-[15px] text-slate-500">{error ?? "加载失败"}</p>
        <Link href={`/dashboard/life-agents/${id}`} className="mt-6 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-medium text-white">
          返回工作台
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 max-lg:-mx-4 max-lg:bg-[#f7f8fa] max-lg:px-3 max-lg:pb-24">
      <header className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <Link href={`/dashboard/life-agents/${id}`} className="text-sm font-medium text-slate-500 transition hover:text-[#111]">
          ← 返回工作台
        </Link>
        <h1 className="mt-3 text-[28px] font-black tracking-tight text-[#111]">销量记录</h1>
        <p className="mt-1 text-sm text-slate-500">{data.profile.displayName} 的提问包购买情况</p>
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
                range === item.key ? "bg-[#111] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-[#111]">{summary.buyers}</p>
          <p className="mt-1 text-xs text-slate-500">购买人数</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-[#111]">{summary.sold}</p>
          <p className="mt-1 text-xs text-slate-500">卖出次数</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-sky-700">¥{(summary.revenue / 100).toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-500">收入</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-[#111]">购买记录</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-slate-400">当前筛选下暂无购买记录</div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[#111]">{item.buyer.name || item.buyer.email}</p>
                  <span className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">购买 {item.questionCount} 次</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">已用 {item.questionsUsed} 次</span>
                  <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">¥{(item.amountPaid / 100).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
