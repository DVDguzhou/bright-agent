"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RatingStars } from "@/components/RatingStars";
import { feedbackTypeBadgeClass, feedbackTypeLabel } from "@/lib/feedback-display";
import { feedbackTypeValueClass } from "@/lib/severity-style";

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

function StatCell({
  value,
  label,
  sub,
  valueClass,
}: {
  value: string | number;
  label: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="px-3 py-3 text-center">
      <p className={`text-2xl font-semibold tabular-nums leading-none ${valueClass ?? "text-ink"}`}>{value}</p>
      <p className="mt-2 text-[11px] font-medium text-ink-600">{label}</p>
      <p className="mt-0.5 text-[11px] text-ink-400">{sub}</p>
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl divide-y divide-hairline/30 max-lg:-mx-4 max-lg:px-4 max-lg:pb-24">
        <div className="h-24 animate-pulse bg-paper-100/60 py-4" />
        <div className="h-40 animate-pulse bg-paper-100/40 py-4" />
        <div className="h-56 animate-pulse bg-paper-100/40 py-4" />
      </div>
    );
  }

  const counts = data?.counts ?? { helpful: 0, notSpecific: 0, notSuitable: 0, factualError: 0, contradiction: 0, tooConfident: 0 };
  const ratings = data?.ratings ?? { averageScore: 0, raters: 0, recent: [] };
  const recent = data?.recent ?? [];
  const total =
    counts.helpful +
    counts.notSpecific +
    counts.notSuitable +
    (counts.factualError ?? 0) +
    (counts.contradiction ?? 0) +
    (counts.tooConfident ?? 0);

  const statRows: Array<{ type: string; label: string; value: number }> = [
    { type: "helpful", label: "有帮助", value: counts.helpful },
    { type: "not_specific", label: "不够具体", value: counts.notSpecific },
    { type: "not_suitable", label: "不适合我", value: counts.notSuitable },
    { type: "factual_error", label: "事实错误", value: counts.factualError ?? 0 },
    { type: "contradiction", label: "前后矛盾", value: counts.contradiction ?? 0 },
    { type: "too_confident", label: "过度自信", value: counts.tooConfident ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-5xl divide-y divide-hairline/30 max-lg:-mx-4 max-lg:px-4 max-lg:pb-24">
      <section className="pb-4 pt-3">
        <h1 className="font-serif text-3xl font-medium leading-tight tracking-tight text-ink">用户反馈</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-400">
          用户对回复的一键评价与星级，帮你判断哪里答得好、哪里要改。
        </p>
      </section>

      <section className="divide-y divide-hairline/30">
        <div className="grid grid-cols-3 [&>*:not(:last-child)]:border-r [&>*]:border-hairline/30">
          {statRows.slice(0, 3).map((t) => (
            <StatCell
              key={t.type}
              value={t.value}
              label={t.label}
              sub="条"
              valueClass={feedbackTypeValueClass(t.type)}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 [&>*:not(:last-child)]:border-r [&>*]:border-hairline/30">
          {statRows.slice(3).map((t) => (
            <StatCell
              key={t.type}
              value={t.value}
              label={t.label}
              sub="条"
              valueClass={feedbackTypeValueClass(t.type)}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 [&>*:not(:last-child)]:border-r [&>*]:border-hairline/30">
          <StatCell
            value={ratings.raters > 0 ? ratings.averageScore.toFixed(1) : "—"}
            label="综合评分"
            sub={ratings.raters > 0 ? `${ratings.raters} 人已评` : "暂无人评分"}
            valueClass="text-ink"
          />
        </div>
      </section>

      <section className="py-4">
        <h2 className="font-serif text-xl font-medium tracking-tight text-ink">最近反馈</h2>
        <p className="mt-1 text-sm text-ink-400">最近 50 条 · 来自用户对单条回复的评价</p>
        {total === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-300">暂无反馈，有用户评价后会出现在这里</p>
        ) : recent.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-300">暂无最近反馈</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline/30">
            {recent.map((fb) => (
              <li key={fb.id} className="py-4 text-sm first:pt-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    href={`/dashboard/life-agents/${fb.profileId}`}
                    className="font-medium text-ink underline-offset-2 hover:text-oxblood-700 hover:underline"
                  >
                    {fb.profileName}
                  </Link>
                  <span className={feedbackTypeBadgeClass(fb.feedbackType)}>
                    {feedbackTypeLabel(fb.feedbackType)}
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-ink-300">{fb.createdAt}</span>
                </div>
                {fb.assistantExcerpt ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
                    <span className="font-medium text-ink-400">回复摘要 · </span>
                    {fb.assistantExcerpt.length > 120 ? `${fb.assistantExcerpt.slice(0, 120)}…` : fb.assistantExcerpt}
                  </p>
                ) : null}
                {fb.comment ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-600">{fb.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="py-4">
        <h2 className="font-serif text-xl font-medium tracking-tight text-ink">最近评分</h2>
        <p className="mt-1 text-sm text-ink-400">
          每满 10 次提问可更新一次；重复评分覆盖旧分，人数不重复累计
        </p>
        {ratings.recent.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-300">暂无评分</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline/30">
            {ratings.recent.map((item) => (
              <li key={item.id} className="py-4 text-sm first:pt-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    href={`/dashboard/life-agents/${item.profileId}`}
                    className="font-medium text-ink underline-offset-2 hover:text-oxblood-700 hover:underline"
                  >
                    {item.profileName}
                  </Link>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-600">
                    <RatingStars score={item.score} size="sm" />
                    {item.score}/5
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-ink-300">{item.updatedAt}</span>
                </div>
                {item.comment ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-600">{item.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
