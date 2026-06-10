"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageCircle,
  Mic,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBoundLifeAgents, LIFE_AGENT_OWNED_CHANGE_EVENT, type BoundLifeAgent } from "@/lib/bound-life-agents";
import { useMobileTouchNavEnabled } from "@/hooks/use-life-agents-feed-gestures";
import { lifeAgentShowsPurchaseUi } from "@/lib/life-agent-commerce";
import {
  fetchAgentNotificationUnreadCount,
  readUnreadCount,
} from "@/lib/notifications-read";
import {
  MIN_VOICE_BLOB_BYTES,
  pickRecorderMimeType,
  useMediaRecorder,
  voiceFilenameForBlob,
} from "@/lib/voice";

const IconAgent = Sparkles;
const IconMessages = MessageCircle;
const IconDashboard = LayoutDashboard;
const IconLogin = LogIn;
const IconLogout = LogOut;
const IconSignup = UserPlus;
const IconSearch = Search;
const IconMap = MapIcon;

const navLinks = [
  { href: "/life-agents", label: "发现", Icon: IconAgent },
  { href: "/dashboard/messages", label: "消息", Icon: IconMessages },
  { href: "/map", label: "地图", Icon: IconMap },
];

const CO_EDIT_PENDING_VOICE_STORAGE_PREFIX = "life-agent-co-edit-pending-voice:";
/** 上滑超过该距离即进入「松开取消」状态（px） */
const VOICE_CANCEL_SWIPE_PX = 36;

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
      className="w-[3px] rounded-full bg-paper/90"
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

  const onCancelTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0) return;
    const dy = touchStartY.current - e.touches[0].clientY;
    const cancelled = dy > VOICE_CANCEL_SWIPE_PX;
    cancelledRef.current = cancelled;
    setIsCancelled(cancelled);
  }, []);

  const attachCancelTracking = useCallback(() => {
    document.addEventListener("touchmove", onCancelTouchMove, { passive: true });
  }, [onCancelTouchMove]);

  const detachCancelTracking = useCallback(() => {
    document.removeEventListener("touchmove", onCancelTouchMove);
  }, [onCancelTouchMove]);
  const { status: recStatus, error: recError, duration, start: recStart, stop: recStop, reset: recReset } =
    useMediaRecorder({
      mimeType: pickRecorderMimeType(),
      onDataAvailable: async (blob) => {
        if (cancelledRef.current) return;
        if (blob.size < MIN_VOICE_BLOB_BYTES) {
          setSubmitHint("说话时间太短，请长按至少一秒");
          return;
        }
        setIsTranscribing(true);
        setSubmitHint("正在识别...");
        try {
          const fd = new FormData();
          fd.append("audio", blob, voiceFilenameForBlob(blob));
          fd.append("language", "zh");
          const res = await fetch("/api/transcribe", { method: "POST", body: fd, credentials: "include" });
          const data = await res.json();
          if (!res.ok) {
            setSubmitHint(
              data.error === "recording too short"
                ? "说话时间太短，请长按至少一秒"
                : data.error === "speech-to-text not configured"
                  ? "语音转写未配置"
                  : "语音识别失败，请重试",
            );
            return;
          }
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

  useEffect(() => () => detachCancelTracking(), [detachCancelTracking]);

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
    try {
      const trimmed = draftText.trim();
      if (trimmed) {
        sessionStorage.setItem(pendingVoicePromptKey(agent.id), trimmed);
      } else {
        sessionStorage.removeItem(pendingVoicePromptKey(agent.id));
      }
    } catch {
      // ignore storage errors
    }
    router.push(`/dashboard/life-agents/${agent.id}/co-edit`);
  }, [agent.id, draftText, router]);

  const clearDraft = useCallback(() => {
    setDraftText("");
    setSubmitHint("已清空语音草稿");
  }, []);

  const handleCancel = useCallback(() => {
    detachCancelTracking();
    cancelledRef.current = true;
    setIsCancelled(false);
    recReset();
    setIsTranscribing(false);
    setSubmitHint("已取消");
  }, [detachCancelTracking, recReset]);

  const beginVoice = useCallback(() => {
    cancelledRef.current = false;
    setIsCancelled(false);
    setSubmitHint(null);
    recReset();
    recStart();
  }, [recReset, recStart]);

  const endVoice = useCallback(() => {
    detachCancelTracking();
    if (isCancelled || cancelledRef.current) {
      handleCancel();
    } else {
      recStop();
    }
  }, [detachCancelTracking, isCancelled, handleCancel, recStop]);

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
          >
            <div className="absolute inset-0 bg-gradient-to-b from-ink/90 to-oxblood-deep/95" />

            {/* top: real-time transcript */}
            <div className="relative z-10 mt-[max(4rem,env(safe-area-inset-top))] w-full px-8">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-[13px] font-medium leading-6 text-paper/50"
              >
                {agent.displayName}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 min-h-[4rem] rounded border border-hairline/30 bg-paper/5 px-5 py-4"
              >
                <p className="text-center text-base leading-7 text-paper/90">
                  {liveText}
                </p>
              </motion.div>
            </div>

            {/* center: animated orb & waveform */}
            <div className="relative z-10 flex flex-col items-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-oxblood-400/20"
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
                    ? "radial-gradient(circle, rgba(122,31,31,0.35) 0%, rgba(122,31,31,0.1) 60%, transparent 80%)"
                    : "radial-gradient(circle, rgba(122,31,31,0.5) 0%, rgba(122,31,31,0.12) 60%, transparent 80%)",
                  boxShadow: isCancelled
                    ? "0 0 48px rgba(122,31,31,0.2), 0 0 96px rgba(122,31,31,0.08)"
                    : "0 0 48px rgba(122,31,31,0.25), 0 0 96px rgba(122,31,31,0.1)",
                }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg className="h-10 w-10 text-paper drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
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
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-oxblood-500/20 ring-2 ring-oxblood-400/40">
                      <svg className="h-6 w-6 text-oxblood-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-oxblood-200">松开取消</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="send-hint"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <p className="text-sm font-medium tracking-wide text-paper/70">松开 · 结束录入</p>
                    <p className="text-xs text-paper/30">上滑取消</p>
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
          attachCancelTracking();
          beginVoice();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          endVoice();
        }}
        onTouchCancel={() => {
          handleCancel();
        }}
        className={`fixed bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] left-1/2 z-[60] flex h-12 w-12 -translate-x-1/2 select-none items-center justify-center rounded-lg shadow-[0_16px_36px_rgba(17,21,19,0.22)] ring-4 ring-paper transition-transform lg:hidden ${
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
          <Mic className={`h-6 w-6 ${isActive ? "animate-pulse" : ""}`} aria-hidden />
        )}
      </button>

      {/* ── Draft panel / hint bubble (shown when NOT recording) ── */}
      {!isActive && draftText ? (
        <div className="app-panel fixed bottom-[calc(env(safe-area-inset-bottom)+5.9rem)] left-1/2 z-[60] w-[min(92vw,22rem)] -translate-x-1/2 p-3 lg:hidden">
          <p className="text-[11px] font-semibold text-ink-400">
            VOICE DRAFT · 语音草稿
          </p>
          <label className="mt-1.5 block text-[10px] font-medium text-ink-400" htmlFor={`voice-draft-${agent.id}`}>
            可直接修改识别结果
          </label>
          <textarea
            id={`voice-draft-${agent.id}`}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={3}
            className="input-shell mt-1 min-h-20 resize-none text-sm leading-snug"
            placeholder="语音识别内容…"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={openCoEdit}
              className="btn-primary min-h-9 flex-1 px-3 py-2 text-xs"
            >
              进入调教
            </button>
            <button
              type="button"
              onClick={clearDraft}
              className="btn-secondary min-h-9 px-3 py-2 text-xs"
            >
              清空
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-ink-400">
            可在此修改文字、继续长按补充，或点「进入调教」发送。
          </p>
        </div>
      ) : !isActive && (submitHint || recError) ? (
        <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+5.9rem)] left-1/2 z-[60] -translate-x-1/2 lg:hidden">
          <div className="app-panel px-2.5 py-1 text-[10px] font-medium text-ink-500">
            {submitHint || recError}
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
    let cancelled = false;
    const applyCount = (data: unknown) => {
      if (cancelled) return;
      setNotificationCount(readUnreadCount(data as Parameters<typeof readUnreadCount>[0]));
    };
    fetch("/api/life-agents/feedback/all", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(applyCount)
      .catch(() => {
        if (!cancelled) setNotificationCount(0);
      });
    const onSeen = () => {
      setNotificationCount(0);
    };
    const refetchCount = () => {
      fetchAgentNotificationUnreadCount()
        .then((count) => {
          if (!cancelled) setNotificationCount(count);
        })
        .catch(() => {});
    };
    window.addEventListener("notifications-seen", onSeen);
    window.addEventListener("focus", refetchCount);
    return () => {
      cancelled = true;
      window.removeEventListener("notifications-seen", onSeen);
      window.removeEventListener("focus", refetchCount);
    };
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
  }, [user, pathname]);

  useEffect(() => {
    if (!user) return;
    const refreshOwned = () => {
      fetchBoundLifeAgents()
        .then((agents) => {
          setOwnedLifeAgents(agents);
        })
        .catch(() => {
          setOwnedLifeAgents([]);
        });
    };
    window.addEventListener(LIFE_AGENT_OWNED_CHANGE_EVENT, refreshOwned);
    return () => window.removeEventListener(LIFE_AGENT_OWNED_CHANGE_EVENT, refreshOwned);
  }, [user]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    refetch();
    router.push("/");
    router.refresh();
  };

  const linkClass = (isActive: boolean) =>
    `block w-full rounded-md px-3 py-3 text-left text-sm font-semibold transition-colors ${
      isActive ? "bg-ink text-paper" : "text-ink-500 hover:bg-paper-200 hover:text-ink"
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
  const isDashboardLifeAgentTopicsPage = /^\/dashboard\/life-agents\/[^/]+\/topics\/?$/.test(pathname);
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
  const topicSearchQuery = searchParams.get("q") ?? "";
  const [topicSearchDraft, setTopicSearchDraft] = useState("");
  const topicSearchComposingRef = useRef(false);

  const commitTopicSearchQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!isDashboardLifeAgentTopicsPage) {
      topicSearchComposingRef.current = false;
      setTopicSearchDraft("");
      return;
    }
    if (!topicSearchComposingRef.current) {
      setTopicSearchDraft(topicSearchQuery);
    }
  }, [isDashboardLifeAgentTopicsPage, topicSearchQuery]);

  const primaryOwnedLifeAgent = ownedLifeAgents?.[0] ?? null;
  const shouldShowCreateFab = !user || (ownedLifeAgents !== null && ownedLifeAgents.length === 0);
  const shouldShowLoadingFab = Boolean(user && ownedLifeAgents === null);

  const touchFeedPager = useMobileTouchNavEnabled() && isDiscoverEntryPage;
  const showFeedPurchasedTab = lifeAgentShowsPurchaseUi();
  const feedTabDiscRef = useRef<HTMLAnchorElement | null>(null);
  const feedTabPurRef = useRef<HTMLAnchorElement | null>(null);
  const [feedTabUnderlineX, setFeedTabUnderlineX] = useState<number | null>(null);

  const updateFeedUnderlineFromProgress = useCallback((progress: number) => {
    const disc = feedTabDiscRef.current;
    if (!disc) return;
    if (!showFeedPurchasedTab) {
      setFeedTabUnderlineX(disc.offsetLeft + disc.offsetWidth / 2);
      return;
    }
    const pur = feedTabPurRef.current;
    if (!pur) return;
    const a = disc.offsetLeft + disc.offsetWidth / 2;
    const b = pur.offsetLeft + pur.offsetWidth / 2;
    const x = a + (b - a) * Math.min(1, Math.max(0, progress));
    setFeedTabUnderlineX(x);
  }, [showFeedPurchasedTab]);

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
    `relative px-2.5 py-1.5 text-[15px] transition-colors ${
      active ? "font-semibold text-ink" : "font-medium text-ink-300"
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
          className={vertical ? linkClass(pathname === "/dashboard") : "inline-flex items-center gap-2 rounded-md px-2 py-2 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink"}
          title="个人主页"
        >
          {!vertical && <IconDashboard className="h-5 w-5 shrink-0" />}
          <motion.span
            className={`text-sm transition-colors ${vertical ? "text-ink-500 hover:text-ink" : "hidden xl:inline text-ink-500"}`}
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
              : "inline-flex items-center gap-2 rounded-md px-2 py-2 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink"
          }
          title="账号与安全"
        >
          <motion.span
            className={`text-sm transition-colors ${vertical ? "text-ink-500 hover:text-ink" : "hidden lg:inline text-ink-500"}`}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
          >
            账号
          </motion.span>
        </Link>
        {!vertical && (
          <span className="text-ink-400 text-sm hidden 2xl:inline truncate max-w-[120px]">
            {user.email}
          </span>
        )}
        {vertical && <span className="text-ink-400 text-xs px-3 py-1 truncate">{user.email}</span>}
        <motion.button
          onClick={logout}
          className={vertical ? `rounded-md px-3 py-3 text-left text-sm font-semibold text-ink-500 hover:bg-paper-200 hover:text-ink` : "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-2 text-sm text-ink-400 transition-colors hover:bg-paper-200 hover:text-ink"}
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
          className={vertical ? linkClass(pathname === "/login") : "inline-flex items-center gap-2 rounded-md px-2 py-2 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink"}
          title="登录"
        >
          {!vertical && <IconLogin className="h-5 w-5 shrink-0" />}
          <motion.span
            className={`text-sm transition-colors ${vertical ? "text-ink-500 hover:text-ink" : "hidden xl:inline text-ink-500"}`}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
          >
            登录
          </motion.span>
        </Link>
        <Link
          href="/signup"
          className={vertical ? `btn-primary px-3 py-3 text-center text-sm font-semibold` : "btn-primary inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm"}
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
        className={`sticky top-0 z-50 overflow-x-hidden border-b border-ink/10 bg-white/90 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_rgba(255,255,255,0.72)] supports-[backdrop-filter]:backdrop-blur-xl ${
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
                className="icon-button h-10 w-10 shrink-0"
                aria-label={useBackArrowOnMobileTop ? "返回" : "打开菜单"}
                aria-expanded={mobileDrawerOpen}
              >
                {useBackArrowOnMobileTop ? (
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden />
                )}
              </button>
              <div className="relative flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-4">
                {touchFeedPager && feedTabUnderlineX !== null ? (
                  <span
                    className="pointer-events-none absolute bottom-0 h-[2px] w-6 rounded-full bg-signal-500 transition-[left] duration-75 ease-out sm:w-7"
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
                    <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-signal-500" aria-hidden />
                  ) : null}
                </Link>
                <Link ref={feedTabDiscRef} href="/life-agents" className={`relative ${feedTabClass(isFeedDiscover)}`} scroll={false}>
                  发现
                  {!touchFeedPager && isFeedDiscover ? (
                    <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-signal-500" aria-hidden />
                  ) : null}
                </Link>
                {showFeedPurchasedTab ? (
                <Link
                  ref={feedTabPurRef}
                  href="/life-agents?tab=purchased"
                  className={`relative ${feedTabClass(isFeedPurchased)}`}
                  scroll={false}
                >
                  已购买
                  {!touchFeedPager && isFeedPurchased ? (
                    <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-signal-500" aria-hidden />
                  ) : null}
                </Link>
                ) : null}
              </div>
              {isDashboardLifeAgentTopicsPage ? (
                <label className="flex h-10 w-[7.25rem] shrink-0 items-center sm:w-40">
                  <span className="sr-only">搜索 Topic</span>
                  <input
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    value={topicSearchDraft}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTopicSearchDraft(value);
                      if (!topicSearchComposingRef.current) {
                        commitTopicSearchQuery(value);
                      }
                    }}
                    onCompositionStart={() => {
                      topicSearchComposingRef.current = true;
                    }}
                    onCompositionEnd={(e) => {
                      topicSearchComposingRef.current = false;
                      const value = e.currentTarget.value;
                      setTopicSearchDraft(value);
                      commitTopicSearchQuery(value);
                    }}
                    placeholder="搜索 Topic…"
                    className="h-9 w-full min-w-0 rounded-md border border-ink/10 bg-white/70 px-3 text-sm text-ink outline-none placeholder:text-ink-300 focus:border-ink focus:bg-white"
                  />
                </label>
              ) : (
              <Link
                href={isDashboardHomePage ? "/dashboard/notifications" : "/life-agents/search"}
                className="icon-button h-10 w-10 shrink-0"
                title={isDashboardHomePage ? "提醒" : "搜索"}
                aria-label={isDashboardHomePage ? "提醒" : "搜索"}
              >
                {isDashboardHomePage ? (
                  <span className="relative inline-flex">
                    <Bell className="h-5 w-5" aria-hidden />
                    {notificationCount > 0 ? (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-signal-500 px-1 text-[10px] font-semibold leading-[16px] text-ink-900">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <IconSearch className="h-5 w-5 stroke-[1.75]" />
                )}
              </Link>
              )}
            </div>
          )}

          {/* 电脑端顶栏 */}
          <div className="hidden min-h-[56px] items-center justify-between lg:flex sm:h-16">
          <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2" title="BrightAgent">
            <Image
              src="/bright-agent-icon.png?v=2"
              alt="BrightAgent"
              width={36}
              height={36}
              className="h-7 w-7 shrink-0 rounded-md object-contain sm:h-9 sm:w-9"
              unoptimized
            />
            <span className="hidden truncate whitespace-nowrap text-base font-bold text-ink md:inline xl:inline 2xl:text-xl">
              BrightAgent
            </span>
            <span className="hidden truncate whitespace-nowrap text-sm text-ink-400 transition-colors group-hover:text-ink 2xl:inline">
              真实经历咨询
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 xl:gap-2 2xl:gap-4">
            {navLinks.map((link) => {
              const Icon = link.Icon;
              const active = link.href === "/life-agents" ? isDiscoverEntryPage : pathname === link.href;
              return (
                <Link key={link.href} href={link.href} title={link.label}>
                  <motion.span
                    className={`relative flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-semibold transition-colors xl:gap-2 xl:px-3 ${
                      active
                        ? "bg-ink text-paper"
                        : "text-ink-500 hover:bg-paper-200 hover:text-ink"
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
                        className="absolute inset-x-2 bottom-1 h-px bg-paper/80"
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
              className="fixed inset-0 z-[190] bg-ink/35 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <motion.aside
              key="nav-drawer-panel"
              initial={{ x: "-105%" }}
              animate={{ x: 0 }}
              exit={{ x: "-105%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed left-0 top-0 z-[191] flex h-[100dvh] w-[min(100vw,19rem)] flex-col border-r border-ink/10 bg-white/95 shadow-[18px_0_60px_rgba(17,21,19,0.16)] supports-[backdrop-filter]:backdrop-blur-xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <span className="text-base font-semibold text-ink">菜单</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="icon-button h-9 w-9 text-ink-400 hover:text-ink"
                  aria-label="关闭"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Link
                  href="/life-agents/create"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mb-1 flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-semibold text-ink transition hover:bg-paper-200"
                >
                  <Plus className="h-5 w-5 text-ink" aria-hidden />
                  创建人生 Agent
                </Link>
                <Link
                  href="/dashboard/life-agents"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-semibold text-ink transition hover:bg-paper-200"
                >
                  <IconAgent className="h-5 w-5 text-ink-400" />
                  我创建的
                </Link>
                <Link
                  href="/dashboard/messages"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-semibold text-ink transition hover:bg-paper-200"
                >
                  <IconMessages className="h-5 w-5 text-ink-400" />
                  消息
                </Link>
                <Link
                  href="/map"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-semibold text-ink transition hover:bg-paper-200"
                >
                  <IconMap className="h-5 w-5 text-ink-400" />
                  地图
                </Link>
                {showFeedPurchasedTab ? (
                <Link
                  href="/licenses"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-semibold text-ink transition hover:bg-paper-200"
                >
                  <ShieldCheck className="h-5 w-5 text-ink-400" aria-hidden />
                  已购咨询
                </Link>
                ) : null}
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-semibold text-ink transition hover:bg-paper-200"
                    >
                      <IconDashboard className="h-5 w-5 text-ink-400" />
                      我的
                    </Link>
                    <Link
                      href="/dashboard/account"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-semibold text-ink transition hover:bg-paper-200"
                    >
                      <UserRound className="h-5 w-5 text-ink-400" aria-hidden />
                      账号与安全
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        void logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-[15px] font-semibold text-ink-500 transition hover:bg-paper-200 hover:text-ink"
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
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] left-1/2 z-[60] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-lg bg-ink text-paper shadow-[0_16px_36px_rgba(28,26,22,0.22)] ring-4 ring-paper transition-transform active:scale-95 lg:hidden"
              aria-label="创建人生 Agent"
            >
              <Plus className="h-6 w-6" aria-hidden />
            </Link>
          ) : shouldShowLoadingFab ? (
            <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] left-1/2 z-[60] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-lg bg-white text-ink shadow-[0_16px_36px_rgba(28,26,22,0.14)] ring-4 ring-paper lg:hidden">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/25 border-t-current" />
            </div>
          ) : null}

          <div className="fixed bottom-0 left-0 right-0 z-50 box-border flex items-end justify-around border-t border-ink/10 bg-white/90 pt-2 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-12px_36px_rgba(17,21,19,0.08)] supports-[backdrop-filter]:backdrop-blur-xl lg:hidden">
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
                    className={`pressable relative flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-2 transition-colors ${
                      active ? "text-ink" : "text-ink-300"
                    }`}
                  >
                    {active ? (
                      <span className="absolute inset-x-[22%] top-0 h-[1px] bg-ink" aria-hidden />
                    ) : null}
                    <span className="relative inline-flex">
                      <Icon className={`h-[22px] w-[22px] shrink-0 ${active ? "stroke-[1.8]" : "stroke-[1.4]"}`} />
                    </span>
                    <span className="w-full truncate text-center text-[11px] font-medium">{link.label}</span>
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
                className={`pressable relative flex flex-col items-center gap-1 px-3 py-2 min-w-0 flex-1 transition-colors ${
                  pathname === "/dashboard" ? "text-ink" : "text-ink-300"
                }`}
              >
                {pathname === "/dashboard" ? (
                  <span className="absolute inset-x-[22%] top-0 h-[1px] bg-ink" aria-hidden />
                ) : null}
                <IconDashboard className={`h-[22px] w-[22px] shrink-0 ${pathname === "/dashboard" ? "stroke-[1.8]" : "stroke-[1.4]"}`} />
                <span className="text-[11px] font-medium">我的</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`pressable relative flex flex-col items-center gap-1 px-3 py-2 min-w-0 flex-1 transition-colors ${
                  pathname === "/login" ? "text-ink" : "text-ink-300"
                }`}
              >
                {pathname === "/login" ? (
                  <span className="absolute inset-x-[22%] top-0 h-[1px] bg-ink" aria-hidden />
                ) : null}
                <IconLogin className={`h-[22px] w-[22px] shrink-0 ${pathname === "/login" ? "stroke-[1.8]" : "stroke-[1.4]"}`} />
                <span className="text-[11px] font-medium">登录</span>
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}
