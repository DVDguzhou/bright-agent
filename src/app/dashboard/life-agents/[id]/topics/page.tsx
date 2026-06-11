"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { FieldInfoButton } from "@/components/FieldInfoButton";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  SearchInput,
  SegmentedControl,
  StatStrip,
  StatusBadge,
} from "@/components/dashboard/AgentAdminUI";

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

type LoadState = { topics: TopicItem[]; loading: boolean; error: string | null };
type FilterKey = "all" | "active" | "candidate" | "archived";
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

const TOPIC_STATUS_INFO = {
  title: "Topic 状态有什么用？",
  ariaLabel: "Topic 状态说明",
  body: [
    "状态决定这个 Topic 会不会被 Agent 用在对话检索里。",
    "candidate：系统自动提取，建议先人工看一眼。",
    "active：确认可用，用户提问时会参与检索匹配。",
    "archived：不再使用，归并到其他 Topic 后也会变成此状态。",
  ],
} as const;

const TOPIC_CONFIDENCE_INFO = {
  title: "Topic 置信度有什么用？",
  ariaLabel: "Topic 置信度说明",
  body: [
    "置信度表示你对这条 Topic 摘要有多少把握。",
    "low：不太确定，可能是推断或待核实。",
    "medium：一般确定，适合大多数自动生成的主题。",
    "high：很确定且有充分依据，检索时可以优先引用。",
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

function statusTone(status?: string): "neutral" | "signal" | "olive" {
  if (status === "active") return "olive";
  if (status === "candidate") return "signal";
  return "neutral";
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
  const [filter, setFilter] = useState<FilterKey>("all");

  const setQuery = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value);
    else params.delete("q");
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
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
    return byStatus.filter((topic) => topicMatchesQuery(topic, edits[topic.id], keyword));
  }, [filter, query, state.topics, edits]);

  const mergeTargets = useMemo(() => state.topics.filter((topic) => topic.status !== "archived"), [state.topics]);

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
    return (
      <AdminPage>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (state.error && state.topics.length === 0) {
    return (
      <AdminPage narrow>
        <EmptyState title={state.error} action={<Link href={`/dashboard/life-agents/${id}`} className="btn-primary">返回工作台</Link>} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="Topic 管理"
        description="审核从知识和长会话里长出来的主题，手动激活、归档、合并或修正文案。"
        actions={<SearchInput value={query} onChange={setQuery} placeholder="搜索 Topic、摘要或别名" label="搜索 Topic" />}
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <StatStrip
          columns={4}
          items={[
            { label: "Topic 总数", value: state.topics.length, sub: "个" },
            { label: "待审核", value: state.topics.filter((topic) => topic.status === "candidate").length, sub: "个", tone: "signal" },
            { label: "已启用", value: state.topics.filter((topic) => topic.status === "active").length, sub: "个", tone: "olive" },
            { label: "关联反馈", value: state.topics.reduce((sum, topic) => sum + (topic.feedback?.total ?? 0), 0), sub: "条" },
          ]}
        />
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "全部" },
            { value: "candidate", label: "待审核" },
            { value: "active", label: "已启用" },
            { value: "archived", label: "已归档" },
          ]}
        />
      </div>

      {filteredTopics.length === 0 ? (
        <EmptyState title={query.trim() ? "没有匹配的 Topic" : "当前筛选下还没有 Topic"} />
      ) : (
        <div className="space-y-4">
          {filteredTopics.map((topic) => {
            const edit = edits[topic.id];
            if (!edit) return null;
            return (
              <Panel key={topic.id}>
                <div className="border-b border-hairline/60 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-ink">{edit.topicLabel || topic.topicLabel}</h2>
                        <StatusBadge tone={statusTone(topic.status)}>{topic.status ?? "candidate"}</StatusBadge>
                        {topic.manualEdited ? <StatusBadge>人工修改过</StatusBadge> : null}
                      </div>
                      <p className="mt-1 text-xs text-ink-400">
                        {topic.topicGroup} · {topic.source || "unknown"} · 来源 {topic.sourceEntryIds?.length ?? 0}
                      </p>
                      <p className="mt-1 break-all font-mono text-[11px] text-ink-300">{topic.topicKey}</p>
                      {topic.mergedIntoTopicLabel ? <p className="mt-1 text-xs text-ink-400">已归并到：{topic.mergedIntoTopicLabel}</p> : null}
                    </div>
                    <p className="text-xs text-ink-400">
                      反馈 {topic.feedback?.total ?? 0} · 有帮助 {topic.feedback?.helpful ?? 0} · 事实问题{" "}
                      {(topic.feedback?.factualError ?? 0) + (topic.feedback?.contradiction ?? 0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-ink-500">Topic 名称</span>
                      <input value={edit.topicLabel} onChange={(e) => updateEdit(topic.id, { topicLabel: e.target.value })} className="input-shell mt-1" />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-500">
                          状态
                          <FieldInfoButton title={TOPIC_STATUS_INFO.title} body={TOPIC_STATUS_INFO.body} ariaLabel={TOPIC_STATUS_INFO.ariaLabel} />
                        </span>
                        <select value={edit.status} onChange={(e) => updateEdit(topic.id, { status: e.target.value })} className="input-shell mt-1">
                          <option value="candidate">candidate</option>
                          <option value="active">active</option>
                          <option value="archived">archived</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-500">
                          置信度
                          <FieldInfoButton title={TOPIC_CONFIDENCE_INFO.title} body={TOPIC_CONFIDENCE_INFO.body} ariaLabel={TOPIC_CONFIDENCE_INFO.ariaLabel} />
                        </span>
                        <select value={edit.confidence} onChange={(e) => updateEdit(topic.id, { confidence: e.target.value })} className="input-shell mt-1">
                          <option value="low">low</option>
                          <option value="medium">medium</option>
                          <option value="high">high</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-xs font-medium text-ink-500">Topic 摘要</span>
                    <textarea value={edit.summary} onChange={(e) => updateEdit(topic.id, { summary: e.target.value })} rows={5} className="input-shell mt-1 min-h-28" />
                  </label>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-ink-500">别名</span>
                      <textarea value={edit.aliases} onChange={(e) => updateEdit(topic.id, { aliases: e.target.value })} rows={4} className="input-shell mt-1 min-h-24" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-ink-500">问题模板</span>
                      <textarea value={edit.questionPatterns} onChange={(e) => updateEdit(topic.id, { questionPatterns: e.target.value })} rows={4} className="input-shell mt-1 min-h-24" />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-hairline/60 pt-4">
                    <button type="button" onClick={() => void saveTopic(topic.id)} disabled={savingId === topic.id} className="btn-primary">
                      {savingId === topic.id ? "保存中" : "保存修改"}
                    </button>
                    <select value={edit.mergeTargetId} onChange={(e) => updateEdit(topic.id, { mergeTargetId: e.target.value })} className="input-shell !min-h-10 !w-auto min-w-[220px] text-sm">
                      <option value="">选择合并目标</option>
                      {mergeTargets
                        .filter((item) => item.id !== topic.id)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.topicLabel} ({item.status})
                          </option>
                        ))}
                    </select>
                    <button type="button" onClick={() => void mergeTopic(topic.id)} disabled={mergingId === topic.id} className="btn-secondary">
                      {mergingId === topic.id ? "归并中" : "归并到目标"}
                    </button>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
