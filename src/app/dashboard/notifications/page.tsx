"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RatingStars } from "@/components/RatingStars";
import { useAuth } from "@/contexts/AuthContext";
import { getDisplayAvatar } from "@/lib/avatar";
import { markAgentNotificationsRead } from "@/lib/notifications-read";

type FeedbackItem = {
  id: string;
  profileId: string;
  profileName: string;
  feedbackType: string;
  assistantExcerpt?: string | null;
  comment?: string | null;
  createdAt: string;
};

type RatingItem = {
  id: string;
  profileId: string;
  profileName: string;
  score: number;
  comment?: string | null;
  updatedAt: string;
};

type CoEditItem = {
  id: string;
  profileId: string;
  profileName: string;
  status: "processed" | "failed";
  rawMessage: string;
  assistantMessage?: string | null;
  changesSummary?: string | null;
  errorDetail?: string | null;
  createdAt: string;
  processedAt?: string | null;
};

type SummaryData = {
  counts: { helpful: number; notSpecific: number; notSuitable: number; factualError?: number; contradiction?: number; tooConfident?: number };
  ratings: { averageScore: number; raters: number; recent: RatingItem[] };
  recent: FeedbackItem[];
  coEdit: CoEditItem[];
};

type NotificationRow =
  | {
      key: string;
      kind: "feedback";
      profileId: string;
      profileName: string;
      feedbackType: string;
      preview: string;
      time: string;
      sortMs: number;
    }
  | {
      key: string;
      kind: "rating";
      profileId: string;
      profileName: string;
      score: number;
      preview: string;
      time: string;
      sortMs: number;
    }
  | {
      key: string;
      kind: "co_edit";
      profileId: string;
      profileName: string;
      status: "processed" | "failed";
      title: string;
      preview: string;
      time: string;
      sortMs: number;
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

function feedbackLabel(t: string) {
  if (t === "helpful") return "收到有帮助反馈";
  if (t === "not_specific") return "收到不够具体反馈";
  if (t === "not_suitable") return "收到不适合我反馈";
  if (t === "factual_error") return "收到事实错误反馈";
  if (t === "contradiction") return "收到前后矛盾反馈";
  if (t === "too_confident") return "收到过度自信反馈";
  return "收到新反馈";
}

function feedbackBadgeClass(t: string) {
  if (t === "helpful") return "bg-olive-400/10 text-olive-600 ring-1 ring-olive-400/40";
  if (t === "not_specific") return "bg-paper-200 text-ink ring-1 ring-hairline";
  if (t === "factual_error") return "bg-oxblood-50 text-oxblood-700 ring-1 ring-oxblood-100";
  if (t === "contradiction") return "bg-paper-50 text-ink-800 ring-1 ring-hairline/50";
  if (t === "too_confident") return "bg-paper-200 text-ink ring-1 ring-hairline";
  return "bg-oxblood-50 text-oxblood-700 ring-1 ring-oxblood-100";
}

function normalizeSummary(raw: any): SummaryData {
  return {
    counts: {
      helpful: raw?.counts?.helpful ?? 0,
      notSpecific: raw?.counts?.notSpecific ?? 0,
      notSuitable: raw?.counts?.notSuitable ?? 0,
      factualError: raw?.counts?.factualError ?? 0,
      contradiction: raw?.counts?.contradiction ?? 0,
      tooConfident: raw?.counts?.tooConfident ?? 0,
    },
    ratings: {
      averageScore: raw?.ratings?.averageScore ?? 0,
      raters: raw?.ratings?.raters ?? 0,
      recent: Array.isArray(raw?.ratings?.recent) ? raw.ratings.recent : [],
    },
    recent: Array.isArray(raw?.recent) ? raw.recent : [],
    coEdit: Array.isArray(raw?.coEdit) ? raw.coEdit : [],
  };
}

export default function DashboardNotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState<SummaryData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    fetch("/api/life-agents/feedback/all", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(normalizeSummary(d)))
      .catch(() => setData(normalizeSummary(null)))
      .finally(() => setDataLoading(false));

    void markAgentNotificationsRead();
  }, [user]);

  const rows = useMemo<NotificationRow[]>(() => {
    if (!data) return [];
    const feedbackRows: NotificationRow[] = data.recent.map((item) => ({
      key: `feedback-${item.id}`,
      kind: "feedback",
      profileId: item.profileId,
      profileName: item.profileName,
      feedbackType: item.feedbackType,
      preview: item.comment?.trim() || item.assistantExcerpt?.trim() || "用户留下了新的反馈",
      time: item.createdAt,
      sortMs: Date.parse(item.createdAt) || 0,
    }));
    const ratingRows: NotificationRow[] = data.ratings.recent.map((item) => ({
      key: `rating-${item.id}`,
      kind: "rating",
      profileId: item.profileId,
      profileName: item.profileName,
      score: item.score,
      preview: item.comment?.trim() || "用户给这个 Agent 留下了新的评分",
      time: item.updatedAt,
      sortMs: Date.parse(item.updatedAt) || 0,
    }));
    const coEditRows: NotificationRow[] = data.coEdit.map((item) => {
      const when = item.processedAt || item.createdAt;
      const title =
        item.status === "processed"
          ? item.changesSummary?.trim()
            ? `已理解并应用：${item.changesSummary}`
            : "已记下你的话"
          : `理解失败：${item.errorDetail?.trim() || "AI 暂时未响应"}`;
      return {
        key: `co_edit-${item.id}`,
        kind: "co_edit",
        profileId: item.profileId,
        profileName: item.profileName,
        status: item.status,
        title,
        preview: item.rawMessage?.trim() || item.assistantMessage?.trim() || "对话调教记录",
        time: when,
        sortMs: Date.parse(when) || 0,
      };
    });
    return [...feedbackRows, ...ratingRows, ...coEditRows].sort((a, b) => b.sortMs - a.sortMs);
  }, [data]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((item) => {
      const label =
        item.kind === "feedback"
          ? feedbackLabel(item.feedbackType)
          : item.kind === "rating"
            ? "收到新评分"
            : item.kind === "co_edit"
              ? item.title
              : "";
      return [item.profileName, item.preview, label].join(" ").toLowerCase().includes(keyword);
    });
  }, [query, rows]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-2xl bg-paper pb-6 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:pb-24 lg:pb-8">
        <header className="flex items-center gap-2 px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/dashboard");
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-200 text-ink transition active:bg-paper-300"
            aria-label="返回"
            title="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 text-[26px] font-bold leading-tight tracking-tight text-ink">提醒</h1>
          <span className="h-10 w-10 shrink-0" aria-hidden />
        </header>
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-sm text-ink-400">{loading ? "加载中…" : "请先登录后查看提醒。"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-paper pb-6 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:pb-24 lg:pb-8">
      <header className="flex items-center gap-2 px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/dashboard");
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-200 text-ink transition active:bg-paper-300"
          aria-label="返回"
          title="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 text-[26px] font-bold leading-tight tracking-tight text-ink">提醒</h1>
        <span className="h-10 w-10 shrink-0" aria-hidden />
      </header>

      <div className="px-4 pb-3 sm:px-0">
        <label className="sr-only">搜索提醒</label>
        <input
          className="w-full rounded-full border-0 bg-paper-200 px-4 py-2.5 text-[15px] text-ink outline-none ring-1 ring-transparent transition placeholder:text-ink-300 focus:bg-paper-50 focus:ring-hairline"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索 Agent 或反馈类型"
        />
      </div>

      <div className="border-t border-hairline/50">
        {dataLoading ? (
          <ul className="divide-y divide-hairline/50 px-4 sm:px-0" aria-busy>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li key={i} className="flex items-center gap-3 py-3.5">
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-paper-300" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-paper-300" />
                  <div className="h-3 w-full max-w-[12rem] animate-pulse rounded bg-paper-200" />
                </div>
                <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-paper-200" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-0">
            <p className="text-[15px] text-ink-300">暂时还没有提醒</p>
            <p className="mt-2 text-sm text-ink-300">当你创建的 Agent 收到新反馈或评分时，会出现在这里。</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-0">
            <p className="text-[15px] text-ink-300">没有匹配的提醒</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 text-sm font-medium text-ink-500 underline"
            >
              清空搜索
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-hairline/50">
            {filteredRows.map((item, index) => {
              const avatarSrc = getDisplayAvatar({ name: item.profileName });
              const href =
                item.kind === "co_edit"
                  ? `/dashboard/life-agents/${item.profileId}/co-edit`
                  : `/dashboard/life-agents/${item.profileId}/feedback`;
              return (
                <motion.li
                  key={item.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index < 10 ? index * 0.02 : 0 }}
                >
                  <Link
                    href={href}
                    className="flex items-center gap-3 px-4 py-3.5 transition active:bg-paper-50 sm:px-0"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-paper-200 ring-1 ring-hairline/50">
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
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="truncate text-[16px] font-semibold text-ink">{item.profileName}</span>
                        {item.kind === "feedback" ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${feedbackBadgeClass(item.feedbackType)}`}>
                            {feedbackLabel(item.feedbackType)}
                          </span>
                        ) : item.kind === "rating" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-oxblood-50 px-2 py-0.5 text-[10px] font-medium text-oxblood-700 ring-1 ring-oxblood-100">
                            <RatingStars score={item.score} size="sm" />
                            {item.score}/5
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              item.status === "processed"
                                ? "bg-olive-400/10 text-olive-600 ring-1 ring-olive-400/40"
                                : "bg-paper-200 text-ink ring-1 ring-hairline"
                            }`}
                          >
                            {item.status === "processed" ? "已理解新调教" : "调教待重试"}
                          </span>
                        )}
                      </div>
                      {item.kind === "co_edit" ? (
                        <>
                          <p className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-ink-500">{item.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-ink-300">原话：{item.preview}</p>
                        </>
                      ) : (
                        <p className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-ink-300">{item.preview}</p>
                      )}
                    </div>
                    <time className="shrink-0 pt-0.5 text-xs tabular-nums text-ink-300" dateTime={item.time}>
                      {formatSessionTime(item.time)}
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
