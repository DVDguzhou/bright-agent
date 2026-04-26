"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBoundLifeAgents, type BoundLifeAgent } from "@/lib/bound-life-agents";
import { useMobileTouchNavEnabled } from "@/hooks/use-life-agents-feed-gestures";
import { useMediaRecorder } from "@/lib/voice/useMediaRecorder";

// 人生 Agent: 智能体/对话
const IconAgent = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
// 消息
const IconMessages = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const IconDashboard = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12l8-8 8 8M6 10v9h12v-9" />
  </svg>
);
const IconLogin = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
  </svg>
);
const IconLogout = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7M11 20H5a2 2 0 01-2-2V6a2 2 0 012-2h6" />
  </svg>
);
const IconSignup = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const IconSearch = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
/** 底栏「地图」→ Agent 地理分布页；已购凭证见 /licenses */
const IconMap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const navLinks = [
  { href: "/life-agents", label: "发现", Icon: IconAgent },
  { href: "/dashboard/messages", label: "消息", Icon: IconMessages },
  { href: "/map", label: "地图", Icon: IconMap },
];

const CO_EDIT_PENDING_VOICE_STORAGE_PREFIX = "life-agent-co-edit-pending-voice:";

function pendingVoicePromptKey(agentId: string) {
  return `${CO_EDIT_PENDING_VOICE_STORAGE_PREFIX}${agentId}`;
}

function mergeVoiceDraft(existing: string, nextSegment: string) {
  const prev = existing.trim();
  const next = nextSegment.trim();
  if (!prev) return next;
  if (!next) return prev;
  return `${prev}\n${next}`;
}

function VoiceWaveBar({ delay, active }: { delay: number; active: boolean }) {
  return (
    <motion.div
      className="w-[3px] rounded-full bg-white/90"
      animate={
        active
          ? { height: [8, 28, 14, 32, 10], opacity: [0.6, 1, 0.8, 1, 0.6] }
          : { height: 6, opacity: 0.3 }
      }
      transition={
        active
          ? { duration: 0.9, repeat: Infinity, repeatType: "mirror", delay, ease: "easeInOut" }
          : { duration: 0.3 }
      }
    />
  );
}

function FloatingVoiceCoachFab({ agent }: { agent: BoundLifeAgent }) {
  const router = useRouter();
  const [submitHint, setSubmitHint] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [isCancelled, setIsCancelled] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const touchStartY = useRef(0);
  const cancelledRef = useRef(false);
  const { status: recStatus, error: recError, duration, start: recStart, stop: recStop, reset: recReset } =
    useMediaRecorder({
      onDataAvailable: async (blob) => {
        if (cancelledRef.current) return;
        setIsTranscribing(true);
        setSubmitHint("正在识别...");
        try {
          const fd = new FormData();
          fd.append("audio", blob, "voice.webm");
          fd.append("language", "zh");
          const res = await fetch("/api/transcribe", { method: "POST", body: fd, credentials: "include" });
          const data = await res.json();
          const text = (data.text ?? "").trim();
          if (!text) {
            setSubmitHint("没有识别到内容，请再说一次");
          } else {
            setDraftText((prev) => mergeVoiceDraft(prev, text));
            setSubmitHint("已记录，继续长按可补充");
          }
        } catch {
          setSubmitHint("语音识别失败，请重试");
        } finally {
          setIsTranscribing(false);
        }
      },
    });

  const isRecording = recStatus === "recording";
  const isActive = isRecording || isTranscribing;
  const helperText = draftText ? "已保存语音草稿，可继续补充" : "长按调教";

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(pendingVoicePromptKey(agent.id));
      setDraftText(saved?.trim() ?? "");
    } catch {
      setDraftText("");
    }
  }, [agent.id]);

  useEffect(() => {
    try {
      if (draftText.trim()) {
        sessionStorage.setItem(pendingVoicePromptKey(agent.id), draftText.trim());
      } else {
        sessionStorage.removeItem(pendingVoicePromptKey(agent.id));
      }
    } catch {
      // ignore storage errors
    }
  }, [agent.id, draftText]);

  useEffect(() => {
    if (!submitHint && !recError) return;
    const timer = window.setTimeout(() => setSubmitHint(null), 3000);
    return () => window.clearTimeout(timer);
  }, [submitHint, recError]);

  const openCoEdit = useCallback(() => {
    router.push(`/dashboard/life-agents/${agent.id}/co-edit`);
  }, [agent.id, router]);

  const clearDraft = useCallback(() => {
    setDraftText("");
    setSubmitHint("已清空语音草稿");
  }, []);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setIsCancelled(false);
    recReset();
    setIsTranscribing(false);
    setSubmitHint("已取消");
  }, [recReset]);

  const beginVoice = useCallback(() => {
    cancelledRef.current = false;
    setIsCancelled(false);
    setSubmitHint(null);
    recReset();
    recStart();
  }, [recReset, recStart]);

  const endVoice = useCallback(() => {
    if (isCancelled || cancelledRef.current) {
      handleCancel();
    } else {
      recStop();
    }
  }, [isCancelled, handleCancel, recStop]);

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const liveText = isTranscribing ? "正在转文字..." : isRecording ? `录音中 ${formatDuration(duration)}` : "";

  return (
    <>
      {/* ── Full-screen recording overlay ── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="voice-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex select-none flex-col items-center justify-between lg:hidden"
            style={{ touchAction: "none", WebkitTouchCallout: "none" }}
            onTouchMove={(e) => {
              const dy = touchStartY.current - e.touches[0].clientY;
              setIsCancelled(dy > 80);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#1a0a2e]/85 to-[#0d001a]/95 backdrop-blur-xl" />

            {/* top: real-time transcript */}
            <div className="relative z-10 mt-[max(4rem,env(safe-area-inset-top))] w-full px-8">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-[13px] font-medium leading-6 text-white/50"
              >
                {agent.displayName}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 min-h-[4rem] rounded-2xl border border-white/[0.06] bg-white/[0.04] px-5 py-4 backdrop-blur-sm"
              >
                <p className="text-center text-base leading-7 text-white/90">
                  {liveText}
                </p>
              </motion.div>
            </div>

            {/* center: animated orb & waveform */}
            <div className="relative z-10 flex flex-col items-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-purple-400/20"
                  animate={{
                    width: [80 + i * 40, 120 + i * 50],
                    height: [80 + i * 40, 120 + i * 50],
                    opacity: [0.5 - i * 0.12, 0],
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeOut",
                  }}
                  style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                />
              ))}
              <motion.div
                className="relative flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                  background: isCancelled
                    ? "radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0.1) 60%, transparent 80%)"
                    : "radial-gradient(circle, rgba(168,85,247,0.45) 0%, rgba(236,72,153,0.2) 50%, transparent 80%)",
                  boxShadow: isCancelled
                    ? "0 0 60px rgba(239,68,68,0.3), 0 0 120px rgba(239,68,68,0.1)"
                    : "0 0 60px rgba(168,85,247,0.35), 0 0 120px rgba(236,72,153,0.15)",
                }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg className="h-10 w-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a5 5 0 005-5V8a5 5 0 10-10 0v5a5 5 0 005 5zm0 0v3m-3 0h6" />
                </svg>
              </motion.div>
              <div className="mt-8 flex items-center gap-[5px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <VoiceWaveBar key={i} delay={i * 0.06} active={!isCancelled} />
                ))}
              </div>
            </div>

            {/* bottom */}
            <div className="relative z-10 mb-[max(3rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-4">
              <AnimatePresence mode="wait">
                {isCancelled ? (
                  <motion.div
                    key="cancel-hint"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 ring-2 ring-red-400/40">
                      <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-red-300">松开取消</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="send-hint"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <p className="text-sm font-medium tracking-wide text-white/70">松开 · 结束录入</p>
                    <p className="text-xs text-white/30">上滑取消</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB button ── */}
      <button
        type="button"
        onClick={openCoEdit}
        onMouseDown={beginVoice}
        onMouseUp={endVoice}
        onMouseLeave={() => {
          if (isRecording) endVoice();
        }}
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
          beginVoice();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          endVoice();
        }}
        onTouchCancel={() => {
          handleCancel();
        }}
        className={`fixed bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] left-1/2 z-[60] flex h-12 w-12 -translate-x-1/2 select-none items-center justify-center rounded-full ring-4 ring-paper transition-transform lg:hidden ${
          isActive
            ? "scale-105 bg-oxblood-500 text-paper"
            : "bg-ink text-paper active:scale-95"
        }`}
        style={{ touchAction: "none", WebkitTouchCallout: "none" }}
        aria-label={`长按语音调教 ${agent.displayName}`}
        title={`长按语音调教 ${agent.displayName}`}
      >
        {isTranscribing ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/25 border-t-current" />
        ) : (
          <svg className={`h-6 w-6 ${isActive ? "animate-pulse" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a5 5 0 005-5V8a5 5 0 10-10 0v5a5 5 0 005 5zm0 0v3m-3 0h6" />
          </svg>
        )}
      </button>

      {/* ── Draft panel / hint bubble (shown when NOT recording) ── */}
      {!isActive && draftText ? (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.9rem)] left-1/2 z-[60] w-[min(92vw,22rem)] -translate-x-1/2 border border-ink bg-paper-50 p-3 lg:hidden">
          <p className="font-serif text-[11px] uppercase tracking-[0.2em] text-ink-400">
            VOICE DRAFT · 语音草稿
          </p>
          <p className="mt-1.5 line-clamp-3 font-serif text-sm leading-snug text-ink">{draftText}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={openCoEdit}
              className="inline-flex flex-1 items-center justify-center bg-ink px-3 py-2 text-xs font-medium tracking-wide text-paper transition hover:bg-oxblood-500"
            >
              进入调教
            </button>
            <button
              type="button"
              onClick={clearDraft}
              className="inline-flex items-center justify-center border border-ink px-3 py-2 text-xs font-medium text-ink transition hover:bg-ink hover:text-paper"
            >
              清空
            </button>
          </div>
          <p className="mt-2 font-serif text-[10px] italic text-ink-400">
            可继续长按补充，或去访问别的 Agent — 草稿暂时保留。
          </p>
        </div>
      ) : !isActive && (submitHint || recError || helperText) ? (
        <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+5.9rem)] left-1/2 z-[60] -translate-x-1/2 lg:hidden">
          <div className="border border-hairline bg-paper-50 px-2.5 py-1 font-serif text-[10px] italic text-ink-500">
            {submitHint || recError || helperText}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, refetch } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [ownedLifeAgents, setOwnedLifeAgents] = useState<BoundLifeAgent[] | null>(null);

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }
    fetch("/api/life-agents/feedback/all", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const count =
          (Array.isArray((d as { recent?: unknown[] })?.recent) ? (d as { recent?: unknown[] }).recent!.length : 0) +
          (Array.isArray((d as { ratings?: { recent?: unknown[] } })?.ratings?.recent)
            ? (d as { ratings?: { recent?: unknown[] } }).ratings!.recent!.length
            : 0);
        setNotificationCount(count);
      })
      .catch(() => setNotificationCount(0));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setOwnedLifeAgents(null);
      return;
    }
    const controller = new AbortController();
    fetchBoundLifeAgents(controller.signal)
      .then((agents) => {
        setOwnedLifeAgents(agents);
      })
      .catch(() => {
        setOwnedLifeAgents([]);
      });
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (pathname === "/dashboard/notifications") {
      setNotificationCount(0);
    }
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    refetch();
    router.push("/");
    router.refresh();
  };

  const linkClass = (isActive: boolean) =>
    `py-3 px-3 text-sm font-medium transition-colors block w-full text-left ${
      isActive ? "text-oxblood-500 bg-paper-200" : "text-ink-500 hover:bg-paper-200"
    }`;

  const isLifeAgentChatPage = /^\/life-agents\/[^/]+\/chat(?:\/|$)/.test(pathname);
  const isLifeAgentDetailPage =
    /^\/life-agents\/[^/]+\/?$/.test(pathname) &&
    pathname !== "/life-agents/create" &&
    pathname !== "/life-agents/search";
  const isLifeAgentCreatePage = pathname === "/life-agents/create";
  const isLifeAgentSearchPage = pathname === "/life-agents/search";
  const isDashboardMessagesPage = pathname === "/dashboard/messages";
  const isDashboardNotificationsPage = pathname === "/dashboard/notifications";
  const isDashboardApiKeysPage = pathname === "/dashboard/api-keys";
  const isDashboardLifeAgentsListPage = pathname === "/dashboard/life-agents";
  const isDashboardLifeAgentFeedbackPage = /^\/dashboard\/life-agents\/[^/]+\/feedback\/?$/.test(pathname);
  const isDashboardLifeAgentCoEditPage = /^\/dashboard\/life-agents\/[^/]+\/co-edit\/?$/.test(pathname);
  const isLicensesPage = pathname === "/licenses";
  const isMapPage = pathname === "/map";
  const isSupportChatPage = pathname === "/support/chat";
  const hideGlobalTopNav =
    isLifeAgentCreatePage ||
    isLifeAgentSearchPage ||
    isDashboardMessagesPage ||
    isDashboardNotificationsPage ||
    isDashboardApiKeysPage ||
    isDashboardLifeAgentsListPage ||
    isDashboardLifeAgentCoEditPage ||
    isDashboardLifeAgentFeedbackPage ||
    isLicensesPage ||
    isMapPage ||
    isSupportChatPage;
  const useBackArrowOnMobileTop = isLifeAgentDetailPage || isLifeAgentCreatePage;
  const hideGlobalBottomNav =
    isLifeAgentChatPage || isLifeAgentDetailPage || isLifeAgentCreatePage || isDashboardLifeAgentCoEditPage;
  const isDiscoverEntryPage = pathname === "/" || pathname === "/life-agents";

  const feedTab = searchParams.get("tab");
  const isFeedDiscover = isDiscoverEntryPage && !feedTab;
  const isPostsCreatePage = pathname === "/posts/create";
  const isPostsPage = pathname === "/posts";
  const isFeedPurchased = isDiscoverEntryPage && feedTab === "purchased";
  const isDashboardHomePage = pathname === "/dashboard";
  const primaryOwnedLifeAgent = ownedLifeAgents?.[0] ?? null;
  const shouldShowCreateFab = !user || (ownedLifeAgents !== null && ownedLifeAgents.length === 0);
  const shouldShowLoadingFab = Boolean(user && ownedLifeAgents === null);

  const touchFeedPager = useMobileTouchNavEnabled() && isDiscoverEntryPage;
  const feedTabDiscRef = useRef<HTMLAnchorElement | null>(null);
  const feedTabPurRef = useRef<HTMLAnchorElement | null>(null);
  const [feedTabUnderlineX, setFeedTabUnderlineX] = useState<number | null>(null);

  const updateFeedUnderlineFromProgress = useCallback((progress: number) => {
    const disc = feedTabDiscRef.current;
    const pur = feedTabPurRef.current;
    if (!disc || !pur) return;
    const a = disc.offsetLeft + disc.offsetWidth / 2;
    const b = pur.offsetLeft + pur.offsetWidth / 2;
    const x = a + (b - a) * Math.min(1, Math.max(0, progress));
    setFeedTabUnderlineX(x);
  }, []);

  useEffect(() => {
    if (!touchFeedPager) {
      setFeedTabUnderlineX(null);
      return;
    }
    const onPager = (e: Event) => {
      const p = (e as CustomEvent<{ progress?: number }>).detail?.progress;
      if (typeof p !== "number") return;
      updateFeedUnderlineFromProgress(p);
    };
    window.addEventListener("la-feed-pager", onPager);
    return () => window.removeEventListener("la-feed-pager", onPager);
  }, [touchFeedPager, updateFeedUnderlineFromProgress]);

  useLayoutEffect(() => {
    if (!touchFeedPager) return;
    const idx = feedTab === "purchased" ? 1 : 0;
    updateFeedUnderlineFromProgress(idx);
  }, [touchFeedPager, feedTab, updateFeedUnderlineFromProgress]);

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileDrawerOpen]);

  const feedTabClass = (active: boolean) =>
    `relative px-2 py-1 font-serif text-[16px] transition-colors ${
      active ? "font-medium text-ink" : "font-normal italic text-ink-300"
    }`;

  const AuthLinks = ({ vertical = false }: { vertical?: boolean }) =>
    user ? (
      <motion.div
        key="logged-in"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className={`flex ${vertical ? "flex-col gap-0.5" : "items-center gap-1 lg:gap-2 xl:gap-3 shrink-0"}`}
      >
        <Link
          href="/dashboard"
          className={vertical ? linkClass(pathname === "/dashboard") : "inline-flex items-center gap-2 rounded-lg px-2 py-2 text-slate-600 transition-colors hover:text-purple-800"}
          title="个人主页"
        >
          {!vertical && <IconDashboard className="h-5 w-5 shrink-0" />}
          <motion.span
            className={`text-sm transition-colors ${vertical ? "text-slate-600 hover:text-purple-800" : "hidden xl:inline text-slate-600"}`}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
          >
            个人主页
          </motion.span>
        </Link>
        <Link
          href="/dashboard/account"
          className={
            vertical
              ? linkClass(pathname === "/dashboard/account")
              : "inline-flex items-center gap-2 rounded-lg px-2 py-2 text-slate-600 transition-colors hover:text-purple-800"
          }
          title="账号与安全"
        >
          <motion.span
            className={`text-sm transition-colors ${vertical ? "text-slate-600 hover:text-purple-800" : "hidden lg:inline text-slate-600"}`}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
          >
            账号
          </motion.span>
        </Link>
        {!vertical && (
          <span className="text-slate-500 text-sm hidden 2xl:inline truncate max-w-[120px]">
            {user.email}
          </span>
        )}
        {vertical && <span className="text-slate-500 text-xs px-3 py-1 truncate">{user.email}</span>}
        <motion.button
          onClick={logout}
          className={vertical ? `text-sm font-medium py-3 px-3 rounded-lg text-left text-rose-500 hover:bg-slate-50` : "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 text-sm text-slate-500 transition-colors hover:text-rose-500"}
          whileHover={{ scale: vertical ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="退出"
        >
          {!vertical && <IconLogout className="h-5 w-5 shrink-0" />}
          <span className={vertical ? "" : "hidden xl:inline"}>退出</span>
        </motion.button>
      </motion.div>
    ) : (
      <motion.div
        key="logged-out"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className={`flex ${vertical ? "flex-col gap-0.5" : "items-center gap-1 lg:gap-2 xl:gap-3 shrink-0"}`}
      >
        <Link
          href="/login"
          className={vertical ? linkClass(pathname === "/login") : "inline-flex items-center gap-2 rounded-lg px-2 py-2 text-slate-600 transition-colors hover:text-slate-900"}
          title="登录"
        >
          {!vertical && <IconLogin className="h-5 w-5 shrink-0" />}
          <motion.span
            className={`text-sm transition-colors ${vertical ? "text-slate-600 hover:text-slate-900" : "hidden xl:inline text-slate-600"}`}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
          >
            登录
          </motion.span>
        </Link>
        <Link
          href="/signup"
          className={vertical ? `py-3 px-3 rounded-lg btn-primary text-sm font-medium text-center` : "btn-primary inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm"}
          title="注册"
        >
          {!vertical && <IconSignup className="h-4 w-4 shrink-0" />}
          <motion.span
            className={vertical ? undefined : "inline-block"}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={vertical ? "" : "hidden xl:inline"}>注册</span>
          </motion.span>
        </Link>
      </motion.div>
    );

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-50 border-b border-hairline bg-paper/95 supports-[backdrop-filter]:backdrop-blur-md overflow-x-hidden pt-[env(safe-area-inset-top)] ${
          hideGlobalTopNav ? "hidden" : isLifeAgentChatPage ? "hidden lg:block" : ""
        }`}
      >
        <div className="container mx-auto max-w-7xl px-3 sm:px-4">
          {/* 手机：小红书式顶栏；聊天页与搜索页由页面内自建顶栏，避免重复 */}
          {!isLifeAgentChatPage && !isLifeAgentSearchPage && (
            <div className="flex items-center gap-1 py-2.5 lg:hidden">
              <button
                type="button"
                onClick={() => {
                  if (useBackArrowOnMobileTop) {
                    if (window.history.length > 1) router.back();
                    else router.push("/life-agents");
                    return;
                  }
                  setMobileDrawerOpen(true);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center text-ink transition active:opacity-50"
                aria-label={useBackArrowOnMobileTop ? "返回" : "打开菜单"}
                aria-expanded={mobileDrawerOpen}
              >
                {useBackArrowOnMobileTop ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <div className="relative flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-4">
                {touchFeedPager && feedTabUnderlineX !== null ? (
                  <span
                    className="pointer-events-none absolute bottom-0 h-[1px] w-6 bg-ink transition-[left] duration-75 ease-out sm:w-7"
                    style={{ left: feedTabUnderlineX, transform: "translateX(-50%)" }}
                    aria-hidden
                  />
                ) : null}
                <Link
                  href="/posts"
                  className={`relative ${feedTabClass(isPostsPage)}`}
                >
                  动态
                  {isPostsPage ? (
                    <span className="absolute bottom-0 left-1 right-1 h-[1px] bg-ink" aria-hidden />
                  ) : null}
                </Link>
                <Link ref={feedTabDiscRef} href="/life-agents" className={`relative ${feedTabClass(isFeedDiscover)}`} scroll={false}>
                  发现
                  {!touchFeedPager && isFeedDiscover ? (
                    <span className="absolute bottom-0 left-1 right-1 h-[1px] bg-ink" aria-hidden />
                  ) : null}
                </Link>
                <Link
                  ref={feedTabPurRef}
                  href="/life-agents?tab=purchased"
                  className={`relative ${feedTabClass(isFeedPurchased)}`}
                  scroll={false}
                >
                  已购买
                  {!touchFeedPager && isFeedPurchased ? (
                    <span className="absolute bottom-0 left-1 right-1 h-[1px] bg-ink" aria-hidden />
                  ) : null}
                </Link>
              </div>
              <Link
                href={isDashboardHomePage ? "/dashboard/notifications" : "/life-agents/search"}
                className="flex h-10 w-10 shrink-0 items-center justify-center text-ink transition active:opacity-50"
                title={isDashboardHomePage ? "提醒" : "搜索"}
                aria-label={isDashboardHomePage ? "提醒" : "搜索"}
              >
                {isDashboardHomePage ? (
                  <span className="relative inline-flex">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {notificationCount > 0 ? (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[16px] items-center justify-center bg-oxblood-500 px-1 font-serif text-[10px] font-medium leading-[16px] text-paper">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <IconSearch className="h-5 w-5 stroke-[1.75]" />
                )}
              </Link>
            </div>
          )}

          {/* 电脑端顶栏 */}
          <div className="hidden min-h-[52px] items-center justify-between lg:flex sm:h-16">
          <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2" title="BrightAgent">
            <Image
              src="/bright-agent-icon.png"
              alt="BrightAgent"
              width={36}
              height={36}
              className="h-7 w-7 shrink-0 rounded-lg object-contain sm:h-9 sm:w-9"
            />
            <span className="hidden truncate whitespace-nowrap bg-gradient-to-r from-[#BA68C8] via-[#FF80AB] to-[#7c3aed] bg-clip-text text-base font-bold text-transparent md:inline xl:inline 2xl:text-xl">
              BrightAgent
            </span>
            <span className="hidden truncate whitespace-nowrap text-sm text-slate-500 transition-colors group-hover:text-purple-700 2xl:inline">
              本地经验 · 对话咨询 · Agent as Service
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 xl:gap-2 2xl:gap-4">
            {navLinks.map((link) => {
              const Icon = link.Icon;
              const active = link.href === "/life-agents" ? isDiscoverEntryPage : pathname === link.href;
              return (
                <Link key={link.href} href={link.href} title={link.label}>
                  <motion.span
                    className={`relative flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? "text-purple-800"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative inline-flex">
                      <Icon className="w-5 h-5 shrink-0" />
                    </span>
                    <span className="hidden xl:inline">{link.label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute left-2 right-2 bottom-1 h-0.5 rounded-full bg-gradient-to-r from-[#FF80AB]/80 to-[#BA68C8]/90"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </motion.span>
                </Link>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1 xl:gap-2 2xl:gap-4">
            <AnimatePresence mode="wait">{AuthLinks({})}</AnimatePresence>
          </div>
          </div>
        </div>
      </motion.nav>

      {/* 手机+平板：底部导航栏；Agent 详情/聊天页有专用操作栏时隐藏 */}
      <AnimatePresence>
        {mobileDrawerOpen && !isLifeAgentChatPage ? (
          <>
            <motion.button
              key="nav-drawer-backdrop"
              type="button"
              aria-label="关闭菜单"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[190] bg-black/35 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <motion.aside
              key="nav-drawer-panel"
              initial={{ x: "-105%" }}
              animate={{ x: 0 }}
              exit={{ x: "-105%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed left-0 top-0 z-[191] flex h-[100dvh] w-[min(100vw,18.5rem)] flex-col border-r border-hairline bg-paper-50 lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <span className="font-serif text-base italic text-ink">菜单</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 text-ink-400 transition hover:text-ink"
                  aria-label="关闭"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Link
                  href="/life-agents/create"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mb-1 flex items-center gap-3 border-b border-hairline px-3 py-3 font-serif text-[15px] text-ink transition hover:text-oxblood-500"
                >
                  <svg className="h-5 w-5 text-oxblood-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  创建人生 Agent
                </Link>
                <Link
                  href="/dashboard/life-agents"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 border-b border-hairline px-3 py-3 font-serif text-[15px] text-ink transition hover:text-oxblood-500"
                >
                  <IconAgent className="h-5 w-5 text-ink-400" />
                  我创建的
                </Link>
                <Link
                  href="/dashboard/messages"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 border-b border-hairline px-3 py-3 font-serif text-[15px] text-ink transition hover:text-oxblood-500"
                >
                  <IconMessages className="h-5 w-5 text-ink-400" />
                  消息
                </Link>
                <Link
                  href="/map"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 border-b border-hairline px-3 py-3 font-serif text-[15px] text-ink transition hover:text-oxblood-500"
                >
                  <IconMap className="h-5 w-5 text-ink-400" />
                  地图
                </Link>
                <Link
                  href="/licenses"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 border-b border-hairline px-3 py-3 font-serif text-[15px] text-ink transition hover:text-oxblood-500"
                >
                  <svg className="h-5 w-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  已购咨询
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-3 border-b border-hairline px-3 py-3 font-serif text-[15px] text-ink transition hover:text-oxblood-500"
                    >
                      <IconDashboard className="h-5 w-5 text-ink-400" />
                      我的
                    </Link>
                    <Link
                      href="/dashboard/account"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-3 border-b border-hairline px-3 py-3 font-serif text-[15px] text-ink transition hover:text-oxblood-500"
                    >
                      <svg className="h-5 w-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      账号与安全
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        void logout();
                      }}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left font-serif text-[15px] italic text-oxblood-500 transition hover:text-oxblood-700"
                    >
                      <IconLogout className="h-5 w-5" />
                      退出登录
                    </button>
                  </>
                ) : (
                  <div className="mt-2 space-y-2 border-t border-hairline pt-4">
                    <Link
                      href="/login"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm"
                    >
                      <IconLogin className="h-4 w-4" />
                      登录
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
                    >
                      注册
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {!hideGlobalBottomNav && (
        <>
          {/* 中间 FAB 与第 3 列空白对齐：发现 | 消息 | （+） | 地图 | 我的 */}
          {primaryOwnedLifeAgent ? (
            <FloatingVoiceCoachFab agent={primaryOwnedLifeAgent} />
          ) : shouldShowCreateFab ? (
            <Link
              href="/life-agents/create"
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] left-1/2 z-[60] flex h-12 w-12 -translate-x-1/2 lg:hidden items-center justify-center rounded-full bg-ink ring-4 ring-paper transition-transform active:scale-95"
              aria-label="创建人生 Agent"
            >
              <svg className="h-6 w-6 text-paper" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          ) : shouldShowLoadingFab ? (
            <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] left-1/2 z-[60] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-paper-50 text-ink ring-4 ring-paper lg:hidden">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/25 border-t-current" />
            </div>
          ) : null}

          <div className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-end justify-around border-t border-hairline bg-paper/95 supports-[backdrop-filter]:backdrop-blur-md pb-[env(safe-area-inset-bottom)] pt-2">
            {(() => {
              const [lifeAgentsLink, messagesLink, licenseLink] = navLinks;
              const renderTab = (
                link: (typeof navLinks)[number]
              ) => {
                const Icon = link.Icon;
                const active = link.href === "/life-agents" ? isDiscoverEntryPage : pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-2 transition-colors ${
                      active ? "text-ink" : "text-ink-300"
                    }`}
                  >
                    {active ? (
                      <span className="absolute inset-x-[22%] top-0 h-[1px] bg-ink" aria-hidden />
                    ) : null}
                    <span className="relative inline-flex">
                      <Icon className={`h-[22px] w-[22px] shrink-0 ${active ? "stroke-[1.8]" : "stroke-[1.4]"}`} />
                    </span>
                    <span className="w-full truncate text-center font-serif text-[11px]">{link.label}</span>
                  </Link>
                );
              };
              return (
                <>
                  {renderTab(lifeAgentsLink)}
                  {renderTab(messagesLink)}
                  <div className="min-h-[52px] min-w-0 flex-1 px-2 py-2" aria-hidden />
                  {renderTab(licenseLink)}
                </>
              );
            })()}

            {user ? (
              <Link
                href="/dashboard"
                className={`relative flex flex-col items-center gap-1 px-3 py-2 min-w-0 flex-1 transition-colors ${
                  pathname === "/dashboard" ? "text-ink" : "text-ink-300"
                }`}
              >
                {pathname === "/dashboard" ? (
                  <span className="absolute inset-x-[22%] top-0 h-[1px] bg-ink" aria-hidden />
                ) : null}
                <IconDashboard className={`h-[22px] w-[22px] shrink-0 ${pathname === "/dashboard" ? "stroke-[1.8]" : "stroke-[1.4]"}`} />
                <span className="font-serif text-[11px]">我的</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`relative flex flex-col items-center gap-1 px-3 py-2 min-w-0 flex-1 transition-colors ${
                  pathname === "/login" ? "text-ink" : "text-ink-300"
                }`}
              >
                {pathname === "/login" ? (
                  <span className="absolute inset-x-[22%] top-0 h-[1px] bg-ink" aria-hidden />
                ) : null}
                <IconLogin className={`h-[22px] w-[22px] shrink-0 ${pathname === "/login" ? "stroke-[1.8]" : "stroke-[1.4]"}`} />
                <span className="font-serif text-[11px]">登录</span>
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}
