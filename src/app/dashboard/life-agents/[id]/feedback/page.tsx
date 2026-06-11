"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RatingStars } from "@/components/RatingStars";
import { feedbackTypeBadgeClass, feedbackTypeLabel } from "@/lib/feedback-display";
import {
  fetchManageData,
  extractTopKeywords,
  formatShortTime,
  type FeedbackAlert,
  type ManageData,
} from "@/app/dashboard/life-agents/_lib/manage";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  PanelHeader,
  SearchInput,
  StatStrip,
} from "@/components/dashboard/AgentAdminUI";
import {
  SEVERITY_BADGE,
  SEVERITY_DOT,
  SEVERITY_LABEL,
  SEVERITY_LINK,
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
      list.push("出现“不适合我”反馈，建议完善适合帮助的人群和不想回答的问题。");
    }
    if ((feedbackCounts.factualError ?? 0) > 0 || (feedbackCounts.contradiction ?? 0) > 0) {
      list.push("已经出现事实错误或前后矛盾，建议优先检查结构化事实、知识条目和记忆摘要。");
    }
    if (ratings.raters > 0 && ratings.averageScore < 4) {
      list.push("星级均分偏低，建议先用对话调教优化语气和回答结构。");
    }
    if (list.length === 0) list.push("当前整体反馈稳定，可以继续扩充知识条目并保持更新频率。");
    return list;
  }, [feedbackCounts, ratings.averageScore, ratings.raters]);

  if (loading && !payload) {
    return (
      <AdminPage>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (loadError || !payload?.profile) {
    return (
      <AdminPage narrow>
        <EmptyState title={loadError ?? "无法加载"} action={<Link href={`/dashboard/life-agents/${id}`} className="btn-primary">返回工作台</Link>} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="反馈诊断"
        description={`${payload.profile.displayName} 的用户评价、轻反馈和近期风险信号。`}
        actions={<SearchInput value={query} onChange={setQuery} placeholder="搜索反馈类型、摘要或评语" label="搜索反馈" />}
      />

      <div className="mb-5">
        <StatStrip
          columns={3}
          items={[
            { label: "综合评分", value: ratings.raters > 0 ? ratings.averageScore.toFixed(1) : "—", sub: "星", tone: "signal" },
            { label: "有帮助", value: feedbackCounts.helpful, sub: "条", tone: "olive" },
            { label: "不够具体", value: feedbackCounts.notSpecific, sub: "条" },
          ]}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {alerts.length > 0 ? (
            <Panel>
              <PanelHeader title="需要你关注" description="来自用户真实反馈，按紧急程度排序。" />
              <ul className="divide-y divide-hairline/60 px-4 sm:px-5">
                {alerts.map((alert: FeedbackAlert) => {
                  const tier = severityFromPriority(alert.priority);
                  return (
                    <li key={alert.id} className="flex items-start gap-3 py-3 text-sm">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${SEVERITY_DOT[tier]}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-ink">{alert.title}</p>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_BADGE[tier]}`}>{SEVERITY_LABEL[tier]}</span>
                        </div>
                        <p className="mt-1 text-ink-500">{alert.detail}</p>
                        <Link
                          href={alert.source === "blind_spot" ? `/dashboard/life-agents/${id}/blind-spots` : `/dashboard/life-agents/${id}/topics`}
                          className={`mt-1 inline-block text-xs font-medium underline ${SEVERITY_LINK[tier]}`}
                        >
                          {alert.action}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="全部反馈记录" description={`${filteredRows.length} 条`} />
            {rows.length === 0 ? (
              <div className="p-5">
                <EmptyState title="该 Agent 暂无反馈记录" />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-5">
                <EmptyState title="没有匹配的记录" />
              </div>
            ) : (
              <ul className="divide-y divide-hairline/60">
                {filteredRows.map((row) => (
                  <li key={row.key} className="px-4 py-4 text-sm sm:px-5">
                    {row.kind === "feedback" ? (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <span className={feedbackTypeBadgeClass(row.feedbackType)}>{feedbackTypeLabel(row.feedbackType)}</span>
                          <time className="shrink-0 text-xs tabular-nums text-ink-300" dateTime={row.createdAt}>{formatShortTime(row.createdAt)}</time>
                        </div>
                        <p className="mt-2 line-clamp-2 text-ink-500">{row.comment?.trim() || row.assistantExcerpt?.trim() || "无文字说明"}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="font-medium text-ink">星级评价</p>
                            <RatingStars score={row.score} size="sm" />
                          </div>
                          <time className="shrink-0 text-xs tabular-nums text-ink-300" dateTime={row.updatedAt}>{formatShortTime(row.updatedAt)}</time>
                        </div>
                        <p className="mt-2 line-clamp-2 text-ink-500">{row.comment?.trim() || "无文字评语"}</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="反馈类型" />
            <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
              {[
                ["有帮助", feedbackCounts.helpful, "helpful"],
                ["不适合我", feedbackCounts.notSuitable, "not_suitable"],
                ["事实错误", feedbackCounts.factualError ?? 0, "factual_error"],
                ["前后矛盾", feedbackCounts.contradiction ?? 0, "contradiction"],
                ["过度自信", feedbackCounts.tooConfident ?? 0, "too_confident"],
              ].map(([label, value, type]) => (
                <div key={String(type)} className="rounded border border-hairline/60 bg-paper px-3 py-3">
                  <p className={`text-xl font-semibold tabular-nums ${feedbackTypeValueClass(String(type))}`}>{value}</p>
                  <p className="mt-1 text-xs text-ink-500">{label}</p>
                </div>
              ))}
            </div>
          </Panel>

          {keywords.length > 0 ? (
            <Panel className="p-4 sm:p-5">
              <p className="text-sm font-semibold text-ink">近期关键词</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">{keywords.join(" · ")}</p>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="改进建议" />
            <ul className="divide-y divide-hairline/60 px-4 text-sm leading-6 text-ink-600 sm:px-5">
              {suggestions.map((item) => (
                <li key={item} className="py-3">{item}</li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AdminPage>
  );
}
