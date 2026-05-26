"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VoiceInputButton } from "@/components/voice";
import { LifeAgentDiscoverCardGrid } from "@/components/LifeAgentDiscoverCardGrid";
import { addSearchHistory, clearSearchHistory, getSearchHistory } from "@/lib/life-agent-search-history";
import type { LifeAgentListItem } from "@/lib/life-agent-feed-search";
import { fetchLifeAgentSearch } from "@/lib/life-agents-list-api";

const SEARCH_PAGE_SIZE = 24;

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

/** 顶栏：返回 + 胶囊输入（含图搜）+「搜索」，对齐小红书搜索页 */
function SearchTopBar({
  draft,
  onDraftChange,
  onSearch,
  onBack,
  autoFocus,
  fileInputRef,
}: {
  draft: string;
  onDraftChange: (v: string) => void;
  onSearch: () => void;
  onBack: () => void;
  autoFocus?: boolean;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
}) {
  return (
    <header className="max-lg:sticky max-lg:top-0 max-lg:z-[60] border-b border-hairline bg-paper pt-[max(0.25rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-2 py-3 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-ink active:opacity-50"
          aria-label="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        {/* 单边底线输入框：杂志风搜索条 */}
        <div className="relative flex min-w-0 flex-1 items-center border-b border-ink/40 focus-within:border-ink">
          <input
            className="min-w-0 flex-1 border-0 bg-transparent py-2 pr-9 font-serif text-[17px] italic text-ink outline-none placeholder:text-ink-300 placeholder:italic"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearch();
              }
            }}
            placeholder="检索 Agent、经验、话题"
            enterKeyHint="search"
            autoFocus={autoFocus}
          />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" tabIndex={-1} aria-hidden />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-0 flex h-8 w-8 items-center justify-center text-ink-300 transition hover:text-ink"
            aria-label="图搜"
            title="图搜（即将上线）"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24" aria-hidden>
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
          onClick={onSearch}
          className="shrink-0 text-[11px] font-medium uppercase tracking-[0.22em] text-ink transition hover:text-oxblood-500 active:opacity-50"
        >
          Search
        </button>
      </div>
    </header>
  );
}

function SearchResultsView({ query }: { query: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(query);
  const [profiles, setProfiles] = useState<LifeAgentListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/life-agents");
    }
  }, [router]);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  // 首屏加载：query 变化时重置并请求第一页
  useEffect(() => {
    setLoadError(null);
    setLoading(true);
    setProfiles([]);
    setNextCursor("");
    setTotal(0);
    setFallback(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetchLifeAgentSearch(query, SEARCH_PAGE_SIZE, undefined, controller.signal)
      .then((resp) => {
        setProfiles(resp.items);
        setNextCursor(resp.nextCursor);
        setTotal(resp.total);
        setFallback(resp.fallback);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        const e = err as { name?: string } | null;
        if (e?.name === "AbortError") {
          setLoadError("请求超时，请检查后端是否启动或稍后重试");
        } else {
          setLoadError("加载失败，请刷新页面重试");
        }
        setProfiles([]);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const resp = await fetchLifeAgentSearch(query, SEARCH_PAGE_SIZE, nextCursor);
      setProfiles((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const item of resp.items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        return merged;
      });
      setNextCursor(resp.nextCursor);
    } catch {
      // 静默失败；用户可继续滚动重试
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, query]);

  const runSearch = useCallback(
    (q: string) => {
      const t = q.trim();
      if (!t) return;
      addSearchHistory(t);
      router.push(`/life-agents/search?q=${encodeURIComponent(t)}`);
    },
    [router],
  );

  const statusLine = useMemo(() => {
    if (loading) return "加载中…";
    if (loadError) return "";
    if (fallback) return "没有完全匹配的 Agent，为你推荐以下内容";
    return `共 ${total} 个相关 Agent`;
  }, [loading, loadError, fallback, total]);

  return (
    <div className="min-h-[100dvh] bg-paper max-lg:-mx-4 max-lg:flex max-lg:flex-col">
      <SearchTopBar
        draft={draft}
        onDraftChange={setDraft}
        onSearch={() => runSearch(draft)}
        onBack={goBack}
        fileInputRef={fileInputRef}
      />
      <div className="min-h-0 flex-1 pb-28 pt-4 max-lg:px-4 sm:mx-auto sm:max-w-7xl sm:px-4">
        {/* 状态行：栏目 kicker 风格 */}
        <div className="flex items-baseline justify-between border-b border-hairline pb-2">
          <span className={`text-[11px] uppercase tracking-[0.2em] ${fallback ? "text-oxblood-500" : "text-ink-400"}`}>
            {fallback ? "Suggested" : "Results"}
          </span>
          <span className="font-serif text-xs italic text-ink-400">{statusLine}</span>
        </div>

      <div className="mx-auto mt-6 max-w-7xl">
        {loadError ? (
          <div className="mb-6 border border-oxblood-200 bg-oxblood-50 px-4 py-3 font-serif text-sm text-oxblood-700">
            {loadError}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-3 underline underline-offset-2 hover:no-underline"
            >
              刷新页面
            </button>
          </div>
        ) : (
          <LifeAgentDiscoverCardGrid
            profiles={profiles}
            loading={loading}
            emptyTitle="没有匹配的 Agent"
            emptySubtitle="换个关键词试试，或减少筛选条件。"
            windowResetKey={query}
            onLoadMore={loadMore}
            hasMoreFromServer={Boolean(nextCursor)}
            loadingMore={loadingMore}
          />
        )}
      </div>
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

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/life-agents");
    }
  }, [router]);

  return (
    <div className="min-h-[100dvh] bg-paper pb-36 max-lg:-mx-4 max-lg:flex max-lg:flex-col sm:mx-0">
      <SearchTopBar
        draft={draft}
        onDraftChange={setDraft}
        onSearch={() => runSearch(draft)}
        onBack={goBack}
        autoFocus
        fileInputRef={fileInputRef}
      />
      <div className="mx-auto w-full flex-1 px-4 sm:max-w-lg sm:px-3 lg:px-4">
        {/* 历史记录 */}
        <section className="mt-8">
          <div className="mb-4 flex items-baseline justify-between border-b border-hairline pb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-400">
              Recent
            </span>
            {history.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  clearSearchHistory();
                  setHistory([]);
                }}
                className="font-serif text-xs italic text-ink-300 transition hover:text-oxblood-500"
                aria-label="清空历史"
              >
                清空
              </button>
            ) : null}
          </div>
          {history.length === 0 ? (
            <p className="font-serif text-sm italic text-ink-300">暂无搜索记录</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {visibleHistory.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => runSearch(item)}
                    className="flex w-full items-baseline justify-between py-2.5 text-left transition hover:text-oxblood-500"
                  >
                    <span className="truncate font-serif text-[15px] text-ink">{item}</span>
                    <span className="ml-3 shrink-0 text-[10px] uppercase tracking-[0.2em] text-ink-300">↗</span>
                  </button>
                </li>
              ))}
              {history.length > 6 ? (
                <li>
                  <button
                    type="button"
                    onClick={() => setHistoryExpanded((e) => !e)}
                    className="block w-full py-2.5 text-left font-serif text-xs italic text-ink-400 transition hover:text-ink"
                  >
                    {historyExpanded ? "— 收起 —" : `— 展开全部 ${history.length} 条 —`}
                  </button>
                </li>
              ) : null}
            </ul>
          )}
        </section>

        {/* 猜你想搜：编号列表风 */}
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between border-b border-hairline pb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-400">
              Editor&apos;s Picks
            </span>
            <span className="font-serif text-xs italic text-ink-300">本周精选</span>
          </div>
          <ol className="divide-y divide-hairline">
            {[...GUESS_LEFT.map((text) => ({ text, hot: false })), ...GUESS_RIGHT].map(({ text, hot }, i) => (
              <li key={text}>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(text);
                    runSearch(text);
                  }}
                  className="group flex w-full items-baseline gap-3 py-3 text-left transition hover:text-oxblood-500"
                >
                  <span className="shrink-0 font-serif text-xs tabular-nums text-ink-300 group-hover:text-oxblood-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-serif text-[15px] text-ink">
                    {text}
                  </span>
                  {hot ? (
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-oxblood-500">
                      hot
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* 底部语音按钮：去掉胶囊 + 玫红色，改为单边发丝线 + 墨色 */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center bg-gradient-to-t from-paper via-paper/95 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
        <p className="mb-3 font-serif text-xs italic text-ink-400">
          按住提问 — 有问必答
        </p>
        <div className="flex min-h-[3.25rem] items-center justify-center border border-ink bg-paper px-10 py-3">
          {voiceOk ? (
            <VoiceInputButton
              size="lg"
              className="!h-12 !w-12 !border-0 !bg-transparent !text-ink !shadow-none [&_svg]:h-7 [&_svg]:w-7"
              onTranscript={(text, isFinal) => {
                if (isFinal && text.trim()) {
                  setDraft(text.trim());
                  runSearch(text.trim());
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 py-1 text-center">
              <svg className="h-8 w-8 text-ink-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.83V20c0 .55.45 1 1 1s1-.45 1-1v-2.18c3.02-.48 5.42-2.83 5.91-5.83.1-.6-.39-1.14-1-1.14z" />
              </svg>
              <span className="font-serif text-[10px] italic text-ink-300">当前环境不支持语音</span>
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
