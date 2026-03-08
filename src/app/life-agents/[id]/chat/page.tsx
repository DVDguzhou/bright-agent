"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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

export default function LifeAgentChatPage() {
  const params = useParams();
  const id = params.id as string;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
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

  useEffect(() => {
    fetch(`/api/life-agents/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        syncRatingForm(data.viewerState?.rating);
        setMessages([
          {
            role: "assistant",
            content: data.welcomeMessage,
          },
        ]);
      })
      .catch(() => setProfile(null));
  }, [id]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !profile) return;
    if (!profile.viewerState.isLoggedIn) {
      setError("请先登录后再开始聊天哦～");
      return;
    }

    const text = input.trim();
    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    const currentSessionId = sessionId;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 分钟超时

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
            ? "会话已失效，请刷新页面后重新开始聊天。"
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
          {profile.sampleQuestions && profile.sampleQuestions.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-500">可参考的提问示例</p>
              <div className="flex flex-wrap gap-2">
                {(profile.sampleQuestions as string[]).slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInput(q)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {q.length > 24 ? q.slice(0, 24) + "…" : q}
                  </button>
                ))}
              </div>
            </div>
          )}
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

      <section className="glass-card flex min-h-[75vh] flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">咨询聊天</h2>
          <p className="mt-1 text-sm text-slate-600">描述你的具体处境和问题，TA 会结合真实经验给出可操作的建议。问得越具体，回答越有用。</p>
        </div>

        <div ref={viewportRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
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
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                正在根据 TA 的经验整理回答...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white/70 px-6 py-5">
          {error && <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex flex-1 flex-col">
              <textarea
                className="input-shell min-h-28 w-full resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="描述你的处境 + 具体问题，例如：我二本大三，在纠结考研还是就业，家里经济一般..."
              />
              <p className="mt-1 text-xs text-slate-400">写得越具体，回答越有用</p>
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary min-w-36 justify-center self-end disabled:opacity-60"
            >
              发送问题
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
