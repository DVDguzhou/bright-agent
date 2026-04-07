"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();
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
  const [coEditReady, setCoEditReady] = useState(false);
  const chatHistoryRef = useRef<ChatRow[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    setCoEditReady(false);
    setChatHistory([]);
    setLastChange(null);
  }, [id]);

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
    if (!data || data.profile.id !== id) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/life-agents/${id}/co-edit-state`, { credentials: "include" });
        let payload: { chatHistory?: unknown; lastChange?: unknown } | null = null;
        if (res.ok) {
          payload = (await res.json()) as { chatHistory?: unknown; lastChange?: unknown };
        }
        if (cancelled) return;

        let localParsed: { chatHistory?: ChatRow[]; lastChange?: LastChange | null } | null = null;
        try {
          const raw = localStorage.getItem(storageKey(id));
          if (raw) localParsed = JSON.parse(raw) as { chatHistory?: ChatRow[]; lastChange?: LastChange | null };
        } catch {
          // ignore
        }

        const serverH = Array.isArray(payload?.chatHistory) ? (payload!.chatHistory as ChatRow[]) : [];
        const localH = Array.isArray(localParsed?.chatHistory) ? localParsed!.chatHistory! : [];

        if (serverH.length > 0) {
          setChatHistory(serverH);
          setLastChange((payload?.lastChange as LastChange | null | undefined) ?? null);
        } else if (localH.length > 0) {
          setChatHistory(localH);
          setLastChange(localParsed?.lastChange ?? null);
        } else {
          setChatHistory([]);
          setLastChange(null);
        }
      } catch {
        if (!cancelled) {
          try {
            const raw = localStorage.getItem(storageKey(id));
            if (raw) {
              const parsed = JSON.parse(raw) as { chatHistory?: ChatRow[]; lastChange?: LastChange | null };
              if (Array.isArray(parsed.chatHistory)) setChatHistory(parsed.chatHistory);
              if (parsed.lastChange !== undefined) setLastChange(parsed.lastChange);
            }
          } catch {
            // ignore
          }
        }
      } finally {
        if (!cancelled) setCoEditReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, id]);

  useEffect(() => {
    if (!coEditReady || !data || data.profile.id !== id) return;
    try {
      localStorage.setItem(storageKey(id), JSON.stringify({ chatHistory, lastChange }));
    } catch {
      // ignore quota error
    }
  }, [chatHistory, lastChange, coEditReady, data, id]);

  useEffect(() => {
    if (!coEditReady || !data || data.profile.id !== id) return;
    const t = window.setTimeout(() => {
      void fetch(`/api/life-agents/${id}/co-edit-state`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory, lastChange }),
      }).catch(() => {
        /* 离线时仅依赖 localStorage */
      });
    }, 650);
    return () => window.clearTimeout(t);
  }, [chatHistory, lastChange, coEditReady, data, id]);

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
    return <div className="mx-auto h-64 max-w-4xl animate-pulse rounded-[28px] bg-gradient-to-br from-violet-100/90 to-fuchsia-100/50 shadow-[0_6px_28px_rgba(124,58,237,0.08)] ring-1 ring-purple-200/20" />;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-[15px] text-slate-500">{loadError ?? "加载失败"}</p>
        <Link href={`/dashboard/life-agents/${id}`} className="btn-primary mt-6 inline-flex">
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
        "max-lg:fixed max-lg:inset-0 max-lg:z-30 max-lg:m-0 max-lg:w-full max-lg:bg-gradient-to-b max-lg:from-[#F3EFFF] max-lg:via-violet-50/40 max-lg:to-white max-lg:min-h-0 " +
        "lg:relative lg:z-auto lg:-mx-4 lg:-mt-8 lg:-mb-8 lg:min-h-[calc(100dvh-4rem)] lg:bg-gradient-to-b lg:from-[#F3EFFF]/80 lg:via-violet-50/30 lg:to-white max-lg:min-h-0"
      }
    >
      <header className="z-40 shrink-0 border-b border-purple-200/[0.18] bg-white/[0.91] px-4 pb-1 pt-[max(0.25rem,env(safe-area-inset-top))] shadow-[0_4px_28px_-10px_rgba(124,58,237,0.08)] backdrop-blur-xl sm:px-4 lg:sticky lg:top-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push(`/dashboard/life-agents/${id}`);
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-950/90 transition active:bg-purple-100/80"
            aria-label="返回"
            title="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-purple-950/90">对话调教</h1>
          </div>
          <div className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full px-2 text-xs font-medium text-purple-800">
            已调教 {turnCount} 轮
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-3 py-1.5 text-xs text-purple-900/50 sm:px-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
            <span>像聊天一样改资料，发送后会自动同步当前 Agent 状态。</span>
            <span>历史已保存到服务器，并同步本机缓存</span>
          </div>
        </div>

        <div className="shrink-0 px-3 pb-3 sm:px-4">
          <div className="mx-auto max-w-3xl rounded-[22px] border border-purple-200/[0.22] bg-white/[0.98] p-4 shadow-[0_6px_30px_-12px_rgba(124,58,237,0.09)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-purple-950/90">当前 Agent 状态</p>
                <p className="mt-1 text-xs text-slate-500">
                  {profile.displayName} · {(profile.expertiseTags ?? []).length} 个标签 · {profile.knowledgeEntries.length} 条知识
                </p>
              </div>
              {lastChange ? (
                <span className="rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 px-3 py-1 text-xs font-medium text-purple-800 ring-1 ring-purple-200/40">
                  刚更新 {new Date(lastChange.appliedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-purple-100/40 bg-violet-50/40 px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[11px] text-purple-600/55">一句话介绍</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">{profile.headline || "未设置"}</p>
              </div>
              <div className="rounded-xl border border-purple-100/40 bg-violet-50/40 px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[11px] text-purple-600/55">欢迎语</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">{profile.welcomeMessage || "未设置"}</p>
              </div>
              <div className="rounded-xl border border-purple-100/40 bg-violet-50/40 px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[11px] text-purple-600/55">擅长标签</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">{(profile.expertiseTags ?? []).join("、") || "未设置"}</p>
              </div>
              <div className="rounded-xl border border-purple-100/40 bg-violet-50/40 px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[11px] text-purple-600/55">示范回答</p>
                <p className="mt-1 text-sm text-slate-700">{(profile.exampleReplies ?? []).length} 条</p>
              </div>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-purple-800">展开完整状态</summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-purple-100/40 bg-violet-50/40 px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-[11px] text-purple-600/55">人设与语气</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {[profile.personaArchetype, profile.toneStyle, profile.responseStyle].filter(Boolean).join(" · ") || "未设置"}
                  </p>
                </div>
                <div className="rounded-xl border border-purple-100/40 bg-violet-50/40 px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-[11px] text-purple-600/55">不能回答的问题</p>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-700">{profile.notSuitableFor || "未设置"}</p>
                </div>
              </div>
            </details>

            {lastChange ? (
              <div className="mt-3 rounded-2xl border border-purple-200/[0.22] bg-gradient-to-r from-violet-50/[0.92] to-fuchsia-50/[0.75] px-3 py-3 backdrop-blur-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-950/90">本次已影响字段</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {impactedFields.map((item) => (
                        <span key={item} className="rounded-full bg-white/[0.95] px-2.5 py-1 text-xs font-medium text-purple-800 ring-1 ring-purple-200/40">
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
                      className="btn-secondary rounded-full px-4 py-2 text-sm"
                    >
                      保留这次修改
                    </button>
                    <button
                      type="button"
                      onClick={() => void undoLastChange()}
                      disabled={modifyLoading}
                      className="btn-primary rounded-full px-4 py-2 text-sm disabled:opacity-50"
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
            {banner ? (
              <div className="rounded-2xl border border-purple-200/[0.2] bg-gradient-to-r from-violet-50/90 to-fuchsia-50/70 px-4 py-3 text-sm text-purple-900/85 backdrop-blur-sm">
                {banner}
              </div>
            ) : null}

            {chatHistory.length === 0 ? (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#BA68C8] to-[#FF80AB] text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                  AI
                </div>
                <div className="max-w-[78%] rounded-[22px] rounded-bl-md border border-purple-200/[0.2] bg-white/[0.97] px-3.5 py-2.5 text-[15px] leading-relaxed text-slate-800 shadow-sm backdrop-blur-sm sm:max-w-[72%]">
                  <p className="whitespace-pre-wrap">
                    你可以直接说想改什么，比如“把欢迎语改得更像朋友聊天”“补两条关于留学租房的示范回答”。
                  </p>
                </div>
              </div>
            ) : null}

            {chatHistory.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex items-end gap-2 ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                {item.role === "assistant" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#BA68C8] to-[#FF80AB] text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                    AI
                  </div>
                ) : null}
                <div
                  className={`max-w-[78%] rounded-[22px] px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm sm:max-w-[72%] ${
                    item.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-[#FF85D0] to-[#A88BEB] text-white shadow-[0_6px_20px_-6px_rgba(168,139,235,0.35)]"
                      : "rounded-bl-md border border-purple-200/[0.2] bg-white/[0.97] text-slate-800 backdrop-blur-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{item.content}</p>
                </div>
                {item.role === "user" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF176] to-[#FF80AB] text-xs font-bold text-slate-900 shadow-sm ring-2 ring-white">
                    我
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-purple-200/[0.16] bg-white/[0.94] px-3 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_28px_-8px_rgba(124,58,237,0.07)] backdrop-blur-lg sm:px-4">
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
                <div className="rounded-2xl border border-purple-200/[0.22] bg-white/[0.98] p-2 shadow-[0_8px_36px_-10px_rgba(124,58,237,0.1)] backdrop-blur-md">
                  <Link
                    href={`/dashboard/life-agents/${id}`}
                    className="block rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-purple-50/90"
                    onClick={() => setMoreOpen(false)}
                  >
                    返回工作台
                  </Link>
                  <Link
                    href={`/dashboard/life-agents/${id}/edit`}
                    className="block rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-purple-50/90"
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
