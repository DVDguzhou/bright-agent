"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  const id = params.id as string;
  const [profile, setProfile] = useState<DetailData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [questionCountInput, setQuestionCountInput] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState("");
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
      try {
        sessionStorage.removeItem(`la-voice-warn:${profile.id}`);
      } catch {
        /* ignore */
      }
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
      body: JSON.stringify({
        questionCount: count,
        amountPaid: profile.pricePerQuestion * count,
      }),
    });
    const data = await res.json();
    setPurchasing(false);

    if (!res.ok) {
      setMessage(data.error === "UNAUTHORIZED" ? "请先登录后再购买。" : "购买失败，请稍后重试。");
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            viewerState: { ...prev.viewerState, remainingQuestions: data.remainingQuestions },
          }
        : prev
    );
    setMessage(`购买成功，当前剩余 ${data.remainingQuestions} 次提问。`);
  };

  if (!loaded) {
    return <div className="h-64 animate-pulse rounded-3xl bg-white shadow-sm" />;
  }
  if (!profile) {
    return (
      <div className="space-y-4">
        <Link href="/life-agents" className="text-sm text-slate-500 hover:text-sky-700">
          ← 返回人生 Agent 列表
        </Link>
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-900">未找到该 Agent</p>
          <p className="mt-2 text-slate-500">链接可能已失效，请从列表重新进入。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/life-agents" className="text-sm text-slate-500 hover:text-sky-700">
        ← 返回人生 Agent 列表
      </Link>

      {heroCoverUrl ? (
        <div className="relative -mx-1 aspect-[21/9] max-h-56 overflow-hidden rounded-2xl bg-slate-100 sm:mx-0 sm:max-h-64">
          <Image
            src={heroCoverUrl}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
            unoptimized={lifeAgentCoverShouldBypassOptimizer(heroCoverUrl)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      ) : null}

      {voiceEnrollBanner === "warn" && profile.viewerState.isOwner && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>
            你上传了音色样本，但<strong className="font-semibold">云端注册未完成</strong>（语音回复可能仍用默认音色）。
            请到「控制台 → 我的人生 Agent → 编辑资料」重新录制并保存，或联系管理员查看服务日志。
          </p>
          <div className="flex shrink-0 gap-2">
            <Link href={`/dashboard/life-agents/${profile.id}`} className="btn-secondary whitespace-nowrap px-3 py-2 text-sm">
              去后台上传
            </Link>
            <button type="button" onClick={dismissVoiceBanner} className="rounded-xl px-3 py-2 text-sm text-amber-800 underline hover:text-amber-950">
              知道了
            </button>
          </div>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="glass-card p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-2xl font-semibold text-blue-700">
                {(profile.displayName ?? "?").slice(0, 1)}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="section-title">{profile.displayName}</h1>
                <VerificationBadge status={profile.verificationStatus ?? "none"} size="md" />
                {profile.verificationStatus === "pending" && (
                  <span className="text-sm text-amber-600">请联系我们完成认证</span>
                )}
              </div>
              <p className="mt-2 text-lg text-slate-600">{profile.headline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  <RatingStars score={averageScore} size="md" />
                  {profile.ratings && profile.ratings.raters > 0
                    ? `${profile.ratings.averageScore.toFixed(1)} / 5 分`
                    : "暂无评分"}
                </span>
                <span>
                  {profile.ratings && profile.ratings.raters > 0
                    ? `${profile.ratings.raters} 位用户已评分`
                    : "满 10 次提问后用户可评分"}
                </span>
              </div>
              {(profile.education || profile.school || profile.job || profile.income) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  {profile.school && <span>🏫 {profile.school}</span>}
                  {profile.education && <span>📜 {profile.education}</span>}
                  {profile.job && <span>💼 {profile.job}</span>}
                  {profile.income && <span>💰 {profile.income}</span>}
                </div>
              )}
              {(profile.country || profile.province || profile.city || profile.county) && (
                <p className="mt-3 text-sm text-slate-500">
                  📍 {[profile.country, profile.province, profile.city, profile.county].filter(Boolean).join(" / ")}
                </p>
              )}
              {Array.isArray(profile.regions) && profile.regions.length > 0 && (
                <p className="mt-2 text-sm text-slate-500">地区：{profile.regions.join(" / ")}</p>
              )}
            </div>

            <div className="rounded-3xl bg-sky-50 p-5 text-right">
              <p className="text-sm text-slate-500">每次提问</p>
              <p className="mt-1 text-3xl font-semibold text-sky-700">
                ¥{(profile.pricePerQuestion / 100).toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-slate-500">已售次数包 {profile.stats.soldQuestionPacks}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {profile.personaArchetype && (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-700">
                {profile.personaArchetype}
              </span>
            )}
            {profile.toneStyle && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
                {profile.toneStyle}
              </span>
            )}
            {profile.responseStyle && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
                {profile.responseStyle}
              </span>
            )}
            {profile.mbti && (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700">
                {profile.mbti}
              </span>
            )}
            {(profile.expertiseTags ?? []).map((tag: string) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">知识条目</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{profile.stats.knowledgeCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">聊天会话</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{profile.stats.sessionCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">我的剩余提问</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{profile.viewerState.remainingQuestions}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">进入聊天前，你会看到</h2>
            <p className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">
              {profile.welcomeMessage}
            </p>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">用户评分</p>
              <div className="mt-2 flex items-center gap-2">
                <RatingStars score={averageScore} size="lg" />
                <p className="text-2xl font-semibold text-slate-900">
                  {profile.ratings && profile.ratings.raters > 0
                    ? profile.ratings.averageScore.toFixed(1)
                    : "--"}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {profile.ratings && profile.ratings.raters > 0
                  ? `${profile.ratings.raters} 位用户已评分`
                  : "还没有用户评分"}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/life-agents/${profile.id}/chat`} className="btn-primary">
                进入聊天页
              </Link>
              {!profile.viewerState.isLoggedIn && (
                <Link href="/login" className="btn-secondary">
                  登录后咨询
                </Link>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">购买提问次数</h2>
            <p className="mt-2 text-sm text-slate-500">按次收费，先买次数再聊天，流程更简单。</p>
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">购买次数</label>
              <input
                type="number"
                min={0}
                max={MAX_QUESTIONS}
                value={questionCountInput}
                onChange={(e) => setQuestionCountInput(e.target.value)}
                placeholder="0"
                className="input-shell w-full max-w-[8rem]"
              />
              <p className="mt-1 text-xs text-slate-500">1–500 次，可自由选择</p>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">需支付</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">¥{totalPrice.toFixed(2)}</p>
            </div>
            <button onClick={purchase} disabled={purchasing || questionCount < MIN_QUESTIONS} className="btn-primary mt-5 w-full justify-center disabled:opacity-60">
              {purchasing ? "购买中..." : questionCount >= MIN_QUESTIONS ? `购买 ${Math.min(MAX_QUESTIONS, questionCount)} 次提问` : "请先选择购买次数"}
            </button>
            {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-slate-900">适合咨询的人群</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">{profile.audience}</p>

          <h3 className="mt-8 text-lg font-semibold text-slate-900">你可以问这些问题</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {(profile.sampleQuestions ?? []).map((question: string) => (
              <span key={question} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {question}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-slate-900">创作者信息</h2>
          <p className="mt-3 text-sm text-slate-700">
            发布者：{profile.creator.name || "未设置昵称"}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{profile.shortBio}</p>
        </div>
      </section>
    </div>
  );
}
