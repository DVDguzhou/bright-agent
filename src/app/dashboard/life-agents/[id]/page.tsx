"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { resolveLifeAgentCoverDisplayUrl } from "@/lib/life-agent-covers";
import {
  buildOptimizationSuggestions,
  computeCompletion,
  fetchManageData,
  formatDateTime,
  formatShortTime,
  type FeedbackAlert,
  type ManageData,
} from "@/app/dashboard/life-agents/_lib/manage";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { MindScoreBadge } from "@/components/MindScoreBadge";
import {
  SEVERITY_BADGE,
  SEVERITY_DOT,
  SEVERITY_LABEL,
  SEVERITY_LINK,
  SEVERITY_TEXT,
  severityFromPriority,
} from "@/lib/severity-style";

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
  { value: "job", label: "求职/秋招" },
  { value: "life", label: "生活" },
  { value: "study", label: "升学/考试" },
  { value: "housing", label: "房产" },
  { value: "policy", label: "当地政策" },
  { value: "cost", label: "物价/开销" },
  { value: "community", label: "社区/小区" },
  { value: "transport", label: "交通/通勤" },
  { value: "weather", label: "气候/环境" },
  { value: "resource", label: "本地资源" },
];

function MindScoreStatCard({ value, href }: { value: number; href?: string }) {
  const content = (
    <div className="px-3 py-3 text-center">
      <div className="flex justify-center">
        <MindScoreBadge value={value} size="lg" prefix="" />
      </div>
      <p className="mt-2 text-[11px] font-medium text-ink-800">心智值</p>
      <p className="mt-0.5 text-[10px] text-ink-600/70">无上限</p>
    </div>
  );
  if (!href) return content;
  return (
    <Link href={href} className="block transition active:scale-[0.99]">
      {content}
    </Link>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string | number;
  sub: string;
  href?: string;
}) {
  const content = (
    <div className="px-3 py-3 text-center">
      <p className="text-2xl font-semibold leading-none text-ink">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-ink-600">{label}</p>
      <p className="mt-0.5 text-[11px] text-ink-400">{sub}</p>
    </div>
  );
  if (!href) return content;
  return (
    <Link href={href} className="block transition active:scale-[0.99]">
      {content}
    </Link>
  );
}

function QuickAction({
  href,
  title,
  desc,
  colorClass,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  colorClass: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 py-3 transition active:opacity-80 sm:py-4"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${colorClass}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs leading-5 text-ink-400">{desc}</p>
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
  const liveTextareaRef = useRef<HTMLTextAreaElement>(null);

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
        setLiveUpdates(json.updates ?? []);
      }
    } catch { /* ignore */ }
  }, [id]);

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
  };

  useEffect(() => {
    void load();
    void loadLiveUpdates();
  }, [load, loadLiveUpdates]);

  const data = state.data;
  const profile = data?.profile;
  const completion = useMemo(() => (profile ? computeCompletion(profile) : 0), [profile]);
  const feedbackTotal = useMemo(() => {
    if (!data?.feedback) return 0;
    return (
      (data.feedback.counts.helpful ?? 0) +
      (data.feedback.counts.notSpecific ?? 0) +
      (data.feedback.counts.notSuitable ?? 0) +
      (data.feedback.counts.factualError ?? 0) +
      (data.feedback.counts.contradiction ?? 0) +
      (data.feedback.counts.tooConfident ?? 0)
    );
  }, [data]);
  const suggestions = useMemo(() => (data ? buildOptimizationSuggestions(data) : []), [data]);

  const coverSrc =
    resolveLifeAgentCoverDisplayUrl(profile?.coverUrl, profile?.coverImageUrl, profile?.coverPresetKey);

  const deleteAgent = async () => {
    if (!confirm("确定删除这个人生 Agent 吗？删除后无法恢复，包括知识、聊天记录等。")) return;
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
      <div className="mx-auto max-w-5xl max-lg:-mx-4 max-lg:px-4 max-lg:pb-24">
        <div className="h-52 animate-pulse bg-paper-200" />
        <div className="mt-4 grid grid-cols-2 gap-px bg-hairline/30 sm:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse bg-paper" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center max-lg:-mx-4 max-lg:pb-24">
        <p className="text-[15px] text-ink-400">{state.error ?? "加载失败"}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper active:opacity-90"
          >
            重新加载
          </button>
          <Link
            href="/dashboard/life-agents"
            className="rounded-full border border-hairline bg-paper px-6 py-2.5 text-sm font-medium text-ink-600"
          >
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl divide-y divide-hairline/30 max-lg:-mx-4 max-lg:px-4 max-lg:pb-24">
      <section>
        <div className="px-0 pb-4 pt-3 sm:px-0">
          <Link href="/dashboard/life-agents" className="text-sm font-medium text-ink-400 transition hover:text-ink">
            ← 全部 Agent
          </Link>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-hairline">
                <LifeAgentCoverImage
                  src={coverSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0">
                <h1 className="break-words font-serif text-3xl font-medium leading-tight tracking-tight text-ink">
                  {profile.displayName}
                </h1>
                <p className="mt-1 line-clamp-2 text-sm text-ink-400">
                  {cleanLifeAgentIntroText(profile.headline, profile.displayName)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-1 font-medium ${
                      profile.published ? "bg-olive-400/20 text-olive-600" : "bg-paper-300 text-ink"
                    }`}
                  >
                    {profile.published ? "已发布" : "未发布"}
                  </span>
                  <span className="rounded-full bg-paper-200 px-2 py-1 text-ink-400">资料完成度 {completion}%</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/life-agents/${id}`}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-600 transition active:opacity-70"
                aria-label="查看展示页"
                title="展示页"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </Link>
              <Link
                href={`/dashboard/life-agents/${id}/edit`}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper active:scale-[0.98]"
              >
                编辑资料
              </Link>
            </div>
          </div>
        </div>

        {/* 原统计条（含金额/售出，审核期暂隐藏）
        <div className="grid grid-cols-2 border-t border-hairline/50 sm:grid-cols-4">
          <StatCard label="累计收入" value={`¥${(data.stats.totalRevenue / 100).toFixed(2)}`} sub="元" />
          <StatCard label="售出次数包" value={data.stats.soldPacks} sub="次" href={`/dashboard/life-agents/${id}/sales`} />
          <StatCard label="聊天会话" value={data.stats.sessionCount} sub="场" href={`/dashboard/life-agents/${id}/sessions`} />
          <StatCard
            label="用户反馈"
            value={feedbackTotal}
            sub={`有帮助 ${data.feedback?.counts.helpful ?? 0} 条`}
            href={`/dashboard/life-agents/${id}/feedback`}
          />
        </div>
        */}
        <div className="grid grid-cols-2 border-t border-hairline/30 sm:grid-cols-4 [&>*:not(:nth-child(2n))]:max-sm:border-r [&>*:not(:nth-child(4n))]:sm:border-r [&>*]:border-hairline/30">
          <StatCard label="被提问" value={data.stats.soldPacks} sub="次" href={`/dashboard/life-agents/${id}/sales`} />
          <StatCard label="互动用户" value={data.questionPacks.length} sub="人" href={`/dashboard/life-agents/${id}/sales`} />
          <StatCard label="累计对话" value={data.stats.sessionCount} sub="场" href={`/dashboard/life-agents/${id}/sessions`} />
          <MindScoreStatCard
            value={data.mindScore?.total ?? data.stats.mindScore ?? 0}
            href={`/dashboard/life-agents/${id}/co-edit`}
          />
        </div>
      </section>

      <section className="py-4">
        <div>
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink">快速操作</h2>
        </div>
        <div className="mt-2 divide-y divide-hairline/30 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0 lg:grid-cols-3">
          <QuickAction
            href={`/dashboard/life-agents/${id}/co-edit`}
            title="对话调教"
            desc="像聊天一样修改欢迎语、风格和知识内容"
            colorClass="bg-paper-200 text-ink-600"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5l-2 2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/edit`}
            title="编辑资料"
            desc="分组修改封面、人设、示范回答与地区信息"
            colorClass="bg-paper-200 text-ink-600"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
          />
          {/* 原「销量记录」入口（含购买语义，审核期暂隐藏）
          <QuickAction
            href={`/dashboard/life-agents/${id}/sales`}
            title="销量记录"
            desc="查看近 7 天、30 天和全部购买记录"
            colorClass="bg-paper-200 text-ink-600"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.119-3 2.5S10.343 13 12 13s3 1.119 3 2.5S13.657 18 12 18m0-10V6m0 12v-2m7-4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          */}
          <QuickAction
            href={`/dashboard/life-agents/${id}/sales`}
            title="互动记录"
            desc="查看近 7 天、30 天和全部用户提问互动"
            colorClass="bg-paper-200 text-ink-600"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/sessions`}
            title="聊天记录"
            desc="按会话搜索，了解用户最近在问什么"
            colorClass="bg-paper-200 text-ink-600"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/feedback`}
            title="反馈诊断"
            desc="看评分、轻反馈类型和近期差评关键词"
            colorClass="bg-paper-200 text-ink-600"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.036 6.258a1 1 0 00.95.69h6.58c.969 0 1.371 1.24.588 1.81l-5.323 3.867a1 1 0 00-.364 1.118l2.034 6.258c.3.921-.755 1.688-1.54 1.118l-5.322-3.867a1 1 0 00-1.176 0l-5.323 3.867c-.784.57-1.838-.197-1.539-1.118l2.034-6.258a1 1 0 00-.364-1.118L.895 11.685c-.783-.57-.38-1.81.588-1.81h6.58a1 1 0 00.95-.69l2.036-6.258z" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/topics`}
            title="Topic 管理"
            desc="审核 candidate，合并重复主题，并人工修正文案"
            colorClass="bg-paper-200 text-ink-600"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h7m-7 4h10M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/blind-spots`}
            title={`盲区问题${(data.stats?.blindSpotCount ?? 0) > 0 ? ` (${data.stats.blindSpotCount})` : ""}`}
            desc="用户问了但 Agent 答不好的问题，补充后提升回答质量"
            colorClass="bg-paper-200 text-ink-600"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>}
          />
          <QuickAction
            href="/dashboard/api-keys"
            title="开放 API"
            desc="管理调用 Key 与调用数据，让别人直接调用你的 Agent"
            colorClass="bg-paper-200 text-ink-600"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a5 5 0 11-9.9 1H3m0 0l3-3m-3 3l3 3m6 6a5 5 0 109.9-1H21m0 0l-3 3m3-3l-3-3" /></svg>}
          />
        </div>
      </section>

      <section className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-medium tracking-tight text-ink">实时更新</h2>
            <p className="mt-1 text-sm text-ink-400">像发朋友圈一样分享最新信息，Agent 回答时会优先引用。</p>
          </div>
          <span className="inline-flex items-baseline gap-1 font-serif text-[11px] uppercase tracking-[0.18em] text-ink-400">
            <span className="text-base font-semibold tabular-nums text-ink">{liveUpdates.length}</span>
            <span>条有效</span>
          </span>
        </div>

        <div className="mt-4">
          <textarea
            ref={liveTextareaRef}
            value={liveContent}
            onChange={(e) => setLiveContent(e.target.value)}
            placeholder="分享最新信息，比如：杭州余杭区最近落户政策放宽了 / 西湖区房价Q2微涨 / 秋招字节阿里都在扩招..."
            className="w-full resize-none rounded border border-hairline bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-300 focus:border-ink focus:outline-none"
            rows={3}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={liveCategory}
              onChange={(e) => setLiveCategory(e.target.value)}
              className="rounded-lg border border-hairline bg-paper px-3 py-1.5 text-xs text-ink-600 focus:outline-none"
            >
              {LIVE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={liveLocation}
              onChange={(e) => setLiveLocation(e.target.value)}
              placeholder="位置标签，如：杭州西湖区（可选）"
              className="rounded-lg border border-hairline bg-paper px-3 py-1.5 text-xs text-ink-600 placeholder:text-ink-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={postLiveUpdate}
              disabled={livePosting || !liveContent.trim()}
              className="ml-auto rounded-full bg-ink px-5 py-1.5 text-sm font-semibold text-paper active:scale-[0.98] disabled:opacity-40"
            >
              {livePosting ? "发布中..." : "发布"}
            </button>
          </div>
        </div>

        {liveUpdates.length > 0 && (
          <ul className="mt-4 divide-y divide-hairline/30">
            {liveUpdates.map((u) => (
              <li key={u.id} className="flex items-start gap-3 py-4 first:pt-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span className="rounded bg-paper-200 px-2 py-0.5 font-medium text-ink-600">{LIVE_CATEGORIES.find((c) => c.value === u.category)?.label ?? u.category}</span>
                    {u.location && <span>📍 {u.location}</span>}
                    <span>{u.freshDays === 0 ? "今天" : `${u.freshDays}天前`}</span>
                    {u.pinned && <span className="font-medium text-oxblood-500">📌 置顶</span>}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{u.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteLiveUpdate(u.id)}
                  className="shrink-0 rounded-lg p-1 text-ink-300 hover:bg-oxblood-50 hover:text-oxblood-500"
                  title="删除"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="py-4">
        <h2 className="font-serif text-xl font-medium tracking-tight text-ink">最近动态</h2>
        <div className="mt-4 divide-y divide-hairline/30 lg:grid lg:grid-cols-3 lg:gap-6 lg:divide-y-0">
          <div className="py-4 first:pt-0 lg:py-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-700">最近互动</h3>
              <Link href={`/dashboard/life-agents/${id}/sales`} className="text-xs font-medium text-oxblood-600">查看全部</Link>
            </div>
            <ul className="mt-3 space-y-3">
              {data.questionPacks.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium text-ink">{item.buyer.name || item.buyer.email}</p>
                  <p className="mt-0.5 text-ink-400">
                    提问 {item.questionCount} 次，已对话 {item.questionsUsed} 次
                  </p>
                  <p className="mt-1 text-xs text-ink-300">{formatShortTime(item.createdAt)}</p>
                </li>
              ))}
              {data.questionPacks.length === 0 && <p className="text-sm text-ink-300">暂时还没有互动记录</p>}
            </ul>
          </div>

          <div className="py-4 lg:border-l lg:border-hairline/30 lg:pl-6 lg:py-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-700">最近聊天</h3>
              <Link href={`/dashboard/life-agents/${id}/sessions`} className="text-xs font-medium text-oxblood-600">查看全部</Link>
            </div>
            <ul className="mt-3 space-y-3">
              {data.chatSessions.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium text-ink">{item.buyer.name || item.buyer.email}</p>
                  <p className="mt-0.5 line-clamp-2 text-ink-400">{item.title || "隐私保护会话"}</p>
                  <p className="mt-1 text-xs text-ink-300">
                    {item.messageCount} 条消息 · 最近更新 {formatShortTime(item.updatedAt)}
                  </p>
                </li>
              ))}
              {data.chatSessions.length === 0 && <p className="text-sm text-ink-300">暂时还没有聊天记录</p>}
            </ul>
          </div>

          <div className="py-4 lg:border-l lg:border-hairline/30 lg:pl-6 lg:py-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-700">最近反馈</h3>
              <Link href={`/dashboard/life-agents/${id}/feedback`} className="text-xs font-medium text-oxblood-600">查看全部</Link>
            </div>
            <ul className="mt-3 space-y-3">
              {(data.feedback?.recent ?? []).slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium text-ink">
                    {item.feedbackType === "helpful"
                      ? "有帮助"
                      : item.feedbackType === "not_specific"
                        ? "不够具体"
                        : item.feedbackType === "factual_error"
                          ? "事实错误"
                          : item.feedbackType === "contradiction"
                            ? "前后矛盾"
                            : item.feedbackType === "too_confident"
                              ? "过度自信"
                              : "不适合我"}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-ink-400">{item.comment?.trim() || item.assistantExcerpt || "无补充说明"}</p>
                  <p className="mt-1 text-xs text-ink-300">{formatShortTime(item.createdAt)}</p>
                </li>
              ))}
              {(data.feedback?.recent ?? []).length === 0 && <p className="text-sm text-ink-300">暂时还没有用户反馈</p>}
            </ul>
          </div>
        </div>
      </section>

      {(data.feedback?.alerts ?? []).length > 0 && (
        <section className="py-4">
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink">需要你关注</h2>
          <p className="mt-1 text-xs text-ink-300">来自用户的真实反馈，按紧急程度排列</p>
          <ul className="mt-3 divide-y divide-hairline/30">
            {(data.feedback?.alerts ?? []).map((alert: FeedbackAlert) => {
              const tier = severityFromPriority(alert.priority);
              return (
              <li
                key={alert.id}
                className="flex items-start gap-3 py-3 text-sm leading-6 first:pt-0"
              >
                <span className={`mt-0.5 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${SEVERITY_DOT[tier]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${SEVERITY_TEXT[tier]}`}>
                      {alert.title}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_BADGE[tier]}`}>
                      {SEVERITY_LABEL[tier]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-ink-500">{alert.detail}</p>
                  {alert.topicId && (
                    <Link
                      href={`/dashboard/life-agents/${id}/topics`}
                      className={`mt-1 inline-block text-xs font-medium underline ${SEVERITY_LINK[tier]}`}
                    >
                      {alert.action} →
                    </Link>
                  )}
                  {alert.source === "blind_spot" && (
                    <Link
                      href={`/dashboard/life-agents/${id}/blind-spots`}
                      className="mt-1 inline-block text-xs font-medium text-ink-600 underline"
                    >
                      {alert.action} →
                    </Link>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="py-4">
        <h2 className="font-serif text-xl font-medium tracking-tight text-ink">优化建议</h2>
        <ul className="mt-3 divide-y divide-hairline/30 text-sm leading-6 text-ink">
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <li key={item} className="py-3 first:pt-0">
                {item}
              </li>
            ))
          ) : (
            <li className="py-3 text-ink-400">状态很好，继续保持更新和稳定回复即可。</li>
          )}
        </ul>
      </section>

      <section className="py-4">
        <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Agent 当前状态</h2>
        <div className="mt-4 divide-y divide-hairline/30 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0 lg:grid-cols-3">
          <div className="py-3 sm:py-2">
            <p className="text-xs font-medium text-ink-400">欢迎语</p>
            <p className="mt-2 line-clamp-3 text-sm text-ink">{profile.welcomeMessage || "未设置"}</p>
          </div>
          <div className="py-3 sm:py-2">
            <p className="text-xs font-medium text-ink-400">擅长标签</p>
            <p className="mt-2 text-sm text-ink">{(profile.expertiseTags ?? []).join("、") || "未设置"}</p>
          </div>
          <div className="py-3 sm:py-2">
            <p className="text-xs font-medium text-ink-400">人设与语气</p>
            <p className="mt-2 text-sm text-ink">
              {[profile.personaArchetype, profile.toneStyle, profile.responseStyle].filter(Boolean).join(" · ") || "未设置"}
            </p>
          </div>
          <div className="py-3 sm:py-2">
            <p className="text-xs font-medium text-ink-400">知识条目</p>
            <p className="mt-2 text-sm text-ink">{profile.knowledgeEntries.length} 条</p>
          </div>
          <div className="py-3 sm:py-2">
            <p className="text-xs font-medium text-ink-400">结构化事实</p>
            <p className="mt-2 text-sm text-ink">{profile.structuredFacts?.length ?? 0} 条</p>
          </div>
          <div className="py-3 sm:py-2">
            <p className="text-xs font-medium text-ink-400">Topic 摘要</p>
            <p className="mt-2 text-sm text-ink">{profile.topicSummaries?.length ?? data.stats.topicCount ?? 0} 条</p>
          </div>
          <div className="py-3 sm:py-2">
            <p className="text-xs font-medium text-ink-400">开放 API</p>
            <p className="mt-2 text-sm text-ink">
              {profile.apiInvokeEnabled ? `已开启 · ${profile.apiTotalCalls ?? 0} 次调用` : "未开启"}
            </p>
          </div>
          <div className="py-3 sm:py-2">
            <p className="text-xs font-medium text-ink-400">最后更新</p>
            <p className="mt-2 text-sm text-ink">{data.chatSessions[0] ? formatDateTime(data.chatSessions[0].updatedAt) : "暂无记录"}</p>
          </div>
        </div>
      </section>

      <section className="py-4">
        <details>
          <summary className="cursor-pointer list-none text-lg font-semibold text-oxblood-700">
            <span className="inline-flex items-center gap-2">
              <span>危险操作</span>
              <span className="text-xs font-medium text-oxblood-500">删除后无法恢复</span>
            </span>
          </summary>
          <div className="mt-4 border-t border-oxblood-200 pt-4">
            <p className="text-sm leading-6 text-oxblood-600">
              删除人生 Agent 后，相关知识、聊天记录、反馈和销量记录都将无法恢复。请确认你不再需要它时再执行。
            </p>
            <button
              type="button"
              onClick={deleteAgent}
              disabled={deleting}
              className="mt-4 min-h-[48px] rounded border border-oxblood-200 bg-paper px-5 py-3 text-sm font-medium text-oxblood-600 transition-colors hover:bg-oxblood-100 active:bg-oxblood-200 disabled:opacity-50"
            >
              {deleting ? "删除中..." : "删除人生 Agent"}
            </button>
          </div>
        </details>
      </section>
    </div>
  );
}
