"use client";

import { useEffect, useMemo, useState } from "react";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RatingStars } from "@/components/RatingStars";
import { resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";
import {
  extractTopKeywords,
  fetchManageData,
  formatShortTime,
  type ManageData,
} from "@/app/dashboard/life-agents/_lib/manage";

type FeedRow =
  | {
      key: string;
      kind: "feedback";
      feedbackType: string;
      assistantExcerpt?: string | null;
      comment?: string | null;
      createdAt: string;
      sortMs: number;
    }
  | {
      key: string;
      kind: "rating";
      score: number;
      comment?: string | null;
      updatedAt: string;
      sortMs: number;
    };

function feedbackLabel(t: string) {
  if (t === "helpful") return "有帮助";
  if (t === "not_specific") return "不够具体";
  if (t === "not_suitable") return "不适合我";
  if (t === "factual_error") return "事实错误";
  if (t === "contradiction") return "前后矛盾";
  if (t === "too_confident") return "过度自信";
  return t;
}

function feedbackAccent(t: string) {
  if (t === "helpful") return "bg-emerald-100 text-emerald-800";
  if (t === "not_specific") return "bg-amber-100 text-amber-900";
  if (t === "factual_error") return "bg-red-100 text-red-800";
  if (t === "contradiction") return "bg-violet-100 text-violet-800";
  if (t === "too_confident") return "bg-orange-100 text-orange-900";
  return "bg-rose-100 text-rose-800";
}

function FeedbackHeader({
  id,
  title,
  subtitle,
  query,
  onQueryChange,
  coverSrc,
  disableSearch = false,
}: {
  id: string;
  title: string;
  subtitle: string;
  query?: string;
  onQueryChange?: (value: string) => void;
  coverSrc?: string;
  disableSearch?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(0.35rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-0">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/life-agents/${id}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
          aria-label="返回工作台"
          title="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111]">{title}</h1>
          <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-black/[0.06]">
          {coverSrc ? (
            <LifeAgentCoverImage
              src={coverSrc}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-semibold text-slate-400">A</div>
          )}
        </div>
      </div>
      <div className="mt-4">
        <input
          className="w-full rounded-full border-0 bg-slate-100 px-4 py-2.5 text-[15px] text-[#111] outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-slate-50 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
          value={query ?? ""}
          onChange={(e) => onQueryChange?.(e.target.value)}
          placeholder="搜索评价类型、摘要或评语"
          disabled={disableSearch}
        />
      </div>
    </header>
  );
}

export default function LifeAgentFeedbackFeedPage() {
  const params = useParams();
  const id = params.id as string;
  const [payload, setPayload] = useState<ManageData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchManageData(id).then((result) => {
      if (cancelled) return;
      setPayload(result.data);
      setLoadError(result.error);
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
        return [feedbackLabel(row.feedbackType), row.assistantExcerpt ?? "", row.comment ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      }
      return [String(row.score), row.comment ?? "", "星级", "评分"].join(" ").toLowerCase().includes(keyword);
    });
  }, [rows, query]);

  const feedbackCounts = useMemo(
    () => payload?.feedback?.counts ?? { helpful: 0, notSpecific: 0, notSuitable: 0, factualError: 0, contradiction: 0, tooConfident: 0 },
    [payload?.feedback?.counts]
  );
  const ratings = payload?.feedback?.ratings ?? { averageScore: 0, raters: 0, recent: [] as Array<{ score: number; comment?: string | null; updatedAt: string }> };
  const keywords = useMemo(
    () =>
      extractTopKeywords(
        rows.map((row) => (row.kind === "feedback" ? `${row.assistantExcerpt ?? ""} ${row.comment ?? ""}` : row.comment ?? "")),
        8,
      ),
    [rows],
  );
  const suggestions = useMemo(() => {
    const list: string[] = [];
    if (feedbackCounts.notSpecific > feedbackCounts.helpful) {
      list.push("近期“不够具体”偏多，优先补真实案例、决策步骤和示范回答。");
    }
    if (feedbackCounts.notSuitable > 0) {
      list.push("出现“不适合我”反馈，建议完善“适合帮助的人群”和“不想回答的问题”。");
    }
    if ((feedbackCounts.factualError ?? 0) > 0 || (feedbackCounts.contradiction ?? 0) > 0) {
      list.push("已经出现事实错误或前后矛盾，建议优先检查结构化事实、知识条目和记忆摘要。");
    }
    if (ratings.raters > 0 && ratings.averageScore < 4) {
      list.push("星级均分偏低，建议先用对话调教优化语气和回答结构。");
    }
    if (list.length === 0) {
      list.push("当前整体反馈稳定，可以继续扩充知识条目并保持更新频率。");
    }
    return list;
  }, [feedbackCounts, ratings.averageScore, ratings.raters]);

  const profile = payload?.profile;
  const coverSrc =
    profile?.coverUrl?.trim() ||
    resolveLifeAgentCoverUrl(profile?.coverImageUrl, profile?.coverPresetKey);

  if (loading && !payload) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 max-lg:-mx-4 max-lg:bg-[#f7f8fa] max-lg:pb-24">
        <FeedbackHeader id={id} title="反馈诊断" subtitle="正在加载 Agent 反馈" disableSearch />
        <div className="h-56 animate-pulse rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 max-lg:-mx-4 max-lg:bg-[#f7f8fa] max-lg:pb-24">
        <FeedbackHeader id={id} title="反馈诊断" subtitle="暂时无法读取这个 Agent 的反馈数据" disableSearch />
        <div className="rounded-[28px] bg-white px-4 py-16 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-[15px] text-slate-500">{loadError ?? "无法加载"}</p>
          <Link href={`/dashboard/life-agents/${id}`} className="mt-6 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-medium text-white">
            返回工作台
          </Link>
        </div>
      </div>
    );
  }

  const trendRows = ratings.recent.slice(0, 7).reverse();

  return (
    <div className="mx-auto max-w-3xl space-y-4 max-lg:-mx-4 max-lg:bg-[#f7f8fa] max-lg:px-3 max-lg:pb-24">
      <FeedbackHeader
        id={id}
        title="反馈诊断"
        subtitle={profile.displayName}
        query={query}
        onQueryChange={setQuery}
        coverSrc={coverSrc}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-sky-700">{ratings.raters > 0 ? ratings.averageScore.toFixed(1) : "—"}</p>
          <p className="mt-1 text-xs text-slate-500">综合评分</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-emerald-700">{feedbackCounts.helpful}</p>
          <p className="mt-1 text-xs text-slate-500">有帮助</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-amber-700">{feedbackCounts.notSpecific}</p>
          <p className="mt-1 text-xs text-slate-500">不够具体</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-rose-700">{feedbackCounts.notSuitable}</p>
          <p className="mt-1 text-xs text-slate-500">不适合我</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-red-700">{feedbackCounts.factualError ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">事实错误</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-2xl font-black text-violet-700">{feedbackCounts.contradiction ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">前后矛盾</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
          <h2 className="text-lg font-semibold text-[#111]">评分趋势</h2>
          {trendRows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">还没有星级评分</p>
          ) : (
            <div className="mt-4 space-y-3">
              {trendRows.map((item, index) => (
                <div key={`${item.updatedAt}-${index}`} className="flex items-center gap-3">
                  <div className="w-14 text-xs text-slate-400">{formatShortTime(item.updatedAt)}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${(item.score / 5) * 100}%` }} />
                  </div>
                  <div className="w-10 text-right text-sm font-semibold text-[#111]">{item.score}/5</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
          <h2 className="text-lg font-semibold text-[#111]">近期关键词</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {keywords.length > 0 ? (
              keywords.map((word) => (
                <span key={word} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  {word}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-400">还没有足够的文本反馈可提炼关键词</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <h2 className="text-lg font-semibold text-[#111]">改进建议</h2>
        <ul className="mt-3 space-y-2 text-sm text-amber-950">
          {suggestions.map((item) => (
            <li key={item} className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-[#111]">全部反馈记录</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <div className="px-4 py-16 text-center text-[15px] text-slate-400">该 Agent 暂无反馈记录</div>
          ) : filteredRows.length === 0 ? (
            <div className="px-4 py-16 text-center text-[15px] text-slate-400">没有匹配的记录</div>
          ) : (
            filteredRows.map((row) => (
              <div key={row.key} className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
                {row.kind === "feedback" ? (
                  <>
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ring-black/[0.06] ${feedbackAccent(row.feedbackType)}`}>
                      {row.feedbackType === "helpful"
                        ? "赞"
                        : row.feedbackType === "not_specific"
                          ? "细"
                          : row.feedbackType === "factual_error"
                            ? "错"
                            : row.feedbackType === "contradiction"
                              ? "冲"
                              : row.feedbackType === "too_confident"
                                ? "满"
                                : "退"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-[16px] font-semibold text-[#111]">{feedbackLabel(row.feedbackType)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">轻反馈</span>
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
                    <time className="shrink-0 self-start pt-0.5 text-xs tabular-nums text-slate-400" dateTime={row.createdAt}>
                      {formatShortTime(row.createdAt)}
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
                        <RatingStars score={row.score} size="sm" />
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-slate-400">{row.comment?.trim() || "无文字评语"}</p>
                    </div>
                    <time className="shrink-0 self-start pt-0.5 text-xs tabular-nums text-slate-400" dateTime={row.updatedAt}>
                      {formatShortTime(row.updatedAt)}
                    </time>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
