"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  displayName: string;
  headline: string;
  welcomeMessage: string;
  sampleQuestions?: string[];
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
  feedback?: "helpful" | "not_specific" | "not_suitable";
  feedbackDraftType?: "helpful" | "not_specific" | "not_suitable";
  feedbackComment?: string;
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

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !profile) return;
    if (!profile.viewerState.isLoggedIn) {
      setError("请先登录后再开始聊天哦～");
      return;
    }

    const text = input.trim();
    const currentSessionId = sessionId;
    const now = new Date().toISOString();

    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 分钟，兼容本地大模型思考模式

      const res = await fetch(`/api/life-agents/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId: currentSessionId ?? undefined,
          message: text,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          messageId: data.messageId,
          sessionId: data.sessionId,
          references: data.references,
        },
      ]);
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
      setSessions((prev) => {
        const nextTitle = data.sessionTitle || trimSessionTitle(text);
        const existing = prev.find((session) => session.id === data.sessionId);
        if (!existing) {
          return [
            {
              id: data.sessionId,
              title: nextTitle,
              messageCount: 2,
              createdAt: now,
              updatedAt: now,
            },
            ...prev,
          ];
        }
        return [
          {
            ...existing,
            updatedAt: now,
            messageCount: existing.messageCount + 2,
          },
          ...prev.filter((session) => session.id !== data.sessionId),
        ];
      });
      syncRatingForm(data.rating);
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "AbortError"
          ? "请求超时，AI 处理较慢，请稍后重试。"
          : "网络异常，请检查连接后重试。";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />;
  }

  const ratingState = profile.viewerState.rating;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.4fr]">
      <aside className="space-y-6">
        <div className="glass-card p-6">
          <Link href={`/life-agents/${id}`} className="text-sm text-slate-500 hover:text-sky-700">
            ← 返回详情页
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">{profile.displayName}</h1>
          <p className="mt-2 text-sm text-slate-600">{profile.headline}</p>
          <div className="mt-6 rounded-2xl bg-sky-50 p-4">
            <p className="text-sm text-slate-500">剩余提问次数</p>
            <p className="mt-1 text-3xl font-semibold text-sky-700">{profile.viewerState.remainingQuestions}</p>
          </div>

          {profile.viewerState.isLoggedIn && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">我的聊天记录</p>
                  <p className="mt-1 text-xs text-slate-500">仅你自己可见，Agent 创建者看不到聊天正文。</p>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                  onClick={() => {
                    setError("");
                    resetToWelcome(profile.welcomeMessage);
                    router.replace(`/life-agents/${id}/chat`, { scroll: false });
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
                      onClick={() => loadSession(session.id, profile.welcomeMessage)}
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
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
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

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-700">💬 怎么聊更好？</p>
            <ul className="mt-2 space-y-1">
              <li>• 说清楚你的<strong>具体处境</strong>（如：二本大三、想转行、时间紧）</li>
              <li>• 问得越具体，回答越有用</li>
              <li>• 可以连续追问，一步步深入</li>
              <li>• 每次提问扣 1 次额度</li>
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/life-agents/${id}`} className="btn-secondary">
              去购买次数
            </Link>
            {!profile.viewerState.isLoggedIn && (
              <Link href="/login" className="btn-primary">
                登录后聊天
              </Link>
            )}
          </div>
        </div>
      </aside>

      <section className="glass-card flex min-h-[75dvh] flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">咨询聊天</h2>
          <p className="mt-1 text-sm text-slate-600">
            描述你的具体处境和问题，TA 会结合真实经验给出可操作的建议。问得越具体，回答越有用。
          </p>
        </div>

        <div ref={viewportRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {sessionLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">正在加载历史会话...</div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.messageId ?? "draft"}`}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.references && message.references.length > 0 && (
                    <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">回答依据的经验</p>
                      {message.references.map((reference) => (
                        <div key={reference.id} className="rounded-2xl bg-white p-3">
                          <p className="text-sm font-medium text-slate-800">
                            {reference.category} · {reference.title}
                          </p>
                          <p className="mt-1 text-xs leading-6 text-slate-500">{reference.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {message.role === "assistant" && message.messageId && sessionId && profile?.viewerState.isLoggedIn && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-medium text-slate-700">这条回答感觉怎么样？</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(["helpful", "not_specific", "not_suitable"] as const).map((fb) => (
                          <button
                            key={fb}
                            type="button"
                            onClick={() => {
                              if (message.feedback) return;
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.messageId === message.messageId
                                    ? { ...m, feedbackDraftType: fb, feedbackComment: m.feedbackComment ?? "" }
                                    : m
                                )
                              );
                            }}
                            disabled={!!message.feedback}
                            className={`rounded-full px-3 py-1.5 transition ${
                              message.feedback === fb || message.feedbackDraftType === fb
                                ? fb === "helpful"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                                : "bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                            }`}
                          >
                            {fb === "helpful" ? "有帮助" : fb === "not_specific" ? "不够具体" : "不适合我"}
                          </button>
                        ))}
                      </div>
                      {!message.feedback && message.feedbackDraftType && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            className="input-shell min-h-20 bg-white"
                            value={message.feedbackComment ?? ""}
                            onChange={(e) =>
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.messageId === message.messageId
                                    ? { ...m, feedbackComment: e.target.value }
                                    : m
                                )
                              )
                            }
                            placeholder="可以直接描述这个 Agent 的问题，例如：太像 AI、回答绕、没抓住我的背景..."
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={async () => {
                                const target = messages.find((m) => m.messageId === message.messageId);
                                if (!target?.feedbackDraftType) return;
                                const res = await fetch(`/api/life-agents/${id}/chat/feedback`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({
                                    messageId: message.messageId,
                                    sessionId,
                                    feedbackType: target.feedbackDraftType,
                                    comment: target.feedbackComment?.trim() || undefined,
                                  }),
                                });
                                if (!res.ok) {
                                  setError("反馈提交失败，请稍后重试。");
                                  return;
                                }
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.messageId === message.messageId
                                      ? {
                                          ...m,
                                          feedback: target.feedbackDraftType,
                                          feedbackComment: target.feedbackComment,
                                          feedbackDraftType: undefined,
                                        }
                                      : m
                                  )
                                );
                              }}
                            >
                              提交反馈
                            </button>
                            <button
                              type="button"
                              className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100"
                              onClick={() =>
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.messageId === message.messageId
                                      ? { ...m, feedbackDraftType: undefined, feedbackComment: "" }
                                      : m
                                  )
                                )
                              }
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}
                      {message.feedback && (
                        <p className="mt-2 text-slate-500">
                          已提交反馈
                          {message.feedbackComment ? `：${message.feedbackComment}` : ""}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                正在根据 TA 的经验整理回答...
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={sendMessage}
          className="mx-4 rounded-[28px] border border-white/65 bg-white/42 p-2 shadow-[0_28px_70px_-30px_rgba(15,23,42,0.42),0_10px_24px_-18px_rgba(255,255,255,0.9)_inset] ring-1 ring-white/35 backdrop-blur-[22px] sm:mx-6 sm:rounded-[32px] sm:p-2.5"
          style={{ paddingBottom: "max(0.5rem, calc(env(safe-area-inset-bottom) + 0.125rem))" }}
        >
          {error && <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
          <div className="relative flex items-end gap-1.5 sm:gap-2">
            <div className="flex-1 rounded-[22px] border border-white/55 bg-white/52 px-3.5 py-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),inset_0_-1px_3px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:rounded-[26px] sm:px-4">
              <textarea
                className="max-h-40 min-h-[24px] w-full resize-none scroll-mb-[35vh] border-0 bg-transparent text-[14px] leading-6 text-slate-800 outline-none placeholder:text-slate-400 sm:text-[15px]"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="描述你的处境 + 具体问题，例如：我二本大三，在纠结考研还是就业，家里经济一般..."
                disabled={loading || sessionLoading}
                rows={1}
                enterKeyHint="send"
              />
              <p className="mt-1 text-[10px] text-slate-400 sm:text-[11px]">写得越具体，回答越有用</p>
            </div>
            <button
              type="submit"
              disabled={loading || sessionLoading || !input.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-sky-400/80 bg-gradient-to-br from-sky-500 via-sky-500 to-cyan-400 text-white shadow-[0_16px_30px_-16px_rgba(14,165,233,0.95)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11 sm:rounded-full"
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
