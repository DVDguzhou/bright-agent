"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VoiceInputButton } from "@/components/voice";
import { LifeAgentDiscoverCardGrid } from "@/components/LifeAgentDiscoverCardGrid";
import { addSearchHistory, clearSearchHistory, getSearchHistory } from "@/lib/life-agent-search-history";
import { rankLifeAgentsBySearchQuery, type LifeAgentListItem } from "@/lib/life-agent-feed-search";

const GUESS_LEFT = ["考研经验咨询", "秋招改简历", "转行互联网", "雅思怎么准备", "体制内跳槽"];
const GUESS_RIGHT: { text: string; hot?: boolean }[] = [
  { text: "产品经理入门路径", hot: true },
  { text: "远程岗位怎么找", hot: false },
  { text: "副业从哪开始", hot: false },
  { text: "大厂面试准备", hot: false },
  { text: "留学申请时间线", hot: false },
];

function speechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition,
  );
}

function SearchResultsView({ query }: { query: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState(query);
  const [profiles, setProfiles] = useState<LifeAgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    setLoadError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch("/api/life-agents", { credentials: "include", signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setProfiles(Array.isArray(data) ? data : []);
        setLoadError(null);
      })
      .catch((err) => {
        setProfiles([]);
        setLoadError(
          err.name === "AbortError" ? "请求超时，请检查后端是否启动或稍后重试" : "加载失败，请刷新页面重试",
        );
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const ranked = useMemo(() => rankLifeAgentsBySearchQuery(profiles, query), [profiles, query]);

  const runSearch = useCallback(
    (q: string) => {
      const t = q.trim();
      if (!t) return;
      addSearchHistory(t);
      router.push(`/life-agents/search?q=${encodeURIComponent(t)}`);
    },
    [router],
  );

  return (
    <div className="-mx-4 min-h-0 flex-1 px-4 pb-28 pt-2 sm:mx-0 sm:px-0">
      <div className="mx-auto max-w-lg sm:max-w-none">
        <div className="flex items-center gap-2">
          <div className="relative flex min-w-0 flex-1 items-center rounded-full border border-slate-200 bg-slate-50 py-2 pl-4 pr-12">
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[#111] outline-none placeholder:text-slate-400"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runSearch(draft);
                }
              }}
              placeholder="搜索 Agent、经验、话题…"
              enterKeyHint="search"
            />
          </div>
          <button
            type="button"
            onClick={() => runSearch(draft)}
            className="shrink-0 px-1 py-2 text-[15px] font-medium text-[#ff2442]"
          >
            搜索
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {loading ? "加载中…" : loadError ? "" : `共 ${ranked.length} 个相关 Agent`}
        </p>
      </div>

      <div className="mx-auto mt-4 max-w-7xl">
        {loadError ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            {loadError}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-3 text-sm font-medium text-amber-700 underline hover:no-underline"
            >
              刷新页面
            </button>
          </div>
        ) : (
          <LifeAgentDiscoverCardGrid
            profiles={ranked}
            loading={loading}
            emptyTitle="没有匹配的 Agent"
            emptySubtitle="换个关键词试试，或减少筛选条件。"
          />
        )}
      </div>
    </div>
  );
}

function SearchEntryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVoiceOk(speechRecognitionSupported());
  }, []);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setDraft(q);
  }, [searchParams]);

  const visibleHistory = useMemo(
    () => (historyExpanded ? history : history.slice(0, 6)),
    [history, historyExpanded],
  );

  const runSearch = useCallback(
    (q: string) => {
      const t = q.trim();
      if (!t) return;
      addSearchHistory(t);
      setHistory(getSearchHistory());
      router.push(`/life-agents/search?q=${encodeURIComponent(t)}`);
    },
    [router],
  );

  return (
    <div className="min-h-[100dvh] bg-white pb-36 pt-2 sm:mx-0 -mx-4 px-4 sm:px-0">
      <div className="mx-auto max-w-lg sm:px-3">
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex min-w-0 flex-1 items-center rounded-full border border-slate-200 bg-slate-50 py-2 pl-4 pr-12">
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[#111] outline-none placeholder:text-slate-400"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runSearch(draft);
                }
              }}
              placeholder="搜索 Agent、经验、话题…"
              enterKeyHint="search"
              autoFocus
            />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" tabIndex={-1} aria-hidden />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-600"
              aria-label="图搜"
              title="图搜（即将上线）"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={() => runSearch(draft)}
            className="shrink-0 px-1 py-2 text-[15px] font-medium text-[#ff2442]"
          >
            搜索
          </button>
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-500">历史记录</h2>
            {history.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  clearSearchHistory();
                  setHistory([]);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="清空历史"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            ) : null}
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">暂无搜索记录</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {visibleHistory.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => runSearch(item)}
                  className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1.5 text-left text-sm text-slate-700 transition active:bg-slate-200"
                >
                  {item}
                </button>
              ))}
              {history.length > 6 ? (
                <button
                  type="button"
                  onClick={() => setHistoryExpanded((e) => !e)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"
                  aria-label={historyExpanded ? "收起" : "展开更多"}
                >
                  <svg
                    className={`h-4 w-4 transition ${historyExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-500">猜你想搜</h2>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400"
              aria-label="更多"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[15px] leading-snug">
            <div className="space-y-3">
              {GUESS_LEFT.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => {
                    setDraft(text);
                    runSearch(text);
                  }}
                  className="block w-full text-left text-[#111] transition active:opacity-60"
                >
                  {text}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {GUESS_RIGHT.map(({ text, hot }) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => {
                    setDraft(text);
                    runSearch(text);
                  }}
                  className="flex w-full items-start gap-1.5 text-left text-[#111] transition active:opacity-60"
                >
                  {hot ? (
                    <span className="mt-0.5 shrink-0 rounded bg-[#ff2442] px-0.5 text-[10px] font-bold leading-tight text-white">
                      热
                    </span>
                  ) : (
                    <span className="w-5 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">{text}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center bg-gradient-to-t from-white via-white to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        <p className="mb-2 text-xs text-slate-400">
          按住提问 有问必答 <span aria-hidden>✨</span>
        </p>
        <div className="flex min-h-[3.25rem] items-center justify-center rounded-full border border-slate-100 bg-white px-10 py-3 shadow-lg shadow-slate-200/80">
          {voiceOk ? (
            <VoiceInputButton
              size="lg"
              className="!h-12 !w-12 !border-0 !bg-transparent !text-[#ff2442] !shadow-none [&_svg]:h-7 [&_svg]:w-7"
              onTranscript={(text, isFinal) => {
                if (isFinal && text.trim()) {
                  setDraft(text.trim());
                  runSearch(text.trim());
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 py-1 text-center">
              <svg className="h-8 w-8 text-[#ff2442]/35" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.83V20c0 .55.45 1 1 1s1-.45 1-1v-2.18c3.02-.48 5.42-2.83 5.91-5.83.1-.6-.39-1.14-1-1.14z" />
              </svg>
              <span className="text-[10px] text-slate-400">当前环境不支持语音</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

  if (q) {
    return <SearchResultsView query={q} key={q} />;
  }

  return <SearchEntryView />;
}

export default function LifeAgentsSearchPage() {
  return (
    <Suspense
      fallback={<div className="min-h-[100dvh] animate-pulse bg-white pt-16" aria-hidden />}
    >
      <SearchPageInner />
    </Suspense>
  );
}
