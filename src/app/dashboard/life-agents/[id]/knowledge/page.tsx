"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { fetchManageData, type ManageData } from "@/app/dashboard/life-agents/_lib/manage";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  PanelHeader,
  StatStrip,
} from "@/components/dashboard/AgentAdminUI";

type KnowledgeEntry = {
  id: string;
  category: string;
  title: string;
  content: string;
  sourceType: string;
  sourceTypeLabel: string;
  wordCount: number;
  hasEmbedding: boolean;
  updatedAt: string;
  createdAt: string;
};

export default function KnowledgeHubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [manage, setManage] = useState<ManageData | null>(null);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ category: "经历", title: "", content: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [manageRes, knowledgeRes] = await Promise.all([
        fetchManageData(id),
        fetch(`/api/life-agents/${id}/knowledge`, { credentials: "include" }).then((r) => r.json()),
      ]);
      if (manageRes.data) setManage(manageRes.data);
      if (manageRes.error) setError(manageRes.error);
      if (Array.isArray(knowledgeRes.entries)) {
        setEntries(knowledgeRes.entries);
        setTotalWords(knowledgeRes.totalWords ?? 0);
      }
    } catch {
      setError("加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (typeFilter && e.sourceType !== typeFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    });
  }, [entries, search, typeFilter]);

  const sourceTypes = useMemo(
    () => Array.from(new Set(entries.map((e) => e.sourceType).filter(Boolean))),
    [entries]
  );

  async function deleteEntry(entryId: string) {
    if (!confirm("确定删除这条知识？关联时间线可能受影响。")) return;
    const res = await fetch(`/api/life-agents/${id}/knowledge/${entryId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    }
  }

  async function createEntry() {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/life-agents/${id}/knowledge`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdd(false);
        setNewEntry({ category: "经历", title: "", content: "" });
        await load();
      } else {
        alert(data.error ?? "创建失败");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminPage narrow>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (error || !manage) {
    return (
      <AdminPage narrow>
        <EmptyState
          title={error ?? "加载失败"}
          action={
            <Link href={`/dashboard/life-agents/${id}`} className="btn-primary">
              返回工作台
            </Link>
          }
        />
      </AdminPage>
    );
  }

  return (
    <AdminPage narrow>
      <PageHeader
        title="知识库"
        description={`${manage.profile.displayName} 的可检索经历与 Q&A，Agent 回答时会引用这些内容。`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowAdd((v) => !v)}>
              <Plus className="mr-1 inline h-4 w-4" aria-hidden />
              添加知识
            </button>
            <Link href={`/dashboard/life-agents/${id}/co-edit`} className="btn-primary">
              对话调教
            </Link>
          </div>
        }
      />

      <StatStrip
        columns={3}
        items={[
          { label: "知识条目", value: entries.length, sub: "条" },
          { label: "总字数", value: totalWords.toLocaleString("zh-CN"), sub: "字" },
          {
            label: "已向量化",
            value: entries.filter((e) => e.hasEmbedding).length,
            sub: "条",
            tone: "signal",
          },
        ]}
      />

      {showAdd && (
        <Panel className="mt-5">
          <PanelHeader title="新增知识条目" description="保存后会进入 RAG 检索，并在回答中作为引用来源。" />
          <div className="space-y-3 p-4 sm:p-5">
            <input
              className="input-shell"
              placeholder="分类，如：经历 / Q&A"
              value={newEntry.category}
              onChange={(e) => setNewEntry((p) => ({ ...p, category: e.target.value }))}
            />
            <input
              className="input-shell"
              placeholder="标题"
              value={newEntry.title}
              onChange={(e) => setNewEntry((p) => ({ ...p, title: e.target.value }))}
            />
            <textarea
              className="input-shell min-h-32"
              placeholder="正文内容"
              value={newEntry.content}
              onChange={(e) => setNewEntry((p) => ({ ...p, content: e.target.value }))}
            />
            <div className="flex gap-2">
              <button type="button" className="btn-primary" disabled={saving} onClick={() => void createEntry()}>
                {saving ? "保存中…" : "保存"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>
                取消
              </button>
            </div>
          </div>
        </Panel>
      )}

      <Panel className="mt-5">
        <PanelHeader title="内容列表" description="可按类型筛选，或在对话调教中批量导入。" />
        <div className="space-y-3 border-b border-hairline px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            <input
              className="input-shell !min-h-10 min-w-[12rem] flex-1 text-sm"
              placeholder="搜索标题或内容…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="input-shell !min-h-10 !w-auto text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">全部类型</option>
              {sourceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-hairline bg-paper-50 text-xs text-ink-400">
              <tr>
                <th className="px-4 py-2.5 font-medium sm:px-5">名称</th>
                <th className="px-4 py-2.5 font-medium">类型</th>
                <th className="px-4 py-2.5 font-medium">分类</th>
                <th className="px-4 py-2.5 font-medium">字数</th>
                <th className="px-4 py-2.5 font-medium">更新</th>
                <th className="px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-400 sm:px-5">
                    暂无知识条目
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-hairline/70 hover:bg-paper-50">
                    <td className="max-w-[14rem] truncate px-4 py-3 font-medium text-ink sm:px-5">{entry.title}</td>
                    <td className="px-4 py-3 text-ink-500">{entry.sourceTypeLabel || entry.sourceType}</td>
                    <td className="px-4 py-3 text-ink-500">{entry.category}</td>
                    <td className="px-4 py-3 text-ink-500">{entry.wordCount}</td>
                    <td className="px-4 py-3 text-xs text-ink-400">
                      {new Date(entry.updatedAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs text-signal-700 hover:underline"
                          onClick={() => router.push(`/dashboard/life-agents/${id}/co-edit`)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-oxblood-600 hover:underline"
                          onClick={() => void deleteEntry(entry.id)}
                        >
                          <Trash2 className="h-3 w-3" aria-hidden />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 text-xs text-ink-400">
        <BookOpen className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        买家在聊天中看到的引用上标，会指向这里的条目。
      </p>
    </AdminPage>
  );
}
