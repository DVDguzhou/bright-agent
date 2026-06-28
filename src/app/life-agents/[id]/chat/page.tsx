"use client";

import { FormEvent, MouseEvent, TouchEvent, useCallback, useEffect, useRef, useState } from "react";
import { cleanLifeAgentIntroMultiline, cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { VoiceMessageBubble, VoiceMessageLoadingBubble, VoiceReplyToggle } from "@/components/voice";
import { LifeAgentMessageComposer } from "@/components/LifeAgentMessageComposer";
import { UserAvatar } from "@/components/UserAvatar";
import { AgentTypingIndicator } from "@/components/AgentTypingIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { resolveLifeAgentCoverDisplayUrl } from "@/lib/life-agent-covers";
import {
  CHAT_PAGE_BACKGROUND_CLASSNAME,
  CHAT_SCROLL_SURFACE_CLASSNAME,
  getChatBubbleClassName,
} from "@/lib/chat-glass";
import { useIsDesktop, useKeyboardViewport, useKeyboardViewportEnabled, chatInputFooterPaddingClass } from "@/hooks/use-keyboard-viewport";
import { LIFE_AGENT_UNLIMITED_CHAT, lifeAgentShowsPurchaseUi } from "@/lib/life-agent-commerce";
import {
  buildGrowthQuestion,
  fetchLifeAgentGrowthLog,
  formatGrowthFreshDays,
  growthEventCategory,
  LIFE_AGENT_GROWTH_CATEGORY_LABELS,
  type LifeAgentGrowthEvent,
} from "@/lib/life-agent-growth";
import { CitedMessageContent } from "@/components/citations/CitedMessageContent";
import { CitationPanel, CitationSourceChips } from "@/components/citations/CitationPanel";
import {
  attributionHint,
  parseCiteIndex,
  type CitationReference,
  type ReplyAttribution,
} from "@/lib/citations";

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
  references?: CitationReference[];
  attribution?: ReplyAttribution;
  pending?: boolean;
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

const FEEDBACK_PRIMARY = [
  { id: "helpful", label: "有帮助" },
  { id: "not_suitable", label: "没帮助" },
] as const;

const FEEDBACK_DETAIL = [
  { id: "not_specific", label: "不够具体" },
  { id: "factual_error", label: "事实错了" },
  { id: "contradiction", label: "前后矛盾" },
  { id: "too_confident", label: "太武断了" },
] as const;

function FeedbackThumbUp({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
      />
    </svg>
  );
}

function FeedbackThumbDown({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79-.44 1.06L9.83 23 16.41 16.41c.37-.36.59-.86.59-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"
      />
    </svg>
  );
}

function feedbackChipClass(isSelected: boolean, hasSelection: boolean, isHelpfulTone: boolean) {
  if (isSelected) {
    return isHelpfulTone
      ? "border-olive-400 bg-olive-400/15 text-olive-600"
      : "border-oxblood-200 bg-paper-200 text-oxblood-600";
  }
  if (hasSelection) return "border-hairline bg-paper-50 text-ink-300";
  return "border-hairline bg-paper-50 text-ink-600 hover:bg-paper-100";
}

function feedbackOptionalComment(feedbackType: string) {
  return feedbackType === "helpful" || feedbackType === "not_suitable";
}

function isAssistantTurnTail(messages: ChatMessage[], index: number) {
  const message = messages[index];
  if (message.role !== "assistant") return false;
  return index + 1 >= messages.length || messages[index + 1].role !== "assistant";
}

function shouldShowAssistantAvatar(messages: ChatMessage[], index: number) {
  return index === 0 || messages[index - 1]?.role !== "assistant";
}

function applySegmentStart(
  prev: ChatMessage[],
  assistantIdx: number,
  segment: {
    index: number;
    messageId?: string;
    references?: CitationReference[];
    attribution?: ReplyAttribution;
  },
  sessionId?: string
): ChatMessage[] {
  const msg: ChatMessage = {
    role: "assistant",
    content: "",
    messageId: segment.messageId,
    sessionId,
    references: segment.references,
    attribution: segment.attribution,
    pending: false,
  };
  if (segment.index === 0) {
    return prev.map((m, i) => (i === assistantIdx ? msg : m));
  }
  const insertAt = assistantIdx + segment.index;
  return [...prev.slice(0, insertAt), msg, ...prev.slice(insertAt)];
}

function appendSegmentContent(
  prev: ChatMessage[],
  assistantIdx: number,
  segmentIndex: number,
  chunk: string
): ChatMessage[] {
  const targetIdx = assistantIdx + segmentIndex;
  return prev.map((m, i) =>
    i === targetIdx ? { ...m, content: m.content + chunk, pending: false } : m
  );
}

function applySegmentMessage(
  prev: ChatMessage[],
  assistantIdx: number,
  segment: {
    index: number;
    content: string;
    messageId?: string;
    references?: CitationReference[];
    attribution?: ReplyAttribution;
  },
  sessionId?: string
): ChatMessage[] {
  const msg: ChatMessage = {
    role: "assistant",
    content: segment.content,
    messageId: segment.messageId,
    sessionId,
    references: segment.references,
    attribution: segment.attribution,
    pending: false,
  };
  if (segment.index === 0) {
    return prev.map((m, i) => (i === assistantIdx ? msg : m));
  }
  const insertAt = assistantIdx + segment.index;
  return [...prev.slice(0, insertAt), msg, ...prev.slice(insertAt)];
}

function applyDoneAssistantMessages(
  prev: ChatMessage[],
  assistantIdx: number,
  data: {
    reply?: string;
    replySegments?: string[];
    messageIds?: string[];
    messageId?: string;
    sessionId?: string;
    references?: ChatMessage["references"];
    segmentReferences?: Array<ChatMessage["references"]>;
    generationReferences?: ChatMessage["references"];
    attribution?: ChatMessage["attribution"];
    audioUrl?: string;
    audioDurationSec?: number;
  },
  segmentsAlreadyStreamed = false
): ChatMessage[] {
  if (segmentsAlreadyStreamed) {
    const ids = data.messageIds ?? [];
    const segCount = Math.max(ids.length, 1);
    const lastIdx = assistantIdx + segCount - 1;
    return prev.map((m, i) => {
      if (i < assistantIdx || i > lastIdx || m.role !== "assistant") return m;
      const segIndex = i - assistantIdx;
      return {
        ...m,
        messageId: ids[segIndex] ?? m.messageId ?? data.messageId,
        sessionId: data.sessionId,
        references: m.references ?? data.segmentReferences?.[segIndex] ?? data.references,
        attribution: m.attribution ?? data.attribution,
        pending: false,
        ...(i === lastIdx
          ? { audioUrl: data.audioUrl, audioDurationSec: data.audioDurationSec }
          : {}),
      };
    });
  }

  const segments =
    Array.isArray(data.replySegments) && data.replySegments.length > 1 ? data.replySegments : null;
  if (!segments) {
    return prev.map((m, i) =>
      i === assistantIdx
        ? {
            ...m,
            content: data.reply || m.content,
            messageId: data.messageId,
            sessionId: data.sessionId,
            references: data.segmentReferences?.[0] ?? data.references ?? m.references,
            attribution: data.attribution,
            audioUrl: data.audioUrl,
            audioDurationSec: data.audioDurationSec,
            pending: false,
          }
        : m
    );
  }
  const before = prev.slice(0, assistantIdx);
  const ids = data.messageIds ?? [];
  const last = segments.length - 1;
  const segMessages: ChatMessage[] = segments.map((seg, i) => ({
    role: "assistant",
    content: seg,
    messageId: ids[i] ?? (i === last ? data.messageId : undefined),
    sessionId: data.sessionId,
    references: data.segmentReferences?.[i] ?? data.references,
    attribution: data.attribution,
    audioUrl: i === last ? data.audioUrl : undefined,
    audioDurationSec: i === last ? data.audioDurationSec : undefined,
    pending: false,
  }));
  return [...before, ...segMessages];
}

export default function LifeAgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const id = params.id as string;
  const initialRequestedSessionIdRef = useRef(searchParams.get("sessionId"));
  const initialPrefillRef = useRef(searchParams.get("prefill") ?? "");
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [recentGrowthEvents, setRecentGrowthEvents] = useState<LifeAgentGrowthEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [submittingFeedbackId, setSubmittingFeedbackId] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Record<string, string>>({});
  const [feedbackComment, setFeedbackComment] = useState<Record<string, string>>({});
  const [commentSubmitted, setCommentSubmitted] = useState<Record<string, boolean>>({});
  const [pendingFeedback, setPendingFeedback] = useState<{ message: ChatMessage; feedbackType: string; comment?: string } | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [useVoiceReply, setUseVoiceReply] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [citationPanelOpen, setCitationPanelOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<{
    messageKey: string;
    citeIndex: number | null;
    references: CitationReference[];
  } | null>(null);
  const isDesktop = useIsDesktop();
  const keyboardViewportEnabled = useKeyboardViewportEnabled();
  const [composerFocused, setComposerFocused] = useState(false);
  const { viewportBox, shellStyle, keyboardVisible } = useKeyboardViewport(keyboardViewportEnabled, {
    inputFocused: composerFocused,
    useFixedShell: !isDesktop,
  });
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const sendingRef = useRef(false);

  const scrollToLastMessage = () => {
    const scroller = viewportRef.current;
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }
  };

  const dismissKeyboard = (e?: MouseEvent<HTMLElement> | TouchEvent<HTMLElement>) => {
    if (e) {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, button, a, select, [contenteditable='true']")) return;
    }
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

  const deleteSession = async (target: SessionSummary) => {
    if (deletingSessionId || loading || sessionLoading) return;
    if (!window.confirm(`确定删除“${trimSessionTitle(target.title)}”吗？聊天正文和相关记忆会一并删除，且无法恢复。`)) return;

    setDeletingSessionId(target.id);
    setError("");
    try {
      const res = await fetch(`/api/life-agents/${id}/chat/sessions/${target.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError(res.status === 404 ? "这条会话已不存在。" : "删除聊天失败，请稍后重试。");
        return;
      }

      const remaining = sessions.filter((item) => item.id !== target.id);
      setSessions(remaining);
      if (sessionId === target.id && profile) {
        if (remaining.length > 0) {
          await loadSession(remaining[0].id, profile.welcomeMessage);
        } else {
          resetToWelcome(profile.welcomeMessage);
          router.replace(`/life-agents/${id}/chat`, { scroll: false });
        }
      }
    } catch {
      setError("删除聊天失败，请检查网络后重试。");
    } finally {
      setDeletingSessionId(null);
    }
  };

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
        if (initialPrefillRef.current.trim()) {
          setInput(initialPrefillRef.current.trim());
        }

        void fetchLifeAgentGrowthLog(id)
          .then((log) => {
            if (!cancelled && log?.events) {
              setRecentGrowthEvents(log.events.slice(0, 3));
            }
          })
          .catch(() => {});

        if (!data.viewerState?.isLoggedIn) return;

        setSessionsLoading(true);
        const sessionsRes = await fetch(`/api/life-agents/${id}/chat/sessions`, {
          credentials: "include",
        });
        const sessionList = sessionsRes.ok ? await sessionsRes.json() : [];
        if (cancelled) return;

        const normalizedSessions = Array.isArray(sessionList) ? sessionList : [];
        setSessions(normalizedSessions);

        if (normalizedSessions.length > 0 && !initialPrefillRef.current.trim()) {
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

  // 移动端锁定 body 滚动，避免键盘弹起时整页被顶上去
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isDesktop) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isDesktop]);

  const agentCoverUrl = profile
    ? resolveLifeAgentCoverDisplayUrl(profile.coverUrl, profile.coverImageUrl, profile.coverPresetKey)
    : null;

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

      // 插入 typing 占位；segment 或 content 事件到达后替换/追加
      const assistantIdx = { current: -1 };
      const segmentsStreamed = { current: false };
      setMessages((prev) => {
        assistantIdx.current = prev.length;
        return [...prev, { role: "assistant" as const, content: "", pending: true }];
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
              data.error === "NO_QUESTIONS_LEFT" && lifeAgentShowsPurchaseUi()
                ? "你的提问次数已经用完，请先返回详情页购买次数。"
                : data.error === "NO_QUESTIONS_LEFT"
                  ? "发送失败，请稍后重试。"
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
          setMessages((prev) => applyDoneAssistantMessages(prev, assistantIdx.current, data));
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
                const segIdx =
                  typeof parsed.segmentIndex === "number" ? parsed.segmentIndex : 0;
                if (typeof parsed.segmentIndex === "number") {
                  segmentsStreamed.current = true;
                }
                setMessages((prev) => {
                  if (typeof parsed.segmentIndex === "number") {
                    return appendSegmentContent(prev, assistantIdx.current, segIdx, parsed.content);
                  }
                  return prev.map((m, i) =>
                    i === assistantIdx.current
                      ? {
                          ...m,
                          content: (m.pending ? "" : m.content) + parsed.content,
                          pending: false,
                        }
                      : m
                  );
                });
              } else if (eventType === "segment_start") {
                segmentsStreamed.current = true;
                setMessages((prev) =>
                  applySegmentStart(
                    prev,
                    assistantIdx.current,
                    {
                      index: parsed.index ?? 0,
                      messageId: parsed.messageId,
                      references: parsed.references,
                      attribution: parsed.attribution,
                    },
                    parsed.sessionId
                  )
                );
              } else if (eventType === "segment" && parsed.content != null) {
                segmentsStreamed.current = true;
                setMessages((prev) =>
                  applySegmentMessage(
                    prev,
                    assistantIdx.current,
                    {
                      index: parsed.index ?? 0,
                      content: parsed.content,
                      messageId: parsed.messageId,
                      references: parsed.references,
                      attribution: parsed.attribution,
                    },
                    parsed.sessionId
                  )
                );
              } else if (eventType === "done") {
                const data = parsed;
                setMessages((prev) =>
                  applyDoneAssistantMessages(
                    prev,
                    assistantIdx.current,
                    data,
                    segmentsStreamed.current
                  )
                );
                setLoading(false);
                sendingRef.current = false;
                if (useVoiceReply && profile?.hasVoiceClone && !parsed.audioUrl) {
                  setVoiceLoading(true);
                }
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
              } else if (eventType === "audio_ready") {
                const data = parsed;
                setMessages((prev) =>
                  prev.map((m, i) =>
                    i === assistantIdx.current
                      ? {
                          ...m,
                          audioUrl: data.audioUrl,
                          audioDurationSec: data.audioDurationSec,
                        }
                      : m
                  )
                );
                setVoiceLoading(false);
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
        setVoiceLoading(false);
      }
    },
    [id, profile, sessionId, sessionLoading, useVoiceReply]
  );

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !profile) return;
    await sendMessageWithText(input.trim());
  };

  const doSubmitMessageFeedback = useCallback(
    async (message: ChatMessage, feedbackType: string, comment?: string) => {
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
            ...(comment ? { comment } : {}),
          }),
        });
        if (!res.ok) {
          setError("反馈提交失败，请稍后重试。");
          return;
        }
        setError("");
        setSelectedFeedback((prev) => ({ ...prev, [message.messageId!]: feedbackType }));
        if (comment) {
          setCommentSubmitted((prev) => ({ ...prev, [message.messageId!]: true }));
        }
      } catch {
        setError("反馈提交失败，请稍后重试。");
      } finally {
        setSubmittingFeedbackId(null);
      }
    },
    [id]
  );

  const submitMessageFeedback = useCallback(
    (message: ChatMessage, feedbackType: string, comment?: string) => {
      setPendingFeedback({ message, feedbackType, comment });
    },
    []
  );

  if (!profile) {
    return <div className="h-72 animate-pulse rounded border border-hairline bg-paper-100" />;
  }

  const ratingState = profile.viewerState.rating;

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);
  const openCitations = (
    references: CitationReference[],
    messageKey: string,
    citeIndex?: number | null
  ) => {
    if (!references.length) return;
    const firstIdx = parseCiteIndex(references[0]?.citeIndex);
    setActiveCitation({
      messageKey,
      citeIndex: citeIndex ?? firstIdx,
      references,
    });
    setCitationPanelOpen(true);
  };

  return (
    <>
    {focusedCommentId && !pendingFeedback && (
      <div
        className="fixed inset-0 z-[90]"
        onMouseDown={(e) => {
          e.preventDefault();
          activeTextareaRef.current?.blur();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          activeTextareaRef.current?.blur();
        }}
      />
    )}
    {pendingFeedback && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/30"
        onClick={() => setPendingFeedback(null)}
      >
        <div
          className="mx-6 w-full max-w-sm rounded border border-hairline bg-paper-50 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-1 text-sm font-medium text-ink-800">
            {{
              helpful: "👍 有帮助",
              not_suitable: "👎 没帮助",
              not_specific: "不够具体",
              factual_error: "事实错了",
              contradiction: "前后矛盾",
              too_confident: "太武断了",
            }[pendingFeedback.feedbackType] ?? pendingFeedback.feedbackType}
          </p>
          <textarea
            autoFocus
            rows={3}
            placeholder={feedbackOptionalComment(pendingFeedback.feedbackType) ? "说说具体理由…（选填）" : "说说具体理由…（必填）"}
            value={pendingFeedback.comment ?? ""}
            onChange={(e) =>
              setPendingFeedback((prev) => prev ? { ...prev, comment: e.target.value } : prev)
            }
            className="mt-3 mb-4 w-full resize-none rounded border border-hairline bg-paper px-3 py-2 text-sm text-ink-700 placeholder:text-ink-300 focus:border-ink focus:outline-none"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPendingFeedback(null)}
              className="flex-1 rounded border border-hairline py-2 text-sm text-ink-500 transition hover:bg-paper-100"
            >
              取消
            </button>
            <button
              type="button"
              disabled={
                !feedbackOptionalComment(pendingFeedback.feedbackType) &&
                !pendingFeedback.comment?.trim()
              }
              onClick={() => {
                void doSubmitMessageFeedback(pendingFeedback.message, pendingFeedback.feedbackType, pendingFeedback.comment?.trim());
                setPendingFeedback(null);
              }}
              className="flex-1 rounded bg-ink py-2 text-sm font-medium text-paper-50 transition-colors hover:bg-oxblood disabled:opacity-40"
            >
              确认发送
            </button>
          </div>
        </div>
      </div>
    )}
    <div
      className={`flex min-h-0 flex-col lg:-mx-4 lg:-mt-3 lg:-mb-8 lg:h-[calc(100dvh-5rem)] lg:max-h-[calc(100dvh-5rem)] max-lg:fixed max-lg:inset-0 max-lg:z-[50] max-lg:overflow-hidden ${CHAT_PAGE_BACKGROUND_CLASSNAME}`}
      style={shellStyle}
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
              className="fixed inset-0 z-[100] bg-ink/35"
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
              className="fixed left-0 top-0 z-[101] flex h-[100dvh] w-[min(100vw,20rem)] flex-col border-r border-hairline bg-paper sm:w-[22rem] sm:max-w-[88vw]"
            >
              <div className="flex items-center justify-between border-b border-hairline/70 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <span className="text-sm font-semibold text-ink">更多</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="rounded-full p-2 text-ink-400 hover:bg-paper-50/90 hover:text-ink"
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
                  className="text-sm text-ink-400 hover:text-ink-700"
                >
                  ← 返回详情页
                </Link>
                <h1 className="mt-3 text-xl font-semibold text-ink">{profile.displayName}</h1>
                <p className="mt-1 text-sm text-ink-500">{profile.headline}</p>

                {profile.hasVoiceClone && (
                  <div className="mt-4 rounded border border-hairline bg-paper-50 px-3 py-3">
                    <p className="text-xs font-medium text-ink-500">回复形式</p>
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

                {!LIFE_AGENT_UNLIMITED_CHAT && (
                <div className="mt-4 rounded border border-hairline bg-paper-50 p-4">
                  <p className="text-sm text-ink-400">剩余提问次数</p>
                  <p className="mt-1 text-2xl font-semibold text-ink-700">{profile.viewerState.remainingQuestions}</p>
                </div>
                )}

                {profile.viewerState.isLoggedIn && (
                  <div className="mt-4 rounded border border-hairline bg-paper-50 p-4 text-sm text-ink-500">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">我的聊天记录</p>
                        <p className="mt-1 text-xs text-ink-400">仅你自己可见，Agent 创建者看不到聊天正文。</p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded bg-ink px-3 py-1.5 text-xs font-medium text-paper-50 transition-colors hover:bg-oxblood"
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
                        <p className="text-xs text-ink-400">正在加载聊天记录...</p>
                      ) : sessions.length === 0 ? (
                        <p className="text-xs text-ink-400">还没有历史会话，发出第一条消息后会自动保存。</p>
                      ) : (
                        sessions.map((session) => (
                          <div
                            key={session.id}
                            className={`group flex w-full items-stretch rounded border transition-colors ${
                              session.id === sessionId
                                ? "border-ink/40 bg-paper-200"
                                : "border-hairline bg-paper-50 hover:border-ink-300 hover:bg-paper-100"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                loadSession(session.id, profile.welcomeMessage);
                                closeMenu();
                              }}
                              className="min-w-0 flex-1 px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/40"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-medium text-ink-700">{trimSessionTitle(session.title)}</p>
                                <span className="shrink-0 text-[11px] text-ink-300">{session.messageCount} 条</span>
                              </div>
                              <p className="mt-1 text-[11px] text-ink-400">
                                {new Date(session.updatedAt).toLocaleString("zh-CN")}
                              </p>
                            </button>
                            <button
                              type="button"
                              title="删除聊天"
                              aria-label={`删除聊天：${trimSessionTitle(session.title)}`}
                              disabled={deletingSessionId !== null || loading || sessionLoading}
                              onClick={() => void deleteSession(session)}
                              className="m-1.5 flex w-9 shrink-0 items-center justify-center rounded text-ink-300 opacity-100 outline-none transition hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-700 disabled:cursor-not-allowed disabled:opacity-40 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {profile.viewerState.isLoggedIn && (
                  <div className="mt-4 rounded border border-hairline bg-paper-50 p-4 text-sm text-ink-500">
                    <p className="font-medium text-ink">Agent 评分</p>
                    <p className="mt-1 text-xs text-ink-400">
                      每满 10 次提问会解锁一次评分。你的新评分会覆盖旧评分，但始终只算 1 位用户。
                    </p>
                    <p className="mt-3 text-sm text-ink-600">
                      已提问 {ratingState?.usedQuestions ?? 0} 次
                      {typeof ratingState?.currentScore === "number" && ` · 当前评分 ${ratingState.currentScore}/5`}
                    </p>
                    {ratingState?.eligible ? (
                      <div className="mt-3 space-y-3">
                        <p className="text-xs text-ink-700">
                          已到第 {ratingState.currentMilestone} 次评价节点，现在可以更新一次评分。
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => setRatingScore(score)}
                              className={`rounded border px-3 py-1 text-sm transition-colors ${
                                ratingScore === score
                                  ? "border-ink bg-ink text-paper-50"
                                  : "border-hairline bg-paper-50 text-ink-500 hover:bg-paper-100"
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
                      <p className="mt-3 text-xs text-ink-400">
                        {typeof ratingState?.currentScore === "number"
                          ? `下一次可更新评分：满 ${ratingState?.nextMilestone ?? 10} 次提问`
                          : `满 ${ratingState?.nextMilestone ?? 10} 次提问后可评分`}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 rounded border border-hairline bg-paper-50 p-4 text-sm text-ink-500">
                  <p className="font-medium text-ink/85">怎么聊更好？</p>
                  <ul className="mt-2 space-y-1">
                    <li>• 说清楚你的<strong>具体处境</strong>（如：二本大三、想转行、时间紧）</li>
                    <li>• 问得越具体，回答越有用</li>
                    <li>• 可以连续追问，一步步深入</li>
                    {lifeAgentShowsPurchaseUi() && <li>• 每次提问扣 1 次额度</li>}
                  </ul>
                </div>
                {(lifeAgentShowsPurchaseUi() || !profile.viewerState.isLoggedIn) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {lifeAgentShowsPurchaseUi() && (
                    <Link href={`/life-agents/${id}`} onClick={closeMenu} className="btn-secondary">
                      去购买次数
                    </Link>
                  )}
                  {!profile.viewerState.isLoggedIn && (
                    <Link href="/login" onClick={closeMenu} className="btn-primary">
                      登录后聊天
                    </Link>
                  )}
                </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-0 flex-1 overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 border-hairline bg-paper sm:rounded sm:border lg:rounded max-lg:flex-1">
        <header className="z-20 flex shrink-0 items-center gap-2 border-b border-hairline bg-paper px-1 py-2 pt-[env(safe-area-inset-top)] sm:px-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push(`/life-agents/${id}`);
            }}
            className="pressable inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-paper-50/90 active:bg-paper-100"
            aria-label="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link
            href={`/life-agents/${id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-1 transition hover:opacity-90"
            aria-label={`查看 ${profile.displayName} 的资料`}
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-paper-200/60 ring-1 ring-hairline/30">
              {agentCoverUrl ? (
                <LifeAgentCoverImage
                  src={agentCoverUrl}
                  alt=""
                  fill
                  compact
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-ink-400">
                  {profile.displayName.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-[15px] font-semibold text-ink">{profile.displayName}</p>
              <p className="truncate text-xs text-ink-400">{profile.headline || "在线咨询"}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={openMenu}
            className="pressable inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-paper-50/90 active:bg-paper-100"
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
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-6 sm:py-5 ${CHAT_SCROLL_SURFACE_CLASSNAME}`}
          onClick={(e) => dismissKeyboard(e)}
          role="presentation"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {sessionLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-400">
                正在加载历史会话...
              </div>
            ) : (
              <>
              {recentGrowthEvents.length > 0 && !sessionId ? (
                <div className="rounded-lg border border-signal-200/70 bg-paper-50 px-3 py-3 text-sm shadow-glow-sm">
                  <p className="text-xs font-semibold text-signal-700">最近可追问</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recentGrowthEvents.slice(0, 2).map((event) => {
                      const question = buildGrowthQuestion(event, profile.displayName);
                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => {
                            setInput(question);
                            setTimeout(scrollToLastMessage, 80);
                          }}
                          className="rounded border border-hairline bg-paper px-2.5 py-1.5 text-left text-xs leading-5 text-ink-600 transition hover:border-signal-200 hover:bg-signal-50 hover:text-signal-700"
                        >
                          <span className="font-medium">
                            {LIFE_AGENT_GROWTH_CATEGORY_LABELS[growthEventCategory(event)] ?? growthEventCategory(event)}
                          </span>
                          <span className="text-ink-300"> · {formatGrowthFreshDays(event.freshDays)}</span>
                          <span className="block max-w-[16rem] truncate">{event.summary || event.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {messages.map((message, index) => {
                const isVoiceLoadingForMsg =
                  message.role === "assistant" &&
                  index === messages.length - 1 &&
                  voiceLoading &&
                  !message.audioUrl;

                return (
                <div key={`${message.role}-${index}-${message.messageId ?? "draft"}`} className="space-y-1">
                  <div
                    className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && shouldShowAssistantAvatar(messages, index) ? (
                      <Link
                        href={`/life-agents/${id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-paper-200/60 ring-1 ring-hairline/25 transition hover:ring-hairline/45"
                        aria-label={`查看 ${profile.displayName} 的资料`}
                      >
                        {agentCoverUrl ? (
                          <LifeAgentCoverImage
                            src={agentCoverUrl}
                            alt=""
                            fill
                            compact
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-ink-400">
                            {profile.displayName.slice(0, 1)}
                          </span>
                        )}
                      </Link>
                    ) : message.role === "assistant" ? (
                      <span className="h-8 w-8 shrink-0" aria-hidden />
                    ) : null}
                    <div className={getChatBubbleClassName(message.role)}>
                      {message.role === "assistant" && message.audioUrl ? (
                        <div className="space-y-3">
                          <VoiceMessageBubble
                            audioUrl={message.audioUrl}
                            durationSeconds={message.audioDurationSec ?? 1}
                            isFromUser={false}
                          />
                          {message.content && (
                            <p className="mt-2 border-t border-hairline/60 pt-2 text-[13px] leading-6 text-ink-500">
                              {message.content}
                            </p>
                          )}
                        </div>
                      ) : isVoiceLoadingForMsg ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded bg-paper-50 px-2.5 py-1.5">
                            <span className="h-3 w-3 shrink-0 rounded-full border-[1.5px] border-hairline/40 border-t-ink animate-spin" />
                            <span className="text-xs text-ink-600/80">语音生成中…</span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.content || ""}</p>
                        </div>
                      ) : message.role === "assistant" && (message.pending || (!message.content.trim() && loading)) ? (
                        <AgentTypingIndicator />
                      ) : (
                        <div className="space-y-2">
                          <CitedMessageContent
                            content={message.content}
                            activeCiteIndex={
                              message.references?.length
                                ? activeCitation?.messageKey ===
                                    (message.messageId ?? message.content.slice(0, 24))
                                  ? activeCitation.citeIndex
                                  : null
                                : null
                            }
                            onCiteClick={
                              message.references?.length
                                ? (idx) =>
                                    openCitations(
                                      message.references!,
                                      message.messageId ?? message.content.slice(0, 24),
                                      idx
                                    )
                                : undefined
                            }
                          />
                          {message.role === "assistant" && message.references?.length ? (
                            <CitationSourceChips
                              references={message.references}
                              activeCiteIndex={
                                activeCitation?.messageKey ===
                                (message.messageId ?? message.content.slice(0, 24))
                                  ? activeCitation.citeIndex
                                  : null
                              }
                              onOpen={(idx) =>
                                openCitations(
                                  message.references!,
                                  message.messageId ?? message.content.slice(0, 24),
                                  idx ?? null
                                )
                              }
                            />
                          ) : null}
                          {attributionHint(message.attribution) && (
                            <p className="text-[11px] text-ink-400">{attributionHint(message.attribution)}</p>
                          )}
                        </div>
                      )}
                    </div>
                    {message.role === "user" ? (
                      <UserAvatar
                        avatarUrl={user?.avatarUrl}
                        name={user?.name}
                        email={user?.email}
                        size="sm"
                      />
                    ) : null}
                  </div>
                  {message.role === "assistant" && message.messageId && message.sessionId && isAssistantTurnTail(messages, index) ? (
                    <div className="ml-10 max-w-full space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {FEEDBACK_PRIMARY.map((item) => {
                          const isSelected = selectedFeedback[message.messageId!] === item.id;
                          const hasSelection = !!selectedFeedback[message.messageId!];
                          const isHelpful = item.id === "helpful";
                          return (
                            <button
                              key={`${message.messageId}-${item.id}`}
                              type="button"
                              disabled={submittingFeedbackId === message.messageId}
                              onClick={() => void submitMessageFeedback(message, item.id)}
                              className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 transition-all duration-200 ${feedbackChipClass(isSelected, hasSelection, isHelpful)} disabled:opacity-60`}
                            >
                              <span className={isSelected ? "opacity-90" : isHelpful ? "text-olive-500" : "text-ink-300"}>
                                {isHelpful ? <FeedbackThumbUp /> : <FeedbackThumbDown />}
                              </span>
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {FEEDBACK_DETAIL.map((item) => {
                          const isSelected = selectedFeedback[message.messageId!] === item.id;
                          const hasSelection = !!selectedFeedback[message.messageId!];
                          return (
                            <button
                              key={`${message.messageId}-${item.id}`}
                              type="button"
                              disabled={submittingFeedbackId === message.messageId}
                              onClick={() => void submitMessageFeedback(message, item.id)}
                              className={`rounded border px-2.5 py-1 transition-all duration-200 ${feedbackChipClass(isSelected, hasSelection, false)} disabled:opacity-60`}
                            >
                              {isSelected && <span className="mr-0.5">✓</span>}
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                      {selectedFeedback[message.messageId!] &&
                        !feedbackOptionalComment(selectedFeedback[message.messageId!]) &&
                        !commentSubmitted[message.messageId!] && (
                          <div
                            className="flex items-start gap-2"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <textarea
                              ref={(el) => {
                                if (focusedCommentId === message.messageId) {
                                  activeTextareaRef.current = el;
                                }
                              }}
                              placeholder="说说哪里不对？你的反馈会帮助创建者改进..."
                              value={feedbackComment[message.messageId!] || ""}
                              onChange={(e) =>
                                setFeedbackComment((prev) => ({
                                  ...prev,
                                  [message.messageId!]: e.target.value,
                                }))
                              }
                              onFocus={() => setFocusedCommentId(message.messageId!)}
                              onBlur={() => {
                                setFocusedCommentId(null);
                                activeTextareaRef.current = null;
                                const comment = feedbackComment[message.messageId!]?.trim();
                                if (comment) {
                                  submitMessageFeedback(
                                    message,
                                    selectedFeedback[message.messageId!],
                                    comment
                                  );
                                }
                              }}
                              rows={2}
                              className="flex-1 resize-none rounded border border-hairline bg-paper px-3 py-2 text-xs text-ink-600 placeholder:text-ink-300 focus:border-ink focus:outline-none"
                            />
                          </div>
                        )}
                      {commentSubmitted[message.messageId!] && (
                        <p className="text-xs text-olive-600">感谢你的反馈！</p>
                      )}
                    </div>
                  ) : null}
                </div>
              )})}
              </>
            )}
            <div ref={chatEndRef} className="h-1 shrink-0 scroll-mt-4" aria-hidden />
          </div>
        </div>

        {error && (
          <div className="shrink-0 mx-3 rounded border border-hairline bg-paper-200 px-4 py-2 text-sm text-oxblood-700 sm:mx-6">
            {error}
          </div>
        )}

        <div
          className={`shrink-0 border-t border-hairline bg-paper px-3 pt-2 sm:px-4 ${chatInputFooterPaddingClass(keyboardVisible)}`}
        >
          <div className="mx-auto max-w-3xl">
            <LifeAgentMessageComposer
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              disabled={loading || sessionLoading}
              placeholder="发消息..."
              onTextareaFocus={() => {
                setComposerFocused(true);
                window.setTimeout(() => scrollToLastMessage(), 120);
                window.setTimeout(() => scrollToLastMessage(), 320);
              }}
            />
          </div>
        </div>
      </section>
      {citationPanelOpen && activeCitation && (
        <CitationPanel
          variant="sidebar"
          open={citationPanelOpen}
          references={activeCitation.references}
          activeCiteIndex={activeCitation.citeIndex}
          onSelectCiteIndex={(idx) =>
            setActiveCitation((prev) => (prev ? { ...prev, citeIndex: idx } : prev))
          }
          onClose={() => setCitationPanelOpen(false)}
        />
      )}
      </div>
      {activeCitation && (
        <CitationPanel
          variant="sheet"
          open={citationPanelOpen}
          references={activeCitation.references}
          activeCiteIndex={activeCitation.citeIndex}
          onSelectCiteIndex={(idx) =>
            setActiveCitation((prev) => (prev ? { ...prev, citeIndex: idx } : prev))
          }
          onClose={() => setCitationPanelOpen(false)}
        />
      )}
    </div>
    </>
  );
}
