"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { VerificationBadge } from "@/components/VerificationBadge";

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

function trimTitle(title: string) {
  return title.length > 28 ? `${title.slice(0, 28)}...` : title;
}

export default function DashboardChatHistoryPage() {
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
        value.toLowerCase().includes(keyword)
      )
    );
  }, [items, query]);

  if (loading || !user) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">{loading ? "加载中..." : "请先登录后查看聊天记录。"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-sky-700">
          ← 返回个人主页
        </Link>
        <h1 className="section-title mt-3">我的聊天记录</h1>
        <p className="section-subtitle mt-2">你和人生 Agent 的历史会话只对你自己可见，卖家看不到聊天正文。</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">最近会话</h2>
          <p className="mt-1 text-sm text-slate-500">点击任意记录即可跳转回对应 Agent 的指定会话。</p>
          <div className="mt-4">
            <input
              className="input-shell w-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索 Agent 名称、简介或会话标题"
            />
          </div>
        </div>

        <div className="p-6">
          {dataLoading ? (
            <p className="py-12 text-center text-slate-500">正在加载聊天记录...</p>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500">还没有历史会话。</p>
              <Link href="/life-agents" className="mt-4 inline-flex rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
                去找一个 Agent 聊聊
              </Link>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500">没有找到匹配的聊天记录。</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                清空搜索
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredItems.map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index < 8 ? index * 0.03 : 0 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/life-agents/${item.profile.id}/chat?sessionId=${item.id}`}
                          className="text-base font-semibold text-slate-900 hover:text-sky-700"
                        >
                          {item.profile.displayName}
                        </Link>
                        <VerificationBadge status={item.profile.verificationStatus ?? "none"} size="sm" />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.profile.headline}</p>
                      <p className="mt-3 text-sm font-medium text-slate-800">{trimTitle(item.title)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        共 {item.messageCount} 条消息 · 最近更新 {new Date(item.updatedAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <Link
                      href={`/life-agents/${item.profile.id}/chat?sessionId=${item.id}`}
                      className="btn-secondary"
                    >
                      继续聊天
                    </Link>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
