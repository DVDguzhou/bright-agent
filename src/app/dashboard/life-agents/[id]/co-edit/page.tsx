"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LifeAgentMessageComposer } from "@/components/LifeAgentMessageComposer";
import { WeflowImportGuide } from "@/components/WeflowImportGuide";
import {
  buildPatchPayloadFromProfile,
  fetchManageData,
  summarizeProfileChanges,
  type ManageData,
  type ManageProfile,
} from "@/app/dashboard/life-agents/_lib/manage";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import {
  CHAT_PAGE_BACKGROUND_CLASSNAME,
  CHAT_SCROLL_SURFACE_CLASSNAME,
  getChatBubbleClassName,
} from "@/lib/chat-glass";

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
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const userHistory = [...chatHistoryRef.current, { role: "user" as const, content: msg }];
    const assistantRowIndex = userHistory.length;
    setModifyLoading(true);
    setBanner(null);
    setChatHistory([...userHistory, { role: "assistant", content: "" }]);

    const replaceAssistantMessage = (text: string) => {
      setChatHistory((prev) => {
        const trimmed =
          prev.length > 0 &&
          prev[prev.length - 1].role === "assistant" &&
          prev[prev.length - 1].content === ""
            ? prev.slice(0, -1)
            : prev;
        return [...trimmed, { role: "assistant" as const, content: text }];
      });
    };

    try {
      const res = await fetch(`/api/life-agents/${id}/modify-via-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg,
          chatHistory: userHistory.map((item) => ({ role: item.role, content: item.content })),
        }),
      });

      const ct = res.headers.get("content-type") || "";

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { detail?: string } | null;
        replaceAssistantMessage(
          typeof errBody?.detail === "string" ? errBody.detail : "修改失败，请重试"
        );
        return;
      }

      if (ct.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let donePayload: { assistantMessage?: string; profile?: ManageProfile } | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            let eventType = "";
            let eventData = "";
            for (const line of part.split("\n")) {
              if (line.startsWith("event: ")) eventType = line.slice(7).trim();
              else if (line.startsWith("data: ")) eventData = line.slice(6);
            }
            if (!eventData) continue;
            try {
              const parsed = JSON.parse(eventData) as Record<string, unknown>;
              if (eventType === "content" && typeof parsed.content === "string") {
                setChatHistory((prev) =>
                  prev.map((row, i) =>
                    i === assistantRowIndex ? { ...row, content: row.content + parsed.content } : row
                  )
                );
              } else if (eventType === "done") {
                donePayload = parsed as { assistantMessage?: string; profile?: ManageProfile };
              }
            } catch {
              // ignore malformed SSE
            }
          }
        }

        const next = donePayload;
        if (!next?.profile) {
          replaceAssistantMessage("修改失败，请重试");
          return;
        }
        const summary = summarizeProfileChanges(previousProfile, next.profile);
        setLastChange({
          before: previousProfile,
          after: next.profile,
          summary,
          message: msg,
          appliedAt: new Date().toISOString(),
        });
        const profileAfter = next.profile;
        setData((prev) => (prev ? { ...prev, profile: profileAfter } : prev));
        setChatHistory((prev) =>
          prev.map((row, i) =>
            i === assistantRowIndex
              ? {
                  ...row,
                  content: next.assistantMessage || row.content || "我已经按你的要求完成修改。",
                }
              : row
          )
        );
        return;
      }

      const next = (await res.json().catch(() => null)) as {
        assistantMessage?: string;
        profile?: ManageProfile;
        detail?: string;
      } | null;
      if (!next?.profile) {
        replaceAssistantMessage(next?.detail || "修改失败，请重试");
        return;
      }
      const summary = summarizeProfileChanges(previousProfile, next.profile);
      setChatHistory((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: next.assistantMessage || "我已经按你的要求完成修改。" },
      ]);
      const profileAfter = next.profile;
      setLastChange({
        before: previousProfile,
        after: profileAfter,
        summary,
        message: msg,
        appliedAt: new Date().toISOString(),
      });
      setData((prev) => (prev ? { ...prev, profile: profileAfter } : prev));
    } catch {
      replaceAssistantMessage("请求失败，请检查网络后重试");
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

  const handleImportChat = useCallback(async (file: File, targetName: string) => {
    if (!data) return;
    const previousProfile = data.profile;
    setImportLoading(true);
    setImportProgress("正在上传并解析聊天记录...");
    setBanner(null);
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: `导入聊天记录：${file.name}（分析「${targetName}」的发言风格）` },
      { role: "assistant", content: "" },
    ]);
    const assistantIdx = chatHistoryRef.current.length + 1;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetName", targetName);

      const res = await fetch(`/api/life-agents/${id}/import-chat`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const ct = res.headers.get("content-type") || "";

      if (!ct.includes("text/event-stream")) {
        const errBody = await res.json().catch(() => null);
        const detail = errBody?.detail || errBody?.error || "导入失败，请重试";
        setChatHistory((prev) =>
          prev.map((row, i) => (i === assistantIdx ? { ...row, content: detail } : row))
        );
        setImportProgress(null);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let donePayload: { assistantMessage?: string; profile?: ManageProfile } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          let eventType = "";
          let eventData = "";
          for (const line of part.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) eventData = line.slice(6);
          }
          if (!eventData) continue;
          try {
            const parsed = JSON.parse(eventData);
            if (eventType === "progress") {
              setImportProgress(
                `已解析 ${parsed.totalMessages} 条消息（${parsed.targetMessages} 条来自目标），正在 AI 分析风格...`
              );
            } else if (eventType === "error") {
              setChatHistory((prev) =>
                prev.map((row, i) =>
                  i === assistantIdx ? { ...row, content: parsed.detail || "分析出错" } : row
                )
              );
            } else if (eventType === "done") {
              donePayload = parsed;
            }
          } catch {
            // ignore malformed SSE
          }
        }
      }

      if (!donePayload?.profile) {
        setChatHistory((prev) =>
          prev.map((row, i) =>
            i === assistantIdx ? { ...row, content: donePayload?.assistantMessage || "分析完成，但未产生修改。" } : row
          )
        );
        return;
      }

      const summary = summarizeProfileChanges(previousProfile, donePayload.profile);
      setLastChange({
        before: previousProfile,
        after: donePayload.profile,
        summary,
        message: `导入聊天记录：${file.name}`,
        appliedAt: new Date().toISOString(),
      });
      setData((prev) => (prev ? { ...prev, profile: donePayload!.profile! } : prev));
      setChatHistory((prev) =>
        prev.map((row, i) =>
          i === assistantIdx
            ? { ...row, content: donePayload!.assistantMessage || "已根据聊天记录分析结果更新 Agent 风格和知识库。" }
            : row
        )
      );
    } catch {
      setChatHistory((prev) =>
        prev.map((row, i) =>
          i === assistantIdx ? { ...row, content: "导入失败，请检查网络后重试。" } : row
        )
      );
    } finally {
      setImportLoading(false);
      setImportProgress(null);
      setImportOpen(false);
    }
  }, [data, id]);

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
        `max-lg:fixed max-lg:inset-0 max-lg:z-30 max-lg:m-0 max-lg:w-full max-lg:min-h-0 ${CHAT_PAGE_BACKGROUND_CLASSNAME} ` +
        "lg:relative lg:z-auto lg:-mx-4 lg:-mt-8 lg:-mb-8 lg:min-h-[calc(100dvh-4rem)] max-lg:min-h-0"
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
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                  {cleanLifeAgentIntroText(profile.headline, profile.displayName) || "未设置"}
                </p>
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
          className={`flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 ${CHAT_SCROLL_SURFACE_CLASSNAME}`}
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
                <div className={getChatBubbleClassName("assistant")}>
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
                <div className={getChatBubbleClassName(item.role)}>
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
                  <button
                    type="button"
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-purple-50/90"
                    onClick={() => {
                      setMoreOpen(false);
                      setImportOpen(true);
                    }}
                    disabled={importLoading || modifyLoading}
                  >
                    导入聊天记录
                  </button>
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

      {/* Import progress banner */}
      {importProgress ? (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center bg-violet-600/90 px-4 py-3 text-sm text-white backdrop-blur-sm">
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {importProgress}
        </div>
      ) : null}

      {/* Import chat modal */}
      {importOpen ? (
        <ImportChatModal
          onClose={() => setImportOpen(false)}
          onSubmit={handleImportChat}
          loading={importLoading}
          agentId={id}
        />
      ) : null}
    </div>
  );
}

function ImportChatModal({
  onClose,
  onSubmit,
  loading,
  agentId,
}: {
  onClose: () => void;
  onSubmit: (file: File, targetName: string) => void;
  loading: boolean;
  agentId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [targetName, setTargetName] = useState("");
  const [senders, setSenders] = useState<string[] | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const accept = ".html,.htm,.csv,.txt";

  const handleFileChange = async (f: File) => {
    setFile(f);
    setSenders(null);
    setTargetName("");
    setParseError(null);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch(`/api/life-agents/${agentId}/parse-chat`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "解析失败" }));
        setParseError(err.detail || "解析失败，请检查文件格式");
        return;
      }
      const data = await res.json();
      const list: string[] = data.senders ?? [];
      setSenders(list);
      setTotalMessages(data.totalMessages ?? 0);
      if (list.length === 1) {
        setTargetName(list[0]);
      }
    } catch {
      setParseError("网络错误，请重试");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-md max-h-[min(92vh,720px)] overflow-y-auto overscroll-contain rounded-2xl border border-purple-200/30 bg-white p-5 shadow-2xl sm:max-w-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold text-slate-800">导入聊天记录</h3>
        <p className="mb-3 text-sm text-slate-500">
          上传导出文件后，AI 会分析聊天风格与语气，并用于优化 Agent 人设与知识。
        </p>

        <details className="mb-4 rounded-xl border border-purple-100 bg-purple-50/50 px-3.5 py-2.5 text-sm open:bg-purple-50/80">
          <summary className="cursor-pointer select-none font-medium text-violet-900 outline-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              用 WeFlow 导出 CSV：图文步骤
            </span>
          </summary>
          <WeflowImportGuide />
        </details>
        <p className="mb-4 text-xs text-slate-500">
          也支持 WeChatMsg、留痕等导出的 <strong className="font-medium text-slate-700">HTML / TXT</strong>。上传后在下方选择{" "}
          <strong className="font-medium text-slate-700">Agent 本人的昵称</strong>。开发者可另见{" "}
          <a
            href="https://github.com/hicccc77/WeFlow/blob/main/docs/HTTP-API.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-700"
          >
            WeFlow HTTP API
          </a>
          。
        </p>

        {/* File input */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">选择文件</label>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileChange(f);
            }}
          />
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-purple-300/60 bg-purple-50/40 px-4 py-3 text-sm text-slate-600 transition hover:border-purple-400 hover:bg-purple-50/80"
            onClick={() => fileRef.current?.click()}
            disabled={parsing || loading}
          >
            <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {parsing ? "解析中..." : file ? file.name : "点击选择 HTML / CSV / TXT 文件"}
          </button>
          <p className="mt-1 text-xs text-slate-400">
            WeFlow 请上传 <code className="text-[11px]">texts</code> 内 WeClone CSV；亦支持 WeChatMsg、留痕等 HTML / CSV / TXT
          </p>
        </div>

        {/* Parse error */}
        {parseError ? (
          <div className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{parseError}</div>
        ) : null}

        {/* Sender selector — shown after successful parse */}
        {senders && senders.length > 0 ? (
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              选择 Agent 本人的昵称
            </label>
            <select
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="w-full rounded-xl border border-purple-200/50 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
            >
              <option value="">请选择…</option>
              {senders.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              共解析到 {totalMessages} 条消息，{senders.length} 位参与者。选择 Agent 本人的昵称，将只分析该人的发言风格。
            </p>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
            disabled={!file || !targetName || loading || parsing}
            onClick={() => {
              if (file && targetName) {
                onSubmit(file, targetName);
              }
            }}
          >
            {loading ? "分析中..." : "一键分析并应用"}
          </button>
        </div>
      </div>
    </div>
  );
}
