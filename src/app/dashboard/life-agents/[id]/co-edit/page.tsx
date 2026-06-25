"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LifeAgentMessageComposer } from "@/components/LifeAgentMessageComposer";
import { AgentTypingIndicator } from "@/components/AgentTypingIndicator";
import { AGENT_CATEGORIES } from "@/lib/life-agent-category";
import { WeflowImportGuide } from "@/components/WeflowImportGuide";
import { MindScoreBadge } from "@/components/MindScoreBadge";
import {
  buildPatchPayloadFromProfile,
  fetchManageData,
  PERSONA_OPTIONS,
  RESPONSE_STYLE_OPTIONS,
  summarizeProfileChanges,
  TONE_OPTIONS,
  type ManageData,
  type ManageProfile,
  type MindScoreBreakdown,
  type NextSuggestion,
} from "@/app/dashboard/life-agents/_lib/manage";
import {
  CHAT_PAGE_BACKGROUND_CLASSNAME,
  CHAT_SCROLL_SURFACE_CLASSNAME,
  getChatBubbleClassName,
} from "@/lib/chat-glass";
import {
  DEFAULT_COVER_URL,
  nextLifeAgentCoverFallbackSrc,
  resolveLifeAgentCoverUrl,
} from "@/lib/life-agent-covers";
import { useIsDesktop, useKeyboardViewport, useKeyboardViewportEnabled, chatInputFooterPaddingClass } from "@/hooks/use-keyboard-viewport";

type CoEditEventStatus = "pending" | "processed" | "failed";
type CoEditEventPayload = {
  id: string;
  status: CoEditEventStatus;
  assistantMessage?: string;
  changesSummary?: string;
  errorDetail?: string;
  rawMessage?: string;
};
type ChatRow = {
  role: "user" | "assistant";
  content: string;
  // 仅 assistant 行使用：关联到一条后台调教事件，用于轮询拿到 LLM 理解结果。
  eventId?: string;
  status?: CoEditEventStatus;
  changesSummary?: string;
};
type LastChange = {
  before: ManageProfile;
  after: ManageProfile;
  summary: string[];
  message: string;
  appliedAt: string;
};

const CO_EDIT_PENDING_VOICE_STORAGE_PREFIX = "life-agent-co-edit-pending-voice:";
const RETRACTED_USER_MESSAGE = "你撤回了一条消息";

function storageKey(id: string) {
  return `life-agent-co-edit:${id}`;
}

/** 合并服务器与本地聊天记录：本地更长时保留本地，避免 PUT 未完成时被旧快照覆盖。 */
function pickCoEditChatHistory(serverH: ChatRow[], localH: ChatRow[]): ChatRow[] {
  if (serverH.length === 0) return localH;
  if (localH.length === 0) return serverH;
  if (localH.length > serverH.length) return localH;
  if (serverH.length > localH.length) return serverH;
  return serverH;
}

function pendingVoicePromptKey(id: string) {
  return `${CO_EDIT_PENDING_VOICE_STORAGE_PREFIX}${id}`;
}

function buildProcessedAssistantContent(ev: CoEditEventPayload): string {
  const base = ev.assistantMessage?.trim() || "好的，我已经理解了。";
  const summary = ev.changesSummary?.trim();
  return summary ? `${base}\n\n（已自动应用：${summary}）` : base;
}

function buildFailedAssistantContent(ev: CoEditEventPayload): string {
  const detail = ev.errorDetail?.trim() || "AI 暂时未响应";
  return `（理解未完成：${detail}）\n原话已保存为记忆，稍后可在 Topic 管理里查看。`;
}

function applyCoEditEventToAssistantRow(row: ChatRow, ev: CoEditEventPayload): ChatRow | null {
  if (row.role !== "assistant") return null;
  if (row.eventId && row.eventId !== ev.id) return null;
  if (ev.status === "processed") {
    return {
      ...row,
      eventId: ev.id,
      content: buildProcessedAssistantContent(ev),
      status: "processed",
      changesSummary: ev.changesSummary?.trim(),
    };
  }
  if (ev.status === "failed") {
    return {
      ...row,
      eventId: ev.id,
      content: buildFailedAssistantContent(ev),
      status: "failed",
    };
  }
  if (ev.status === "pending" && !row.eventId) {
    return {
      ...row,
      eventId: ev.id,
      status: "pending",
      content: row.content || "已记录，正在理解中…",
    };
  }
  return null;
}

function reconcileChatHistoryWithEvents(history: ChatRow[], events: CoEditEventPayload[]): ChatRow[] {
  if (events.length === 0) return history;
  const eventMap = new Map(events.map((ev) => [ev.id, ev]));
  const latestByRaw = new Map<string, CoEditEventPayload>();
  for (const ev of events) {
    const raw = ev.rawMessage?.trim();
    if (raw) latestByRaw.set(raw, ev);
  }

  let changed = false;
  const next = history.map((row, index, arr) => {
    if (row.role !== "assistant") return row;

    let ev = row.eventId ? eventMap.get(row.eventId) : undefined;
    if (!ev && (row.status === "pending" || row.content.includes("正在理解"))) {
      const userRow = arr[index - 1];
      if (userRow?.role === "user") {
        ev = latestByRaw.get(userRow.content.trim());
      }
    }
    if (!ev) return row;

    const updated = applyCoEditEventToAssistantRow(row, ev);
    if (!updated || updated === row) return row;
    changed = true;
    return updated;
  });
  return changed ? next : history;
}

function markTimedOutPendingRows(history: ChatRow[]): ChatRow[] {
  let changed = false;
  const next = history.map((row) => {
    if (row.role !== "assistant" || row.status !== "pending") return row;
    changed = true;
    return {
      ...row,
      content: "（理解超时，可能因服务重启中断）\n请重新发送上一条内容。",
      status: "failed" as const,
    };
  });
  return changed ? next : history;
}

function dismissKeyboard() {
  const active = document.activeElement as HTMLElement | null;
  if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
    active.blur();
  }
}

function mergeManageProfile(prev: ManageProfile, patch: Partial<ManageProfile>): ManageProfile {
  return {
    ...prev,
    ...patch,
    knowledgeEntries: patch.knowledgeEntries ?? prev.knowledgeEntries ?? [],
    expertiseTags: patch.expertiseTags ?? prev.expertiseTags ?? [],
    sampleQuestions: patch.sampleQuestions ?? prev.sampleQuestions ?? [],
    exampleReplies: patch.exampleReplies ?? prev.exampleReplies ?? [],
    forbiddenPhrases: patch.forbiddenPhrases ?? prev.forbiddenPhrases ?? [],
    regions: patch.regions ?? prev.regions ?? [],
  };
}

function applyMindScoreUpdate(
  payload: { mindScore?: MindScoreBreakdown; nextSuggestion?: NextSuggestion | null },
  setMindScore: (v: MindScoreBreakdown | null) => void,
  setNextSuggestion: (v: NextSuggestion | null) => void,
  setScoreFlash: (v: number | null) => void,
) {
  if (payload.mindScore) {
    setMindScore(payload.mindScore);
    if (typeof payload.mindScore.delta === "number" && payload.mindScore.delta > 0) {
      setScoreFlash(payload.mindScore.delta);
    }
  }
  if (payload.nextSuggestion !== undefined) {
    setNextSuggestion(payload.nextSuggestion);
  }
}

const profileFieldClassName =
  "mt-1 w-full rounded border border-hairline/50 bg-paper/90 px-2.5 py-2 text-sm text-ink-600 outline-none transition focus:border-ink";

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
  const [profileSaving, setProfileSaving] = useState(false);
  const [mindScore, setMindScore] = useState<MindScoreBreakdown | null>(null);
  const [nextSuggestion, setNextSuggestion] = useState<NextSuggestion | null>(null);
  const [scoreFlash, setScoreFlash] = useState<number | null>(null);
  const [showRetractMenu, setShowRetractMenu] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatHistoryRef = useRef<ChatRow[]>([]);
  const chatHistoryHydratedForRef = useRef<string | null>(null);
  const pendingVoicePromptRef = useRef<string | null>(null);
  const chatViewportRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dismissedSuggestionRuleIdsRef = useRef<Set<string>>(new Set());
  const isDesktop = useIsDesktop();
  const keyboardViewportEnabled = useKeyboardViewportEnabled();
  const [composerFocused, setComposerFocused] = useState(false);
  const { shellStyle, keyboardVisible } = useKeyboardViewport(keyboardViewportEnabled, {
    inputFocused: composerFocused,
    useFixedShell: !isDesktop,
  });

  const scrollChatToEnd = () => {
    const scroller = chatViewportRef.current;
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }
  };

  const setNextSuggestionFiltered = useCallback((suggestion: NextSuggestion | null) => {
    if (suggestion && dismissedSuggestionRuleIdsRef.current.has(suggestion.ruleId)) {
      setNextSuggestion(null);
      return;
    }
    setNextSuggestion(suggestion);
  }, []);

  const dismissNextSuggestion = useCallback(() => {
    if (nextSuggestion?.ruleId) {
      dismissedSuggestionRuleIdsRef.current.add(nextSuggestion.ruleId);
    }
    setNextSuggestion(null);
  }, [nextSuggestion]);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    setCoEditReady(false);
    setChatHistory([]);
    setLastChange(null);
    dismissedSuggestionRuleIdsRef.current.clear();
    chatHistoryHydratedForRef.current = null;
    pendingVoicePromptRef.current = null;
    try {
      const pending = sessionStorage.getItem(pendingVoicePromptKey(id));
      if (pending) {
        pendingVoicePromptRef.current = pending;
        sessionStorage.removeItem(pendingVoicePromptKey(id));
      }
    } catch {
      pendingVoicePromptRef.current = null;
    }
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
    if (!data) return;
    if (data.mindScore) setMindScore(data.mindScore);
    if (data.nextSuggestion) setNextSuggestionFiltered(data.nextSuggestion);
  }, [data]);

  useEffect(() => {
    if (scoreFlash == null) return;
    const t = window.setTimeout(() => setScoreFlash(null), 3200);
    return () => window.clearTimeout(t);
  }, [scoreFlash]);

  useEffect(() => {
    if (!data || data.profile.id !== id) return;
    // 只在进入本 Agent 时拉一次聊天记录；若依赖整个 data，撤回/轮询更新 profile 时会
    // 用服务器旧快照覆盖本地，表现为「刚发的消息没了」。
    if (chatHistoryHydratedForRef.current === id) return;
    chatHistoryHydratedForRef.current = id;
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
        const merged = pickCoEditChatHistory(serverH, localH);

        if (merged.length > 0) {
          setChatHistory(merged);
          const lastChangePayload =
            localH.length > serverH.length
              ? (localParsed?.lastChange ?? null)
              : ((payload?.lastChange as LastChange | null | undefined) ?? localParsed?.lastChange ?? null);
          setLastChange(lastChangePayload);
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
        if (!cancelled) {
          setCoEditReady(true);
          try {
            const eventsRes = await fetch(`/api/life-agents/${id}/co-edit-events?limit=50`, {
              credentials: "include",
            });
            if (eventsRes.ok) {
              const eventsPayload = (await eventsRes.json()) as { events?: CoEditEventPayload[] };
              setChatHistory((prev) => reconcileChatHistoryWithEvents(prev, eventsPayload.events ?? []));
            }
          } catch {
            // ignore reconcile errors; poll will retry later
          }
        }
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

  const updateProfile = useCallback((patch: Partial<ManageProfile>) => {
    setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, ...patch } } : prev));
  }, []);

  const saveProfileFields = useCallback(async () => {
    if (!data || profileSaving || modifyLoading) return;
    setProfileSaving(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/life-agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPatchPayloadFromProfile(data.profile)),
      });
      const next = await res.json().catch(() => null);
      if (!res.ok || !next) {
        setBanner("资料保存失败，请稍后再试");
        return;
      }
      setData((prev) => (prev ? { ...prev, profile: mergeManageProfile(prev.profile, next) } : prev));
      applyMindScoreUpdate(next, setMindScore, setNextSuggestionFiltered, setScoreFlash);
      setBanner("资料已保存");
    } catch {
      setBanner("资料保存失败，请检查网络后重试");
    } finally {
      setProfileSaving(false);
    }
  }, [data, id, modifyLoading, profileSaving]);

  // 同步写入：把原话发到后端立刻拿到 eventId，前端先放一个 "已记录，正在理解中…" 占位。
  // LLM 理解结果通过下面的轮询 effect 回填到对应气泡里。
  const runModify = useCallback(async (msg: string) => {
    if (!data) return;
    const userHistory: ChatRow[] = [
      ...chatHistoryRef.current,
      { role: "user", content: msg },
    ];
    setChatHistory([
      ...userHistory,
      { role: "assistant", content: "已记录，正在理解中…", status: "pending" },
    ]);
    setBanner(null);
    setModifyLoading(true);
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
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { detail?: string; error?: string } | null;
        const detail =
          (typeof errBody?.detail === "string" && errBody.detail) ||
          (typeof errBody?.error === "string" && errBody.error) ||
          `HTTP ${res.status}`;
        console.error("[co-edit] enqueue failed", { status: res.status, body: errBody });
        setChatHistory((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== "assistant") return prev;
          return [
            ...prev.slice(0, -1),
            { ...last, content: `保存失败：${detail}`, status: "failed" },
          ];
        });
        setBanner(`保存失败：${detail}`);
        return;
      }
      const payload = (await res.json().catch(() => null)) as { eventId?: string } | null;
      if (!payload?.eventId) {
        console.error("[co-edit] enqueue response missing eventId", payload);
        setChatHistory((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== "assistant") return prev;
          return [
            ...prev.slice(0, -1),
            { ...last, content: "保存失败：服务器未返回事件 ID", status: "failed" },
          ];
        });
        setBanner("保存失败：服务器未返回事件 ID");
        return;
      }
      const newEventId = payload.eventId;
      setChatHistory((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "assistant") return prev;
        return [
          ...prev.slice(0, -1),
          { ...last, eventId: newEventId, status: "pending" },
        ];
      });
    } catch (err) {
      console.error("[co-edit] enqueue threw", err);
      setChatHistory((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "assistant") return prev;
        return [
          ...prev.slice(0, -1),
          { ...last, content: "网络错误，请稍后再试", status: "failed" },
        ];
      });
      setBanner("网络错误，请稍后再试");
    } finally {
      setModifyLoading(false);
    }
  }, [data, id]);

  // 是否还有 pending 的 assistant 气泡：作为是否启动轮询的开关。
  const hasPendingEvent = useMemo(
    () => chatHistory.some((row) => row.role === "assistant" && row.status === "pending"),
    [chatHistory],
  );

  // 轮询事件接口：把后台理解出的结果回填到对应气泡，并刷新 manage 资料。
  useEffect(() => {
    if (!coEditReady || !data || !hasPendingEvent) return;
    let cancelled = false;
    let attempts = 0;
    let timer: number | null = null;

    const stillHasPending = () =>
      chatHistoryRef.current.some((row) => row.role === "assistant" && row.status === "pending");

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/life-agents/${id}/co-edit-events?limit=50`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`events HTTP ${res.status}`);
        const payload = (await res.json()) as { events?: CoEditEventPayload[] };
        const eventMap = new Map<string, CoEditEventPayload>();
        for (const ev of payload.events ?? []) {
          if (ev?.id) eventMap.set(ev.id, ev);
        }

        let anyProcessed = false;
        let lastProcessedMessage = "";
        setChatHistory((prev) => {
          let mutated = false;
          const next = prev.map((row, index, arr) => {
            if (row.role !== "assistant") return row;

            let ev = row.eventId ? eventMap.get(row.eventId) : undefined;
            if (!ev && row.status === "pending") {
              const userRow = arr[index - 1];
              if (userRow?.role === "user") {
                ev = (payload.events ?? []).find(
                  (item) => item.rawMessage?.trim() === userRow.content.trim(),
                );
              }
            }
            if (!ev) return row;

            const updated = applyCoEditEventToAssistantRow(row, ev);
            if (!updated || updated === row) return row;
            mutated = true;
            if (ev.status === "processed") {
              anyProcessed = true;
              if (ev.rawMessage) lastProcessedMessage = ev.rawMessage;
            }
            return updated;
          });
          return mutated ? next : prev;
        });

        if (anyProcessed) {
          // 至少有一个 event 完成：拉一次最新 manage 资料，更新 profile / mindScore / nextSuggestion 与 lastChange。
          const previousProfile = data.profile;
          const refresh = await fetchManageData(id);
          if (!cancelled && refresh.data) {
            const after = refresh.data.profile;
            const diffSummary = summarizeProfileChanges(previousProfile, after);
            if (diffSummary.length > 0) {
              setLastChange({
                before: previousProfile,
                after,
                summary: diffSummary,
                message: lastProcessedMessage || chatHistoryRef.current.find((r) => r.role === "user")?.content || "",
                appliedAt: new Date().toISOString(),
              });
            }
            setData(refresh.data);
            applyMindScoreUpdate(
              {
                mindScore: refresh.data.mindScore ?? undefined,
                nextSuggestion: refresh.data.nextSuggestion ?? null,
              },
              setMindScore,
              setNextSuggestionFiltered,
              setScoreFlash,
            );
          }
        }
      } catch (err) {
        console.warn("[co-edit] poll error", err);
      }
      if (cancelled) return;
      if (attempts >= 120) {
        setChatHistory((prev) => markTimedOutPendingRows(prev));
        return;
      }
      if (!stillHasPending()) return;
      const delay = attempts > 20 ? 6000 : attempts > 10 ? 4000 : 2000;
      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, 1200);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [coEditReady, data, hasPendingEvent, id]);

  const submitModify = async (e?: FormEvent<HTMLFormElement>, voiceText?: string) => {
    e?.preventDefault();
    const msg = (voiceText ?? modifyInput).trim();
    if (!msg || modifyLoading) return;
    setModifyInput("");
    await runModify(msg);
  };

  useEffect(() => {
    if (!coEditReady || !data || modifyLoading) return;
    const pending = pendingVoicePromptRef.current?.trim();
    if (!pending) return;
    pendingVoicePromptRef.current = null;
    setBanner(`已收到语音指令，正在调教：${pending}`);
    void runModify(pending);
  }, [coEditReady, data, modifyLoading, runModify]);

  const canRetractUserMessage = useCallback((item: ChatRow, index: number, rows: ChatRow[]) => {
    if (item.role !== "user") return false;
    if (item.content.includes(RETRACTED_USER_MESSAGE)) return false;
    if (importLoading) return false;
    const next = rows[index + 1];
    if (next?.role === "assistant" && next.status === "pending") return false;
    return true;
  }, [importLoading]);

  const retractUserMessage = useCallback((index: number) => {
    const rows = chatHistoryRef.current;
    const row = rows[index];
    if (!row || !canRetractUserMessage(row, index, rows)) return;
    const originalContent = row.content;
    setChatHistory((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], content: RETRACTED_USER_MESSAGE };
      if (next[index + 1]?.role === "assistant") {
        next.splice(index + 1, 1);
      }
      return next;
    });
    setLastChange((lc) => (lc?.message === originalContent ? null : lc));
    setShowRetractMenu(null);
    setBanner(null);
  }, [canRetractUserMessage]);

  /** 把「下一步建议」作为 Agent 提问发到对话里，而不是填进输入框。 */
  const postNextSuggestionQuestion = useCallback(() => {
    if (!nextSuggestion || modifyLoading || importLoading) return;
    const question = nextSuggestion.prompt.trim() || nextSuggestion.title.trim();
    if (!question) return;
    setChatHistory((prev) => [...prev, { role: "assistant", content: question }]);
    setNextSuggestion(null);
    setBanner(null);
    window.setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }, 80);
  }, [nextSuggestion, modifyLoading, importLoading]);

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
      setData((prev) => (prev ? { ...prev, profile: lastChange.before } : prev));
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
      setData((prev) =>
        prev && donePayload?.profile
          ? { ...prev, profile: mergeManageProfile(prev.profile, donePayload.profile) }
          : prev
      );
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
    return <div className="mx-auto h-64 max-w-4xl animate-pulse bg-paper-100/60" />;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-[15px] text-ink-400">{loadError ?? "加载失败"}</p>
        <Link href={`/dashboard/life-agents/${id}`} className="btn-primary mt-6 inline-flex">
          返回工作台
        </Link>
      </div>
    );
  }

  const profile = data.profile;
  const agentAvatarUrl =
    resolveLifeAgentCoverUrl(profile.coverImageUrl, profile.coverPresetKey) || DEFAULT_COVER_URL;

  return (
    <div
      className={
        "flex min-w-0 flex-col " +
        `max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-30 max-lg:m-0 max-lg:w-full max-lg:min-h-0 max-lg:overflow-hidden ${CHAT_PAGE_BACKGROUND_CLASSNAME} ` +
        "lg:relative lg:z-auto lg:-mx-4 lg:-mt-8 lg:-mb-8 lg:overflow-visible max-lg:min-h-0"
      }
      style={shellStyle}
    >
      <header className="z-40 shrink-0 border-b border-hairline/30 bg-paper/[0.91] px-4 pb-1 pt-[max(0.25rem,env(safe-area-inset-top))] shadow-[0_4px_28px_-10px_rgba(26,23,20,0.07)] backdrop-blur-xl sm:px-4 lg:sticky lg:top-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push(`/dashboard/life-agents/${id}`);
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-50 text-ink transition active:bg-paper-100/80"
            aria-label="返回"
            title="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl font-medium leading-tight tracking-tight text-ink">对话调教</h1>
          </div>
          <div className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full px-2 text-xs font-medium text-ink-700">
            已调教 {turnCount} 轮
          </div>
        </div>
      </header>

      <div className="flex min-h-0 max-lg:flex-1 flex-col max-lg:overflow-hidden">
        <div className="shrink-0 px-3 py-1.5 text-xs text-ink-400/50 sm:px-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
            <span>像聊天一样改资料，发送后会自动同步当前 Agent 状态。</span>
            <span>历史已保存到服务器，并同步本机缓存</span>
          </div>
        </div>

        <div className="shrink-0 px-3 pb-2 sm:px-4">
          <div className="mx-auto max-w-3xl rounded border border-hairline/40 bg-paper p-3 sm:p-4">
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">当前 Agent 状态</p>
                  <p className="mt-1 text-xs text-ink-400">
                    {profile.displayName} · {(profile.expertiseTags ?? []).length} 个标签 · {(profile.knowledgeEntries ?? []).length} 条知识
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {mindScore ? (
                    <>
                      <MindScoreBadge value={mindScore.total} size="sm" />
                      {scoreFlash != null && scoreFlash > 0 ? (
                        <span className="rounded-full bg-olive-400/20 px-2 py-0.5 text-xs font-bold text-olive-600">
                          +{scoreFlash}
                        </span>
                      ) : null}
                    </>
                  ) : null}
                  {lastChange ? (
                    <span className="rounded bg-paper-200 px-2.5 py-1 text-[10px] font-medium text-ink-700">
                      刚更新
                    </span>
                  ) : null}
                  <svg
                    className="h-4 w-4 text-ink-600/60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded border border-hairline/40 bg-paper-50/40 px-3 py-2.5">
                  <label className="text-[11px] text-ink-400/60" htmlFor="co-edit-headline">
                    一句话介绍
                  </label>
                  <textarea
                    id="co-edit-headline"
                    rows={2}
                    value={profile.headline}
                    onChange={(e) => updateProfile({ headline: e.target.value })}
                    className={profileFieldClassName}
                    placeholder="未设置"
                  />
                </div>
                <div className="rounded border border-hairline/40 bg-paper-50/40 px-3 py-2.5">
                  <label className="text-[11px] text-ink-400/60" htmlFor="co-edit-welcome">
                    欢迎语
                  </label>
                  <textarea
                    id="co-edit-welcome"
                    rows={3}
                    value={profile.welcomeMessage}
                    onChange={(e) => updateProfile({ welcomeMessage: e.target.value })}
                    className={profileFieldClassName}
                    placeholder="未设置"
                  />
                </div>
                <div className="rounded border border-hairline/40 bg-paper-50/40 px-3 py-2.5 sm:col-span-2">
                  <label className="text-[11px] text-ink-400/60" htmlFor="co-edit-examples">
                    示范回答（每行一条）
                  </label>
                  <textarea
                    id="co-edit-examples"
                    rows={3}
                    value={(profile.exampleReplies ?? []).join("\n")}
                    onChange={(e) =>
                      updateProfile({
                        exampleReplies: e.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean),
                      })
                    }
                    className={profileFieldClassName}
                    placeholder="每行写一条示范回答"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[11px] text-ink-400/60">擅长标签</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {AGENT_CATEGORIES.map((cat) => {
                      const selected = (profile.expertiseTags ?? []).includes(cat.label);
                      return (
                        <button
                          key={cat.label}
                          type="button"
                          onClick={() => {
                            const tags = profile.expertiseTags ?? [];
                            updateProfile({
                              expertiseTags: selected
                                ? tags.filter((t) => t !== cat.label)
                                : [...tags, cat.label],
                            });
                          }}
                          className={`rounded-full px-2.5 py-1 text-xs transition ${selected ? "" : "hover:opacity-80"}`}
                          style={{
                            backgroundColor: cat.color + "20",
                            color: cat.color,
                            boxShadow: selected ? `inset 0 0 0 1.5px ${cat.color}` : "none",
                          }}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded border border-hairline/40 bg-paper-50/40 px-3 py-2.5 sm:col-span-2">
                    <p className="text-[11px] text-ink-400/60">人设与语气</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <select
                        value={profile.personaArchetype ?? ""}
                        onChange={(e) => updateProfile({ personaArchetype: e.target.value })}
                        className={profileFieldClassName}
                      >
                        <option value="">角色类型</option>
                        {PERSONA_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <select
                        value={profile.toneStyle ?? ""}
                        onChange={(e) => updateProfile({ toneStyle: e.target.value })}
                        className={profileFieldClassName}
                      >
                        <option value="">语气</option>
                        {TONE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <select
                        value={profile.responseStyle ?? ""}
                        onChange={(e) => updateProfile({ responseStyle: e.target.value })}
                        className={profileFieldClassName}
                      >
                        <option value="">回答习惯</option>
                        {RESPONSE_STYLE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="rounded border border-hairline/40 bg-paper-50/40 px-3 py-2.5 sm:col-span-2">
                    <label className="text-[11px] text-ink-400/60" htmlFor="co-edit-not-suitable">
                      不能回答的问题
                    </label>
                    <textarea
                      id="co-edit-not-suitable"
                      rows={2}
                      value={profile.notSuitableFor ?? ""}
                      onChange={(e) => updateProfile({ notSuitableFor: e.target.value })}
                      className={profileFieldClassName}
                      placeholder="未设置"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => void saveProfileFields()}
                  disabled={profileSaving || modifyLoading}
                  className="btn-primary rounded-full px-5 py-2 text-sm disabled:opacity-50"
                >
                  {profileSaving ? "保存中…" : "保存资料修改"}
                </button>
              </div>

              {lastChange ? (
                <div className="mt-3 rounded border border-hairline/40 bg-paper-50 px-3 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">本次已影响字段</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {impactedFields.map((item) => (
                          <span key={item} className="rounded bg-paper-200 px-2.5 py-1 text-xs font-medium text-ink-700">
                            {item}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-ink-400">最近指令：{lastChange.message}</p>
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
            </details>
          </div>
        </div>

        <div
          ref={chatViewportRef}
          className={`max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-contain px-3 sm:px-4 ${CHAT_SCROLL_SURFACE_CLASSNAME}`}
          onClick={dismissKeyboard}
          onTouchStart={dismissKeyboard}
          role="presentation"
        >
          <div className="mx-auto max-w-3xl space-y-4 pb-4">
            {banner ? (
              <div className="rounded border border-hairline/30 bg-paper-50 px-4 py-3 text-sm text-ink-800">
                {banner}
              </div>
            ) : null}

            {chatHistory.length === 0 ? (
              <div className="flex items-end gap-2 justify-start">
                <img
                  src={agentAvatarUrl}
                  alt={data?.profile.displayName || "Agent"}
                  onError={(e) => {
                    const t = e.currentTarget;
                    const fallback = nextLifeAgentCoverFallbackSrc(t.src);
                    if (fallback && fallback !== t.src) t.src = fallback;
                  }}
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-paper shadow-sm"
                />
                <div className={getChatBubbleClassName("assistant")}>
                  <p className="whitespace-pre-wrap">
                    你可以直接说想改什么，比如“把欢迎语改得更像朋友聊天”“补两条关于留学租房的示范回答”。
                  </p>
                </div>
              </div>
            ) : null}

            {chatHistory.map((item, index) => {
              const canRetract = canRetractUserMessage(item, index, chatHistory);
              const openRetractMenu = () => {
                if (!canRetract) return;
                setShowRetractMenu(index);
              };

              if (item.role === "user") {
                return (
                  <div key={`${item.role}-${index}`} className="flex justify-end">
                    <div className="flex max-w-[85%] flex-col items-end gap-1">
                      <div className="flex items-end gap-2">
                        <div
                          className={getChatBubbleClassName(item.role)}
                          onContextMenu={(e) => {
                            if (!canRetract) return;
                            e.preventDefault();
                            openRetractMenu();
                          }}
                        >
                          <p className="whitespace-pre-wrap">{item.content}</p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-200 text-xs font-semibold text-ink-600">
                          我
                        </div>
                      </div>
                      {canRetract ? (
                        <div className="pr-10">
                          <RecallMessageButton onClick={openRetractMenu} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              }

              return (
              <div key={`${item.role}-${index}`} className="flex items-end gap-2 justify-start">
                <img
                  src={agentAvatarUrl}
                  alt={data?.profile.displayName || "Agent"}
                  onError={(e) => {
                    const t = e.currentTarget;
                    const fallback = nextLifeAgentCoverFallbackSrc(t.src);
                    if (fallback && fallback !== t.src) t.src = fallback;
                  }}
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-paper shadow-sm"
                />
                <div className={getChatBubbleClassName(item.role)}>
                  {item.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <AgentTypingIndicator />
                      <span className="text-xs text-ink-500">{item.content || "正在理解中…"}</span>
                    </div>
                  ) : !item.content.trim() && (modifyLoading || importLoading) ? (
                    <AgentTypingIndicator />
                  ) : (
                    <p
                      className={`whitespace-pre-wrap ${item.status === "failed" ? "text-ink-500" : ""}`}
                    >
                      {item.content}
                    </p>
                  )}
                </div>
              </div>
              );
            })}
            <div ref={endRef} />
          </div>
        </div>

        <div className={`shrink-0 border-t border-hairline/25 bg-paper/[0.94] px-3 pt-2 shadow-[0_-4px_28px_-8px_rgba(26,23,20,0.06)] backdrop-blur-lg sm:px-4 ${chatInputFooterPaddingClass(keyboardVisible)}`}>
          <div className="mx-auto max-w-3xl">
            {nextSuggestion ? (
              <div className="mb-2 rounded border border-hairline/30 bg-paper-50 px-3 py-3">
                <p className="text-sm font-semibold text-ink">{nextSuggestion.title}</p>
                <p className="mt-1 text-xs leading-5 text-ink-500">{nextSuggestion.reason}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => postNextSuggestionQuestion()}
                    disabled={modifyLoading || importLoading}
                    className="rounded-full bg-oxblood px-4 py-1.5 text-xs font-semibold text-paper disabled:opacity-50"
                  >
                    继续调教
                  </button>
                  <button
                    type="button"
                    onClick={dismissNextSuggestion}
                    disabled={modifyLoading || importLoading}
                    className="btn-secondary rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : null}
            <LifeAgentMessageComposer
              formRef={formRef}
              textareaRef={inputRef}
              value={modifyInput}
              onChange={setModifyInput}
              onSubmit={(e) => void submitModify(e)}
              disabled={modifyLoading}
              placeholder={modifyLoading ? "AI 正在处理这次修改…" : "例如：把擅长标签改成考研、转行、找工作"}
              onTextareaFocus={() => {
                setComposerFocused(true);
                setTimeout(scrollChatToEnd, 280);
                setTimeout(scrollChatToEnd, 520);
              }}
              moreOpen={moreOpen}
              onMoreClick={() => setMoreOpen((o) => !o)}
              onCloseMorePanel={() => setMoreOpen(false)}
              morePanel={
                <div className="rounded-2xl border border-hairline/40 bg-paper/[0.98] p-2 backdrop-blur-md">
                  <button
                    type="button"
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink-600 hover:bg-paper-50/90"
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
                    className="block rounded-xl px-3 py-2.5 text-sm text-ink-600 hover:bg-paper-50/90"
                    onClick={() => setMoreOpen(false)}
                  >
                    返回工作台
                  </Link>
                  <Link
                    href={`/dashboard/life-agents/${id}/edit`}
                    className="block rounded-xl px-3 py-2.5 text-sm text-ink-600 hover:bg-paper-50/90"
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
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center bg-ink-600/90 px-4 py-3 text-sm text-paper backdrop-blur-sm">
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

      {showRetractMenu != null ? (
        <RetractConfirmDialog
          open
          onClose={() => setShowRetractMenu(null)}
          onConfirm={() => {
            retractUserMessage(showRetractMenu);
            setShowRetractMenu(null);
          }}
        />
      ) : null}
    </div>
  );
}

function RecallMessageButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full bg-paper-200/90 px-2.5 py-1 text-[11px] font-medium text-ink-500 transition hover:bg-paper-300 hover:text-ink-700"
      aria-label="撤回消息"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 10h10a5 5 0 0 1 5 5v2" />
        <path d="M3 10l4-4" />
        <path d="M3 10l4 4" />
      </svg>
      撤回
    </button>
  );
}

function RetractConfirmDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 max-h-none max-w-none border-0 bg-transparent p-3 backdrop:bg-ink/60 open:flex open:items-end open:justify-center sm:open:items-center"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-t bg-paper p-4 sm:rounded">
        <div className="mb-4 text-center text-sm font-semibold text-ink">撤回消息</div>
        <p className="mb-4 text-center text-xs text-ink-400">
          仅隐藏本条对话；若已改 Agent 资料，请用上方「撤回上次修改」恢复。
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded bg-paper-200 px-4 py-3 text-sm font-medium text-ink-600 transition active:bg-paper-300"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded bg-oxblood-600 px-4 py-3 text-sm font-medium text-paper transition active:bg-oxblood-700"
          >
            撤回
          </button>
        </div>
      </div>
    </dialog>
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

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
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 max-h-none max-w-none border-0 bg-transparent p-3 backdrop:bg-ink/50 open:flex open:items-center open:justify-center"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div
        className="mx-auto w-full max-w-md max-h-[min(92vh,720px)] overflow-y-auto overscroll-contain rounded border border-hairline/30 bg-paper p-5 sm:max-w-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold text-ink-700">导入聊天记录</h3>
        <p className="mb-3 text-sm text-ink-400">
          上传导出文件后，AI 会分析聊天风格与语气，并用于优化 Agent 人设与知识。
        </p>

        <details className="mb-4 rounded border border-hairline/50 bg-paper-50/50 px-3.5 py-2.5 text-sm open:bg-paper-50/80">
          <summary className="cursor-pointer select-none font-medium text-ink-800 outline-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              用 WeFlow 导出 CSV：图文步骤
            </span>
          </summary>
          <WeflowImportGuide />
        </details>
        <p className="mb-4 text-xs text-ink-400">
          也支持 WeChatMsg、留痕等导出的 <strong className="font-medium text-ink-600">HTML / TXT</strong>。上传后在下方选择{" "}
          <strong className="font-medium text-ink-600">Agent 本人的昵称</strong>。开发者可另见{" "}
          <a
            href="https://github.com/hicccc77/WeFlow/blob/main/docs/HTTP-API.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-600 underline decoration-hairline underline-offset-2 hover:text-ink-700"
          >
            WeFlow HTTP API
          </a>
          。
        </p>

        {/* File input */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-600">选择文件</label>
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
            className="flex w-full items-center gap-2 rounded border border-dashed border-hairline/60 bg-paper-50/40 px-4 py-3 text-sm text-ink-500 transition hover:border-ink active:bg-paper-50/80"
            onClick={() => fileRef.current?.click()}
            disabled={parsing || loading}
          >
            <svg className="h-5 w-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {parsing ? "解析中..." : file ? file.name : "点击选择 HTML / CSV / TXT 文件"}
          </button>
          <p className="mt-1 text-xs text-ink-300">
            WeFlow 请上传 <code className="text-[11px]">texts</code> 内 WeClone CSV；亦支持 WeChatMsg、留痕等 HTML / CSV / TXT
          </p>
        </div>

        {/* Parse error */}
        {parseError ? (
          <div className="mb-4 rounded border border-oxblood-200 bg-oxblood-50 px-3.5 py-2.5 text-sm text-oxblood-600">{parseError}</div>
        ) : null}

        {/* Sender selector — shown after successful parse */}
        {senders && senders.length > 0 ? (
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-ink-600">
              选择 Agent 本人的昵称
            </label>
            <select
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="w-full rounded border border-hairline/50 bg-paper px-3.5 py-2.5 text-sm text-ink-700 outline-none transition focus:border-ink"
            >
              <option value="">请选择…</option>
              {senders.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-300">
              共解析到 {totalMessages} 条消息，{senders.length} 位参与者。选择 Agent 本人的昵称，将只分析该人的发言风格。
            </p>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded px-4 py-2 text-sm text-ink-400 transition active:bg-paper-200"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded bg-ink px-5 py-2 text-sm font-medium text-paper disabled:opacity-50"
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
    </dialog>
  );
}
