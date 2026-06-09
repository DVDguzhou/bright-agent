"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LifeAgentDiscoverCardGrid } from "@/components/LifeAgentDiscoverCardGrid";
import type { LifeAgentListItem } from "@/lib/life-agent-feed-search";
import { fetchLifeAgentCollectionPage } from "@/lib/life-agents-list-api";

const PAGE_SIZE = 24;

type CollectionMeta = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

/** 已知校园/专题合集的文案。新增合集时在此登记；未登记的 key 用兜底文案。 */
const COLLECTIONS: Record<string, CollectionMeta> = {
  kaoyan: {
    eyebrow: "校园 · 考研",
    title: "考研上岸的人，都在这",
    subtitle: "双非逆袭、二战、调剂、初复试——问问真的考过来的学长学姐，把焦虑拆成可执行的下一步。",
  },
  liuxue: {
    eyebrow: "校园 · 留学",
    title: "申请季，找个过来人带你",
    subtitle: "选校、文书、套磁、时间线——听走过这条路的人怎么准备，少踩信息差的坑。",
  },
  qiuzhi: {
    eyebrow: "校园 · 求职",
    title: "秋招春招，问问已上岸的人",
    subtitle: "简历、面试、选 offer、转方向——和刚走过校招的人聊聊，比海投有用。",
  },
  jingpin: {
    eyebrow: "编辑精选",
    title: "这里是我们精选的Agent",
    subtitle: "上岸以后累不累，读研值不值，怎么过大学生活，怎么找实习，怎么留学，甚至怎么创业，这里都有答案。",
  },
};

function metaFor(key: string): CollectionMeta {
  return (
    COLLECTIONS[key] ?? {
      eyebrow: "精选合集",
      title: "精选 Agent",
      subtitle: "为这个主题挑出的过来人，点进去直接开问。",
    }
  );
}

export default function CampusCollectionPage() {
  const params = useParams<{ collection: string }>();
  const collection = useMemo(() => {
    const raw = params?.collection;
    return typeof raw === "string" ? decodeURIComponent(raw) : Array.isArray(raw) ? decodeURIComponent(raw[0] ?? "") : "";
  }, [params]);

  const meta = useMemo(() => metaFor(collection), [collection]);

  const [items, setItems] = useState<LifeAgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const seedRef = useRef((Math.random() * 2147483647) | 0);

  useEffect(() => {
    if (!collection) return;
    const controller = new AbortController();
    seedRef.current = (Math.random() * 2147483647) | 0;
    setLoading(true);
    setError(null);
    setItems([]);
    setNextCursor("");
    fetchLifeAgentCollectionPage(collection, PAGE_SIZE, 0, seedRef.current, controller.signal)
      .then(({ items: rows, nextCursor: next }) => {
        setItems(rows);
        setNextCursor(next);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setError("加载失败，请稍后重试");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [collection]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const offset = Number.parseInt(nextCursor, 10) || items.length;
      const { items: rows, nextCursor: next } = await fetchLifeAgentCollectionPage(
        collection,
        PAGE_SIZE,
        offset,
        seedRef.current,
      );
      setItems((prev) => [...prev, ...rows]);
      setNextCursor(next);
    } catch {
      // 静默失败：保留已加载内容
    } finally {
      setLoadingMore(false);
    }
  }, [collection, items.length, loadingMore, nextCursor]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-hairline bg-paper pt-[max(0.25rem,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Link
            href="/life-agents"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-ink-400 transition hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            广场
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4">
        <div className="border-b border-hairline py-10 sm:py-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-oxblood-500">{meta.eyebrow}</p>
          <h1 className="mt-3 font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl">{meta.title}</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-500">{meta.subtitle}</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {error ? (
          <p className="py-16 text-center text-sm text-oxblood-600">{error}</p>
        ) : (
          <LifeAgentDiscoverCardGrid
            profiles={items}
            loading={loading}
            emptyTitle="这个合集还没有 Agent"
            emptySubtitle="稍后再来看看，或先去广场逛逛"
            onLoadMore={handleLoadMore}
            hasMoreFromServer={Boolean(nextCursor)}
            loadingMore={loadingMore}
          />
        )}
      </main>
    </div>
  );
}
