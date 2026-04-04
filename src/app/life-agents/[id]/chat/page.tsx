"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { VoiceInputButton, VoiceMessageBubble, VoiceReplyToggle } from "@/components/voice";
import { useAuth } from "@/contexts/AuthContext";
import { lifeAgentCoverShouldBypassOptimizer, resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";

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
    category: string;
    title: string;
    excerpt: string;
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

const QUICK_EMOJIS = ["😀", "👍", "❤️", "🙏", "😂", "🎉", "🫡", "✨"];

const DEFAULT_QUICK_PHRASES = ["你好", "谢谢", "想请教一下", "在吗"];

function autoResizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "0px";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

export default function LifeAgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const id = params.id as string;
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
  const [useVoiceReply, setUseVoiceReply] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const composerWrapRef = useRef<HTMLDivElement | null>(null);

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

        setProfile(data);
        syncRatingForm(data.viewerState?.rating);
        resetToWelcome(data.welcomeMessage);
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
          await loadSession(initialSession.id, data.welcomeMessage);
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
    if (keyboardInset <= 0) return;
    const t = window.setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [keyboardInset]);

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
    if (!emojiOpen) return;
    const onPointer = (e: PointerEvent) => {
      const el = composerWrapRef.current;
      if (el && !el.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [emojiOpen]);

  /** 移动端软键盘（viewport 不缩放时）用 visualViewport 垫高底部输入区 */
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const update = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - Math.max(0, vv.offsetTop));
      setKeyboardInset(gap);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const quickPhrases = useMemo(() => {
    const samples = profile?.sampleQuestions?.filter(Boolean).slice(0, 4) ?? [];
    return Array.from(new Set([...samples, ...DEFAULT_QUICK_PHRASES])).slice(0, 8);
  }, [profile]);

  const agentCoverUrl = profile
    ? profile.coverUrl || resolveLifeAgentCoverUrl(profile.coverImageUrl, profile.coverPresetKey)
    : null;

  const userLetter = (user?.name?.trim() || user?.email || "我").slice(0, 1).toUpperCase();

  const sendMessageWithText = useCallback(
    async (text: string) => {
      if (!text.trim() || !profile) return;
      if (!profile.viewerState.isLoggedIn) {
        setError("请先登录后再开始聊天哦～");
        return;
      }
      const trimmed = text.trim();
      const currentSessionId = sessionId;
      const now = new Date().toISOString();

      setError("");
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
        setLoading(false);
      }
    },
    [id, profile, sessionId, useVoiceReply]
  );

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !profile) return;
    await sendMessageWithText(input.trim());
  };

  if (!profile) {
    return <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />;
  }

  const ratingState = profile.viewerState.rating;

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const bottomBarPad = `calc(env(safe-area-inset-bottom, 0px) + ${keyboardInset}px)`;

  return (
    <div
      className="-mx-4 -mt-3 flex min-h-0 flex-col sm:-mt-8 lg:-mb-8 lg:min-h-[calc(100dvh-5rem)] max-lg:fixed max-lg:inset-0 max-lg:z-[35] max-lg:h-[100dvh] max-lg:max-h-[100dvh] max-lg:w-screen max-lg:max-w-none max-lg:overflow-hidden max-lg:bg-white max-lg:px-4 max-lg:pt-[env(safe-area-inset-top)]"
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
              className="fixed left-0 top-0 z-[101] flex h-[100dvh] w-[min(100vw,20rem)] flex-col border-r border-slate-200 bg-white shadow-xl sm:w-[22rem] sm:max-w-[88vw]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <span className="text-sm font-semibold text-slate-800">更多</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
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
                  className="text-sm text-slate-500 hover:text-sky-700"
                >
                  ← 返回详情页
                </Link>
                <h1 className="mt-3 text-xl font-semibold text-slate-900">{profile.displayName}</h1>
                <p className="mt-1 text-sm text-slate-600">{profile.headline}</p>

                {profile.hasVoiceClone && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
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

                <div className="mt-4 rounded-2xl bg-sky-50 p-4">
                  <p className="text-sm text-slate-500">剩余提问次数</p>
                  <p className="mt-1 text-2xl font-semibold text-sky-700">{profile.viewerState.remainingQuestions}</p>
                </div>

                {profile.viewerState.isLoggedIn && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">我的聊天记录</p>
                        <p className="mt-1 text-xs text-slate-500">仅你自己可见，Agent 创建者看不到聊天正文。</p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
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
                                ? "border-sky-300 bg-sky-50"
                                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
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
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">Agent 评分</p>
                    <p className="mt-1 text-xs text-slate-500">
                      每满 10 次提问会解锁一次评分。你的新评分会覆盖旧评分，但始终只算 1 位用户。
                    </p>
                    <p className="mt-3 text-sm text-slate-700">
                      已提问 {ratingState?.usedQuestions ?? 0} 次
                      {typeof ratingState?.currentScore === "number" && ` · 当前评分 ${ratingState.currentScore}/5`}
                    </p>
                    {ratingState?.eligible ? (
                      <div className="mt-3 space-y-3">
                        <p className="text-xs text-sky-700">
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
                                  ? "bg-sky-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-700">怎么聊更好？</p>
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

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 border-slate-200/80 bg-white shadow-sm sm:rounded-3xl sm:border lg:rounded-3xl max-lg:flex-1">
        <header className="sticky top-0 z-20 flex shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-1 py-2 sm:px-3 lg:pt-[max(0.25rem,env(safe-area-inset-top))] max-lg:pt-0">
          <button
            type="button"
            onClick={() => router.push(`/life-agents/${id}`)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#111] transition hover:bg-slate-100"
            aria-label="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-1">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-black/5">
              {agentCoverUrl ? (
                <Image
                  src={agentCoverUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="36px"
                  unoptimized={lifeAgentCoverShouldBypassOptimizer(agentCoverUrl)}
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
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#111] transition hover:bg-slate-100"
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
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-3 py-3 sm:px-6 sm:py-5"
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
                <div
                  key={`${message.role}-${index}-${message.messageId ?? "draft"}`}
                  className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" ? (
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-black/5">
                      {agentCoverUrl ? (
                        <Image
                          src={agentCoverUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="32px"
                          unoptimized={lifeAgentCoverShouldBypassOptimizer(agentCoverUrl)}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                          {profile.displayName.slice(0, 1)}
                        </span>
                      )}
                    </div>
                  ) : null}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed sm:max-w-[72%] ${
                      message.role === "user"
                        ? "rounded-br-md bg-[#1677ff] text-white"
                        : "rounded-bl-md bg-[#f0f0f0] text-[#111]"
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
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-400 text-xs font-bold text-white ring-1 ring-white">
                      {userLetter}
                    </div>
                  ) : null}
                </div>
              ))
            )}
            <div ref={chatEndRef} className="h-1 shrink-0 scroll-mt-4" aria-hidden />
          </div>
        </div>

        {error && (
          <div className="shrink-0 mx-3 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600 sm:mx-6">
            {error}
          </div>
        )}

        <div
          className="shrink-0 border-t border-slate-100 bg-white px-3 pt-2 sm:px-4"
          style={{ paddingBottom: bottomBarPad }}
        >
          <div className="mx-auto max-w-3xl">
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickPhrases.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  disabled={loading || sessionLoading}
                  onClick={() => {
                    void sendMessageWithText(phrase);
                  }}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition active:bg-slate-100 disabled:opacity-50"
                >
                  {phrase}
                </button>
              ))}
            </div>

            <form
              onSubmit={sendMessage}
              className="bg-white px-0 pb-0 pt-1 sm:px-0"
            >
              <div ref={composerWrapRef} className="relative mx-auto w-full max-w-3xl">
            {emojiOpen ? (
              <div className="absolute bottom-full left-0 right-0 z-20 mb-2 flex flex-wrap gap-1.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-lg">
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition hover:bg-slate-50"
                    onClick={() => {
                      setInput((prev) => prev + em);
                      setEmojiOpen(false);
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex items-end gap-1.5 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-1 shadow-sm sm:gap-2 sm:py-2 sm:pl-3">
              <VoiceInputButton
                onTranscript={(text, isFinal) => {
                  if (isFinal && text.trim()) {
                    sendMessageWithText(text);
                  }
                }}
                disabled={loading || sessionLoading}
                size="sm"
                className="!h-9 !w-9 shrink-0 border-slate-200 sm:!h-10 sm:!w-10"
              />
              <textarea
                onFocus={() => {
                  setEmojiOpen(false);
                  setTimeout(scrollToLastMessage, 280);
                  setTimeout(scrollToLastMessage, 520);
                }}
                className="max-h-32 min-h-[36px] w-full min-w-0 flex-1 resize-none border-0 bg-transparent py-2 text-[15px] leading-5 text-[#111] outline-none placeholder:text-slate-400"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="发消息..."
                disabled={loading || sessionLoading}
                rows={1}
                enterKeyHint="send"
              />
              <button
                type="button"
                onClick={() => setEmojiOpen((o) => !o)}
                disabled={loading || sessionLoading}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                aria-label="表情"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M8.5 14.5s1.2 2 3.5 2 3.5-2 3.5-2M9 9h.01M15 9h.01" />
                </svg>
              </button>
              <button
                type="button"
                onClick={openMenu}
                disabled={loading || sessionLoading}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                aria-label="更多功能"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
