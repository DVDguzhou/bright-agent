"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getDisplayAvatar } from "@/lib/avatar";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";

type ChatHistoryItem = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    displayName: string;
    headline: string;
    verificationStatus?: string;
  };
};

function formatSessionTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "昨天";
  const y = d.getFullYear();
  const thisYear = now.getFullYear();
  if (y === thisYear) return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${y}/${d.getMonth() + 1}/${d.getDate()}`;
}

function previewText(item: ChatHistoryItem) {
  if (item.messageCount === 0) return "暂无消息";
  const t = (item.title ?? "").trim();
  if (t) return t.length > 80 ? `${t.slice(0, 80)}…` : t;
  const h = cleanLifeAgentIntroText(item.profile.headline, item.profile.displayName);
  return h || "暂无消息";
}

export default function DashboardMessagesPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<ChatHistoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    fetch("/api/life-agents/chat-sessions", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setDataLoading(false));
  }, [user]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      [item.title, item.profile.displayName, item.profile.headline].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [items, query]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">{loading ? "加载中…" : "请先登录后查看消息。"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-white pb-6 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:pb-24 lg:pb-8">
      <header className="px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111]">消息</h1>
      </header>

      <div className="px-4 pb-3 sm:px-0">
        <label className="sr-only">搜索会话</label>
        <input
          className="w-full rounded-full border-0 bg-slate-100 px-4 py-2.5 text-[15px] text-[#111] outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-slate-50 focus:ring-slate-200"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索会话或 Agent"
        />
      </div>

      <div className="border-t border-slate-100">
        {dataLoading ? (
          <ul className="divide-y divide-slate-100 px-4 sm:px-0" aria-busy>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li key={i} className="flex items-center gap-3 py-3.5">
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-200" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-full max-w-[12rem] animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-slate-100" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-0">
            <p className="text-[15px] text-slate-400">还没有会话</p>
            <Link
              href="/life-agents"
              className="mt-5 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-medium text-white active:opacity-90"
            >
              去找 Agent 聊聊
            </Link>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-0">
            <p className="text-[15px] text-slate-400">没有匹配的会话</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 text-sm font-medium text-slate-600 underline"
            >
              清空搜索
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredItems.map((item, index) => {
              const avatarSrc = getDisplayAvatar({ name: item.profile.displayName });
              const href = `/life-agents/${item.profile.id}/chat?sessionId=${item.id}`;
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index < 10 ? index * 0.02 : 0 }}
                >
                  <Link
                    href={href}
                    className="flex items-center gap-3 px-4 py-3.5 transition active:bg-slate-50 sm:px-0"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-black/[0.06]">
                      <Image
                        src={avatarSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[16px] font-semibold text-[#111]">
                          {item.profile.displayName}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-slate-400">
                        {previewText(item)}
                      </p>
                    </div>
                    <time
                      className="shrink-0 pt-0.5 text-xs tabular-nums text-slate-400"
                      dateTime={item.updatedAt}
                    >
                      {formatSessionTime(item.updatedAt)}
                    </time>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
