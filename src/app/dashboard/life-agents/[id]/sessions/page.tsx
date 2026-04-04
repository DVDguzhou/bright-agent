"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  extractTopKeywords,
  fetchManageData,
  formatDateTime,
  formatShortTime,
  type ManageData,
} from "@/app/dashboard/life-agents/_lib/manage";

export default function LifeAgentSessionsPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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
    const keyword = query.trim().toLowerCase();
    const list = data?.chatSessions ?? [];
    if (!keyword) return list;
    return list.filter((item) =>
      [item.title, item.buyer.name ?? "", item.buyer.email ?? ""].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [data?.chatSessions, query]);

  const totalMessages = useMemo(
    () => (data?.chatSessions ?? []).reduce((sum, item) => sum + item.messageCount, 0),
    [data?.chatSessions],
  );
  const topKeywords = useMemo(
    () => extractTopKeywords((data?.chatSessions ?? []).map((item) => item.title || ""), 6),
    [data?.chatSessions],
  );

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
        <h1 className="mt-3 text-[28px] font-black tracking-tight text-[#111]">聊天记录</h1>
        <p className="mt-1 text-sm text-slate-500">查看最近会话摘要，理解用户都在问什么。</p>
        <div className="mt-4">
          <input
            className="w-full rounded-full border-0 bg-slate-100 px-4 py-2.5 text-[15px] text-[#111] outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-slate-50 focus:ring-slate-200"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索用户或会话摘要"
          />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-[#111]">{data.chatSessions.length}</p>
          <p className="mt-1 text-xs text-slate-500">总会话数</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-[#111]">{totalMessages}</p>
          <p className="mt-1 text-xs text-slate-500">总消息数</p>
        </div>
        <div className="col-span-2 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-xs font-medium text-slate-500">最近高频主题</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topKeywords.length > 0 ? (
              topKeywords.map((word) => (
                <span key={word} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  {word}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">会话摘要还不足以提炼主题</span>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-[#111]">最近 50 个会话</h2>
          <p className="mt-1 text-sm text-slate-500">默认仅展示脱敏摘要，不暴露完整对话内容。</p>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-slate-400">
              {query ? "没有匹配的会话" : "暂无聊天会话"}
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[#111]">{item.buyer.name || item.buyer.email}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.title || "隐私保护会话"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{formatShortTime(item.updatedAt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{item.messageCount} 条消息</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">创建于 {formatDateTime(item.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
