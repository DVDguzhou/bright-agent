"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { resolveLifeAgentCoverDisplayUrl } from "@/lib/life-agent-covers";
import { overrideLifeAgentCoverUrlByDisplayName } from "@/lib/life-agent-display-overrides";
import { isFavoriteAgentId, toggleFavoriteAgentId } from "@/lib/life-agent-favorites";
import { cleanLifeAgentIntroMultiline, cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { MindScoreBadge } from "@/components/MindScoreBadge";
import { lifeAgentShowsPurchaseUi } from "@/lib/life-agent-commerce";
import {
  buildGrowthQuestion,
  fetchLifeAgentGrowthLog,
  formatGrowthFreshDays,
  growthEventCategory,
  growthEventLocation,
  LIFE_AGENT_GROWTH_CATEGORY_LABELS,
  markLifeAgentGrowthSeen,
  type LifeAgentGrowthEvent,
  type LifeAgentGrowthLog,
} from "@/lib/life-agent-growth";
import { selectTopLifeAgentDisplayTags } from "@/lib/life-agent-display-tags";
import { triggerHapticTap } from "@/lib/haptic";

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
  structuredFacts?: Array<{
    id: string;
    factKey: string;
    factValue: string;
    confidence?: string;
    status?: string;
  }>;
  topicSummaries?: Array<{
    id: string;
    topicGroup: string;
    topicKey: string;
    topicLabel: string;
    summary: string;
    confidence?: string;
    status?: string;
  }>;
  verificationStatus?: string;
  claim?: {
    status: "claimed" | "unclaimed";
    label: string;
    isClaimed: boolean;
  };
  creator: {
    name: string | null;
  };
  stats: {
    sessionCount: number;
    soldQuestionPacks: number;
    knowledgeCount: number;
    topicCount?: number;
    mindScore?: number;
    mindScoreLevel?: number;
  };
  mindScore?: {
    total: number;
    level: number;
    levelLabel: string;
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

export default function LifeAgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<DetailData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [voiceEnrollBanner, setVoiceEnrollBanner] = useState<"warn" | null>(null);
  const [starred, setStarred] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<Array<{ id: string; content: string; category: string; location?: string; createdAt: string; freshDays: number }>>([]);
  const [growthLog, setGrowthLog] = useState<LifeAgentGrowthLog | null>(null);

  useEffect(() => {
    const sync = () => setStarred(isFavoriteAgentId(id));
    sync();
    window.addEventListener("la-favorite-change", sync);
    return () => window.removeEventListener("la-favorite-change", sync);
  }, [id]);

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

    fetch(`/api/life-agents/${id}/live-updates`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (json?.updates) setLiveUpdates(json.updates); })
      .catch(() => {});

    fetchLifeAgentGrowthLog(id)
      .then((log) => {
        if (log) setGrowthLog(log);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!profile?.viewerState?.isLoggedIn) return;
    const following = growthLog?.summary?.following || starred;
    if (!following) return;
    void markLifeAgentGrowthSeen(id).then(() => {
      setGrowthLog((prev) =>
        prev
          ? {
              ...prev,
              summary: { ...prev.summary, unread: 0, following: true },
            }
          : prev
      );
    });
  }, [growthLog?.summary?.following, id, profile?.viewerState?.isLoggedIn, starred]);

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

  const averageScore = profile?.ratings?.averageScore ?? 0;
  const heroCoverUrl = profile
    ? overrideLifeAgentCoverUrlByDisplayName(profile.displayName) ??
      resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey)
    : null;

  const cleanedIntro = useMemo(() => {
    if (!profile) return null;
    const dn = profile.displayName;
    return {
      headline: cleanLifeAgentIntroText(profile.headline, dn),
      shortBio: cleanLifeAgentIntroText(profile.shortBio, dn),
      school: cleanLifeAgentIntroText(profile.school, dn),
      education: cleanLifeAgentIntroText(profile.education, dn),
      job: cleanLifeAgentIntroText(profile.job, dn),
      income: cleanLifeAgentIntroText(profile.income, dn),
      audience: cleanLifeAgentIntroMultiline(profile.audience, dn),
      welcomeMessage: cleanLifeAgentIntroMultiline(profile.welcomeMessage, dn),
      sampleQuestions: (profile.sampleQuestions ?? []).map((q) => cleanLifeAgentIntroText(q, dn)),
    };
  }, [profile]);

  /* ---------- loading / 404 ---------- */
  if (!loaded) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mx-auto w-full max-w-[min(88vw,320px)] animate-pulse bg-paper-200" style={{ aspectRatio: "1 / 1" }} />
        <div className="space-y-2 border-t border-hairline p-4">
          <div className="h-8 w-1/2 animate-pulse bg-paper-200" />
          <div className="h-4 w-3/4 animate-pulse bg-paper-200" />
          <div className="mt-2 h-4 w-full animate-pulse bg-paper-200" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 pt-12 text-center">
        <p className="font-serif text-xl font-medium text-ink">未找到该 Agent</p>
        <p className="font-serif text-sm italic text-ink-400">链接可能已失效，请从列表重新进入。</p>
        <Link href="/life-agents" className="btn-primary pressable mt-4 inline-flex" onClick={() => triggerHapticTap()}>
          返回列表
        </Link>
      </div>
    );
  }

  const ci = cleanedIntro!;
  const areaText = [profile.country, profile.province, profile.city, profile.county]
    .filter(Boolean)
    .filter((seg, i, arr) => i === 0 || arr[i - 1] !== seg) // 去掉相邻重复段（直辖市省=市，如「北京 · 北京」）
    .join(" · ");
  // 标签只展示 MBTI + 专长话题；人设/语气/回应风格是内部行为字段，不当话题标签露出。
  // 分类展开后 tag 可能很多，详情页只展示与简介/受众最相关的前 5 个。
  const allTags = selectTopLifeAgentDisplayTags({
    mbti: profile.mbti,
    expertiseTags: profile.expertiseTags,
    headline: ci.headline,
    audience: ci.audience,
    shortBio: ci.shortBio,
    sampleQuestions: profile.sampleQuestions,
    limit: 5,
  });

  const showPurchaseUi = lifeAgentShowsPurchaseUi();
  const hasPrice = showPurchaseUi && profile.pricePerQuestion > 0;
  const remainingQ = profile.viewerState.remainingQuestions;
  const claim = profile.claim ?? { status: "unclaimed", label: "未认领", isClaimed: false };
  const fallbackGrowthEvents: LifeAgentGrowthEvent[] = liveUpdates.map((u) => ({
    id: u.id,
    type: "live_update",
    visibility: "public",
    title: "更新了一条近况",
    summary: u.content,
    payload: { category: u.category, location: u.location },
    sourceId: u.id,
    createdAt: u.createdAt,
    freshDays: u.freshDays,
  }));
  const growthEvents = growthLog?.events.length ? growthLog.events : fallbackGrowthEvents;
  const latestGrowth = growthEvents[0];
  const growthUnread = growthLog?.summary.unread ?? 0;
  const growthTotal = growthLog?.summary.publicTotal || growthEvents.length;

  return (
    <>
      {/* ===== 头图 ===== */}
      <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8">
        <div className="flex justify-center px-4 pb-1 pt-5 sm:px-6 sm:pb-2 sm:pt-7">
          <div className="relative w-full max-w-[min(88vw,320px)] overflow-hidden rounded-sm border border-hairline bg-paper-200" style={{ aspectRatio: "1 / 1" }}>
            {heroCoverUrl && (
              <LifeAgentCoverImage
                src={heroCoverUrl}
                alt={profile.displayName}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 88vw, 320px"
                priority
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
            <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
              <button
                type="button"
                onClick={() => {
                  triggerHapticTap();
                  void toggleFavoriteAgentId(profile.id).then((next) => {
                    setStarred(next);
                    if (next && profile.viewerState.isLoggedIn) {
                      void markLifeAgentGrowthSeen(profile.id);
                    }
                    setGrowthLog((prev) =>
                      prev
                        ? { ...prev, summary: { ...prev.summary, following: next, unread: next ? 0 : prev.summary.unread } }
                        : prev
                    );
                  });
                }}
                className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-ink/40 text-paper backdrop-blur-sm transition hover:bg-ink/60 active:bg-ink/60"
                aria-label={starred ? "取消追更" : "追更这位前辈"}
                title={starred ? "取消追更" : "追更这位前辈"}
              >
                {starred ? (
                  <svg className="h-5 w-5 text-paper" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
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
                <div className="rounded-full bg-paper/90 px-2 py-1 backdrop-blur-sm">
                  <VerificationBadge status={profile.verificationStatus ?? "none"} size="sm" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 主内容 ===== */}
      <div className="mx-auto max-w-2xl divide-y divide-hairline pb-24 sm:pb-28">

        {/* --- 名称 --- */}
        <div className="-mx-4 px-4 pb-5 pt-5 sm:-mx-6 sm:px-6">
          <h1 className="font-serif text-2xl font-medium leading-snug text-ink sm:text-3xl [text-wrap:balance]">
            {profile.displayName}
          </h1>
          <div className="mt-2 flex">
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-5 ${
                claim.isClaimed
                  ? "border-hairline bg-paper-50 text-ink-700"
                  : "border-signal-600/30 bg-signal-50 text-signal-700"
              }`}
            >
              {claim.label}
            </span>
          </div>
          <p className="mt-2 font-serif text-sm italic leading-relaxed text-ink-400">{ci.headline}</p>

          {allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <span key={tag} className="border border-hairline px-2 py-0.5 text-[11px] font-medium text-ink-500">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-hairline pt-3 text-xs text-ink-400">
            <span>{profile.stats.sessionCount} 场聊天</span>
            {typeof (profile.mindScore?.total ?? profile.stats.mindScore) === "number" ? (
              <MindScoreBadge value={profile.mindScore?.total ?? profile.stats.mindScore ?? 0} size="sm" />
            ) : null}
          </div>
        </div>

        {/* --- 最近更新 / 追更 --- */}
        <div className="-mx-4 bg-paper-50 px-4 py-4 sm:-mx-6 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {growthUnread > 0
                  ? `你养着的前辈更新了 ${growthUnread} 条`
                  : latestGrowth
                    ? `最近更新 ${growthTotal} 条`
                    : "最近还没有公开近况"}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-400">
                {latestGrowth
                  ? `${latestGrowth.title} · ${formatGrowthFreshDays(latestGrowth.freshDays)}`
                  : "可以先问他的过往经验，之后追更会看到新的近况。"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHapticTap();
                void toggleFavoriteAgentId(profile.id).then((next) => {
                  setStarred(next);
                  if (next && profile.viewerState.isLoggedIn) {
                    void markLifeAgentGrowthSeen(profile.id);
                  }
                  setGrowthLog((prev) =>
                    prev
                      ? { ...prev, summary: { ...prev.summary, following: next, unread: next ? 0 : prev.summary.unread } }
                      : prev
                  );
                });
              }}
              className={`pressable shrink-0 rounded border px-3 py-2 text-xs font-semibold transition ${
                starred
                  ? "border-signal-200 bg-signal-50 text-signal-700 hover:bg-signal-100"
                  : "border-hairline bg-paper text-ink-600 hover:border-signal-200 hover:text-signal-700"
              }`}
            >
              {starred ? "已追更" : "追更"}
            </button>
          </div>
          {latestGrowth ? (
            <div className="mt-3 rounded-md border border-hairline bg-paper px-3 py-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                <span className="font-medium text-signal-700">
                  {LIFE_AGENT_GROWTH_CATEGORY_LABELS[growthEventCategory(latestGrowth)] ?? growthEventCategory(latestGrowth)}
                </span>
                {growthEventLocation(latestGrowth) ? <span>{growthEventLocation(latestGrowth)}</span> : null}
                <span>{formatGrowthFreshDays(latestGrowth.freshDays)}</span>
              </div>
              {latestGrowth.summary.trim() ? (
                <p className="mt-1 text-sm leading-6 text-ink-600 [text-wrap:pretty]">{latestGrowth.summary}</p>
              ) : (
                <p className="mt-1 text-sm leading-6 text-ink-500">这位前辈最近维护过相关话题，可以直接追问最新情况。</p>
              )}
              <div className="mt-3">
                <Link
                  href={`/life-agents/${profile.id}/chat?prefill=${encodeURIComponent(buildGrowthQuestion(latestGrowth, profile.displayName))}`}
                  onClick={() => triggerHapticTap()}
                  className="pressable inline-flex min-h-9 items-center rounded bg-ink px-3 text-xs font-semibold text-paper-50 transition hover:bg-signal-700"
                >
                  问问这件事
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* --- 创作者信息 --- */}
        <div className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-paper-200 ring-1 ring-hairline">
              {heroCoverUrl ? (
                <LifeAgentCoverImage
                  src={heroCoverUrl}
                  alt={profile.displayName}
                  fill
                  compact
                  className="object-cover object-center"
                  sizes="44px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-ink text-base font-bold text-paper">
                  {(profile.displayName ?? "?").slice(0, 1)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-ink">
                  {profile.creator.name || profile.displayName}
                </span>
                <VerificationBadge status={profile.verificationStatus ?? "none"} size="sm" />
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-ink-400">{ci.shortBio}</p>
            </div>
          </div>

          {(ci.school || ci.education || ci.job || ci.income || areaText) && (
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-ink-500">
              {ci.school ? <span><span className="text-ink-300">学校</span>　{ci.school}</span> : null}
              {ci.education ? <span><span className="text-ink-300">学历</span>　{ci.education}</span> : null}
              {ci.job ? <span><span className="text-ink-300">职业</span>　{ci.job}</span> : null}
              {ci.income ? <span><span className="text-ink-300">收入</span>　{ci.income}</span> : null}
              {areaText && <span><span className="text-ink-300">地区</span>　{areaText}</span>}
            </div>
          )}
        </div>

        {/* --- 音色注册提醒 --- */}
        {voiceEnrollBanner === "warn" && profile.viewerState.isOwner && (
          <div className="-mx-4 bg-paper-200 px-4 py-3 text-sm text-oxblood-700 sm:-mx-6 sm:px-6">
            <p>
              音色样本已上传，但<strong>云端注册未完成</strong>。请到后台重新录制。
            </p>
            <div className="mt-2 flex gap-2">
              <Link
                href={`/dashboard/life-agents/${profile.id}`}
                onClick={() => triggerHapticTap()}
                className="pressable rounded-sm bg-oxblood-600 px-3 py-1.5 text-xs font-semibold text-paper"
              >
                去后台
              </Link>
              <button
                type="button"
                onClick={() => {
                  triggerHapticTap();
                  dismissVoiceBanner();
                }}
                className="pressable text-xs text-oxblood-600 underline"
              >
                知道了
              </button>
            </div>
          </div>
        )}

        {/* --- 适合人群 --- */}
        <div className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
          <h2 className="text-sm font-semibold text-ink">适合咨询的人群</h2>
          <p className="mt-2 text-sm leading-7 text-ink-500 [text-wrap:pretty]">{ci.audience}</p>
        </div>

        {/* --- 更新时间线 --- */}
        {growthEvents.length > 1 && (
          <div className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
            <h2 className="text-sm font-semibold text-ink">更新轨迹</h2>
            <div className="mt-3 divide-y divide-hairline/60">
              {growthEvents.slice(1, 5).map((event) => (
                <div key={event.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                    <span className="font-medium text-signal-700">
                      {LIFE_AGENT_GROWTH_CATEGORY_LABELS[growthEventCategory(event)] ?? growthEventCategory(event)}
                    </span>
                    {growthEventLocation(event) ? <span>{growthEventLocation(event)}</span> : null}
                    <span>{formatGrowthFreshDays(event.freshDays)}</span>
                  </div>
                  {event.summary.trim() ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{event.summary}</p>
                  ) : null}
                  <Link
                    href={`/life-agents/${profile.id}/chat?prefill=${encodeURIComponent(buildGrowthQuestion(event, profile.displayName))}`}
                    onClick={() => triggerHapticTap()}
                    className="pressable mt-1 inline-flex text-xs font-semibold text-signal-700 underline decoration-signal-300 underline-offset-4"
                  >
                    问问这条更新
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 你可以问 --- */}
        {ci.sampleQuestions.length > 0 && (
          <div className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
            <h2 className="text-sm font-semibold text-ink">你可以问这些问题</h2>
            <ul className="mt-3 space-y-2">
              {ci.sampleQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-[11px] font-medium tabular-nums text-ink-300" aria-hidden>{i + 1}.</span>
                  <span className="text-sm leading-relaxed text-ink-500">{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* --- 评价 --- */}
        <div className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
          <h2 className="text-sm font-semibold text-ink">用户评价</h2>
          <div className="mt-3 flex items-center gap-4">
            <span className="font-serif text-4xl font-medium text-ink">
              {profile.ratings && profile.ratings.raters > 0
                ? profile.ratings.averageScore.toFixed(1)
                : "—"}
            </span>
            <div>
              <RatingStars score={averageScore} size="md" />
              <p className="mt-0.5 text-xs text-ink-400">
                {profile.ratings && profile.ratings.raters > 0
                  ? `${profile.ratings.raters} 人评价`
                  : "暂无评价"}
              </p>
            </div>
          </div>
          {profile.ratings?.recent && profile.ratings.recent.length > 0 && (
            <div className="mt-4 divide-y divide-hairline border-t border-hairline">
              {profile.ratings.recent.slice(0, 5).map((r) => (
                <div key={r.id} className="py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <RatingStars score={r.score} size="sm" />
                    <span className="text-xs text-ink-400">{new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-ink-500 [text-wrap:pretty]">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ===== 底部固定操作栏 ===== */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-paper/95 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          {hasPrice && (
            <p className="mb-2 text-center text-xs text-ink-400">
              {remainingQ > 0
                ? `剩余 ${remainingQ} 次提问额度`
                : `¥${(profile.pricePerQuestion / 100).toFixed(0)} / 次提问`}
            </p>
          )}
          {!profile.viewerState.isLoggedIn ? (
            <Link
              href={`/login?redirect=${encodeURIComponent(`/life-agents/${profile.id}/chat`)}`}
              onClick={() => triggerHapticTap()}
              className="btn-primary pressable flex w-full items-center justify-center py-3 text-base font-semibold"
            >
              登录后开始咨询
            </Link>
          ) : remainingQ > 0 ? (
            <Link
              href={`/life-agents/${profile.id}/chat`}
              onClick={() => triggerHapticTap()}
              className="btn-primary pressable flex w-full items-center justify-center py-3 text-base font-semibold"
            >
              继续聊天（剩余 {remainingQ} 次）
            </Link>
          ) : (
            <Link
              href={`/life-agents/${profile.id}/chat`}
              onClick={() => triggerHapticTap()}
              className="btn-primary pressable flex w-full items-center justify-center py-3 text-base font-semibold"
            >
              开始咨询
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
