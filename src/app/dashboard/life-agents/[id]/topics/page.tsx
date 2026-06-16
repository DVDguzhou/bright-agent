"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  BookOpenText,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  GitMerge,
  Layers3,
  PencilLine,
  Sparkles,
  Tag,
} from "lucide-react";
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
import { computeCompletion, fetchManageData, type ManageData, type ManageProfile } from "@/app/dashboard/life-agents/_lib/manage";

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

type KnowledgeEntry = ManageProfile["knowledgeEntries"][number];
type TimelineEvent = NonNullable<ManageProfile["timelineEvents"]>[number];
type LoadState = {
  topics: TopicItem[];
  manage: ManageData | null;
  loading: boolean;
  error: string | null;
};
type FilterKey = "all" | "active" | "candidate" | "archived";
type WorkspaceView = "timeline" | "tags" | "topics";
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

const GROUP_LABELS: Record<string, string> = {
  education: "教育",
  career: "职业",
  industry: "行业",
  cityChoice: "城市选择",
  startup: "创业",
  money: "收入",
  relationship: "关系",
  family: "家庭",
  mental: "状态",
  lifeChoice: "人生选择",
  social: "社交",
};

const TIMELINE_LABELS: Record<string, string> = {
  confirmed: "已确认",
  needs_clarification: "待补时间",
  inferred: "推断",
};

function statusTone(status?: string): "neutral" | "signal" | "olive" {
  if (status === "active") return "olive";
  if (status === "candidate") return "signal";
  return "neutral";
}

function confidenceTone(confidence?: string): "neutral" | "signal" | "olive" {
  if (confidence === "high") return "olive";
  if (confidence === "low") return "signal";
  return "neutral";
}

function timelineTone(status?: string): "neutral" | "signal" | "olive" {
  if (status === "confirmed") return "olive";
  if (status === "needs_clarification") return "signal";
  return "neutral";
}

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

function compactList(items: Array<string | undefined | null>, fallback = "暂未填写") {
  const cleaned = items.map((item) => item?.trim()).filter(Boolean) as string[];
  return cleaned.length > 0 ? cleaned.join(" · ") : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function facetSubjects(entry: KnowledgeEntry) {
  const tags = entry.facetTags;
  if (!tags || typeof tags !== "object") return [];
  const subjects = asStringArray((tags as Record<string, unknown>).subjects);
  const aspect = (tags as Record<string, unknown>).aspect;
  const aspectType = aspect && typeof aspect === "object" ? String((aspect as Record<string, unknown>).type ?? "").trim() : "";
  return [...subjects, aspectType].filter(Boolean);
}

function tagsForEntry(entry: KnowledgeEntry) {
  return Array.from(new Set([...(entry.tags ?? []), ...facetSubjects(entry), entry.category].filter(Boolean)));
}

function contentPreview(content: string, limit = 118) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}...`;
}

function sourceCount(topic: TopicItem) {
  return topic.sourceEntryIds?.length ?? 0;
}

function formatTimelineStatus(status?: string) {
  return TIMELINE_LABELS[status ?? ""] ?? status ?? "待确认";
}

function findKnowledgeByTopic(topic: TopicItem, entries: KnowledgeEntry[]) {
  const ids = new Set(topic.sourceEntryIds ?? []);
  return entries.filter((entry) => ids.has(entry.id));
}

function InsightChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-hairline/70 bg-paper-50 px-3 py-3 shadow-glow-sm transition duration-200 hover:-translate-y-0.5 hover:border-signal-300 hover:shadow-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold leading-none text-ink">{value}</div>
    </div>
  );
}

function TimelineRail({
  events,
  activeId,
  onSelect,
}: {
  events: TimelineEvent[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="还没有时间线节点"
        description="当知识里包含关键经历、选择、转折或结果时，系统会把它们整理成人生主线。"
      />
    );
  }
  return (
    <div className="relative">
      <div className="absolute bottom-3 left-[15px] top-3 w-px bg-hairline" aria-hidden />
      <div className="space-y-2">
        {events.map((event) => {
          const active = event.id === activeId;
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelect(event.id)}
              className={`group relative flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition duration-200 motion-reduce:transition-none ${
                active ? "bg-paper-200 shadow-inner-glow" : "hover:bg-paper-100"
              }`}
            >
              <span
                className={`relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-paper-50 transition duration-200 ${
                  active ? "border-signal-500 text-signal-700 shadow-glow-sm" : "border-hairline text-ink-300 group-hover:border-signal-300 group-hover:text-signal-700"
                }`}
              >
                <CircleDot className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{event.periodLabel || "时间待确认"}</span>
                  <StatusBadge tone={timelineTone(event.status)}>{formatTimelineStatus(event.status)}</StatusBadge>
                </span>
                <span className="mt-1 block line-clamp-1 text-sm text-ink-600">{event.title}</span>
                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-ink-400">{event.summary}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimelineDetail({ event }: { event: TimelineEvent | null }) {
  if (!event) {
    return (
      <div className="rounded-lg border border-dashed border-hairline/80 bg-paper-50 p-5 text-sm leading-6 text-ink-400">
        选择左侧时间线节点，查看它对应的经历、因果和待补充信息。
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-hairline/70 bg-paper-50 p-4 shadow-glow-sm transition duration-200 motion-safe:animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{event.title}</p>
          <p className="mt-1 text-xs text-ink-400">
            {event.periodLabel} · {event.eventType || "experience"} · 来源 {event.sourceEntryIds?.length ?? 0}
          </p>
        </div>
        <StatusBadge tone={confidenceTone(event.confidence)}>{event.confidence ?? "medium"}</StatusBadge>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-600">{event.summary}</p>
      {event.clarificationQuestion ? (
        <div className="mt-4 rounded-md bg-signal-50 px-3 py-2 text-sm leading-6 text-signal-700">
          {event.clarificationQuestion}
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniList title="原因" items={event.causes ?? []} />
        <MiniList title="结果" items={event.outcomes ?? []} />
        <MiniList title="取舍" items={event.tradeoffs ?? []} />
      </div>
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md bg-paper-100 px-3 py-2">
      <p className="text-xs font-medium text-ink-500">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 space-y-1 text-xs leading-5 text-ink-400">
          {items.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-ink-300">暂无</p>
      )}
    </div>
  );
}

function TagCloud({
  tags,
  selected,
  onSelect,
}: {
  tags: Array<{ label: string; count: number }>;
  selected: string | null;
  onSelect: (tag: string | null) => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`min-h-9 rounded border px-3 text-sm font-medium transition active:scale-[0.98] motion-reduce:transition-none ${
          selected === null ? "border-ink bg-ink text-paper-50" : "border-hairline bg-paper-50 text-ink-500 hover:border-signal-300 hover:text-ink"
        }`}
      >
        全部标签
      </button>
      {tags.map((tag) => (
        <button
          key={tag.label}
          type="button"
          onClick={() => onSelect(tag.label)}
          className={`group min-h-9 rounded border px-3 text-sm transition active:scale-[0.98] motion-reduce:transition-none ${
            selected === tag.label ? "border-signal-600 bg-signal-50 text-signal-700" : "border-hairline bg-paper-50 text-ink-500 hover:border-signal-300 hover:text-ink"
          }`}
        >
          <span className="font-medium">{tag.label}</span>
          <span className="ml-1 text-xs text-ink-300 group-hover:text-ink-400">{tag.count}</span>
        </button>
      ))}
    </div>
  );
}

function KnowledgeStrip({ entries }: { entries: KnowledgeEntry[] }) {
  if (entries.length === 0) {
    return <p className="rounded-md bg-paper-100 px-3 py-2 text-xs text-ink-400">这个 Topic 暂时没有关联到具体知识条目。</p>;
  }
  return (
    <div className="space-y-2">
      {entries.slice(0, 3).map((entry) => (
        <div key={entry.id} className="rounded-md bg-paper-100 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold text-ink">{entry.title}</p>
            {entry.timelineStatus ? <StatusBadge tone={entry.timelineStatus === "needs_clarification" ? "signal" : "neutral"}>{entry.timelineStatus}</StatusBadge> : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-400">{contentPreview(entry.content)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tagsForEntry(entry).slice(0, 5).map((tag) => (
              <span key={tag} className="rounded bg-paper-50 px-1.5 py-0.5 text-[11px] text-ink-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LifeAgentTopicsPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const query = searchParams.get("q") ?? "";
  const [state, setState] = useState<LoadState>({ topics: [], manage: null, loading: true, error: null });
  const [edits, setEdits] = useState<EditState>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [view, setView] = useState<WorkspaceView>("timeline");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeTimelineId, setActiveTimelineId] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const setQuery = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value);
    else params.delete("q");
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [topicRes, manageRes] = await Promise.all([
        fetch(`/api/life-agents/${id}/topics`, { credentials: "include" }),
        fetchManageData(id),
      ]);
      const topicData = await topicRes.json().catch(() => null);
      if (!topicRes.ok) {
        setState({ topics: [], manage: null, loading: false, error: topicData?.detail || "加载 Topic 失败" });
        return;
      }
      if (manageRes.error || !manageRes.data) {
        setState({ topics: [], manage: null, loading: false, error: manageRes.error || "加载 Agent 档案失败" });
        return;
      }
      const topics = Array.isArray(topicData?.topics) ? (topicData.topics as TopicItem[]) : [];
      const timelineEvents = manageRes.data.profile.timelineEvents ?? [];
      setState({ topics, manage: manageRes.data, loading: false, error: null });
      setActiveTimelineId((prev) => prev ?? timelineEvents[0]?.id ?? null);
      setExpandedTopicId((prev) => prev ?? topics[0]?.id ?? null);
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
      setState({ topics: [], manage: null, loading: false, error: "网络错误，请稍后重试" });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const profile = state.manage?.profile;
  const entries = useMemo(() => profile?.knowledgeEntries ?? [], [profile?.knowledgeEntries]);
  const timelineEvents = useMemo(() => profile?.timelineEvents ?? [], [profile?.timelineEvents]);
  const activeTimeline = useMemo(() => timelineEvents.find((event) => event.id === activeTimelineId) ?? timelineEvents[0] ?? null, [activeTimelineId, timelineEvents]);
  const completion = profile ? computeCompletion(profile) : 0;

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      for (const tag of tagsForEntry(entry)) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .slice(0, 18)
      .map(([label, count]) => ({ label, count }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!selectedTag) return entries;
    return entries.filter((entry) => tagsForEntry(entry).includes(selectedTag));
  }, [entries, selectedTag]);

  const filteredTopics = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const byStatus = filter === "all" ? state.topics : state.topics.filter((topic) => topic.status === filter);
    const byQuery = byStatus.filter((topic) => topicMatchesQuery(topic, edits[topic.id], keyword));
    if (!selectedTag) return byQuery;
    const entryIds = new Set(filteredEntries.map((entry) => entry.id));
    return byQuery.filter((topic) => (topic.sourceEntryIds ?? []).some((entryId) => entryIds.has(entryId)));
  }, [edits, filter, filteredEntries, query, selectedTag, state.topics]);

  const mergeTargets = useMemo(() => state.topics.filter((topic) => topic.status !== "archived"), [state.topics]);
  const needsTimeCount = timelineEvents.filter((event) => event.status === "needs_clarification").length + entries.filter((entry) => entry.timelineStatus === "needs_clarification").length;
  const feedbackTotal = state.topics.reduce((sum, topic) => sum + (topic.feedback?.total ?? 0), 0);

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
        <LoadingBlock label="正在整理 Agent 记忆" />
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
        title="记忆管理"
        description="用 Profile、时间线和标签一起整理 Agent 的真实经历，让它知道什么是主线、什么是可检索内容。"
        actions={<SearchInput value={query} onChange={setQuery} placeholder="搜索 Topic、标签、摘要或别名" label="搜索记忆" />}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={profile?.published ? "olive" : "neutral"}>{profile?.published ? "已发布" : "未发布"}</StatusBadge>
            <StatusBadge tone="signal">Profile {completion}%</StatusBadge>
            {needsTimeCount > 0 ? <StatusBadge tone="signal">{needsTimeCount} 条待补时间</StatusBadge> : <StatusBadge tone="olive">时间线清晰</StatusBadge>}
          </div>
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink text-paper-50 shadow-glow-sm">
                  <BookOpenText className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold leading-snug text-ink">{profile?.displayName ?? "Life Agent"}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-500">{profile?.headline || "把经历整理成能被咨询的记忆结构"}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InsightChip icon={<PencilLine className="h-4 w-4" aria-hidden />} label="身份线索" value={compactList([profile?.school, profile?.job, profile?.city])} />
                <InsightChip icon={<Tag className="h-4 w-4" aria-hidden />} label="擅长标签" value={(profile?.expertiseTags ?? []).slice(0, 3).join(" · ") || "待补充"} />
              </div>
            </div>
            <div className="border-t border-hairline/60 bg-paper-100 p-4 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span>资料完成度</span>
                <span className="font-semibold text-ink">{completion}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded bg-paper-300">
                <div className="h-full rounded bg-signal-600 transition-all duration-500 motion-reduce:transition-none" style={{ width: `${completion}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-400">优先补齐关键经历的时间、结果、取舍，Agent 会更像一个有完整人生上下文的人。</p>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <InsightChip icon={<Clock3 className="h-4 w-4" aria-hidden />} label="时间线节点" value={timelineEvents.length} />
          <InsightChip icon={<Layers3 className="h-4 w-4" aria-hidden />} label="知识条目" value={entries.length} />
        </div>
      </div>

      <div className="mb-5">
        <StatStrip
          columns={4}
          items={[
            { label: "Topic 总数", value: state.topics.length, sub: "个" },
            { label: "待审核", value: state.topics.filter((topic) => topic.status === "candidate").length, sub: "个", tone: "signal" },
            { label: "已启用", value: state.topics.filter((topic) => topic.status === "active").length, sub: "个", tone: "olive" },
            { label: "关联反馈", value: feedbackTotal, sub: "条" },
          ]}
        />
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: "timeline", label: "时间线" },
            { value: "tags", label: "标签内容" },
            { value: "topics", label: "Topic 编辑" },
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

      {view === "timeline" ? (
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Panel className="p-3">
            <TimelineRail events={timelineEvents} activeId={activeTimeline?.id ?? null} onSelect={setActiveTimelineId} />
          </Panel>
          <TimelineDetail event={activeTimeline} />
        </div>
      ) : null}

      {view === "tags" ? (
        <div className="space-y-5 motion-safe:animate-fade-in">
          <Panel className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-signal-700" aria-hidden />
              <h2 className="text-base font-semibold text-ink">标签索引</h2>
            </div>
            <TagCloud tags={tagCounts} selected={selectedTag} onSelect={setSelectedTag} />
          </Panel>
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredEntries.slice(0, 12).map((entry) => (
              <Panel key={entry.id} className="p-4 transition duration-200 hover:-translate-y-0.5 hover:border-signal-300 hover:shadow-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink">{entry.title}</h3>
                  {entry.timelineStatus ? <StatusBadge tone={entry.timelineStatus === "needs_clarification" ? "signal" : "neutral"}>{entry.timelineStatus}</StatusBadge> : null}
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-500">{contentPreview(entry.content, 180)}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tagsForEntry(entry).slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className="rounded bg-paper-200 px-2 py-1 text-xs text-ink-500 transition hover:bg-signal-50 hover:text-signal-700"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        </div>
      ) : null}

      {view === "topics" ? (
        filteredTopics.length === 0 ? (
          <EmptyState title={query.trim() ? "没有匹配的 Topic" : "当前筛选下还没有 Topic"} />
        ) : (
          <div className="space-y-4 motion-safe:animate-fade-in">
            {filteredTopics.map((topic) => {
              const edit = edits[topic.id];
              if (!edit) return null;
              const expanded = expandedTopicId === topic.id;
              const linkedEntries = findKnowledgeByTopic(topic, entries);
              const riskyFeedback = (topic.feedback?.factualError ?? 0) + (topic.feedback?.contradiction ?? 0) + (topic.feedback?.tooConfident ?? 0);
              return (
                <Panel key={topic.id} className="overflow-hidden transition duration-200 hover:border-signal-300 hover:shadow-glow motion-reduce:transition-none">
                  <button
                    type="button"
                    onClick={() => setExpandedTopicId(expanded ? null : topic.id)}
                    className="flex w-full items-start justify-between gap-4 border-b border-hairline/60 p-4 text-left transition hover:bg-paper-100 sm:p-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-ink">{edit.topicLabel || topic.topicLabel}</h2>
                        <StatusBadge tone={statusTone(topic.status)}>{topic.status ?? "candidate"}</StatusBadge>
                        <StatusBadge tone={confidenceTone(topic.confidence)}>{topic.confidence ?? "medium"}</StatusBadge>
                        {topic.manualEdited ? <StatusBadge>人工修改</StatusBadge> : null}
                      </div>
                      <p className="mt-1 text-xs text-ink-400">
                        {GROUP_LABELS[topic.topicGroup] ?? topic.topicGroup} · {topic.source || "knowledge"} · 来源 {sourceCount(topic)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-500">{topic.summary || "还没有摘要"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="hidden text-right text-xs text-ink-400 sm:block">
                        <p>反馈 {topic.feedback?.total ?? 0}</p>
                        <p className={riskyFeedback > 0 ? "text-oxblood-600" : ""}>风险 {riskyFeedback}</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-ink-300 transition ${expanded ? "rotate-180 text-signal-700" : ""}`} aria-hidden />
                    </div>
                  </button>

                  {expanded ? (
                    <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px] motion-safe:animate-slide-up">
                      <div className="space-y-4">
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
                          <button type="button" onClick={() => void saveTopic(topic.id)} disabled={savingId === topic.id} className="btn-primary inline-flex items-center gap-2">
                            {savingId === topic.id ? <Sparkles className="h-4 w-4 animate-pulse" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
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
                          <button type="button" onClick={() => void mergeTopic(topic.id)} disabled={mergingId === topic.id} className="btn-secondary inline-flex items-center gap-2">
                            <GitMerge className="h-4 w-4" aria-hidden />
                            {mergingId === topic.id ? "归并中" : "归并到目标"}
                          </button>
                        </div>
                      </div>

                      <aside className="space-y-3">
                        <div className="rounded-lg bg-paper-100 p-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
                            <Archive className="h-4 w-4 text-signal-700" aria-hidden />
                            关联知识
                          </div>
                          <div className="mt-3">
                            <KnowledgeStrip entries={linkedEntries} />
                          </div>
                        </div>
                        {topic.mergedIntoTopicLabel ? (
                          <p className="rounded-md bg-paper-100 px-3 py-2 text-xs text-ink-400">已归并到：{topic.mergedIntoTopicLabel}</p>
                        ) : null}
                        <p className="break-all rounded-md bg-paper-100 px-3 py-2 font-mono text-[11px] leading-5 text-ink-300">{topic.topicKey}</p>
                      </aside>
                    </div>
                  ) : null}
                </Panel>
              );
            })}
          </div>
        )
      ) : null}
    </AdminPage>
  );
}
