"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RatingStars } from "@/components/RatingStars";

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
  counts: { helpful: number; notSpecific: number; notSuitable: number; factualError?: number; contradiction?: number; tooConfident?: number };
  ratings: { averageScore: number; raters: number; recent: RatingItem[] };
  recent: FeedbackItem[];
};

export default function DashboardFeedbackPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeSummary = (raw: any): SummaryData => ({
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
  });

  useEffect(() => {
    fetch("/api/life-agents/feedback/all", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(normalizeSummary(d));
        setLoading(false);
      })
      .catch(() => {
        setData(normalizeSummary(null));
        setLoading(false);
      });
  }, []);

  const feedbackLabel = (t: string) =>
    t === "helpful"
      ? "有帮助"
      : t === "not_specific"
        ? "不够具体"
        : t === "not_suitable"
          ? "不适合我"
          : t === "factual_error"
            ? "事实错误"
            : t === "contradiction"
              ? "前后矛盾"
              : t === "too_confident"
                ? "过度自信"
                : t;
  const feedbackColor = (t: string) =>
    t === "helpful"
      ? "bg-olive-400/10 text-olive-600 ring-1 ring-olive-400/40"
      : t === "not_specific"
        ? "bg-paper-200 text-ink ring-1 ring-hairline"
        : t === "factual_error"
          ? "bg-oxblood-50 text-oxblood-700 ring-1 ring-oxblood-100"
          : t === "contradiction"
            ? "bg-paper-50 text-ink-800 ring-1 ring-hairline/50"
            : t === "too_confident"
              ? "bg-paper-200 text-ink ring-1 ring-hairline"
        : "bg-oxblood-50 text-oxblood-700 ring-1 ring-oxblood-100";

  const shellClass =
    "mx-auto max-w-5xl space-y-4 max-lg:-mx-4 max-lg:bg-paper-50 max-lg:px-3 max-lg:pb-24";

  if (loading) {
    return (
      <div className={shellClass}>
        <div className="rounded-[28px] bg-paper px-4 py-5 shadow-sm ring-1 ring-hairline/40 sm:px-6">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-paper-300" />
          <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-paper-200" />
        </div>
        <div className="h-48 animate-pulse rounded-[28px] bg-paper shadow-sm ring-1 ring-hairline/40" />
        <div className="h-64 animate-pulse rounded-[28px] bg-paper shadow-sm ring-1 ring-hairline/40" />
      </div>
    );
  }

  const counts = data?.counts ?? { helpful: 0, notSpecific: 0, notSuitable: 0, factualError: 0, contradiction: 0, tooConfident: 0 };
  const ratings = data?.ratings ?? { averageScore: 0, raters: 0, recent: [] };
  const recent = data?.recent ?? [];
  const total = counts.helpful + counts.notSpecific + counts.notSuitable + (counts.factualError ?? 0) + (counts.contradiction ?? 0) + (counts.tooConfident ?? 0);

  const statTiles = [
    { label: "有帮助", value: counts.helpful, valueClass: "text-olive-600" },
    { label: "不够具体", value: counts.notSpecific, valueClass: "text-oxblood-600" },
    { label: "不适合我", value: counts.notSuitable, valueClass: "text-oxblood-700" },
    { label: "事实错误", value: counts.factualError ?? 0, valueClass: "text-oxblood-700" },
    { label: "前后矛盾", value: counts.contradiction ?? 0, valueClass: "text-ink-700" },
    { label: "过度自信", value: counts.tooConfident ?? 0, valueClass: "text-oxblood-600" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className={shellClass}
    >
      <header className="px-1 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">用户反馈</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-400">
          用户对回复的一键评价与星级，帮你判断哪里答得好、哪里要改。
        </p>
      </header>

      <section className="rounded-[28px] bg-paper px-4 py-4 shadow-sm ring-1 ring-hairline/40 sm:px-6">
        <h2 className="text-sm font-semibold text-ink-400">反馈概览</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statTiles.map((t) => (
            <div
              key={t.label}
              className="rounded-2xl bg-paper-50 px-3 py-3 text-center ring-1 ring-hairline/40 sm:py-3.5"
            >
              <p className={`text-2xl font-black tabular-nums leading-none ${t.valueClass}`}>{t.value}</p>
              <p className="mt-2 text-[11px] font-medium text-ink-500">{t.label}</p>
            </div>
          ))}
          <div className="col-span-2 rounded-2xl bg-gradient-to-br from-oxblood-50 to-oxblood-50 px-4 py-3 ring-1 ring-oxblood-100/80 sm:col-span-1">
            <p className="text-[11px] font-medium text-ink-500">综合评分</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <RatingStars score={ratings.averageScore} size="md" />
              <span className="text-2xl font-black tabular-nums text-oxblood-700">
                {ratings.raters > 0 ? ratings.averageScore.toFixed(1) : "—"}
              </span>
            </div>
            <p className="mt-2 text-center text-[10px] text-ink-400 sm:text-left">
              {ratings.raters > 0 ? `${ratings.raters} 人已评` : "暂无人评分"}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-paper shadow-sm ring-1 ring-hairline/40">
        <div className="border-b border-hairline/50 px-4 py-4 sm:px-6">
          <h2 className="text-xl font-black tracking-tight text-ink">最近反馈</h2>
          <p className="mt-1 text-sm text-ink-400">最近 50 条 · 来自用户对单条回复的评价</p>
        </div>
        <div className="px-3 py-3 sm:px-5 sm:py-4">
          {total === 0 ? (
            <p className="py-14 text-center text-[15px] text-ink-300">暂无反馈，有用户评价后会出现在这里</p>
          ) : recent.length === 0 ? (
            <p className="py-14 text-center text-[15px] text-ink-300">暂无最近反馈</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((fb, i) => (
                <motion.li
                  key={fb.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i < 12 ? i * 0.02 : 0 }}
                  className="rounded-2xl bg-paper-50 p-3.5 ring-1 ring-hairline/40 sm:p-4"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={`/dashboard/life-agents/${fb.profileId}`}
                      className="text-[15px] font-semibold text-ink underline-offset-2 hover:text-oxblood-700 hover:underline"
                    >
                      {fb.profileName}
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${feedbackColor(fb.feedbackType)}`}
                    >
                      {feedbackLabel(fb.feedbackType)}
                    </span>
                    <span className="ml-auto text-xs tabular-nums text-ink-300">{fb.createdAt}</span>
                  </div>
                  {fb.assistantExcerpt && (
                    <p className="mt-2.5 text-[13px] leading-relaxed text-ink-500">
                      <span className="font-medium text-ink-300">回复摘要 · </span>
                      {fb.assistantExcerpt.length > 120 ? `${fb.assistantExcerpt.slice(0, 120)}…` : fb.assistantExcerpt}
                    </p>
                  )}
                  {fb.comment && (
                    <p className="mt-2 rounded-xl bg-paper/80 px-3 py-2 text-[13px] leading-relaxed text-ink-600 ring-1 ring-hairline/40">
                      {fb.comment}
                    </p>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-paper shadow-sm ring-1 ring-hairline/40">
        <div className="border-b border-hairline/50 px-4 py-4 sm:px-6">
          <h2 className="text-xl font-black tracking-tight text-ink">最近评分</h2>
          <p className="mt-1 text-sm text-ink-400">
            每满 10 次提问可更新一次；重复评分覆盖旧分，人数不重复累计
          </p>
        </div>
        <div className="px-3 py-3 sm:px-5 sm:py-4">
          {ratings.recent.length === 0 ? (
            <p className="py-14 text-center text-[15px] text-ink-300">暂无评分</p>
          ) : (
            <ul className="space-y-2">
              {ratings.recent.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i < 12 ? i * 0.02 : 0 }}
                  className="rounded-2xl bg-paper-50 p-3.5 ring-1 ring-hairline/40 sm:p-4"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={`/dashboard/life-agents/${item.profileId}`}
                      className="text-[15px] font-semibold text-ink underline-offset-2 hover:text-oxblood-700 hover:underline"
                    >
                      {item.profileName}
                    </Link>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2 py-0.5 text-[11px] font-semibold text-oxblood-700 ring-1 ring-oxblood-100">
                      <RatingStars score={item.score} size="sm" />
                      {item.score}/5
                    </span>
                    <span className="ml-auto text-xs tabular-nums text-ink-300">{item.updatedAt}</span>
                  </div>
                  {item.comment && (
                    <p className="mt-2.5 text-[13px] leading-relaxed text-ink-600">{item.comment}</p>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </motion.div>
  );
}
