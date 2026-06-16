"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Code2,
  FileText,
  MessageCircle,
  Pencil,
  ShieldQuestion,
  Star,
  Trash2,
} from "lucide-react";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { resolveLifeAgentCoverDisplayUrl } from "@/lib/life-agent-covers";
import {
  buildOptimizationSuggestions,
  computeCompletion,
  fetchManageData,
  formatShortTime,
  type FeedbackAlert,
  type ManageData,
} from "@/app/dashboard/life-agents/_lib/manage";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { MindScoreBadge } from "@/components/MindScoreBadge";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  PanelHeader,
  RowLink,
  StatStrip,
  StatusBadge,
} from "@/components/dashboard/AgentAdminUI";
import {
  SEVERITY_BADGE,
  SEVERITY_DOT,
  SEVERITY_LABEL,
  SEVERITY_LINK,
  severityFromPriority,
} from "@/lib/severity-style";
import {
  formatGrowthFreshDays,
  growthEventCategory,
  LIFE_AGENT_GROWTH_CATEGORY_LABELS,
  LIFE_AGENT_GROWTH_TYPE_LABELS,
  type LifeAgentGrowthEvent,
} from "@/lib/life-agent-growth";

type LoadState = {
  data: ManageData | null;
  error: string | null;
  loading: boolean;
};

type LiveUpdate = {
  id: string;
  content: string;
  category: string;
  location?: string;
  pinned: boolean;
  createdAt: string;
  freshDays: number;
};

const LIVE_CATEGORIES = [
  { value: "general", label: "综合" },
  { value: "market", label: "行情" },
  { value: "job", label: "求职" },
  { value: "life", label: "生活" },
  { value: "study", label: "升学" },
  { value: "housing", label: "房产" },
  { value: "policy", label: "政策" },
  { value: "resource", label: "资源" },
];

function QuickAction({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-hairline/70 bg-paper-50 p-4 shadow-glow-sm transition hover:-translate-y-0.5 hover:border-signal-200 hover:shadow-glow motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-paper-200 text-ink-500 transition group-hover:bg-signal-100 group-hover:text-signal-700">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-ink-500">{desc}</span>
        </span>
      </div>
    </Link>
  );
}

export default function LifeAgentManageHomePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [state, setState] = useState<LoadState>({ data: null, error: null, loading: true });
  const [deleting, setDeleting] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [liveContent, setLiveContent] = useState("");
  const [liveCategory, setLiveCategory] = useState("general");
  const [liveLocation, setLiveLocation] = useState("");
  const [livePosting, setLivePosting] = useState(false);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const result = await fetchManageData(id);
    setState({ data: result.data, error: result.error, loading: false });
  }, [id]);

  const loadLiveUpdates = useCallback(async () => {
    try {
      const res = await fetch(`/api/life-agents/${id}/live-updates`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setLiveUpdates(Array.isArray(json.updates) ? json.updates : []);
      }
    } catch {
      setLiveUpdates([]);
    }
  }, [id]);

  useEffect(() => {
    void load();
    void loadLiveUpdates();
  }, [load, loadLiveUpdates]);

  const data = state.data;
  const profile = data?.profile;
  const completion = useMemo(() => (profile ? computeCompletion(profile) : 0), [profile]);
  const feedbackTotal = useMemo(() => {
    if (!data?.feedback) return 0;
    const counts = data.feedback.counts;
    return (
      (counts.helpful ?? 0) +
      (counts.notSpecific ?? 0) +
      (counts.notSuitable ?? 0) +
      (counts.factualError ?? 0) +
      (counts.contradiction ?? 0) +
      (counts.tooConfident ?? 0)
    );
  }, [data]);
  const suggestions = useMemo(() => (data ? buildOptimizationSuggestions(data) : []), [data]);

  const postLiveUpdate = async () => {
    if (!liveContent.trim()) return;
    setLivePosting(true);
    try {
      const res = await fetch(`/api/life-agents/${id}/live-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: liveContent.trim(),
          category: liveCategory,
          location: liveLocation.trim() || undefined,
        }),
      });
      if (res.ok) {
        setLiveContent("");
        setLiveLocation("");
        void loadLiveUpdates();
        void load();
      }
    } finally {
      setLivePosting(false);
    }
  };

  const deleteLiveUpdate = async (updateId: string) => {
    await fetch(`/api/life-agents/${id}/live-updates/${updateId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setLiveUpdates((prev) => prev.filter((u) => u.id !== updateId));
    void load();
  };

  const deleteAgent = async () => {
    if (!confirm("确定删除这个人生 Agent 吗？删除后无法恢复。")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/life-agents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        alert("删除失败，请稍后重试");
        return;
      }
      router.push("/dashboard/life-agents");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  if (state.loading && !data) {
    return (
      <AdminPage>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (!data || !profile) {
    return (
      <AdminPage narrow>
        <EmptyState
          title={state.error ?? "加载失败"}
          description="没有拿到这个 Agent 的管理数据。"
          action={<button type="button" onClick={() => void load()} className="btn-primary">重新加载</button>}
        />
      </AdminPage>
    );
  }

  const coverSrc = resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey);
  const headline = cleanLifeAgentIntroText(profile.headline, profile.displayName);
  const growthSummary = data.growth?.summary;
  const growthEvents = data.growth?.events ?? [];

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Agent 工作台"
        title={profile.displayName}
        description={headline}
        actions={
          <>
            <Link href={`/life-agents/${id}`} className="btn-secondary">查看展示页</Link>
            <Link href={`/dashboard/life-agents/${id}/edit`} className="btn-primary">
              <Pencil className="h-4 w-4" />
              编辑资料
            </Link>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={profile.published ? "olive" : "neutral"}>
              {profile.published ? "已发布" : "未发布"}
            </StatusBadge>
            <StatusBadge tone="signal">资料完成度 {completion}%</StatusBadge>
            {profile.verificationStatus === "verified" ? <StatusBadge tone="olive">已认证</StatusBadge> : null}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <div className="relative aspect-[4/5] bg-paper-200">
            <LifeAgentCoverImage src={coverSrc} alt="" fill className="object-cover" sizes="280px" />
          </div>
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink-500">心智值</span>
              <MindScoreBadge value={data.mindScore?.total ?? data.stats.mindScore ?? 0} size="sm" prefix="" />
            </div>
            <div className="h-2 overflow-hidden rounded bg-paper-200">
              <div className="h-full rounded bg-signal-600" style={{ width: `${completion}%` }} />
            </div>
            <p className="text-xs leading-5 text-ink-400">封面、示例问题、Topic、音色和发布状态会影响资料完成度。</p>
          </div>
        </Panel>

        <div className="space-y-5">
          <StatStrip
            columns={4}
            items={[
              { label: "被提问", value: data.stats.soldPacks, sub: "次", tone: "signal" },
              { label: "互动用户", value: data.questionPacks.length, sub: "人" },
              { label: "聊天会话", value: data.stats.sessionCount, sub: "场" },
              { label: "反馈记录", value: feedbackTotal, sub: "条" },
            ]}
          />
          <StatStrip
            columns={4}
            items={[
              { label: "本周更新", value: growthSummary?.weekCount ?? 0, sub: "条", tone: "signal" },
              { label: "被追更", value: growthSummary?.followerCount ?? 0, sub: "人", tone: "olive" },
              { label: "待回应反馈", value: (data.feedback?.alerts ?? []).length, sub: "项" },
              { label: "公开近况", value: growthSummary?.publicTotal ?? liveUpdates.length, sub: "条" },
            ]}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <QuickAction href={`/dashboard/life-agents/${id}/edit`} title="编辑资料" desc="封面、人设、示范回答、地区身份。" icon={<Pencil className="h-5 w-5" />} />
            <QuickAction href={`/dashboard/life-agents/${id}/sales`} title="互动记录" desc="查看用户提问、购买与使用情况。" icon={<Activity className="h-5 w-5" />} />
            <QuickAction href={`/dashboard/life-agents/${id}/sessions`} title="聊天记录" desc="按会话查看用户最近在问什么。" icon={<MessageCircle className="h-5 w-5" />} />
            <QuickAction href={`/dashboard/life-agents/${id}/feedback`} title="反馈诊断" desc="看评分、轻反馈和需要关注的问题。" icon={<Star className="h-5 w-5" />} />
            <QuickAction href={`/dashboard/life-agents/${id}/topics`} title="Topic 管理" desc="审核、合并、修正可复用主题。" icon={<FileText className="h-5 w-5" />} />
            <QuickAction href={`/dashboard/life-agents/${id}/blind-spots`} title="盲区问题" desc="补上 Agent 答不好的真实问题。" icon={<ShieldQuestion className="h-5 w-5" />} />
            <QuickAction href="/dashboard/api-keys" title="开放 API" desc="管理调用 Key 和第三方集成。" icon={<Code2 className="h-5 w-5" />} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <PanelHeader
            title="成长日志"
            description="写下最近变化。公开近况会出现在展示页，也会进入 Agent 回答上下文。"
          />
          <div className="space-y-3 p-4 sm:p-5">
            {(data.feedback?.alerts ?? []).length > 0 ? (
              <div className="rounded-md border border-signal-200 bg-signal-50 px-3 py-3">
                <p className="text-xs font-semibold text-signal-800">建议优先补充</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(data.feedback?.alerts ?? []).slice(0, 3).map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => setLiveContent((prev) => prev || `${alert.title}：${alert.detail}`)}
                      className="rounded border border-signal-200 bg-paper-50 px-2.5 py-1.5 text-left text-xs leading-5 text-signal-800 transition hover:bg-signal-100"
                    >
                      {alert.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <textarea
              value={liveContent}
              onChange={(e) => setLiveContent(e.target.value)}
              placeholder="比如：最近我在帮几位同学改秋招简历，发现大厂实习经历最好写清楚业务指标..."
              className="input-shell min-h-28 resize-y text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select value={liveCategory} onChange={(e) => setLiveCategory(e.target.value)} className="input-shell !min-h-10 !w-auto text-sm">
                {LIVE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                value={liveLocation}
                onChange={(e) => setLiveLocation(e.target.value)}
                placeholder="位置标签，可选"
                className="input-shell !min-h-10 flex-1 text-sm"
              />
              <button type="button" onClick={postLiveUpdate} disabled={livePosting || !liveContent.trim()} className="btn-primary !min-h-10">
                {livePosting ? "发布中" : "发布公开近况"}
              </button>
            </div>
            <p className="text-xs leading-5 text-ink-400">
              发布后用户能在展示页看到，也可以点“问问这件事”直接进入聊天。
            </p>
            {liveUpdates.length > 0 ? (
              <ul className="divide-y divide-hairline/60">
                {liveUpdates.slice(0, 5).map((u) => (
                  <li key={u.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm leading-6 text-ink">{u.content}</p>
                        <p className="mt-1 text-xs text-ink-400">
                          {LIVE_CATEGORIES.find((c) => c.value === u.category)?.label ?? u.category}
                          {u.location ? ` · ${u.location}` : ""}
                          {` · ${u.freshDays === 0 ? "今天" : `${u.freshDays} 天前`}`}
                        </p>
                      </div>
                      <button type="button" onClick={() => void deleteLiveUpdate(u.id)} className="text-xs font-medium text-ink-300 hover:text-oxblood-600">
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {growthEvents.length > 0 ? (
              <div className="rounded-md border border-hairline/70 bg-paper-50">
                <div className="border-b border-hairline/60 px-3 py-2">
                  <p className="text-xs font-semibold text-ink-500">维护轨迹</p>
                </div>
                <ul className="divide-y divide-hairline/60">
                  {growthEvents.slice(0, 8).map((event: LifeAgentGrowthEvent) => (
                    <li key={event.id} className="px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                            <span className="font-medium text-ink-600">
                              {LIFE_AGENT_GROWTH_TYPE_LABELS[event.type] ?? event.type}
                            </span>
                            {event.type === "live_update" ? (
                              <span className="text-signal-700">
                                {LIFE_AGENT_GROWTH_CATEGORY_LABELS[growthEventCategory(event)] ?? growthEventCategory(event)}
                              </span>
                            ) : null}
                            <span>{formatGrowthFreshDays(event.freshDays)}</span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-ink">{event.title}</p>
                          <p className="mt-1 text-sm leading-6 text-ink-500">{event.summary}</p>
                        </div>
                        <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${
                          event.visibility === "public" ? "bg-signal-100 text-signal-800" : "bg-paper-200 text-ink-500"
                        }`}>
                          {event.visibility === "public" ? "主页可见" : "后台记录"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="space-y-5">
          {(data.feedback?.alerts ?? []).length > 0 ? (
            <Panel>
              <PanelHeader title="需要你关注" description="来自用户反馈，按紧急程度排序。" />
              <ul className="divide-y divide-hairline/60 px-4 sm:px-5">
                {(data.feedback?.alerts ?? []).slice(0, 5).map((alert: FeedbackAlert) => {
                  const tier = severityFromPriority(alert.priority);
                  return (
                    <li key={alert.id} className="flex gap-3 py-3 text-sm">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${SEVERITY_DOT[tier]}`} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-ink">{alert.title}</p>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_BADGE[tier]}`}>
                            {SEVERITY_LABEL[tier]}
                          </span>
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
            <PanelHeader title="最近成长" description="公开近况、互动、聊天和反馈的最新记录。" />
            <div className="divide-y divide-hairline/60">
              {growthEvents[0] ? (
                <RowLink
                  href={`/life-agents/${id}`}
                  title={growthEvents[0].title}
                  description={growthEvents[0].summary}
                  meta={formatGrowthFreshDays(growthEvents[0].freshDays)}
                />
              ) : null}
              {data.questionPacks[0] ? (
                <RowLink
                  href={`/dashboard/life-agents/${id}/sales`}
                  title={data.questionPacks[0].buyer.name || data.questionPacks[0].buyer.email}
                  description={`提问 ${data.questionPacks[0].questionCount} 次，已对话 ${data.questionPacks[0].questionsUsed} 次`}
                  meta={formatShortTime(data.questionPacks[0].createdAt)}
                />
              ) : null}
              {data.chatSessions[0] ? (
                <RowLink
                  href={`/dashboard/life-agents/${id}/sessions`}
                  title={data.chatSessions[0].buyer.name || data.chatSessions[0].buyer.email}
                  description={data.chatSessions[0].title || "隐私保护会话"}
                  meta={`${data.chatSessions[0].messageCount} 条消息 · ${formatShortTime(data.chatSessions[0].updatedAt)}`}
                />
              ) : null}
              {(data.feedback?.recent ?? [])[0] ? (
                <RowLink
                  href={`/dashboard/life-agents/${id}/feedback`}
                  title="最近反馈"
                  description={(data.feedback?.recent ?? [])[0].comment || (data.feedback?.recent ?? [])[0].assistantExcerpt || "无文字说明"}
                  meta={formatShortTime((data.feedback?.recent ?? [])[0].createdAt)}
                />
              ) : null}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="优化建议" />
            <ul className="divide-y divide-hairline/60 px-4 text-sm leading-6 text-ink-600 sm:px-5">
              {suggestions.map((item) => (
                <li key={item} className="py-3">{item}</li>
              ))}
              {suggestions.length === 0 ? <li className="py-3 text-ink-400">状态很好，继续保持更新即可。</li> : null}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel className="mt-5">
        <PanelHeader title="危险操作" description="删除后，知识、聊天记录和反馈都无法恢复。" />
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3 text-sm text-oxblood-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>只有在确认不再需要这个 Agent 时再执行删除。</p>
          </div>
          <button type="button" onClick={deleteAgent} disabled={deleting} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-oxblood-200 px-4 text-sm font-medium text-oxblood-600 hover:bg-oxblood-50 disabled:opacity-50">
            <Trash2 className="h-4 w-4" />
            {deleting ? "删除中" : "删除 Agent"}
          </button>
        </div>
      </Panel>
    </AdminPage>
  );
}
