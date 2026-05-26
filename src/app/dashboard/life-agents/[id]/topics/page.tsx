"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { FieldInfoButton } from "@/components/FieldInfoButton";

type TopicItem = {
  id: string;
  topicGroup: string;
  topicKey: string;
  topicLabel: string;
  summary: string;
  aliases?: string[];
  questionPatterns?: string[];
  sourceEntryIds?: string[];
  source?: string;
  confidence?: string;
  status?: "candidate" | "active" | "archived" | string;
  manualEdited?: boolean;
  mergedIntoTopicId?: string | null;
  mergedIntoTopicLabel?: string;
  feedback?: {
    total?: number;
    helpful?: number;
    notSpecific?: number;
    notSuitable?: number;
    factualError?: number;
    contradiction?: number;
    tooConfident?: number;
  };
};

type LoadState = {
  topics: TopicItem[];
  loading: boolean;
  error: string | null;
};

type EditState = Record<
  string,
  {
    topicLabel: string;
    summary: string;
    aliases: string;
    questionPatterns: string;
    confidence: string;
    status: string;
    mergeTargetId: string;
  }
>;

function badgeClass(status?: string) {
  switch (status) {
    case "active":
      return "bg-olive-400/20 text-olive-600";
    case "candidate":
      return "bg-paper-300 text-oxblood-700";
    case "archived":
      return "bg-paper-300 text-ink-500";
    default:
      return "bg-paper-200 text-ink-600";
  }
}

const TOPIC_STATUS_INFO = {
  title: "Topic 状态有什么用？",
  ariaLabel: "Topic 状态说明",
  body: [
    "状态决定这个 Topic 会不会被 Agent 用在对话里。",
    "candidate（待审核）：系统自动提取，还没确认，建议先人工看一眼。",
    "active（已启用）：确认可用，用户提问时会参与检索匹配。",
    "archived（已归档）：不再使用；归并到其他 Topic 后也会变成此状态。",
  ],
} as const;

const TOPIC_CONFIDENCE_INFO = {
  title: "Topic 置信度有什么用？",
  ariaLabel: "Topic 置信度说明",
  body: [
    "置信度表示你对这条 Topic 摘要有多少把握。",
    "low：不太确定，可能是推断或待核实。",
    "medium：一般确定，适合大多数自动生成的主题。",
    "high：很确定、有充分依据；Agent 检索时会优先引用，回答也会更笃定。",
  ],
} as const;

function topicMatchesQuery(topic: TopicItem, edit: EditState[string] | undefined, keyword: string): boolean {
  if (!keyword) return true;
  const haystack = [
    topic.topicLabel,
    topic.topicKey,
    topic.summary,
    topic.topicGroup,
    topic.source,
    topic.status,
    topic.confidence,
    topic.mergedIntoTopicLabel,
    ...(topic.aliases ?? []),
    ...(topic.questionPatterns ?? []),
    edit?.topicLabel,
    edit?.summary,
    edit?.aliases,
    edit?.questionPatterns,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(keyword);
}

export default function LifeAgentTopicsPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const query = searchParams.get("q") ?? "";
  const [state, setState] = useState<LoadState>({ topics: [], loading: true, error: null });
  const [edits, setEdits] = useState<EditState>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "candidate" | "archived">("all");

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/life-agents/${id}/topics`, { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setState({ topics: [], loading: false, error: data?.detail || "加载 Topic 失败" });
        return;
      }
      const topics = Array.isArray(data?.topics) ? (data.topics as TopicItem[]) : [];
      setState({ topics, loading: false, error: null });
      setEdits(
        Object.fromEntries(
          topics.map((topic) => [
            topic.id,
            {
              topicLabel: topic.topicLabel ?? "",
              summary: topic.summary ?? "",
              aliases: Array.isArray(topic.aliases) ? topic.aliases.join("\n") : "",
              questionPatterns: Array.isArray(topic.questionPatterns) ? topic.questionPatterns.join("\n") : "",
              confidence: topic.confidence ?? "medium",
              status: topic.status ?? "candidate",
              mergeTargetId: "",
            },
          ]),
        ),
      );
    } catch {
      setState({ topics: [], loading: false, error: "网络错误，请稍后重试" });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredTopics = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const byStatus = filter === "all" ? state.topics : state.topics.filter((topic) => topic.status === filter);
    if (!keyword) return byStatus;
    return byStatus.filter((topic) => topicMatchesQuery(topic, edits[topic.id], keyword));
  }, [filter, query, state.topics, edits]);

  const mergeTargets = useMemo(
    () => state.topics.filter((topic) => topic.status !== "archived"),
    [state.topics],
  );

  const updateEdit = (topicId: string, patch: Partial<EditState[string]>) => {
    setEdits((prev) => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] ?? {
          topicLabel: "",
          summary: "",
          aliases: "",
          questionPatterns: "",
          confidence: "medium",
          status: "candidate",
          mergeTargetId: "",
        }),
        ...patch,
      },
    }));
  };

  const saveTopic = async (topicId: string) => {
    const edit = edits[topicId];
    if (!edit) return;
    setSavingId(topicId);
    try {
      const res = await fetch(`/api/life-agents/${id}/topics/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topicLabel: edit.topicLabel.trim(),
          summary: edit.summary.trim(),
          aliases: edit.aliases.split("\n").map((item) => item.trim()).filter(Boolean),
          questionPatterns: edit.questionPatterns.split("\n").map((item) => item.trim()).filter(Boolean),
          confidence: edit.confidence,
          status: edit.status,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.detail || "保存失败");
        return;
      }
      const topics = Array.isArray(data?.topics) ? (data.topics as TopicItem[]) : [];
      setState((prev) => ({ ...prev, topics }));
    } finally {
      setSavingId(null);
    }
  };

  const mergeTopic = async (sourceTopicId: string) => {
    const targetTopicId = edits[sourceTopicId]?.mergeTargetId;
    if (!targetTopicId) {
      alert("请先选择合并目标");
      return;
    }
    setMergingId(sourceTopicId);
    try {
      const res = await fetch(`/api/life-agents/${id}/topics/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sourceTopicId, targetTopicId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.detail || "合并失败");
        return;
      }
      const topics = Array.isArray(data?.topics) ? (data.topics as TopicItem[]) : [];
      setState((prev) => ({ ...prev, topics }));
    } finally {
      setMergingId(null);
    }
  };

  if (state.loading && state.topics.length === 0) {
    return <div className="mx-auto h-56 max-w-5xl animate-pulse rounded-[28px] bg-paper shadow-sm ring-1 ring-hairline/40" />;
  }

  if (state.error && state.topics.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-[15px] text-ink-400">{state.error}</p>
        <Link href={`/dashboard/life-agents/${id}`} className="mt-6 inline-flex rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper">
          返回工作台
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 max-lg:-mx-4 max-lg:bg-paper-50 max-lg:px-3 max-lg:pb-24">
      <header className="rounded-[28px] bg-paper px-4 py-4 shadow-sm ring-1 ring-hairline/40 sm:px-6">
        <Link href={`/dashboard/life-agents/${id}`} className="text-sm font-medium text-ink-400 transition hover:text-ink">
          ← 返回工作台
        </Link>
        <h1 className="mt-3 text-[28px] font-black tracking-tight text-ink">Topic 管理</h1>
        <p className="mt-1 text-sm text-ink-400">审核从知识和长会话里长出来的主题，手动激活、归档、合并或修正文案。</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(["all", "active", "candidate", "archived"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                filter === item ? "bg-ink text-paper" : "bg-paper-200 text-ink-500"
              }`}
            >
              {item === "all" ? "全部" : item}
            </button>
          ))}
          {query.trim() ? (
            <span className="text-sm text-ink-400">找到 {filteredTopics.length} 个</span>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-paper px-3 py-4 text-center shadow-sm ring-1 ring-hairline/40">
          <p className="text-2xl font-black text-ink">{state.topics.length}</p>
          <p className="mt-1 text-xs text-ink-400">Topic 总数</p>
        </div>
        <div className="rounded-2xl bg-paper px-3 py-4 text-center shadow-sm ring-1 ring-hairline/40">
          <p className="text-2xl font-black text-ink">{state.topics.filter((topic) => topic.status === "candidate").length}</p>
          <p className="mt-1 text-xs text-ink-400">待审核</p>
        </div>
        <div className="rounded-2xl bg-paper px-3 py-4 text-center shadow-sm ring-1 ring-hairline/40">
          <p className="text-2xl font-black text-ink">{state.topics.filter((topic) => topic.status === "active").length}</p>
          <p className="mt-1 text-xs text-ink-400">已启用</p>
        </div>
        <div className="rounded-2xl bg-paper px-3 py-4 text-center shadow-sm ring-1 ring-hairline/40">
          <p className="text-2xl font-black text-ink">{state.topics.reduce((sum, topic) => sum + (topic.feedback?.total ?? 0), 0)}</p>
          <p className="mt-1 text-xs text-ink-400">关联反馈</p>
        </div>
      </section>

      <section className="space-y-4">
        {filteredTopics.length === 0 ? (
          <div className="rounded-[28px] bg-paper px-6 py-16 text-center text-sm text-ink-300 shadow-sm ring-1 ring-hairline/40">
            {query.trim() ? (
              <>
                <p>没有匹配的 Topic</p>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-4 text-sm font-medium text-ink-500 underline"
                >
                  清空搜索
                </button>
              </>
            ) : (
              "当前筛选下还没有 topic"
            )}
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const edit = edits[topic.id];
            if (!edit) return null;
            return (
              <article key={topic.id} className="rounded-[28px] bg-paper p-4 shadow-sm ring-1 ring-hairline/40 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(topic.status)}`}>{topic.status}</span>
                      <span className="rounded-full bg-paper-200 px-2.5 py-1 text-xs text-ink-500">{topic.topicGroup}</span>
                      <span className="rounded-full bg-paper-200 px-2.5 py-1 text-xs text-ink-500">{topic.source || "unknown"}</span>
                      {topic.manualEdited ? <span className="rounded-full bg-oxblood-100 px-2.5 py-1 text-xs text-oxblood-700">人工改过</span> : null}
                    </div>
                    <p className="mt-3 break-all text-xs text-ink-300">{topic.topicKey}</p>
                    {topic.mergedIntoTopicLabel ? (
                      <p className="mt-1 text-xs text-ink-400">已归并到：{topic.mergedIntoTopicLabel}</p>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div className="rounded-xl bg-paper-50 px-3 py-2 text-center">
                      <p className="font-semibold text-ink">{topic.feedback?.total ?? 0}</p>
                      <p className="text-ink-400">反馈</p>
                    </div>
                    <div className="rounded-xl bg-paper-50 px-3 py-2 text-center">
                      <p className="font-semibold text-ink">{topic.feedback?.helpful ?? 0}</p>
                      <p className="text-ink-400">有帮助</p>
                    </div>
                    <div className="rounded-xl bg-paper-50 px-3 py-2 text-center">
                      <p className="font-semibold text-ink">{(topic.feedback?.factualError ?? 0) + (topic.feedback?.contradiction ?? 0)}</p>
                      <p className="text-ink-400">事实问题</p>
                    </div>
                    <div className="rounded-xl bg-paper-50 px-3 py-2 text-center">
                      <p className="font-semibold text-ink">{topic.sourceEntryIds?.length ?? 0}</p>
                      <p className="text-ink-400">来源</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-ink-400">Topic 名称</span>
                    <input
                      value={edit.topicLabel}
                      onChange={(e) => updateEdit(topic.id, { topicLabel: e.target.value })}
                      className="mt-1 w-full rounded-2xl border-0 bg-paper-200 px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent focus:bg-paper focus:ring-hairline"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-400">
                        状态
                        <FieldInfoButton
                          title={TOPIC_STATUS_INFO.title}
                          body={TOPIC_STATUS_INFO.body}
                          ariaLabel={TOPIC_STATUS_INFO.ariaLabel}
                        />
                      </span>
                      <select
                        value={edit.status}
                        onChange={(e) => updateEdit(topic.id, { status: e.target.value })}
                        className="mt-1 w-full rounded-2xl border-0 bg-paper-200 px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent focus:bg-paper focus:ring-hairline"
                      >
                        <option value="candidate">candidate</option>
                        <option value="active">active</option>
                        <option value="archived">archived</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-400">
                        置信度
                        <FieldInfoButton
                          title={TOPIC_CONFIDENCE_INFO.title}
                          body={TOPIC_CONFIDENCE_INFO.body}
                          ariaLabel={TOPIC_CONFIDENCE_INFO.ariaLabel}
                        />
                      </span>
                      <select
                        value={edit.confidence}
                        onChange={(e) => updateEdit(topic.id, { confidence: e.target.value })}
                        className="mt-1 w-full rounded-2xl border-0 bg-paper-200 px-4 py-3 text-sm text-ink outline-none ring-1 ring-transparent focus:bg-paper focus:ring-hairline"
                      >
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                      </select>
                    </label>
                  </div>
                </div>

                <label className="mt-3 block">
                  <span className="text-xs font-medium text-ink-400">Topic 摘要</span>
                  <textarea
                    value={edit.summary}
                    onChange={(e) => updateEdit(topic.id, { summary: e.target.value })}
                    rows={5}
                    className="mt-1 w-full rounded-2xl border-0 bg-paper-200 px-4 py-3 text-sm leading-6 text-ink outline-none ring-1 ring-transparent focus:bg-paper focus:ring-hairline"
                  />
                </label>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-ink-400">别名</span>
                    <textarea
                      value={edit.aliases}
                      onChange={(e) => updateEdit(topic.id, { aliases: e.target.value })}
                      rows={4}
                      className="mt-1 w-full rounded-2xl border-0 bg-paper-200 px-4 py-3 text-sm leading-6 text-ink outline-none ring-1 ring-transparent focus:bg-paper focus:ring-hairline"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-ink-400">问题模板</span>
                    <textarea
                      value={edit.questionPatterns}
                      onChange={(e) => updateEdit(topic.id, { questionPatterns: e.target.value })}
                      rows={4}
                      className="mt-1 w-full rounded-2xl border-0 bg-paper-200 px-4 py-3 text-sm leading-6 text-ink outline-none ring-1 ring-transparent focus:bg-paper focus:ring-hairline"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void saveTopic(topic.id)}
                    disabled={savingId === topic.id}
                    className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-50"
                  >
                    {savingId === topic.id ? "保存中..." : "保存修改"}
                  </button>
                  <select
                    value={edit.mergeTargetId}
                    onChange={(e) => updateEdit(topic.id, { mergeTargetId: e.target.value })}
                    className="rounded-full border-0 bg-paper-200 px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-transparent focus:bg-paper focus:ring-hairline"
                  >
                    <option value="">选择合并目标</option>
                    {mergeTargets
                      .filter((item) => item.id !== topic.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.topicLabel} ({item.status})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void mergeTopic(topic.id)}
                    disabled={mergingId === topic.id}
                    className="rounded-full border border-hairline bg-paper px-5 py-2.5 text-sm font-medium text-ink-600 disabled:opacity-50"
                  >
                    {mergingId === topic.id ? "归并中..." : "归并到目标"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
