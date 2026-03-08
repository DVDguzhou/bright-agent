"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  displayName: string;
  headline: string;
  welcomeMessage: string;
  viewerState: {
    isLoggedIn: boolean;
    remainingQuestions: number;
  };
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
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

  useEffect(() => {
    fetch(`/api/life-agents/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
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
      setError("请先登录后再开始聊天。");
      return;
    }

    const text = input.trim();
    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    const res = await fetch(`/api/life-agents/${id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        sessionId: sessionId ?? undefined,
        message: text,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        data.error === "NO_QUESTIONS_LEFT"
          ? "你的提问次数已经用完，请先返回详情页购买次数。"
          : data.error === "UNAUTHORIZED"
          ? "请先登录。"
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
            },
          }
        : prev
    );
  };

  if (!profile) {
    return <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />;
  }

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
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>聊天页面采用类似 GPT 的布局，支持连续追问。</p>
            <p>每发送一条问题，会消耗 1 次提问额度。</p>
            <p>如果额度不足，可以回到详情页购买次数包。</p>
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

      <section className="glass-card flex min-h-[75vh] flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">咨询聊天窗口</h2>
          <p className="mt-1 text-sm text-slate-500">界面尽量简洁、明亮，方便大学生和普通用户直接上手。</p>
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">参考经验</p>
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
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                正在整理回答...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white/70 px-6 py-5">
          {error && <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
          <div className="flex flex-col gap-3 md:flex-row">
            <textarea
              className="input-shell min-h-28 flex-1 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你想问的问题，例如：我现在很迷茫，不知道该先考研还是先工作。"
            />
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
