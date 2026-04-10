"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { cleanLifeAgentIntroMultiline, cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { AnimatePresence, motion } from "framer-motion";
import { VoiceMessageBubble, VoiceReplyToggle } from "@/components/voice";
import { LifeAgentMessageComposer } from "@/components/LifeAgentMessageComposer";
import { useAuth } from "@/contexts/AuthContext";
import { resolveLifeAgentCoverDisplayUrl } from "@/lib/life-agent-covers";
import { useEdgeSwipeBack } from "@/hooks/use-edge-swipe-back";
import { useMobileTouchNavEnabled } from "@/hooks/use-life-agents-feed-gestures";

type Profile = {
  id: string;
  displayName: string;
  headline: string;
  welcomeMessage: string;
  sampleQuestions?: string[];
  hasVoiceClone?: boolean;
  coverUrl?: string;
  coverImageUrl?: string;
  coverPresetKey?: string;
  viewerState: {
    isLoggedIn: boolean;
    remainingQuestions: number;
    rating?: {
      usedQuestions: number;
      eligible: boolean;
      nextMilestone: number;
      currentMilestone: number;
      lastRatedMilestone: number;
      currentScore?: number | null;
      currentComment?: string;
    } | null;
  };
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  messageId?: string;
  sessionId?: string;
  audioUrl?: string;
  audioDurationSec?: number;
  references?: Array<{
    id: string;
    sourceType?: string;
    factKey?: string;
    category: string;
    title: string;
    excerpt: string;
    confidence?: string;
  }>;
};

type SessionSummary = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

function buildWelcomeMessage(welcomeMessage: string): ChatMessage {
  return {
    role: "assistant",
    content: welcomeMessage,
  };
}

function trimSessionTitle(title: string) {
  return title.length > 18 ? `${title.slice(0, 18)}...` : title;
}

export default function LifeAgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const id = params.id as string;
  const touchNavEnabled = useMobileTouchNavEnabled();
  useEdgeSwipeBack(touchNavEnabled);
  const initialRequestedSessionIdRef = useRef(searchParams.get("sessionId"));
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [submittingFeedbackId, setSubmittingFeedbackId] = useState<string | null>(null);
  const [useVoiceReply, setUseVoiceReply] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewportBox, setViewportBox] = useState<{ height: number; offsetTop: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const sendingRef = useRef(false);

  const scrollToLastMessage = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  };

  const dismissKeyboard = () => {
    const el = document.activeElement as HTMLElement | null;
    if (el?.matches?.("input, textarea")) el.blur();
  };

  const syncRatingForm = (rating?: Profile["viewerState"]["rating"]) => {
    setRatingScore((rating?.currentScore as number | null) ?? 5);
    setRatingComment(rating?.currentComment ?? "");
  };

  const resetToWelcome = useCallback((welcomeMessage: string) => {
    setSessionId(null);
    setMessages([buildWelcomeMessage(welcomeMessage)]);
  }, []);

  const loadSession = useCallback(async (targetSessionId: string, welcomeMessage: string) => {
    setSessionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/life-agents/${id}/chat/sessions/${targetSessionId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "SESSION_NOT_FOUND" ? "会话不存在或无权查看。" : "加载聊天记录失败。");
        resetToWelcome(welcomeMessage);
        return;
      }
      setSessionId(targetSessionId);
      router.replace(`/life-agents/${id}/chat?sessionId=${targetSessionId}`, { scroll: false });
      setMessages(
        Array.isArray(data.messages) && data.messages.length > 0
          ? data.messages.map((message: any) => ({
              role: message.role,
              content: message.content,
              messageId: message.role === "assistant" ? message.id : undefined,
              sessionId: targetSessionId,
              audioUrl: message.audioUrl,
              audioDurationSec: message.audioDurationSec,
              references: Array.isArray(message.references) ? message.references : undefined,
            }))
          : [buildWelcomeMessage(welcomeMessage)]
      );
    } catch {
      setError("加载聊天记录失败。");
      resetToWelcome(welcomeMessage);
    } finally {
      setSessionLoading(false);
    }
  }, [id, resetToWelcome, router]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/life-agents/${id}`, { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;

        const profileForUi: Profile = {
          ...data,
          headline: cleanLifeAgentIntroText(data.headline, data.displayName),
          welcomeMessage: cleanLifeAgentIntroMultiline(data.welcomeMessage, data.displayName),
        };
        setProfile(profileForUi);
        syncRatingForm(data.viewerState?.rating);
        resetToWelcome(profileForUi.welcomeMessage);
        setSessions([]);

        if (!data.viewerState?.isLoggedIn) return;

        setSessionsLoading(true);
        const sessionsRes = await fetch(`/api/life-agents/${id}/chat/sessions`, {
          credentials: "include",
        });
        const sessionList = sessionsRes.ok ? await sessionsRes.json() : [];
        if (cancelled) return;

        const normalizedSessions = Array.isArray(sessionList) ? sessionList : [];
        setSessions(normalizedSessions);

        if (normalizedSessions.length > 0) {
          const initialSession =
            (initialRequestedSessionIdRef.current &&
              normalizedSessions.find((session: SessionSummary) => session.id === initialRequestedSessionIdRef.current)) ||
            normalizedSessions[0];
          await loadSession(initialSession.id, profileForUi.welcomeMessage);
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, loadSession, resetToWelcome]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (viewportBox === null) return;
    const t = window.setTimeout(() => {
      viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [viewportBox]);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    const update = () => {
      if (!vv) {
        setViewportBox({ height: window.innerHeight, offsetTop: 0 });
        return;
      }
      setViewportBox({
        height: Math.max(0, vv.height),
        offsetTop: Math.max(0, vv.offsetTop),
      });
    };
    update();
    if (!vv) return;
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const agentCoverUrl = profile
    ? resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey)
    : null;

  const userLetter = (user?.name?.trim() || user?.email || "我").slice(0, 1).toUpperCase();

  const sendMessageWithText = useCallback(
    async (text: string) => {
      if (!text.trim() || !profile || sessionLoading || sendingRef.current) return;
      if (!profile.viewerState.isLoggedIn) {
        setError("请先登录后再开始聊天哦～");
        return;
      }
      const trimmed = text.trim();
      const currentSessionId = sessionId;
      const now = new Date().toISOString();

      setError("");
      sendingRef.current = true;
      setLoading(true);
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");

      // 先插入一条空的 assistant 占位消息，后续流式追加内容
      const assistantIdx = { current: -1 };
      setMessages((prev) => {
        assistantIdx.current = prev.length;
        return [...prev, { role: "assistant" as const, content: "" }];
      });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000);

        const res = await fetch(`/api/life-agents/${id}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sessionId: currentSessionId ?? undefined,
            message: trimmed,
            useVoiceReply: useVoiceReply && profile?.hasVoiceClone,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const ct = res.headers.get("content-type") || "";

        // 非 SSE 响应（错误等）：按原逻辑处理
        if (!ct.includes("text/event-stream")) {
          const data = await res.json();
          if (!res.ok) {
            setError(
              data.error === "NO_QUESTIONS_LEFT"
                ? "你的提问次数已经用完，请先返回详情页购买次数。"
                : data.error === "UNAUTHORIZED"
                  ? "请先登录。"
                  : data.error === "SESSION_NOT_FOUND"
                    ? "会话已失效，请重新选择历史会话或新建聊天。"
                    : "发送失败，请稍后重试。"
            );
            // 移除用户消息和空的 assistant 占位
            setMessages((prev) => prev.slice(0, -2));
            return;
          }
          // 兜底：非流式成功响应
          setMessages((prev) =>
            prev.map((m, i) =>
              i === assistantIdx.current
                ? { ...m, content: data.reply, messageId: data.messageId, sessionId: data.sessionId, references: data.references, audioUrl: data.audioUrl, audioDurationSec: data.audioDurationSec }
                : m
            )
          );
          return;
        }

        // SSE 流式响应
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) break;
          buffer += decoder.decode(value, { stream: true });

          // 按双换行分割 SSE 事件
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            let eventType = "";
            let eventData = "";
            for (const line of part.split("\n")) {
              if (line.startsWith("event: ")) eventType = line.slice(7);
              else if (line.startsWith("data: ")) eventData = line.slice(6);
            }
            if (!eventData) continue;

            try {
              const parsed = JSON.parse(eventData);

              if (eventType === "content" && parsed.content) {
                setMessages((prev) =>
                  prev.map((m, i) =>
                    i === assistantIdx.current
                      ? { ...m, content: m.content + parsed.content }
                      : m
                  )
                );
              } else if (eventType === "done") {
                const data = parsed;
                // 更新 assistant 消息的元数据
                setMessages((prev) =>
                  prev.map((m, i) =>
                    i === assistantIdx.current
                      ? {
                          ...m,
                          content: data.reply || m.content,
                          messageId: data.messageId,
                          sessionId: data.sessionId,
                          references: data.references,
                          audioUrl: data.audioUrl,
                          audioDurationSec: data.audioDurationSec,
                        }
                      : m
                  )
                );
                setSessionId(data.sessionId);
                setProfile((prev) =>
                  prev
                    ? {
                        ...prev,
                        viewerState: {
                          ...prev.viewerState,
                          remainingQuestions: data.remainingQuestions,
                          rating: data.rating ?? prev.viewerState.rating,
                        },
                      }
                    : prev
                );
                setSessions((prevSessions) => {
                  const nextTitle = data.sessionTitle || trimSessionTitle(trimmed);
                  const existing = prevSessions.find((session) => session.id === data.sessionId);
                  if (!existing) {
                    return [
                      {
                        id: data.sessionId,
                        title: nextTitle,
                        messageCount: 2,
                        createdAt: now,
                        updatedAt: now,
                      },
                      ...prevSessions,
                    ];
                  }
                  return [
                    {
                      ...existing,
                      updatedAt: now,
                      messageCount: existing.messageCount + 2,
                    },
                    ...prevSessions.filter((session) => session.id !== data.sessionId),
                  ];
                });
                syncRatingForm(data.rating);
              }
            } catch {
              // ignore malformed SSE data
            }
          }
        }
      } catch (err) {
        const msg =
          err instanceof Error && err.name === "AbortError"
            ? "请求超时，AI 处理较慢，请稍后重试。"
            : "网络异常，请检查连接后重试。";
        setError(msg);
        // 移除用户消息和空/部分 assistant 消息
        setMessages((prev) => {
          const assistantMsg = prev[assistantIdx.current];
          if (assistantMsg && !assistantMsg.content) {
            return prev.slice(0, -2);
          }
          return prev.slice(0, -1);
        });
      } finally {
        sendingRef.current = false;
        setLoading(false);
      }
    },
    [id, profile, sessionId, sessionLoading, useVoiceReply]
  );

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !profile) return;
    await sendMessageWithText(input.trim());
  };

  const submitMessageFeedback = useCallback(
    async (message: ChatMessage, feedbackType: string) => {
      if (!message.messageId || !message.sessionId) return;
      setSubmittingFeedbackId(message.messageId);
      try {
        const res = await fetch(`/api/life-agents/${id}/chat/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            messageId: message.messageId,
            sessionId: message.sessionId,
            feedbackType,
          }),
        });
        if (!res.ok) {
          setError("反馈提交失败，请稍后重试。");
          return;
        }
        setError("");
      } catch {
        setError("反馈提交失败，请稍后重试。");
      } finally {
        setSubmittingFeedbackId(null);
      }
    },
    [id]
  );

  if (!profile) {
    return <div className="h-72 animate-pulse rounded-3xl bg-gradient-to-br from-violet-100/90 to-fuchsia-100/50 shadow-[0_6px_28px_rgba(124,58,237,0.08)]" />;
  }

  const ratingState = profile.viewerState.rating;

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div
      className="flex min-h-0 flex-col lg:-mx-4 lg:-mt-3 lg:-mb-8 lg:min-h-[calc(100dvh-5rem)] max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-[35] max-lg:overflow-hidden max-lg:bg-gradient-to-b max-lg:from-[#F3EFFF] max-lg:via-violet-50/40 max-lg:to-white"
      style={
        viewportBox
          ? { height: `${viewportBox.height}px`, top: `${viewportBox.offsetTop}px` }
          : { height: "100dvh" }
      }
    >
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              key="chat-drawer-backdrop"
              type="button"
              aria-label="关闭菜单"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-[2px]"
              onClick={closeMenu}
            />
            <motion.aside
              key="chat-drawer-panel"
              id="chat-side-panel"
              role="dialog"
              aria-modal="true"
              aria-label="会话与设置"
              initial={{ x: "-105%" }}
              animate={{ x: 0 }}
              exit={{ x: "-105%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed left-0 top-0 z-[101] flex h-[100dvh] w-[min(100vw,20rem)] flex-col border-r border-purple-200/[0.25] bg-white/[0.97] shadow-[4px_0_32px_-8px_rgba(124,58,237,0.12)] backdrop-blur-lg sm:w-[22rem] sm:max-w-[88vw]"
            >
              <div className="flex items-center justify-between border-b border-purple-100/70 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <span className="text-sm font-semibold text-purple-950/90">更多</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="rounded-full p-2 text-slate-500 hover:bg-purple-50/90 hover:text-purple-900"
                  aria-label="关闭"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Link
                  href={`/life-agents/${id}`}
                  onClick={closeMenu}
                  className="text-sm text-slate-500 hover:text-purple-800"
                >
                  ← 返回详情页
                </Link>
                <h1 className="mt-3 text-xl font-semibold text-slate-900">{profile.displayName}</h1>
                <p className="mt-1 text-sm text-slate-600">{profile.headline}</p>

                {profile.hasVoiceClone && (
                  <div className="mt-4 rounded-2xl border border-purple-200/[0.2] bg-violet-50/40 px-3 py-3 backdrop-blur-sm">
                    <p className="text-xs font-medium text-slate-600">回复形式</p>
                    <div className="mt-2 flex justify-start">
                      <VoiceReplyToggle
                        useVoiceReply={useVoiceReply}
                        onChange={setUseVoiceReply}
                        hasVoiceClone={profile.hasVoiceClone}
                        disabled={loading || sessionLoading}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-purple-200/[0.18] bg-gradient-to-br from-violet-50/[0.9] to-fuchsia-50/[0.65] p-4 backdrop-blur-sm">
                  <p className="text-sm text-slate-500">剩余提问次数</p>
                  <p className="mt-1 text-2xl font-semibold text-purple-800">{profile.viewerState.remainingQuestions}</p>
                </div>

                {profile.viewerState.isLoggedIn && (
                  <div className="mt-4 rounded-2xl border border-purple-200/[0.22] bg-white/[0.98] p-4 text-sm text-slate-600 shadow-[0_4px_20px_rgba(124,58,237,0.05)] backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-purple-950/90">我的聊天记录</p>
                        <p className="mt-1 text-xs text-slate-500">仅你自己可见，Agent 创建者看不到聊天正文。</p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded-full bg-gradient-to-r from-[#BA68C8] to-[#FF80AB] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-95"
                        onClick={() => {
                          setError("");
                          resetToWelcome(profile.welcomeMessage);
                          router.replace(`/life-agents/${id}/chat`, { scroll: false });
                          closeMenu();
                        }}
                      >
                        新建聊天
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {sessionsLoading ? (
                        <p className="text-xs text-slate-500">正在加载聊天记录...</p>
                      ) : sessions.length === 0 ? (
                        <p className="text-xs text-slate-500">还没有历史会话，发出第一条消息后会自动保存。</p>
                      ) : (
                        sessions.map((session) => (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => {
                              loadSession(session.id, profile.welcomeMessage);
                              closeMenu();
                            }}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                              session.id === sessionId
                                ? "border-fuchsia-300/60 bg-gradient-to-br from-violet-50 to-fuchsia-50/80"
                                : "border-purple-100/80 bg-white/[0.85] hover:border-purple-200/50 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-slate-800">{trimSessionTitle(session.title)}</p>
                              <span className="text-[11px] text-slate-400">{session.messageCount} 条</span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {new Date(session.updatedAt).toLocaleString("zh-CN")}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {profile.viewerState.isLoggedIn && (
                  <div className="mt-4 rounded-2xl border border-purple-200/[0.22] bg-white/[0.98] p-4 text-sm text-slate-600 shadow-[0_4px_20px_rgba(124,58,237,0.05)] backdrop-blur-sm">
                    <p className="font-medium text-purple-950/90">Agent 评分</p>
                    <p className="mt-1 text-xs text-slate-500">
                      每满 10 次提问会解锁一次评分。你的新评分会覆盖旧评分，但始终只算 1 位用户。
                    </p>
                    <p className="mt-3 text-sm text-slate-700">
                      已提问 {ratingState?.usedQuestions ?? 0} 次
                      {typeof ratingState?.currentScore === "number" && ` · 当前评分 ${ratingState.currentScore}/5`}
                    </p>
                    {ratingState?.eligible ? (
                      <div className="mt-3 space-y-3">
                        <p className="text-xs text-purple-800">
                          已到第 {ratingState.currentMilestone} 次评价节点，现在可以更新一次评分。
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => setRatingScore(score)}
                              className={`rounded-full px-3 py-1 text-sm transition ${
                                ratingScore === score
                                  ? "bg-gradient-to-r from-[#BA68C8] to-[#FF80AB] text-white shadow-sm"
                                  : "bg-violet-50/80 text-slate-600 hover:bg-purple-100/60"
                              }`}
                            >
                              {score} 分
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="input-shell min-h-24"
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          placeholder="可以补充这个 Agent 目前最明显的问题，例如：太像 AI、建议不够贴合、节奏太慢..."
                        />
                        <button
                          type="button"
                          disabled={ratingSubmitting}
                          onClick={async () => {
                            setRatingSubmitting(true);
                            const res = await fetch(`/api/life-agents/${id}/rating`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({
                                score: ratingScore,
                                comment: ratingComment.trim() || undefined,
                              }),
                            });
                            const data = await res.json();
                            setRatingSubmitting(false);
                            if (!res.ok) {
                              setError(
                                data.error === "RATING_NOT_ELIGIBLE"
                                  ? "还没到可评分节点，满 10 次提问后再来。"
                                  : "评分提交失败，请稍后重试。"
                              );
                              return;
                            }
                            setError("");
                            setProfile((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    viewerState: {
                                      ...prev.viewerState,
                                      rating: data.rating ?? prev.viewerState.rating,
                                    },
                                  }
                                : prev
                            );
                            syncRatingForm(data.rating);
                          }}
                          className="btn-secondary"
                        >
                          {ratingSubmitting ? "提交中..." : "提交评分"}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        {typeof ratingState?.currentScore === "number"
                          ? `下一次可更新评分：满 ${ratingState?.nextMilestone ?? 10} 次提问`
                          : `满 ${ratingState?.nextMilestone ?? 10} 次提问后可评分`}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-purple-100/50 bg-violet-50/35 p-4 text-sm text-slate-600 backdrop-blur-sm">
                  <p className="font-medium text-purple-950/85">怎么聊更好？</p>
                  <ul className="mt-2 space-y-1">
                    <li>• 说清楚你的<strong>具体处境</strong>（如：二本大三、想转行、时间紧）</li>
                    <li>• 问得越具体，回答越有用</li>
                    <li>• 可以连续追问，一步步深入</li>
                    <li>• 每次提问扣 1 次额度</li>
                  </ul>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={`/life-agents/${id}`} onClick={closeMenu} className="btn-secondary">
                    去购买次数
                  </Link>
                  {!profile.viewerState.isLoggedIn && (
                    <Link href="/login" onClick={closeMenu} className="btn-primary">
                      登录后聊天
                    </Link>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 border-purple-200/[0.2] bg-white/[0.98] shadow-[0_6px_32px_-12px_rgba(124,58,237,0.1)] backdrop-blur-sm sm:rounded-3xl sm:border lg:rounded-3xl max-lg:flex-1">
        <header className="z-20 flex shrink-0 items-center gap-2 border-b border-purple-100/70 bg-white/[0.95] px-1 py-2 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push(`/life-agents/${id}`);
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-purple-950/90 transition hover:bg-purple-50/90"
            aria-label="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-1">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-violet-100/60 ring-1 ring-purple-200/30">
              {agentCoverUrl ? (
                <LifeAgentCoverImage
                  src={agentCoverUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-500">
                  {profile.displayName.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-[15px] font-semibold text-[#111]">{profile.displayName}</p>
              <p className="truncate text-xs text-slate-500">{profile.headline || "在线咨询"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openMenu}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-purple-950/90 transition hover:bg-purple-50/90"
            aria-expanded={menuOpen}
            aria-controls="chat-side-panel"
            aria-label="更多"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" />
            </svg>
          </button>
        </header>

        <div
          ref={viewportRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-white/90 to-violet-50/20 px-3 py-3 sm:px-6 sm:py-5"
          onClick={dismissKeyboard}
          role="presentation"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {sessionLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                正在加载历史会话...
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={`${message.role}-${index}-${message.messageId ?? "draft"}`} className="space-y-1">
                  <div
                    className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" ? (
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-violet-100/60 ring-1 ring-purple-200/25">
                        {agentCoverUrl ? (
                          <LifeAgentCoverImage
                            src={agentCoverUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                            {profile.displayName.slice(0, 1)}
                          </span>
                        )}
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[78%] rounded-[22px] px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm sm:max-w-[72%] ${
                        message.role === "user"
                          ? "rounded-br-md bg-gradient-to-br from-[#FF85D0] to-[#A88BEB] text-white shadow-[0_6px_20px_-6px_rgba(168,139,235,0.35)]"
                          : "rounded-bl-md border border-purple-200/[0.2] bg-white/[0.97] text-slate-800 backdrop-blur-sm"
                      }`}
                    >
                      {message.role === "assistant" && message.audioUrl ? (
                        <div className="space-y-3">
                          <VoiceMessageBubble
                            audioUrl={message.audioUrl}
                            durationSeconds={message.audioDurationSec ?? 1}
                            isFromUser={false}
                          />
                          {message.content && (
                            <p className="mt-2 border-t border-black/10 pt-2 text-[13px] leading-6 text-slate-600">
                              {message.content}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.references && message.references.length > 0 && (
                            <div className="flex flex-wrap gap-2 border-t border-black/10 pt-2">
                              {message.references.slice(0, 4).map((ref) => (
                                <span
                                  key={`${ref.id}-${ref.title}`}
                                  className="rounded-full bg-violet-50/90 px-2.5 py-1 text-[11px] text-purple-900/70 ring-1 ring-purple-200/30"
                                  title={ref.excerpt}
                                >
                                  {ref.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {message.role === "user" ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF176] to-[#FF80AB] text-xs font-bold text-slate-900 shadow-sm ring-2 ring-white">
                        {userLetter}
                      </div>
                    ) : null}
                  </div>
                  {message.role === "assistant" && message.messageId && message.sessionId ? (
                    <div className="ml-10 flex flex-wrap gap-2 text-xs">
                      {[
                        { id: "helpful", label: "有帮助" },
                        { id: "not_specific", label: "不够具体" },
                        { id: "factual_error", label: "事实错了" },
                        { id: "contradiction", label: "前后矛盾" },
                        { id: "too_confident", label: "太武断了" },
                      ].map((item) => (
                        <button
                          key={`${message.messageId}-${item.id}`}
                          type="button"
                          disabled={submittingFeedbackId === message.messageId}
                          onClick={() => void submitMessageFeedback(message, item.id)}
                          className="rounded-full border border-purple-100/60 bg-violet-50/80 px-2.5 py-1 text-purple-900/70 transition hover:bg-purple-100/50 disabled:opacity-60"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
            <div ref={chatEndRef} className="h-1 shrink-0 scroll-mt-4" aria-hidden />
          </div>
        </div>

        {error && (
          <div className="shrink-0 mx-3 rounded-2xl border border-orange-100/80 bg-orange-50/90 px-4 py-2 text-sm text-orange-800/90 sm:mx-6">
            {error}
          </div>
        )}

        <div className="shrink-0 border-t border-purple-200/[0.16] bg-white/[0.94] px-3 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_28px_-8px_rgba(124,58,237,0.07)] backdrop-blur-lg sm:px-4">
          <div className="mx-auto max-w-3xl">
            <LifeAgentMessageComposer
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              disabled={loading || sessionLoading}
              placeholder="发消息..."
              onVoiceFinal={(text) => {
                if (text.trim()) sendMessageWithText(text);
              }}
              onTextareaFocus={() => {
                setTimeout(scrollToLastMessage, 280);
                setTimeout(scrollToLastMessage, 520);
              }}
              onMoreClick={openMenu}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
