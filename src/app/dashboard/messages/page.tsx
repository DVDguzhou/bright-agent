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
  counts: { helpful: number; notSpecific: number; notSuitable: number };
  ratings: { averageScore: number; raters: number; recent: RatingItem[] };
  recent: FeedbackItem[];
};

export default function DashboardMessagesPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeSummary = (raw: any): SummaryData => ({
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
    t === "helpful" ? "有帮助" : t === "not_specific" ? "不够具体" : t === "not_suitable" ? "不适合我" : t;
  const feedbackColor = (t: string) =>
    t === "helpful"
      ? "bg-green-100 text-green-700"
      : t === "not_specific"
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";

  if (loading) {
    return (
      <div className="space-y-8">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-sky-700">
          ← 返回控制台
        </Link>
        <div className="h-64 animate-pulse rounded-3xl bg-white shadow-sm" />
      </div>
    );
  }

  const counts = data?.counts ?? { helpful: 0, notSpecific: 0, notSuitable: 0 };
  const ratings = data?.ratings ?? { averageScore: 0, raters: 0, recent: [] };
  const recent = data?.recent ?? [];
  const total = counts.helpful + counts.notSpecific + counts.notSuitable;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-sky-700">
          ← 返回控制台
        </Link>
        <h1 className="section-title mt-3">消息 · 用户反馈</h1>
        <p className="section-subtitle mt-2">
          用户对你的人生 Agent 回复的评价，帮你了解回答效果并持续改进
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">有帮助</p>
          <p className="mt-1 text-2xl font-semibold text-green-700">{counts.helpful}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">不够具体</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{counts.notSpecific}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">不适合我</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">{counts.notSuitable}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">当前评分</p>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars score={ratings.averageScore} size="md" />
            <p className="text-2xl font-semibold text-sky-700">
              {ratings.raters > 0 ? ratings.averageScore.toFixed(1) : "--"}
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-500">{ratings.raters} 位用户已评分</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">最近反馈（最近 50 条）</h2>
          <p className="mt-1 text-sm text-slate-500">
            用户对某条回复点击「有帮助」「不够具体」或「不适合我」后，会出现在这里
          </p>
        </div>
        <div className="p-6">
          {total === 0 ? (
            <p className="py-12 text-center text-slate-500">暂无反馈，用户反馈后会显示在这里</p>
          ) : recent.length === 0 ? (
            <p className="py-12 text-center text-slate-500">暂无最近反馈</p>
          ) : (
            <ul className="space-y-4">
              {recent.map((fb, i) => (
                <motion.li
                  key={fb.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/life-agents/${fb.profileId}`}
                      className="text-sm font-medium text-sky-600 hover:text-sky-700"
                    >
                      {fb.profileName}
                    </Link>
                    <span className="text-slate-400">·</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${feedbackColor(
                        fb.feedbackType
                      )}`}
                    >
                      {feedbackLabel(fb.feedbackType)}
                    </span>
                    <span className="text-xs text-slate-400">{fb.createdAt}</span>
                  </div>
                  {fb.assistantExcerpt && (
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-500">回复摘要：</span>
                      {fb.assistantExcerpt.length > 120
                        ? fb.assistantExcerpt.slice(0, 120) + "…"
                        : fb.assistantExcerpt}
                    </p>
                  )}
                  {fb.comment && (
                    <p className="mt-1 text-sm text-slate-700 italic">补充：{fb.comment}</p>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">最近评分</h2>
          <p className="mt-1 text-sm text-slate-500">用户每满 10 次提问可更新一次评分，重复评分会覆盖旧分数，不会重复计人数</p>
        </div>
        <div className="p-6">
          {ratings.recent.length === 0 ? (
            <p className="py-12 text-center text-slate-500">暂无评分</p>
          ) : (
            <ul className="space-y-4">
              {ratings.recent.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/life-agents/${item.profileId}`} className="text-sm font-medium text-sky-600 hover:text-sky-700">
                      {item.profileName}
                    </Link>
                    <span className="text-slate-400">·</span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">
                      <RatingStars score={item.score} size="sm" />
                      {item.score}/5 分
                    </span>
                    <span className="text-xs text-slate-400">{item.updatedAt}</span>
                  </div>
                  {item.comment && <p className="mt-2 text-sm text-slate-700">{item.comment}</p>}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
