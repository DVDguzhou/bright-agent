"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LifeAgentMessageComposer } from "@/components/LifeAgentMessageComposer";
import {
  buildPatchPayloadFromProfile,
  fetchManageData,
  summarizeProfileChanges,
  type ManageData,
  type ManageProfile,
} from "@/app/dashboard/life-agents/_lib/manage";

type ChatRow = { role: "user" | "assistant"; content: string };
type LastChange = {
  before: ManageProfile;
  after: ManageProfile;
  summary: string[];
  message: string;
  appliedAt: string;
};

function storageKey(id: string) {
  return `life-agent-co-edit:${id}`;
}

function dismissKeyboard() {
  const active = document.activeElement as HTMLElement | null;
  if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
    active.blur();
  }
}

export default function LifeAgentCoEditPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatRow[]>([]);
  const [modifyInput, setModifyInput] = useState("");
  const [modifyLoading, setModifyLoading] = useState(false);
  const [lastChange, setLastChange] = useState<LastChange | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const chatHistoryRef = useRef<ChatRow[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchManageData(id).then((result) => {
      if (cancelled) return;
      setData(result.data);
      setLoadError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(id));
      if (!raw) return;
      const parsed = JSON.parse(raw) as { chatHistory?: ChatRow[]; lastChange?: LastChange | null };
      if (Array.isArray(parsed.chatHistory)) setChatHistory(parsed.chatHistory);
      if (parsed.lastChange) setLastChange(parsed.lastChange);
    } catch {
      // ignore broken local state
    }
  }, [id]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(id), JSON.stringify({ chatHistory, lastChange }));
    } catch {
      // ignore quota error
    }
  }, [chatHistory, id, lastChange]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, lastChange, banner]);

  const impactedFields = useMemo(() => lastChange?.summary ?? [], [lastChange]);
  const turnCount = useMemo(() => chatHistory.filter((item) => item.role === "user").length, [chatHistory]);

  const runModify = async (msg: string) => {
    if (!data) return;
    const previousProfile = data.profile;
    const nextHistory = [...chatHistoryRef.current, { role: "user" as const, content: msg }];
    setModifyLoading(true);
    setBanner(null);
    setChatHistory(nextHistory);
    try {
      const res = await fetch(`/api/life-agents/${id}/modify-via-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg,
          chatHistory: nextHistory.map((item) => ({ role: item.role, content: item.content })),
        }),
      });
      const next = await res.json().catch(() => null);
      if (!res.ok || !next?.profile) {
        setChatHistory((prev) => [...prev, { role: "assistant", content: next?.detail || "修改失败，请重试" }]);
        return;
      }
      const summary = summarizeProfileChanges(previousProfile, next.profile);
      setChatHistory((prev) => [...prev, { role: "assistant", content: next.assistantMessage || "我已经按你的要求完成修改。" }]);
      setLastChange({
        before: previousProfile,
        after: next.profile,
        summary,
        message: msg,
        appliedAt: new Date().toISOString(),
      });
      setData((prev) => (prev ? { ...prev, profile: next.profile } : prev));
    } catch {
      setChatHistory((prev) => [...prev, { role: "assistant", content: "请求失败，请检查网络后重试" }]);
    } finally {
      setModifyLoading(false);
    }
  };

  const submitModify = async (e?: FormEvent<HTMLFormElement>, voiceText?: string) => {
    e?.preventDefault();
    const msg = (voiceText ?? modifyInput).trim();
    if (!msg || modifyLoading) return;
    setModifyInput("");
    await runModify(msg);
  };

  const undoLastChange = async () => {
    if (!lastChange) return;
    setModifyLoading(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/life-agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPatchPayloadFromProfile(lastChange.before)),
      });
      const next = await res.json().catch(() => null);
      if (!res.ok) {
        setBanner("撤回失败，请稍后再试");
        return;
      }
      setData((prev) => (prev ? { ...prev, profile: next } : prev));
      setChatHistory((prev) => [...prev, { role: "assistant", content: "已撤回上次修改，资料恢复到修改前状态。" }]);
      setLastChange(null);
      setBanner("已撤回上次修改");
    } finally {
      setModifyLoading(false);
    }
  };

  if (loading) {
    return <div className="mx-auto h-64 max-w-4xl animate-pulse rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]" />;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-[15px] text-slate-500">{loadError ?? "加载失败"}</p>
        <Link href={`/dashboard/life-agents/${id}`} className="mt-6 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-medium text-white">
          返回工作台
        </Link>
      </div>
    );
  }

  const profile = data.profile;

  return (
    <div
      className={
        "flex min-w-0 flex-col overflow-hidden " +
        "max-lg:fixed max-lg:inset-0 max-lg:z-30 max-lg:m-0 max-lg:w-full max-lg:bg-slate-50 max-lg:min-h-0 " +
        "lg:relative lg:z-auto lg:-mx-4 lg:-mt-8 lg:-mb-8 lg:min-h-[calc(100dvh-4rem)] max-lg:min-h-0"
      }
    >
      <header className="z-40 shrink-0 border-b border-slate-200/80 bg-white/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md max-lg:relative sm:px-6 sm:pb-3 sm:pt-[max(0.75rem,env(safe-area-inset-top))] lg:sticky lg:top-0">
        <div className="mx-auto grid max-w-5xl grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 sm:grid-cols-[3rem_1fr_3rem]">
          <Link
            href={`/dashboard/life-agents/${id}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
            aria-label="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 text-center sm:flex-row sm:gap-2">
            <h1 className="text-[15px] font-semibold text-slate-900 sm:text-base">对话调教</h1>
            <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
              已调教 {turnCount} 轮
            </span>
          </div>
          <span className="justify-self-end sm:w-12" aria-hidden />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-3 py-1.5 text-xs text-slate-500 sm:px-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
            <span>像聊天一样改资料，发送后会自动同步当前 Agent 状态。</span>
            <span>历史保存在当前设备</span>
          </div>
        </div>

        <div className="shrink-0 px-3 pb-3 sm:px-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#111]">当前 Agent 状态</p>
                <p className="mt-1 text-xs text-slate-500">
                  {profile.displayName} · {(profile.expertiseTags ?? []).length} 个标签 · {profile.knowledgeEntries.length} 条知识
                </p>
              </div>
              {lastChange ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  刚更新 {new Date(lastChange.appliedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] text-slate-400">一句话介绍</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">{profile.headline || "未设置"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] text-slate-400">欢迎语</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">{profile.welcomeMessage || "未设置"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] text-slate-400">擅长标签</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">{(profile.expertiseTags ?? []).join("、") || "未设置"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] text-slate-400">示范回答</p>
                <p className="mt-1 text-sm text-slate-700">{(profile.exampleReplies ?? []).length} 条</p>
              </div>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-sky-700">展开完整状态</summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] text-slate-400">人设与语气</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {[profile.personaArchetype, profile.toneStyle, profile.responseStyle].filter(Boolean).join(" · ") || "未设置"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] text-slate-400">不能回答的问题</p>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-700">{profile.notSuitableFor || "未设置"}</p>
                </div>
              </div>
            </details>

            {lastChange ? (
              <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">本次已影响字段</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {impactedFields.map((item) => (
                        <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">最近指令：{lastChange.message}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLastChange(null);
                        setBanner("这次修改已保留");
                      }}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      保留这次修改
                    </button>
                    <button
                      type="button"
                      onClick={() => void undoLastChange()}
                      disabled={modifyLoading}
                      className="rounded-full bg-[#111] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      撤回上次修改
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4"
          onClick={dismissKeyboard}
          onTouchStart={dismissKeyboard}
          role="presentation"
        >
          <div className="mx-auto max-w-3xl space-y-4 pb-4">
            {banner ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{banner}</div> : null}

            {chatHistory.length === 0 ? (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-1 ring-black/5">
                  AI
                </div>
                <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-[#f0f0f0] px-3.5 py-2.5 text-[15px] leading-relaxed text-[#111] sm:max-w-[72%]">
                  <p className="whitespace-pre-wrap">
                    你可以直接说想改什么，比如“把欢迎语改得更像朋友聊天”“补两条关于留学租房的示范回答”。
                  </p>
                </div>
              </div>
            ) : null}

            {chatHistory.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex items-end gap-2 ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                {item.role === "assistant" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-1 ring-black/5">
                    AI
                  </div>
                ) : null}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed sm:max-w-[72%] ${
                    item.role === "user"
                      ? "rounded-br-md bg-[#1677ff] text-white"
                      : "rounded-bl-md bg-[#f0f0f0] text-[#111]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{item.content}</p>
                </div>
                {item.role === "user" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-400 text-xs font-bold text-white ring-1 ring-white">
                    我
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-3 pb-[env(safe-area-inset-bottom)] pt-2 sm:px-4">
          <div className="mx-auto max-w-3xl">
            <LifeAgentMessageComposer
              formRef={formRef}
              textareaRef={inputRef}
              value={modifyInput}
              onChange={setModifyInput}
              onSubmit={(e) => void submitModify(e)}
              disabled={modifyLoading}
              placeholder={modifyLoading ? "AI 正在处理这次修改…" : "例如：把擅长标签改成考研、转行、找工作"}
              onVoiceFinal={(text) => void submitModify(undefined, text.trim())}
              onTextareaFocus={() => {
                setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 280);
                setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 520);
              }}
              moreOpen={moreOpen}
              onMoreClick={() => setMoreOpen((o) => !o)}
              onCloseMorePanel={() => setMoreOpen(false)}
              morePanel={
                <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-lg">
                  <Link
                    href={`/dashboard/life-agents/${id}`}
                    className="block rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setMoreOpen(false)}
                  >
                    返回工作台
                  </Link>
                  <Link
                    href={`/dashboard/life-agents/${id}/edit`}
                    className="block rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setMoreOpen(false)}
                  >
                    去编辑资料
                  </Link>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
