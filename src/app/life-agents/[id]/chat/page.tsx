"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { VoiceInputButton, VoiceMessageBubble, VoiceReplyToggle } from "@/components/voice";

type Profile = {
  id: string;
  displayName: string;
  headline: string;
  welcomeMessage: string;
  sampleQuestions?: string[];
  hasVoiceClone?: boolean;
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

function autoResizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "0px";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

export default function LifeAgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToLastMessage = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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

  return (
    <div className="-mx-4 -mt-3 sm:-mt-8 lg:-mb-8 flex min-h-[calc(100dvh-9rem)] flex-col sm:min-h-[calc(100dvh-8rem)] lg:min-h-[calc(100dvh-5rem)]">
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

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 border-slate-200/80 bg-white shadow-sm sm:rounded-3xl sm:border lg:rounded-3xl">
        <header className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-2 py-2 sm:px-4">
          <button
            type="button"
            onClick={openMenu}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
            aria-expanded={menuOpen}
            aria-controls="chat-side-panel"
            title="更多"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1 flex justify-center px-1">
            <span className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800">
              <span className="truncate">{profile.displayName}</span>
            </span>
          </div>
          <Link
            href={`/life-agents/${id}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            title="Agent 详情"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Link>
        </header>

        <div
          ref={viewportRef}
          className="flex-1 space-y-5 overflow-y-auto overscroll-contain bg-white px-3 py-4 pb-2 sm:px-6 sm:py-6"
          onClick={dismissKeyboard}
          onTouchStart={dismissKeyboard}
          role="presentation"
        >
          <div className="mx-auto max-w-3xl space-y-5">
            {sessionLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                正在加载历史会话...
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.messageId ?? "draft"}`}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-[15px] leading-7 sm:max-w-[85%] ${
                      message.role === "user"
                        ? "bg-sky-500 text-white"
                        : "bg-slate-100 text-slate-800"
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
                          <p className="mt-2 border-t border-slate-200/60 pt-2 text-[13px] leading-6 text-slate-600">
                            {message.content}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {error && (
          <div className="shrink-0 mx-3 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600 sm:mx-6">
            {error}
          </div>
        )}

        <form
          onSubmit={sendMessage}
          className="shrink-0 border-t border-slate-100 bg-white px-2 pb-12 pt-2 sm:px-4 lg:pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={openMenu}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 sm:h-11 sm:w-11"
              title="更多"
              aria-label="打开更多菜单"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div className="flex min-h-[44px] min-w-0 flex-1 items-end gap-2 rounded-[1.75rem] border border-slate-200 bg-white px-3 py-1.5 shadow-sm sm:rounded-[2rem] sm:px-4 sm:py-2">
              <textarea
                onFocus={() => setTimeout(scrollToLastMessage, 150)}
                className="max-h-36 min-h-[24px] w-full flex-1 resize-none border-0 bg-transparent py-2 text-base leading-6 text-slate-800 outline-none placeholder:text-slate-400"
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
                placeholder="发消息…"
                disabled={loading || sessionLoading}
                rows={1}
                enterKeyHint="send"
              />
              <VoiceInputButton
                onTranscript={(text, isFinal) => {
                  if (isFinal && text.trim()) {
                    sendMessageWithText(text);
                  }
                }}
                disabled={loading || sessionLoading}
                size="sm"
                className="!h-9 !w-9 shrink-0 border-0 bg-transparent sm:!h-10 sm:!w-10"
              />
            </div>
            <button
              type="submit"
              disabled={loading || sessionLoading || !input.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
              aria-label="发送"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M3.72 2.94a.75.75 0 0 1 .8-.12l11.5 5.5a.75.75 0 0 1 0 1.36l-11.5 5.5A.75.75 0 0 1 3.45 14.5l1.34-4.05H9.5a.75.75 0 0 0 0-1.5H4.8L3.45 4.9a.75.75 0 0 1 .27-.96Z" />
              </svg>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
