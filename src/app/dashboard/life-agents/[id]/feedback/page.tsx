"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatCell } from "@/components/dashboard/StatCell";
import { RatingStars } from "@/components/RatingStars";
import { feedbackTypeLabel } from "@/lib/feedback-display";
import {
  fetchManageData,
  extractTopKeywords,
  formatShortTime,
  type FeedbackAlert,
  type ManageData,
} from "@/app/dashboard/life-agents/_lib/manage";
import {
  SEVERITY_BADGE,
  SEVERITY_DOT,
  SEVERITY_LABEL,
  SEVERITY_LINK,
  SEVERITY_TEXT,
  feedbackTypeValueClass,
  severityFromPriority,
} from "@/lib/severity-style";

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
        return [feedbackTypeLabel(row.feedbackType), row.assistantExcerpt ?? "", row.comment ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      }
      return [String(row.score), row.comment ?? "", "星级", "评分"].join(" ").toLowerCase().includes(keyword);
    });
  }, [rows, query]);

  const feedbackCounts = useMemo(
    () =>
      payload?.feedback?.counts ?? {
        helpful: 0,
        notSpecific: 0,
        notSuitable: 0,
        factualError: 0,
        contradiction: 0,
        tooConfident: 0,
      },
    [payload?.feedback?.counts],
  );
  const ratings = payload?.feedback?.ratings ?? {
    averageScore: 0,
    raters: 0,
    recent: [] as Array<{ score: number; comment?: string | null; updatedAt: string }>,
  };
  const alerts = payload?.feedback?.alerts ?? [];
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
  const trendRows = ratings.recent.slice(0, 7).reverse();

  if (loading && !payload) {
    return <div className="mx-auto h-56 max-w-4xl animate-pulse bg-paper-100/60" />;
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-[15px] text-ink-400">{loadError ?? "无法加载"}</p>
        <Link href={`/dashboard/life-agents/${id}`} className="mt-6 inline-flex rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper">
          返回工作台
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl divide-y divide-hairline/30 max-lg:-mx-4 max-lg:px-4 max-lg:pb-24">
      <section className="pb-4 pt-3">
        <Link href={`/dashboard/life-agents/${id}`} className="text-sm font-medium text-ink-400 transition hover:text-ink">
          ← 返回工作台
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight text-ink">反馈诊断</h1>
        <p className="mt-1 text-sm text-ink-400">{profile.displayName} 的用户评价与轻反馈</p>
        <div className="mt-4">
          <input
            className="w-full rounded border border-hairline bg-paper px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-300 focus:border-ink"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索评价类型、摘要或评语"
            aria-label="搜索反馈"
          />
        </div>
      </section>

      <section className="divide-y divide-hairline/30">
        <div className="grid grid-cols-3 [&>*:not(:last-child)]:border-r [&>*]:border-hairline/30">
          <StatCell
            value={ratings.raters > 0 ? ratings.averageScore.toFixed(1) : "—"}
            label="综合评分"
            sub="星"
            valueClass="text-ink"
          />
          <StatCell
            value={feedbackCounts.helpful}
            label="有帮助"
            sub="条"
            valueClass={feedbackTypeValueClass("helpful")}
          />
          <StatCell
            value={feedbackCounts.notSpecific}
            label="不够具体"
            sub="条"
            valueClass={feedbackTypeValueClass("not_specific")}
          />
        </div>
        <div className="grid grid-cols-3 [&>*:not(:last-child)]:border-r [&>*]:border-hairline/30">
          <StatCell
            value={feedbackCounts.notSuitable}
            label="不适合我"
            sub="条"
            valueClass={feedbackTypeValueClass("not_suitable")}
          />
          <StatCell
            value={feedbackCounts.factualError ?? 0}
            label="事实错误"
            sub="条"
            valueClass={feedbackTypeValueClass("factual_error")}
          />
          <StatCell
            value={feedbackCounts.contradiction ?? 0}
            label="前后矛盾"
            sub="条"
            valueClass={feedbackTypeValueClass("contradiction")}
          />
        </div>
      </section>

      {alerts.length > 0 ? (
        <section className="py-4">
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink">需要你关注</h2>
          <p className="mt-1 text-xs text-ink-300">来自用户的真实反馈，按紧急程度排列</p>
          <ul className="mt-3 divide-y divide-hairline/30">
            {alerts.map((alert: FeedbackAlert) => {
              const tier = severityFromPriority(alert.priority);
              return (
                <li key={alert.id} className="flex items-start gap-3 py-3 text-sm leading-6 first:pt-0">
                  <span className={`mt-0.5 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${SEVERITY_DOT[tier]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${SEVERITY_TEXT[tier]}`}>{alert.title}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_BADGE[tier]}`}>
                        {SEVERITY_LABEL[tier]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-ink-500">{alert.detail}</p>
                    {alert.topicId ? (
                      <Link
                        href={`/dashboard/life-agents/${id}/topics`}
                        className={`mt-1 inline-block text-xs font-medium underline ${SEVERITY_LINK[tier]}`}
                      >
                        {alert.action} →
                      </Link>
                    ) : null}
                    {alert.source === "blind_spot" ? (
                      <Link
                        href={`/dashboard/life-agents/${id}/blind-spots`}
                        className="mt-1 inline-block text-xs font-medium text-ink-600 underline"
                      >
                        {alert.action} →
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="py-4">
        <h2 className="font-serif text-xl font-medium tracking-tight text-ink">评分趋势</h2>
        {trendRows.length === 0 ? (
          <p className="mt-3 text-sm text-ink-300">还没有星级评分</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {trendRows.map((item, index) => (
              <li key={`${item.updatedAt}-${index}`} className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 text-xs text-ink-300">{formatShortTime(item.updatedAt)}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-200">
                  <div
                    className="h-full rounded-full bg-oxblood-400"
                    style={{ width: `${(item.score / 5) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-semibold tabular-nums text-ink">{item.score}/5</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {keywords.length > 0 ? (
        <section className="py-3">
          <p className="text-[11px] font-medium text-ink-600">近期关键词</p>
          <p className="mt-2 text-sm text-ink-500">{keywords.join(" · ")}</p>
        </section>
      ) : null}

      <section className="py-4">
        <h2 className="font-serif text-xl font-medium tracking-tight text-ink">改进建议</h2>
        <ul className="mt-3 divide-y divide-hairline/30 text-sm text-ink">
          {suggestions.map((item) => (
            <li key={item} className="py-3 first:pt-0">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="py-4">
        <h2 className="font-serif text-xl font-medium tracking-tight text-ink">全部反馈记录</h2>
        <p className="mt-1 text-sm text-ink-400">{filteredRows.length} 条</p>
        {rows.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-300">该 Agent 暂无反馈记录</p>
        ) : filteredRows.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-300">没有匹配的记录</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline/30">
            {filteredRows.map((row) => (
              <li key={row.key} className="py-4 text-sm first:pt-0">
                {row.kind === "feedback" ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink">{feedbackTypeLabel(row.feedbackType)}</p>
                      <time className="shrink-0 text-xs tabular-nums text-ink-300" dateTime={row.createdAt}>
                        {formatShortTime(row.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-ink-400">
                      {row.comment?.trim()
                        ? row.comment
                        : row.assistantExcerpt?.trim()
                          ? row.assistantExcerpt.length > 100
                            ? `${row.assistantExcerpt.slice(0, 100)}…`
                            : row.assistantExcerpt
                          : "无摘要"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">星级评价</p>
                        <RatingStars score={row.score} size="sm" />
                      </div>
                      <time className="shrink-0 text-xs tabular-nums text-ink-300" dateTime={row.updatedAt}>
                        {formatShortTime(row.updatedAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-ink-400">{row.comment?.trim() || "无文字评语"}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
