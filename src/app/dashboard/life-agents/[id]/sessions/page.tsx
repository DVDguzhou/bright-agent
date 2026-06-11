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
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  SearchInput,
  StatStrip,
} from "@/components/dashboard/AgentAdminUI";

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
    return (
      <AdminPage>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (!data) {
    return (
      <AdminPage narrow>
        <EmptyState title={error ?? "加载失败"} action={<Link href={`/dashboard/life-agents/${id}`} className="btn-primary">返回工作台</Link>} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        backHref={`/dashboard/life-agents/${id}`}
        title="聊天记录"
        description="查看最近会话摘要，理解用户正在围绕哪些真实处境提问。"
        actions={<SearchInput value={query} onChange={setQuery} placeholder="搜索用户或会话摘要" label="搜索聊天记录" />}
      />

      <div className="mb-5">
        <StatStrip
          columns={2}
          items={[
            { label: "总会话数", value: data.chatSessions.length, sub: "场" },
            { label: "总消息数", value: totalMessages, sub: "条", tone: "signal" },
          ]}
        />
      </div>

      {topKeywords.length > 0 ? (
        <Panel className="mb-5 p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink">近期高频主题</p>
          <p className="mt-2 text-sm leading-6 text-ink-500">{topKeywords.join(" · ")}</p>
        </Panel>
      ) : null}

      <Panel>
        <div className="border-b border-hairline/60 px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-ink">最近 50 个会话</h2>
          <p className="mt-1 text-sm text-ink-500">默认只展示脱敏摘要，不暴露完整对话内容。{filtered.length} 条</p>
        </div>
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState title={query ? "没有匹配的会话" : "暂无聊天会话"} />
          </div>
        ) : (
          <ul className="divide-y divide-hairline/60">
            {filtered.map((item) => (
              <li key={item.id} className="px-4 py-4 text-sm sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{item.buyer.name || item.buyer.email}</p>
                    <p className="mt-1 line-clamp-2 text-ink-500">{item.title || "隐私保护会话"}</p>
                    <p className="mt-1 text-xs text-ink-300">
                      {item.messageCount} 条消息 · 创建于 {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-ink-300">{formatShortTime(item.updatedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminPage>
  );
}
