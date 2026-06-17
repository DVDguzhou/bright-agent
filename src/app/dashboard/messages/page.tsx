"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { resolveLifeAgentCoverDisplayUrl } from "@/lib/life-agent-covers";
import {
  fetchLifeAgentSubscriptions,
  formatGrowthFreshDays,
  LIFE_AGENT_GROWTH_CATEGORY_LABELS,
  markLifeAgentGrowthSeen,
  type LifeAgentSubscription,
} from "@/lib/life-agent-growth";
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

function SubscriptionStrip({
  items,
  onMarkSeen,
}: {
  items: LifeAgentSubscription[];
  onMarkSeen: (profileId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <Panel className="mb-5 -mx-3 w-[calc(100%+1.5rem)] rounded-none border-x-0 sm:mx-0 sm:w-full sm:rounded-lg sm:border-x">
      <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-6">
        <p className="text-sm font-medium text-ink">我的订阅</p>
        <Link href="/life-agents?tab=favorites" className="text-xs text-ink-400 transition hover:text-ink">
          全部
        </Link>
      </div>
      <div
        className="flex gap-6 overflow-x-auto px-4 pb-5 pt-1 sm:gap-8 sm:px-6 sm:pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-horizontal-scroll
      >
        {items.map((item) => {
          const coverUrl = resolveLifeAgentCoverDisplayUrl(
            item.coverUrl,
            item.coverImageUrl,
            item.coverPresetKey,
          );
          const categoryLabel =
            item.updateStatus
              ? LIFE_AGENT_GROWTH_CATEGORY_LABELS[item.updateStatus.category] ?? item.updateStatus.category
              : null;
          return (
            <Link
              key={item.id}
              href={`/life-agents/${item.id}`}
              onClick={() => onMarkSeen(item.id)}
              className="pressable group shrink-0 w-[7.25rem] text-center sm:w-[8.25rem]"
            >
              <div className="relative mx-auto h-[5.25rem] w-[5.25rem] overflow-visible sm:h-[5.75rem] sm:w-[5.75rem]">
                <div className="h-full w-full overflow-hidden rounded-full border border-hairline bg-paper-200 shadow-glow-sm transition group-hover:border-signal-300">
                  <LifeAgentCoverImage
                    src={coverUrl}
                    alt=""
                    fill
                    compact
                    className="object-cover"
                    sizes="92px"
                  />
                </div>
                {item.growthUnread > 0 ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-paper-50"
                    aria-label="有未读更新"
                  />
                ) : null}
              </div>
              <p className="mt-2.5 line-clamp-2 text-[13px] leading-snug text-ink">{item.displayName}</p>
              {item.updateStatus?.isRecent && categoryLabel ? (
                <p className="mt-1 text-xs leading-tight text-signal-700">
                  {formatGrowthFreshDays(item.updateStatus.freshDays)} · {categoryLabel}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

export default function DashboardMessagesPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<ChatHistoryItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<LifeAgentSubscription[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [query, setQuery] = useState("");

  const markSubscriptionSeen = (profileId: string) => {
    setSubscriptions((prev) =>
      prev.map((item) => (item.id === profileId ? { ...item, growthUnread: 0 } : item)),
    );
    void markLifeAgentGrowthSeen(profileId);
  };

  const refreshSubscriptions = () => {
    fetchLifeAgentSubscriptions()
      .then(setSubscriptions)
      .catch(() => {});
  };

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }
    let cancelled = false;
    setDataLoading(true);
    Promise.all([
      fetch("/api/life-agents/chat-sessions", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => (Array.isArray(data) ? data : []))
        .catch(() => []),
      fetchLifeAgentSubscriptions(),
    ])
      .then(([sessions, subs]) => {
        if (!cancelled) {
          setItems(sessions);
          setSubscriptions(subs);
        }
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSubscriptions();
    };
    const onGrowthSeen = (event: Event) => {
      const profileId = (event as CustomEvent<{ profileId?: string }>).detail?.profileId;
      if (profileId) {
        setSubscriptions((prev) =>
          prev.map((item) => (item.id === profileId ? { ...item, growthUnread: 0 } : item)),
        );
      } else {
        refreshSubscriptions();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("la-growth-seen", onGrowthSeen);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("la-growth-seen", onGrowthSeen);
    };
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
      <AdminPage wide>
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
    <AdminPage wide>
      <div className="px-3 sm:px-0">
        <PageHeader
          eyebrow="对话档案"
          title="消息"
          description="你发起过的咨询会保存在这里，按最近回复排序。"
          actions={<SearchInput value={query} onChange={setQuery} placeholder="搜索会话或 Agent" label="搜索会话" />}
        />
      </div>

      {dataLoading ? (
        <div className="px-3 sm:px-0">
          <LoadingBlock />
        </div>
      ) : (
        <>
          <SubscriptionStrip items={subscriptions} onMarkSeen={markSubscriptionSeen} />

          <div className="px-3 sm:px-0">
            {items.length === 0 ? (
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
          </div>
        </>
      )}
    </AdminPage>
  );
}
