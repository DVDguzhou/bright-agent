"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { RatingStars } from "@/components/RatingStars";
import { lifeAgentCoverShouldBypassOptimizer, resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";

type ManagePayload = {
  profile?: { id: string; displayName: string; headline: string; coverUrl?: string; coverImageUrl?: string; coverPresetKey?: string };
  feedback?: {
    recent: Array<{
      id: string;
      feedbackType: string;
      assistantExcerpt?: string | null;
      comment?: string | null;
      createdAt: string;
    }>;
    ratings?: {
      recent: Array<{
        id: string;
        score: number;
        comment?: string | null;
        updatedAt: string;
      }>;
    };
  };
};

function formatSessionTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
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
  if (t === "helpful") return "有帮助";
  if (t === "not_specific") return "不够具体";
  if (t === "not_suitable") return "不适合我";
  return t;
}

function feedbackAccent(t: string) {
  if (t === "helpful") return "bg-emerald-100 text-emerald-800";
  if (t === "not_specific") return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-800";
}

type FeedRow =
  | {
      key: string;
      kind: "feedback";
      id: string;
      feedbackType: string;
      assistantExcerpt?: string | null;
      comment?: string | null;
      createdAt: string;
      sortMs: number;
    }
  | {
      key: string;
      kind: "rating";
      id: string;
      score: number;
      comment?: string | null;
      updatedAt: string;
      sortMs: number;
    };

export default function LifeAgentFeedbackFeedPage() {
  const params = useParams();
  const id = params.id as string;
  const [payload, setPayload] = useState<ManagePayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetch(`/api/life-agents/${id}/manage`, { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          return { err: "无权查看该 Agent 的反馈", data: null as ManagePayload | null };
        }
        if (!r.ok) {
          return { err: "加载失败，请稍后重试", data: null as ManagePayload | null };
        }
        const d = await r.json().catch(() => null);
        return { err: null as string | null, data: d as ManagePayload };
      })
      .then((res) => {
        if (cancelled) return;
        if (res.err) {
          setLoadError(res.err);
          setPayload(null);
        } else {
          setPayload(res.data);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("网络错误");
        setPayload(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const rows = useMemo(() => {
    const fb = payload?.feedback;
    if (!fb) return [];
    const out: FeedRow[] = [];
    for (const item of fb.recent ?? []) {
      const sortMs = Date.parse(item.createdAt);
      out.push({
        key: `f-${item.id}`,
        kind: "feedback",
        id: item.id,
        feedbackType: item.feedbackType,
        assistantExcerpt: item.assistantExcerpt,
        comment: item.comment,
        createdAt: item.createdAt,
        sortMs: Number.isNaN(sortMs) ? 0 : sortMs,
      });
    }
    for (const item of fb.ratings?.recent ?? []) {
      const sortMs = Date.parse(item.updatedAt);
      out.push({
        key: `r-${item.id}`,
        kind: "rating",
        id: item.id,
        score: item.score,
        comment: item.comment,
        updatedAt: item.updatedAt,
        sortMs: Number.isNaN(sortMs) ? 0 : sortMs,
      });
    }
    out.sort((a, b) => b.sortMs - a.sortMs);
    return out;
  }, [payload?.feedback]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => {
      if (row.kind === "feedback") {
        const text = [
          feedbackLabel(row.feedbackType),
          row.assistantExcerpt ?? "",
          row.comment ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return text.includes(keyword);
      }
      const text = [String(row.score), row.comment ?? "", "星级", "评分"].join(" ").toLowerCase();
      return text.includes(keyword);
    });
  }, [rows, query]);

  const profile = payload?.profile;
  const coverSrc =
    profile?.coverUrl?.trim() ||
    resolveLifeAgentCoverUrl(profile?.coverImageUrl, profile?.coverPresetKey);

  if (loading && !payload) {
    return (
      <div className="mx-auto max-w-2xl bg-white pb-6 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:pb-24 lg:pb-8">
        <div className="px-4 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <ul className="mt-4 divide-y divide-slate-100 px-4 sm:px-0" aria-busy>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li key={i} className="flex items-center gap-3 py-3.5">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-3 max-w-[12rem] animate-pulse rounded bg-slate-100" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center max-lg:-mx-4 max-lg:pb-24">
        <p className="text-[15px] text-slate-500">{loadError ?? "无法加载"}</p>
        <Link
          href={`/dashboard/life-agents/${id}`}
          className="mt-6 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-medium text-white active:opacity-90"
        >
          返回管理页
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-white pb-6 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:pb-24 lg:pb-8">
      <header className="flex items-center gap-3 px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
        <Link
          href={`/dashboard/life-agents/${id}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
          aria-label="返回管理页"
          title="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111]">用户反馈</h1>
          <p className="mt-0.5 truncate text-sm text-slate-500">{profile.displayName}</p>
        </div>
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-black/[0.06]">
          <Image
            src={coverSrc}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
            unoptimized={lifeAgentCoverShouldBypassOptimizer(coverSrc)}
          />
        </div>
      </header>

      <div className="px-4 pb-3 sm:px-0">
        <label className="sr-only">搜索反馈</label>
        <input
          className="w-full rounded-full border-0 bg-slate-100 px-4 py-2.5 text-[15px] text-[#111] outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-slate-50 focus:ring-slate-200"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索评价类型、摘要或评语"
        />
      </div>

      <div className="border-t border-slate-100">
        {rows.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-0">
            <p className="text-[15px] text-slate-400">该 Agent 暂无反馈记录</p>
            <p className="mt-2 text-sm text-slate-400">用户点击「有帮助」等或更新星级后会出现在这里</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-0">
            <p className="text-[15px] text-slate-400">没有匹配的记录</p>
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
            {filteredRows.map((row, index) => (
              <motion.li
                key={row.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index < 12 ? index * 0.02 : 0 }}
              >
                <div className="flex items-center gap-3 px-4 py-3.5 sm:px-0">
                  {row.kind === "feedback" ? (
                    <>
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ring-black/[0.06] ${feedbackAccent(row.feedbackType)}`}
                        aria-hidden
                      >
                        {row.feedbackType === "helpful" ? "赞" : row.feedbackType === "not_specific" ? "细" : "退"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate text-[16px] font-semibold text-[#111]">
                            {feedbackLabel(row.feedbackType)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            轻反馈
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-slate-400">
                          {row.comment?.trim()
                            ? row.comment
                            : row.assistantExcerpt?.trim()
                              ? row.assistantExcerpt.length > 100
                                ? `${row.assistantExcerpt.slice(0, 100)}…`
                                : row.assistantExcerpt
                              : "无摘要"}
                        </p>
                      </div>
                      <time
                        className="shrink-0 self-start pt-0.5 text-xs tabular-nums text-slate-400"
                        dateTime={row.createdAt}
                      >
                        {formatSessionTime(row.createdAt)}
                      </time>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 ring-1 ring-sky-200/80">
                        <span className="text-sm font-black tabular-nums">{row.score}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate text-[16px] font-semibold text-[#111]">星级评价</span>
                          <span className="inline-flex items-center gap-1">
                            <RatingStars score={row.score} size="sm" />
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            {row.score}/5
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-slate-400">
                          {row.comment?.trim() || "无文字评语"}
                        </p>
                      </div>
                      <time
                        className="shrink-0 self-start pt-0.5 text-xs tabular-nums text-slate-400"
                        dateTime={row.updatedAt}
                      >
                        {formatSessionTime(row.updatedAt)}
                      </time>
                    </>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
