"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";
import { isFavoriteAgentId, toggleFavoriteAgentId } from "@/lib/life-agent-favorites";

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
  const [purchaseCount, setPurchaseCount] = useState(1);
  const [payMethod, setPayMethod] = useState<"balance" | "wechat">("balance");
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState("");
  const [showPurchase, setShowPurchase] = useState(false);
  const [voiceEnrollBanner, setVoiceEnrollBanner] = useState<"warn" | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const sync = () => setStarred(isFavoriteAgentId(id));
    sync();
    window.addEventListener("la-favorite-change", sync);
    return () => window.removeEventListener("la-favorite-change", sync);
  }, [id]);

  useEffect(() => {
    if (!showPurchase) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showPurchase]);

  useEffect(() => {
    if (showPurchase) {
      setPayMethod("balance");
      setMessage("");
    }
  }, [showPurchase]);

  const questionCount = useMemo(
    () => Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, purchaseCount)),
    [purchaseCount]
  );

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/life-agents/${id}`, { credentials: "include" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data?.displayName) {
          setProfile(data);
          setStarred(isFavoriteAgentId(id));
        } else setProfile(null);
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
    if (!profile) return 0;
    const count = Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, purchaseCount));
    return (profile.pricePerQuestion * count) / 100;
  }, [profile, purchaseCount]);

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
        <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-violet-100/90 to-fuchsia-100/50" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-1/3 animate-pulse rounded bg-violet-100/80" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-violet-100/80" />
          <div className="h-4 w-full animate-pulse rounded bg-violet-50/60" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 pt-12 text-center">
        <p className="text-lg font-medium text-purple-950/90">未找到该 Agent</p>
        <p className="text-slate-500">链接可能已失效，请从列表重新进入。</p>
        <Link href="/life-agents" className="btn-primary mt-4 inline-flex">
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
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-violet-100/50 sm:aspect-[2/1] sm:max-h-[420px]">
          {heroCoverUrl && (
            <LifeAgentCoverImage
              src={heroCoverUrl}
              alt=""
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />
          <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
            <button
              type="button"
              onClick={() => {
                void toggleFavoriteAgentId(profile.id).then(setStarred);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
              aria-label={starred ? "取消收藏" : "收藏"}
              title={starred ? "取消收藏" : "收藏"}
            >
              {starred ? (
                <svg className="h-5 w-5 text-amber-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              )}
            </button>
            {(profile.verificationStatus === "verified" || profile.verificationStatus === "pending") && (
              <div className="rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
                <VerificationBadge status={profile.verificationStatus ?? "none"} size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 主内容（底部留出固定栏空间） ===== */}
      <div className="mx-auto max-w-2xl space-y-2 pb-24 sm:pb-28">

        {/* --- 价格 + 名称 --- */}
        <div className="-mx-4 bg-white/[0.98] px-4 pb-4 pt-5 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <p className="text-2xl font-bold text-purple-700">
            ¥{(profile.pricePerQuestion / 100).toFixed(2)}
            <span className="ml-1 text-sm font-medium text-slate-400">/次提问</span>
          </p>
          <h1 className="mt-3 text-lg font-bold leading-snug text-purple-950/90 sm:text-xl">
            {profile.displayName}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{profile.headline}</p>

          {allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <span key={tag} className="rounded-md bg-violet-50/95 px-2 py-0.5 text-xs font-medium text-purple-700">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 小数据条 */}
          <div className="mt-4 flex items-center gap-4 border-t border-purple-100/60 pt-3 text-xs text-slate-400">
            <span>{profile.stats.soldQuestionPacks} 次已售</span>
            <span>{profile.stats.sessionCount} 场聊天</span>
            <span>{profile.stats.knowledgeCount} 条知识</span>
            {profile.viewerState.remainingQuestions > 0 && (
              <span className="ml-auto font-medium text-purple-700">
                剩余 {profile.viewerState.remainingQuestions} 次
              </span>
            )}
          </div>
        </div>

        {/* --- 创作者卡片 --- */}
        <div className="-mx-4 bg-white/[0.98] px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#BA68C8] to-[#FF80AB] text-base font-bold text-white shadow-sm">
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
        <div className="-mx-4 bg-white/[0.98] px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <h2 className="text-sm font-semibold text-purple-950/90">适合咨询的人群</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{profile.audience}</p>
        </div>

        {/* --- 你可以问 --- */}
        {(profile.sampleQuestions ?? []).length > 0 && (
          <div className="-mx-4 bg-white/[0.98] px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
            <h2 className="text-sm font-semibold text-purple-950/90">你可以问这些问题</h2>
            <div className="mt-3 space-y-2">
              {profile.sampleQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border border-purple-100/50 bg-violet-50/50 px-3 py-2.5 backdrop-blur-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fuchsia-100/90 text-[10px] font-bold text-purple-700">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 欢迎语 --- */}
        <div className="-mx-4 bg-white/[0.98] px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <h2 className="text-sm font-semibold text-purple-950/90">开场欢迎语</h2>
          <div className="mt-2 rounded-xl border border-purple-100/50 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 px-3.5 py-3 text-sm leading-6 text-slate-700 backdrop-blur-sm">
            {profile.welcomeMessage}
          </div>
        </div>

        {/* --- 评价 --- */}
        <div className="-mx-4 bg-white/[0.98] px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <h2 className="text-sm font-semibold text-purple-950/90">用户评价</h2>
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
            <div className="mt-4 space-y-3 border-t border-purple-100/60 pt-3">
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

      {/* 购买面板：闲鱼式底部弹层（挂 body） */}
      {portalReady &&
        showPurchase &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[200] bg-black/45"
              aria-hidden
              onClick={() => setShowPurchase(false)}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-[210] flex max-h-[90vh] flex-col rounded-t-[22px] bg-gradient-to-b from-[#f3efff] via-[#ebe4f7] to-[#e4daf5] shadow-[0_-10px_40px_-8px_rgba(124,58,237,0.18)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="la-purchase-title"
            >
              <button
                type="button"
                onClick={() => setShowPurchase(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5"
                aria-label="关闭"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* 顶部商品区（白底） */}
              <div className="shrink-0 rounded-t-[22px] border-b border-purple-200/[0.2] bg-white/[0.98] px-4 pb-4 pt-5 backdrop-blur-md">
                <div className="flex gap-3 pr-10">
                  <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-violet-100/50 ring-1 ring-purple-200/30">
                    {heroCoverUrl ? (
                      <LifeAgentCoverImage
                        src={heroCoverUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p id="la-purchase-title" className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#111]">
                      {profile.displayName}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{profile.headline}</p>
                    <p className="mt-2 text-[22px] font-bold leading-none text-purple-800">
                      ¥{(profile.pricePerQuestion / 100).toFixed(2)}
                      <span className="ml-1 text-xs font-normal text-slate-400">/ 次提问</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 中间可滚动：白卡片分区 */}
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between rounded-xl border border-purple-200/[0.2] bg-white/[0.98] px-4 py-3.5 text-sm shadow-[0_3px_16px_rgba(124,58,237,0.06)] backdrop-blur-sm">
                  <span className="text-slate-600">服务类型</span>
                  <span className="font-medium text-[#111]">按次付费 · 提问咨询</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-purple-200/[0.2] bg-white/[0.98] px-4 py-3.5 text-sm shadow-[0_3px_16px_rgba(124,58,237,0.06)] backdrop-blur-sm">
                  <span className="text-[#111]">购买数量</span>
                  <div className="flex items-center rounded-lg border border-purple-200/[0.25] bg-violet-50/50">
                    <button
                      type="button"
                      disabled={purchaseCount <= MIN_QUESTIONS}
                      onClick={() => setPurchaseCount((c) => Math.max(MIN_QUESTIONS, c - 1))}
                      className="flex h-9 w-10 items-center justify-center text-lg text-slate-600 transition active:bg-slate-200 disabled:opacity-35"
                    >
                      −
                    </button>
                    <span className="min-w-[2.25rem] text-center text-base font-semibold tabular-nums text-[#111]">
                      {purchaseCount}
                    </span>
                    <button
                      type="button"
                      disabled={purchaseCount >= MAX_QUESTIONS}
                      onClick={() => setPurchaseCount((c) => Math.min(MAX_QUESTIONS, c + 1))}
                      className="flex h-9 w-10 items-center justify-center text-lg text-slate-600 transition active:bg-slate-200 disabled:opacity-35"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-purple-200/[0.2] bg-white/[0.98] px-4 py-3.5 text-sm shadow-[0_3px_16px_rgba(124,58,237,0.06)] backdrop-blur-sm">
                  <span className="text-slate-600">应付合计</span>
                  <span className="text-lg font-bold text-purple-800">¥{totalPrice.toFixed(2)}</span>
                </div>

                <div className="overflow-hidden rounded-xl border border-purple-200/[0.2] bg-white/[0.98] shadow-[0_3px_16px_rgba(124,58,237,0.06)] backdrop-blur-sm">
                  <p className="border-b border-purple-100/60 px-4 py-2 text-xs text-slate-400">支付方式</p>
                  <button
                    type="button"
                    onClick={() => setPayMethod("balance")}
                    className="flex w-full items-center gap-3 border-b border-purple-50/80 px-4 py-3.5 text-left text-sm"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-xs font-bold text-white">
                      余
                    </span>
                    <span className="flex-1 font-medium text-[#111]">账户余额（演示）</span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        payMethod === "balance" ? "border-amber-500 bg-amber-400" : "border-slate-300"
                      }`}
                    >
                      {payMethod === "balance" ? (
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("wechat")}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#07c160] text-[10px] font-bold text-white">
                      微
                    </span>
                    <span className="flex-1 font-medium text-[#111]">微信支付（演示）</span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        payMethod === "wechat" ? "border-[#07c160] bg-[#07c160]" : "border-slate-300"
                      }`}
                    >
                      {payMethod === "wechat" ? (
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                  </button>
                </div>

                {message ? (
                  <p className="px-1 text-center text-sm text-orange-800/90">{message}</p>
                ) : null}
              </div>

              {/* 底部固定：闲鱼式橙色胶囊按钮 */}
              <div className="shrink-0 border-t border-purple-200/[0.25] bg-white/[0.96] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
                <button
                  type="button"
                  onClick={purchase}
                  disabled={purchasing}
                  className="btn-primary w-full py-3.5 text-base font-bold disabled:opacity-50"
                >
                  {purchasing ? "提交中…" : `确认购买 ¥${totalPrice.toFixed(2)}`}
                </button>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* ===== 底部固定操作栏 ===== */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-purple-200/[0.2] bg-white/[0.94] backdrop-blur-lg shadow-[0_-4px_28px_-8px_rgba(124,58,237,0.08)]">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-purple-700">
              ¥{(profile.pricePerQuestion / 100).toFixed(2)}
              <span className="ml-1 text-xs font-normal text-slate-400">/次</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPurchase(!showPurchase)}
            className="btn-secondary shrink-0 px-5 py-2.5 text-sm font-semibold"
          >
            购买提问
          </button>
          {profile.viewerState.isLoggedIn ? (
            <Link href={`/life-agents/${profile.id}/chat`} className="btn-primary shrink-0 px-6 py-2.5 text-sm font-semibold">
              进入聊天
            </Link>
          ) : (
            <Link href="/login" className="btn-primary shrink-0 px-6 py-2.5 text-sm font-semibold">
              登录后咨询
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
