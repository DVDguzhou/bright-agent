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
    <div className="rounded-2xl bg-[#fafbfc] px-3 py-3 text-center ring-1 ring-black/[0.04]">
      <p className="text-2xl font-black leading-none text-[#111]">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-slate-700">{label}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
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
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] transition active:scale-[0.99]"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${colorClass}`}>{icon}</div>
      <p className="mt-3 text-sm font-semibold text-[#111]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
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
      <div className="mx-auto max-w-5xl space-y-4 max-lg:-mx-4 max-lg:bg-[#f7f8fa] max-lg:px-3 max-lg:pb-24">
        <div className="h-52 animate-pulse rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center max-lg:-mx-4 max-lg:pb-24">
        <p className="text-[15px] text-slate-500">{state.error ?? "加载失败"}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full bg-[#111] px-6 py-2.5 text-sm font-medium text-white active:opacity-90"
          >
            重新加载
          </button>
          <Link
            href="/dashboard/life-agents"
            className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700"
          >
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 max-lg:-mx-4 max-lg:bg-[#f7f8fa] max-lg:px-3 max-lg:pb-24">
      <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="bg-gradient-to-r from-amber-50 via-white to-sky-50 px-4 pb-4 pt-3 sm:px-6">
          <Link href="/dashboard/life-agents" className="text-sm font-medium text-slate-500 transition hover:text-[#111]">
            ← 全部 Agent
          </Link>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/5">
                <LifeAgentCoverImage
                  src={coverSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0">
                <h1 className="break-words text-[26px] font-black leading-tight tracking-tight text-[#111] sm:text-[28px]">
                  {profile.displayName}
                </h1>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {cleanLifeAgentIntroText(profile.headline, profile.displayName)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-1 font-medium ${
                      profile.published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {profile.published ? "已发布" : "未发布"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">资料完成度 {completion}%</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/life-agents/${id}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm ring-1 ring-black/[0.05] active:scale-[0.98]"
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
                className="rounded-full bg-[#111] px-4 py-2 text-sm font-semibold text-white active:scale-[0.98]"
              >
                编辑资料
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-100 sm:grid-cols-4">
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
      </section>

      <section className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#111]">快速操作</h2>
            <p className="mt-1 text-sm text-slate-500">把高频动作从巨型 tab 拆开，改资料时更不容易迷路。</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <QuickAction
            href={`/dashboard/life-agents/${id}/co-edit`}
            title="对话调教"
            desc="像聊天一样修改欢迎语、风格和知识内容"
            colorClass="bg-sky-100 text-sky-700"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5l-2 2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/edit`}
            title="编辑资料"
            desc="分组修改封面、价格、人设、示范回答与地区信息"
            colorClass="bg-amber-100 text-amber-700"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/sales`}
            title="销量记录"
            desc="查看近 7 天、30 天和全部购买记录"
            colorClass="bg-emerald-100 text-emerald-700"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.119-3 2.5S10.343 13 12 13s3 1.119 3 2.5S13.657 18 12 18m0-10V6m0 12v-2m7-4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/sessions`}
            title="聊天记录"
            desc="按会话搜索，了解用户最近在问什么"
            colorClass="bg-fuchsia-100 text-fuchsia-700"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/feedback`}
            title="反馈诊断"
            desc="看评分、轻反馈类型和近期差评关键词"
            colorClass="bg-rose-100 text-rose-700"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.036 6.258a1 1 0 00.95.69h6.58c.969 0 1.371 1.24.588 1.81l-5.323 3.867a1 1 0 00-.364 1.118l2.034 6.258c.3.921-.755 1.688-1.54 1.118l-5.322-3.867a1 1 0 00-1.176 0l-5.323 3.867c-.784.57-1.838-.197-1.539-1.118l2.034-6.258a1 1 0 00-.364-1.118L.895 11.685c-.783-.57-.38-1.81.588-1.81h6.58a1 1 0 00.95-.69l2.036-6.258z" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/topics`}
            title="Topic 管理"
            desc="审核 candidate，合并重复主题，并人工修正文案"
            colorClass="bg-teal-100 text-teal-700"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h7m-7 4h10M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>}
          />
          <QuickAction
            href={`/dashboard/life-agents/${id}/blind-spots`}
            title={`盲区问题${(data.stats?.blindSpotCount ?? 0) > 0 ? ` (${data.stats.blindSpotCount})` : ""}`}
            desc="用户问了但 Agent 答不好的问题，补充后提升回答质量"
            colorClass="bg-amber-100 text-amber-700"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>}
          />
          <QuickAction
            href="/dashboard/api-keys"
            title="开放 API"
            desc="管理调用 Key、定价和数据，让别人直接调用你的 Agent"
            colorClass="bg-indigo-100 text-indigo-700"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a5 5 0 11-9.9 1H3m0 0l3-3m-3 3l3 3m6 6a5 5 0 109.9-1H21m0 0l-3 3m3-3l-3-3" /></svg>}
          />
        </div>
      </section>

      <section className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#111]">实时更新</h2>
            <p className="mt-1 text-sm text-slate-500">像发朋友圈一样分享最新信息，Agent 回答时会优先引用。</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {liveUpdates.length} 条有效
          </span>
        </div>

        <div className="mt-4 rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
          <textarea
            ref={liveTextareaRef}
            value={liveContent}
            onChange={(e) => setLiveContent(e.target.value)}
            placeholder="分享最新信息，比如：杭州余杭区最近落户政策放宽了 / 西湖区房价Q2微涨 / 秋招字节阿里都在扩招..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#111] placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
            rows={3}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={liveCategory}
              onChange={(e) => setLiveCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
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
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={postLiveUpdate}
              disabled={livePosting || !liveContent.trim()}
              className="ml-auto rounded-full bg-[#111] px-5 py-1.5 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-40"
            >
              {livePosting ? "发布中..." : "发布"}
            </button>
          </div>
        </div>

        {liveUpdates.length > 0 && (
          <ul className="mt-4 space-y-3">
            {liveUpdates.map((u) => (
              <li key={u.id} className="flex items-start gap-3 rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700">{LIVE_CATEGORIES.find((c) => c.value === u.category)?.label ?? u.category}</span>
                    {u.location && <span>📍 {u.location}</span>}
                    <span>{u.freshDays === 0 ? "今天" : `${u.freshDays}天前`}</span>
                    {u.pinned && <span className="font-medium text-amber-600">📌 置顶</span>}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#111]">{u.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteLiveUpdate(u.id)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  title="删除"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <h2 className="text-xl font-black tracking-tight text-[#111]">最近动态</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">最近购买</h3>
              <Link href={`/dashboard/life-agents/${id}/sales`} className="text-xs font-medium text-sky-600">查看全部</Link>
            </div>
            <ul className="mt-3 space-y-3">
              {data.questionPacks.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium text-[#111]">{item.buyer.name || item.buyer.email}</p>
                  <p className="mt-0.5 text-slate-500">
                    买了 {item.questionCount} 次，已用 {item.questionsUsed} 次 · ¥{(item.amountPaid / 100).toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{formatShortTime(item.createdAt)}</p>
                </li>
              ))}
              {data.questionPacks.length === 0 && <p className="text-sm text-slate-400">暂时还没有购买记录</p>}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">最近聊天</h3>
              <Link href={`/dashboard/life-agents/${id}/sessions`} className="text-xs font-medium text-sky-600">查看全部</Link>
            </div>
            <ul className="mt-3 space-y-3">
              {data.chatSessions.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium text-[#111]">{item.buyer.name || item.buyer.email}</p>
                  <p className="mt-0.5 line-clamp-2 text-slate-500">{item.title || "隐私保护会话"}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.messageCount} 条消息 · 最近更新 {formatShortTime(item.updatedAt)}
                  </p>
                </li>
              ))}
              {data.chatSessions.length === 0 && <p className="text-sm text-slate-400">暂时还没有聊天记录</p>}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">最近反馈</h3>
              <Link href={`/dashboard/life-agents/${id}/feedback`} className="text-xs font-medium text-sky-600">查看全部</Link>
            </div>
            <ul className="mt-3 space-y-3">
              {(data.feedback?.recent ?? []).slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium text-[#111]">
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
                  <p className="mt-0.5 line-clamp-2 text-slate-500">{item.comment?.trim() || item.assistantExcerpt || "无补充说明"}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatShortTime(item.createdAt)}</p>
                </li>
              ))}
              {(data.feedback?.recent ?? []).length === 0 && <p className="text-sm text-slate-400">暂时还没有用户反馈</p>}
            </ul>
          </div>
        </div>
      </section>

      {(data.feedback?.alerts ?? []).length > 0 && (
        <section className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
          <h2 className="text-xl font-black tracking-tight text-[#111]">需要你关注</h2>
          <p className="mt-1 text-xs text-slate-400">来自用户的真实反馈，按紧急程度排列</p>
          <ul className="mt-3 space-y-2">
            {(data.feedback?.alerts ?? []).map((alert: FeedbackAlert) => (
              <li
                key={alert.id}
                className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  alert.color === "red"
                    ? "bg-red-50 ring-1 ring-red-200"
                    : alert.color === "orange"
                      ? "bg-orange-50 ring-1 ring-orange-200"
                      : alert.color === "yellow"
                        ? "bg-yellow-50 ring-1 ring-yellow-200"
                        : "bg-blue-50 ring-1 ring-blue-200"
                }`}
              >
                <span
                  className={`mt-0.5 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    alert.color === "red"
                      ? "bg-red-500"
                      : alert.color === "orange"
                        ? "bg-orange-500"
                        : alert.color === "yellow"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        alert.color === "red"
                          ? "text-red-700"
                          : alert.color === "orange"
                            ? "text-orange-700"
                            : alert.color === "yellow"
                              ? "text-yellow-700"
                              : "text-blue-700"
                      }`}
                    >
                      {alert.title}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        alert.color === "red"
                          ? "bg-red-100 text-red-600"
                          : alert.color === "orange"
                            ? "bg-orange-100 text-orange-600"
                            : alert.color === "yellow"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {alert.priority === "urgent"
                        ? "紧急"
                        : alert.priority === "high"
                          ? "重要"
                          : alert.priority === "medium"
                            ? "建议"
                            : "参考"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-slate-600">{alert.detail}</p>
                  {alert.topicId && (
                    <Link
                      href={`/dashboard/life-agents/${id}/topics`}
                      className={`mt-1 inline-block text-xs font-medium underline ${
                        alert.color === "red"
                          ? "text-red-600"
                          : alert.color === "orange"
                            ? "text-orange-600"
                            : alert.color === "yellow"
                              ? "text-yellow-600"
                              : "text-blue-600"
                      }`}
                    >
                      {alert.action} →
                    </Link>
                  )}
                  {alert.source === "blind_spot" && (
                    <Link
                      href={`/dashboard/life-agents/${id}/blind-spots`}
                      className="mt-1 inline-block text-xs font-medium text-orange-600 underline"
                    >
                      {alert.action} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-[28px] bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <h2 className="text-xl font-black tracking-tight text-[#111]">优化建议</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950">
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <li key={item} className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm">
                {item}
              </li>
            ))
          ) : (
            <li className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm">状态很好，继续保持更新和稳定回复即可。</li>
          )}
        </ul>
      </section>

      <section className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <h2 className="text-xl font-black tracking-tight text-[#111]">Agent 当前状态</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">欢迎语</p>
            <p className="mt-2 line-clamp-3 text-sm text-[#111]">{profile.welcomeMessage || "未设置"}</p>
          </div>
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">擅长标签</p>
            <p className="mt-2 text-sm text-[#111]">{(profile.expertiseTags ?? []).join("、") || "未设置"}</p>
          </div>
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">人设与语气</p>
            <p className="mt-2 text-sm text-[#111]">
              {[profile.personaArchetype, profile.toneStyle, profile.responseStyle].filter(Boolean).join(" · ") || "未设置"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">知识条目</p>
            <p className="mt-2 text-sm text-[#111]">{profile.knowledgeEntries.length} 条</p>
          </div>
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">结构化事实</p>
            <p className="mt-2 text-sm text-[#111]">{profile.structuredFacts?.length ?? 0} 条</p>
          </div>
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">Topic 摘要</p>
            <p className="mt-2 text-sm text-[#111]">{profile.topicSummaries?.length ?? data.stats.topicCount ?? 0} 条</p>
          </div>
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">开放 API</p>
            <p className="mt-2 text-sm text-[#111]">
              {profile.apiInvokeEnabled ? `已开启 · ${profile.apiTotalCalls ?? 0} 次调用` : "未开启"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">最后更新</p>
            <p className="mt-2 text-sm text-[#111]">{data.chatSessions[0] ? formatDateTime(data.chatSessions[0].updatedAt) : "暂无记录"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <details>
          <summary className="cursor-pointer list-none text-lg font-semibold text-red-700">
            <span className="inline-flex items-center gap-2">
              <span>危险操作</span>
              <span className="text-xs font-medium text-red-500">删除后无法恢复</span>
            </span>
          </summary>
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/70 p-4">
            <p className="text-sm leading-6 text-red-600">
              删除人生 Agent 后，相关知识、聊天记录、反馈和销量记录都将无法恢复。请确认你不再需要它时再执行。
            </p>
            <button
              type="button"
              onClick={deleteAgent}
              disabled={deleting}
              className="mt-4 min-h-[48px] rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 active:bg-red-200 disabled:opacity-50"
            >
              {deleting ? "删除中..." : "删除人生 Agent"}
            </button>
          </div>
        </details>
      </section>
    </div>
  );
}
