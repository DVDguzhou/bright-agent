"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { lifeAgentCoverShouldBypassOptimizer, resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";

type DetailData = {
  id: string;
  displayName: string;
  headline: string;
  shortBio: string;
  longBio: string;
  education?: string;
  income?: string;
  job?: string;
  school?: string;
  regions?: string[];
  country?: string;
  province?: string;
  city?: string;
  county?: string;
  mbti?: string;
  personaArchetype?: string;
  toneStyle?: string;
  responseStyle?: string;
  audience: string;
  welcomeMessage: string;
  pricePerQuestion: number;
  expertiseTags: string[];
  sampleQuestions: string[];
  knowledgeEntries: Array<{
    id: string;
    category: string;
    title: string;
    content: string;
    tags: string[];
  }>;
  verificationStatus?: string;
  creator: {
    name: string | null;
  };
  stats: {
    sessionCount: number;
    soldQuestionPacks: number;
    knowledgeCount: number;
  };
  ratings?: {
    averageScore: number;
    raters: number;
    recent: Array<{
      id: string;
      score: number;
      comment?: string | null;
      updatedAt: string;
    }>;
  };
  viewerState: {
    isLoggedIn: boolean;
    isOwner: boolean;
    remainingQuestions: number;
  };
  coverUrl?: string;
  coverImageUrl?: string;
  coverPresetKey?: string;
};

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 500;

export default function LifeAgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [profile, setProfile] = useState<DetailData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [questionCountInput, setQuestionCountInput] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState("");
  const [showPurchase, setShowPurchase] = useState(false);
  const [voiceEnrollBanner, setVoiceEnrollBanner] = useState<"warn" | null>(null);

  const questionCount = useMemo(() => {
    const n = parseInt(questionCountInput, 10);
    return Number.isNaN(n) ? 0 : Math.min(MAX_QUESTIONS, Math.max(0, n));
  }, [questionCountInput]);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/life-agents/${id}`, { credentials: "include" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data?.displayName) setProfile(data);
        else setProfile(null);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoaded(true));
  }, [id]);

  useEffect(() => {
    if (!profile?.viewerState?.isOwner || typeof window === "undefined") return;
    const k = `la-voice-warn:${profile.id}`;
    if (sessionStorage.getItem(k)) {
      setVoiceEnrollBanner("warn");
    }
  }, [profile]);

  const dismissVoiceBanner = () => {
    if (profile?.id) {
      try { sessionStorage.removeItem(`la-voice-warn:${profile.id}`); } catch { /* ignore */ }
    }
    setVoiceEnrollBanner(null);
  };

  const totalPrice = useMemo(() => {
    if (!profile || questionCount < MIN_QUESTIONS) return 0;
    const count = Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, questionCount));
    return (profile.pricePerQuestion * count) / 100;
  }, [profile, questionCount]);

  const averageScore = profile?.ratings?.averageScore ?? 0;
  const heroCoverUrl = profile
    ? profile.coverUrl || resolveLifeAgentCoverUrl(profile.coverImageUrl, profile.coverPresetKey)
    : null;

  const purchase = async () => {
    if (!profile) return;
    const count = Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, questionCount));
    setPurchasing(true);
    setMessage("");
    const res = await fetch(`/api/life-agents/${profile.id}/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ questionCount: count, amountPaid: profile.pricePerQuestion * count }),
    });
    const data = await res.json();
    setPurchasing(false);
    if (!res.ok) {
      setMessage(data.error === "UNAUTHORIZED" ? "请先登录后再购买。" : "购买失败，请稍后重试。");
      return;
    }
    setProfile((prev) =>
      prev ? { ...prev, viewerState: { ...prev.viewerState, remainingQuestions: data.remainingQuestions } } : prev
    );
    setMessage(`购买成功，当前剩余 ${data.remainingQuestions} 次提问。`);
  };

  /* ---------- loading / 404 ---------- */
  if (!loaded) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="aspect-[4/3] animate-pulse bg-slate-100" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-50" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 pt-12 text-center">
        <p className="text-lg font-medium text-slate-900">未找到该 Agent</p>
        <p className="text-slate-500">链接可能已失效，请从列表重新进入。</p>
        <Link href="/life-agents" className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white">
          返回列表
        </Link>
      </div>
    );
  }

  const areaText = [profile.country, profile.province, profile.city, profile.county].filter(Boolean).join(" · ");
  const allTags = [
    profile.personaArchetype,
    profile.toneStyle,
    profile.responseStyle,
    profile.mbti,
    ...(profile.expertiseTags ?? []),
  ].filter(Boolean) as string[];

  return (
    <>
      {/* ===== 全宽封面 ===== */}
      <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 sm:aspect-[2/1] sm:max-h-[420px]">
          {heroCoverUrl && (
            <Image
              src={heroCoverUrl}
              alt=""
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority
              unoptimized={lifeAgentCoverShouldBypassOptimizer(heroCoverUrl)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />
          <button
            onClick={() => router.back()}
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:top-4"
            aria-label="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {(profile.verificationStatus === "verified" || profile.verificationStatus === "pending") && (
            <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm sm:right-4 sm:top-4">
              <VerificationBadge status={profile.verificationStatus ?? "none"} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* ===== 主内容（底部留出固定栏空间） ===== */}
      <div className="mx-auto max-w-2xl space-y-2 pb-24 sm:pb-28">

        {/* --- 价格 + 名称 --- */}
        <div className="-mx-4 bg-white px-4 pb-4 pt-5 sm:-mx-6 sm:px-6">
          <p className="text-2xl font-bold text-blue-600">
            ¥{(profile.pricePerQuestion / 100).toFixed(2)}
            <span className="ml-1 text-sm font-medium text-slate-400">/次提问</span>
          </p>
          <h1 className="mt-3 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
            {profile.displayName}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{profile.headline}</p>

          {allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <span key={tag} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 小数据条 */}
          <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
            <span>{profile.stats.soldQuestionPacks} 次已售</span>
            <span>{profile.stats.sessionCount} 场聊天</span>
            <span>{profile.stats.knowledgeCount} 条知识</span>
            {profile.viewerState.remainingQuestions > 0 && (
              <span className="ml-auto font-medium text-blue-600">
                剩余 {profile.viewerState.remainingQuestions} 次
              </span>
            )}
          </div>
        </div>

        {/* --- 创作者卡片 --- */}
        <div className="-mx-4 bg-white px-4 py-4 sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-base font-bold text-white">
              {(profile.displayName ?? "?").slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-slate-900">
                  {profile.creator.name || profile.displayName}
                </span>
                <VerificationBadge status={profile.verificationStatus ?? "none"} size="sm" />
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{profile.shortBio}</p>
            </div>
          </div>

          {(profile.school || profile.education || profile.job || profile.income || areaText) && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {profile.school && <span>🏫 {profile.school}</span>}
              {profile.education && <span>📜 {profile.education}</span>}
              {profile.job && <span>💼 {profile.job}</span>}
              {profile.income && <span>💰 {profile.income}</span>}
              {areaText && <span>📍 {areaText}</span>}
            </div>
          )}
        </div>

        {/* --- 音色注册提醒 --- */}
        {voiceEnrollBanner === "warn" && profile.viewerState.isOwner && (
          <div className="-mx-4 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:-mx-6 sm:px-6">
            <p>
              音色样本已上传，但<strong>云端注册未完成</strong>。请到后台重新录制。
            </p>
            <div className="mt-2 flex gap-2">
              <Link href={`/dashboard/life-agents/${profile.id}`} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white">
                去后台
              </Link>
              <button type="button" onClick={dismissVoiceBanner} className="text-xs text-amber-700 underline">
                知道了
              </button>
            </div>
          </div>
        )}

        {/* --- 适合人群 --- */}
        <div className="-mx-4 bg-white px-4 py-4 sm:-mx-6 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-900">适合咨询的人群</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{profile.audience}</p>
        </div>

        {/* --- 你可以问 --- */}
        {(profile.sampleQuestions ?? []).length > 0 && (
          <div className="-mx-4 bg-white px-4 py-4 sm:-mx-6 sm:px-6">
            <h2 className="text-sm font-semibold text-slate-900">你可以问这些问题</h2>
            <div className="mt-3 space-y-2">
              {profile.sampleQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 欢迎语 --- */}
        <div className="-mx-4 bg-white px-4 py-4 sm:-mx-6 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-900">开场欢迎语</h2>
          <div className="mt-2 rounded-xl bg-blue-50/60 px-3.5 py-3 text-sm leading-6 text-slate-700">
            {profile.welcomeMessage}
          </div>
        </div>

        {/* --- 评价 --- */}
        <div className="-mx-4 bg-white px-4 py-4 sm:-mx-6 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-900">用户评价</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-900">
              {profile.ratings && profile.ratings.raters > 0
                ? profile.ratings.averageScore.toFixed(1)
                : "—"}
            </span>
            <div>
              <RatingStars score={averageScore} size="md" />
              <p className="mt-0.5 text-xs text-slate-400">
                {profile.ratings && profile.ratings.raters > 0
                  ? `${profile.ratings.raters} 人评价`
                  : "暂无评价"}
              </p>
            </div>
          </div>
          {profile.ratings?.recent && profile.ratings.recent.length > 0 && (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
              {profile.ratings.recent.slice(0, 5).map((r) => (
                <div key={r.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <RatingStars score={r.score} size="sm" />
                    <span className="text-xs text-slate-400">{new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-slate-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ===== 购买面板（Bottom Sheet 浮层） ===== */}
      {showPurchase && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowPurchase(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">购买提问次数</h2>
              <button onClick={() => setShowPurchase(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">1–500 次，按次收费，每次 ¥{(profile.pricePerQuestion / 100).toFixed(2)}</p>
            <div className="mt-4 flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">购买次数</label>
                <input
                  type="number"
                  min={0}
                  max={MAX_QUESTIONS}
                  value={questionCountInput}
                  onChange={(e) => setQuestionCountInput(e.target.value)}
                  placeholder="输入次数"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>
              <div className="shrink-0 pb-1 text-right">
                <p className="text-xs text-slate-400">合计</p>
                <p className="text-2xl font-bold text-blue-600">¥{totalPrice.toFixed(2)}</p>
              </div>
            </div>
            <button
              onClick={purchase}
              disabled={purchasing || questionCount < MIN_QUESTIONS}
              className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
            >
              {purchasing
                ? "购买中..."
                : questionCount >= MIN_QUESTIONS
                  ? `确认购买 ${Math.min(MAX_QUESTIONS, questionCount)} 次`
                  : "请输入购买次数"}
            </button>
            {message && <p className="mt-3 text-center text-sm text-blue-600">{message}</p>}
          </div>
        </>
      )}

      {/* ===== 底部固定操作栏 ===== */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-blue-600">
              ¥{(profile.pricePerQuestion / 100).toFixed(2)}
              <span className="ml-1 text-xs font-normal text-slate-400">/次</span>
            </p>
          </div>
          <button
            onClick={() => setShowPurchase(!showPurchase)}
            className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
          >
            购买提问
          </button>
          {profile.viewerState.isLoggedIn ? (
            <Link
              href={`/life-agents/${profile.id}/chat`}
              className="shrink-0 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              进入聊天
            </Link>
          ) : (
            <Link
              href="/login"
              className="shrink-0 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              登录后咨询
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
