"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { resolveLifeAgentCoverDisplayUrl } from "@/lib/life-agent-covers";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  SearchInput,
  formatShortDate,
} from "@/components/dashboard/AgentAdminUI";

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
    coverUrl?: string;
    coverImageUrl?: string;
    coverPresetKey?: string;
  };
};

function formatSessionTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return formatShortDate(iso);
}

function previewText(item: ChatHistoryItem) {
  if (item.messageCount === 0) return "还没有消息";
  const title = (item.title ?? "").trim();
  if (title) return title.length > 80 ? `${title.slice(0, 80)}…` : title;
  return cleanLifeAgentIntroText(item.profile.headline, item.profile.displayName) || "这场对话暂无摘要";
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
      <AdminPage narrow>
        {loading ? (
          <LoadingBlock />
        ) : (
          <EmptyState
            title="请先登录"
            description="登录后可以查看你和人生 Agent 的所有对话。"
            action={<Link href="/login" className="btn-primary">去登录</Link>}
          />
        )}
      </AdminPage>
    );
  }

  return (
    <AdminPage narrow>
      <PageHeader
        eyebrow="对话档案"
        title="消息"
        description="你发起过的咨询会保存在这里，按最近回复排序。"
        actions={<SearchInput value={query} onChange={setQuery} placeholder="搜索会话或 Agent" label="搜索会话" />}
      />

      {dataLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          title="还没有会话"
          description="去发现页找一个经历相近的人生 Agent，第一条消息会在这里留下记录。"
          action={<Link href="/life-agents" className="btn-primary">去找 Agent 聊聊</Link>}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="没有匹配的会话"
          description="换一个关键词，或者清空搜索查看全部消息。"
          action={<button type="button" onClick={() => setQuery("")} className="btn-secondary">清空搜索</button>}
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-hairline/60">
            {filteredItems.map((item) => {
              const coverUrl = resolveLifeAgentCoverDisplayUrl(
                item.profile.coverUrl,
                item.profile.coverImageUrl,
                item.profile.coverPresetKey,
              );
              const chatHref = `/life-agents/${item.profile.id}/chat?sessionId=${item.id}`;
              return (
                <li key={item.id}>
                  <Link href={chatHref} className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-paper-100 sm:px-5">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-hairline bg-paper-200">
                      <LifeAgentCoverImage src={coverUrl} alt="" fill compact className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate font-medium text-ink">{item.profile.displayName}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] text-ink-300">
                          <MessageCircle className="h-3 w-3" />
                          {item.messageCount}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-ink-500">{previewText(item)}</p>
                    </div>
                    <time className="shrink-0 text-xs tabular-nums text-ink-300" dateTime={item.updatedAt}>
                      {formatSessionTime(item.updatedAt)}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </AdminPage>
  );
}
