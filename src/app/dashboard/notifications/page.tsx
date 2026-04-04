"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RatingStars } from "@/components/RatingStars";
import { useAuth } from "@/contexts/AuthContext";
import { getDisplayAvatar } from "@/lib/avatar";

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

type SummaryData = {
  counts: { helpful: number; notSpecific: number; notSuitable: number };
  ratings: { averageScore: number; raters: number; recent: RatingItem[] };
  recent: FeedbackItem[];
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
  return "收到新反馈";
}

function feedbackBadgeClass(t: string) {
  if (t === "helpful") return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100";
  if (t === "not_specific") return "bg-amber-50 text-amber-900 ring-1 ring-amber-100";
  return "bg-rose-50 text-rose-800 ring-1 ring-rose-100";
}

function normalizeSummary(raw: any): SummaryData {
  return {
    counts: {
      helpful: raw?.counts?.helpful ?? 0,
      notSpecific: raw?.counts?.notSpecific ?? 0,
      notSuitable: raw?.counts?.notSuitable ?? 0,
    },
    ratings: {
      averageScore: raw?.ratings?.averageScore ?? 0,
      raters: raw?.ratings?.raters ?? 0,
      recent: Array.isArray(raw?.ratings?.recent) ? raw.ratings.recent : [],
    },
    recent: Array.isArray(raw?.recent) ? raw.recent : [],
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
    return [...feedbackRows, ...ratingRows].sort((a, b) => b.sortMs - a.sortMs);
  }, [data]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((item) => {
      const label = item.kind === "feedback" ? feedbackLabel(item.feedbackType) : "收到新评分";
      return [item.profileName, item.preview, label].join(" ").toLowerCase().includes(keyword);
    });
  }, [query, rows]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-2xl bg-white pb-6 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:pb-24 lg:pb-8">
        <header className="flex items-center gap-2 px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/dashboard");
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
            aria-label="返回"
            title="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 text-[26px] font-bold leading-tight tracking-tight text-[#111]">提醒</h1>
          <span className="h-10 w-10 shrink-0" aria-hidden />
        </header>
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-sm text-slate-500">{loading ? "加载中…" : "请先登录后查看提醒。"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-white pb-6 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:pb-24 lg:pb-8">
      <header className="flex items-center gap-2 px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/dashboard");
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
          aria-label="返回"
          title="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 text-[26px] font-bold leading-tight tracking-tight text-[#111]">提醒</h1>
        <span className="h-10 w-10 shrink-0" aria-hidden />
      </header>

      <div className="px-4 pb-3 sm:px-0">
        <label className="sr-only">搜索提醒</label>
        <input
          className="w-full rounded-full border-0 bg-slate-100 px-4 py-2.5 text-[15px] text-[#111] outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-slate-50 focus:ring-slate-200"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索 Agent 或反馈类型"
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
        ) : rows.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-0">
            <p className="text-[15px] text-slate-400">暂时还没有提醒</p>
            <p className="mt-2 text-sm text-slate-400">当你创建的 Agent 收到新反馈或评分时，会出现在这里。</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-0">
            <p className="text-[15px] text-slate-400">没有匹配的提醒</p>
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
            {filteredRows.map((item, index) => {
              const avatarSrc = getDisplayAvatar({ name: item.profileName });
              const href = `/dashboard/life-agents/${item.profileId}/feedback`;
              return (
                <motion.li
                  key={item.key}
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
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="truncate text-[16px] font-semibold text-[#111]">{item.profileName}</span>
                        {item.kind === "feedback" ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${feedbackBadgeClass(item.feedbackType)}`}>
                            {feedbackLabel(item.feedbackType)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-800 ring-1 ring-sky-100">
                            <RatingStars score={item.score} size="sm" />
                            {item.score}/5
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-slate-400">{item.preview}</p>
                    </div>
                    <time className="shrink-0 pt-0.5 text-xs tabular-nums text-slate-400" dateTime={item.time}>
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
