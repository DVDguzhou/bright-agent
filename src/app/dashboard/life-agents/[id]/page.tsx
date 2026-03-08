"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type KnowledgeDraft = {
  category: string;
  title: string;
  content: string;
  tags: string;
};

type ManageData = {
  profile: {
    id: string;
    displayName: string;
    headline: string;
    shortBio: string;
    longBio: string;
    audience: string;
    welcomeMessage: string;
    pricePerQuestion: number;
    expertiseTags: string[];
    sampleQuestions: string[];
    published: boolean;
    knowledgeEntries: Array<{
      id: string;
      category: string;
      title: string;
      content: string;
      tags: string[];
    }>;
  };
  stats: {
    totalRevenue: number;
    soldPacks: number;
    sessionCount: number;
  };
  questionPacks: Array<{
    id: string;
    questionCount: number;
    questionsUsed: number;
    amountPaid: number;
    createdAt: string;
    buyer: { email: string; name: string | null };
  }>;
  chatSessions: Array<{
    id: string;
    title: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
    buyer: { email: string; name: string | null };
  }>;
};

export default function LifeAgentManageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<ManageData | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "sales" | "sessions">("edit");
  const [form, setForm] = useState({
    displayName: "",
    headline: "",
    shortBio: "",
    longBio: "",
    audience: "",
    welcomeMessage: "",
    pricePerQuestion: "990",
    expertiseTags: "",
    sampleQuestions: "",
    published: true,
  });
  const [entries, setEntries] = useState<KnowledgeDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/life-agents/${id}/manage`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.profile) {
          const p = d.profile;
          setForm({
            displayName: p.displayName,
            headline: p.headline,
            shortBio: p.shortBio,
            longBio: p.longBio,
            audience: p.audience,
            welcomeMessage: p.welcomeMessage,
            pricePerQuestion: String(p.pricePerQuestion),
            expertiseTags: Array.isArray(p.expertiseTags) ? p.expertiseTags.join(", ") : "",
            sampleQuestions: Array.isArray(p.sampleQuestions) ? p.sampleQuestions.join("\n") : "",
            published: p.published,
          });
          setEntries(
            (p.knowledgeEntries || []).map((e: { category: string; title: string; content: string; tags: string[] }) => ({
              category: e.category,
              title: e.title,
              content: e.content,
              tags: Array.isArray(e.tags) ? e.tags.join(", ") : "",
            }))
          );
        }
      })
      .catch(() => setData(null));
  }, [id]);

  const updateEntry = (index: number, key: keyof KnowledgeDraft, value: string) => {
    setEntries((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, [key]: value } : entry)));
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, { category: "经验主题", title: "", content: "", tags: "经验, 建议" }]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (entries.length < 2) {
      setError("至少保留 2 条经验知识");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      pricePerQuestion: parseInt(form.pricePerQuestion, 10),
      expertiseTags: form.expertiseTags.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean),
      sampleQuestions: form.sampleQuestions.split("\n").map((s) => s.trim()).filter(Boolean),
      knowledgeEntries: entries.map((entry) => ({
        category: entry.category,
        title: entry.title,
        content: entry.content,
        tags: entry.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      })),
    };

    const res = await fetch(`/api/life-agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const resData = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(resData.error === "FORBIDDEN" ? "无权编辑" : "保存失败，请检查输入");
      return;
    }
    setData((prev) => (prev ? { ...prev, profile: resData } : prev));
    router.refresh();
  };

  if (!data) {
    return (
      <div className="py-20">
        <div className="mx-auto h-64 w-full max-w-2xl animate-pulse rounded-3xl bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/life-agents" className="text-sm text-slate-500 hover:text-sky-700">
          ← 返回我的人生 Agent
        </Link>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="section-title">{data.profile.displayName}</h1>
            <p className="section-subtitle mt-1">{data.profile.headline}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/life-agents/${id}`} className="btn-secondary">
              查看展示页
            </Link>
            <Link href={`/life-agents/${id}/chat`} className="btn-primary">
              进入聊天
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">累计收入</p>
          <p className="mt-1 text-2xl font-semibold text-sky-700">
            ¥{(data.stats.totalRevenue / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">售出次数包</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data.stats.soldPacks}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">聊天会话</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data.stats.sessionCount}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {(["edit", "sales", "sessions"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-sky-500 text-sky-700"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab === "edit" ? "编辑资料" : tab === "sales" ? "销量记录" : "聊天记录"}
          </button>
        ))}
      </div>

      {activeTab === "edit" && (
        <form onSubmit={submit} className="space-y-6">
          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">基本展示信息</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Agent 名称</label>
                <input
                  className="input-shell"
                  value={form.displayName}
                  onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">一句话介绍</label>
                <input
                  className="input-shell"
                  value={form.headline}
                  onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">简短介绍</label>
                <textarea
                  className="input-shell min-h-24"
                  value={form.shortBio}
                  onChange={(e) => setForm((prev) => ({ ...prev, shortBio: e.target.value }))}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">详细背景</label>
                <textarea
                  className="input-shell min-h-36"
                  value={form.longBio}
                  onChange={(e) => setForm((prev) => ({ ...prev, longBio: e.target.value }))}
                  required
                />
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">聊天与收费设置</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">适合帮助的人群</label>
                <textarea
                  className="input-shell min-h-24"
                  value={form.audience}
                  onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">首次欢迎语</label>
                <textarea
                  className="input-shell min-h-24"
                  value={form.welcomeMessage}
                  onChange={(e) => setForm((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">每次提问价格（分）</label>
                <input
                  type="number"
                  min={100}
                  className="input-shell"
                  value={form.pricePerQuestion}
                  onChange={(e) => setForm((prev) => ({ ...prev, pricePerQuestion: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">已发布</span>
                </label>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">擅长标签</label>
                <input
                  className="input-shell"
                  value={form.expertiseTags}
                  onChange={(e) => setForm((prev) => ({ ...prev, expertiseTags: e.target.value }))}
                  placeholder="逗号分隔"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">示例问题</label>
                <textarea
                  className="input-shell min-h-24"
                  value={form.sampleQuestions}
                  onChange={(e) => setForm((prev) => ({ ...prev, sampleQuestions: e.target.value }))}
                  placeholder="每行一个"
                />
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">经验知识</h2>
              <button type="button" onClick={addEntry} className="btn-secondary">
                新增一条
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {entries.map((entry, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">分类</label>
                      <input
                        className="input-shell"
                        value={entry.category}
                        onChange={(e) => updateEntry(index, "category", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">标题</label>
                      <input
                        className="input-shell"
                        value={entry.title}
                        onChange={(e) => updateEntry(index, "title", e.target.value)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">内容</label>
                      <textarea
                        className="input-shell min-h-28"
                        value={entry.content}
                        onChange={(e) => updateEntry(index, "content", e.target.value)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">标签</label>
                      <input
                        className="input-shell"
                        value={entry.tags}
                        onChange={(e) => updateEntry(index, "tags", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? "保存中..." : "保存修改"}
          </button>
        </form>
      )}

      {activeTab === "sales" && (
        <div className="glass-card overflow-hidden">
          <h3 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-900">
            购买记录（最近 50 条）
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left font-medium text-slate-600">购买者</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">次数</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">已用</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">金额</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">购买时间</th>
                </tr>
              </thead>
              <tbody>
                {data.questionPacks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      暂无购买记录
                    </td>
                  </tr>
                ) : (
                  data.questionPacks.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="px-6 py-4 text-slate-700">{p.buyer.name || p.buyer.email}</td>
                      <td className="px-6 py-4">{p.questionCount}</td>
                      <td className="px-6 py-4">{p.questionsUsed}</td>
                      <td className="px-6 py-4 font-medium text-sky-700">
                        ¥{(p.amountPaid / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(p.createdAt).toLocaleString("zh-CN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="glass-card overflow-hidden">
          <h3 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-900">
            聊天会话（最近 50 条）
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left font-medium text-slate-600">咨询者</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">会话标题</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">消息数</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">最近更新</th>
                </tr>
              </thead>
              <tbody>
                {data.chatSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      暂无聊天会话
                    </td>
                  </tr>
                ) : (
                  data.chatSessions.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="px-6 py-4 text-slate-700">{s.buyer.name || s.buyer.email}</td>
                      <td className="px-6 py-4 max-w-[200px] truncate">{s.title}</td>
                      <td className="px-6 py-4">{s.messageCount}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(s.updatedAt).toLocaleString("zh-CN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
