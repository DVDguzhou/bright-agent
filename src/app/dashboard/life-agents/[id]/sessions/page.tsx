"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatCell } from "@/components/dashboard/StatCell";
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
        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-ink">聊天记录</h1>
        <p className="mt-1 text-sm text-ink-400">查看最近会话摘要，理解用户都在问什么。</p>
        <div className="mt-4">
          <input
            className="w-full rounded border border-hairline bg-paper px-4 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-300 focus:border-ink"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索用户或会话摘要"
            aria-label="搜索用户或会话摘要"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 border-hairline/30 [&>*:first-child]:border-r [&>*]:border-hairline/30">
        <StatCell value={data.chatSessions.length} label="总会话数" sub="场" />
        <StatCell value={totalMessages} label="总消息数" sub="条" />
      </section>

      {topKeywords.length > 0 ? (
        <section className="py-3">
          <p className="text-[11px] font-medium text-ink-600">最近高频主题</p>
          <p className="mt-2 text-sm text-ink-500">{topKeywords.join(" · ")}</p>
        </section>
      ) : null}

      <section className="py-4">
        <h2 className="font-serif text-xl font-medium text-ink">最近 50 个会话</h2>
        <p className="mt-1 text-sm text-ink-400">
          默认仅展示脱敏摘要，不暴露完整对话内容 · {filtered.length} 条
        </p>
        {filtered.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-300">
            {query ? "没有匹配的会话" : "暂无聊天会话"}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline/30">
            {filtered.map((item) => (
              <li key={item.id} className="py-4 text-sm first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">{item.buyer.name || item.buyer.email}</p>
                  <span className="shrink-0 text-xs text-ink-300">{formatShortTime(item.updatedAt)}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-ink-400">{item.title || "隐私保护会话"}</p>
                <p className="mt-1 text-xs text-ink-300">
                  {item.messageCount} 条消息 · 创建于 {formatDateTime(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
