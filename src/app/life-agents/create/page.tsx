"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type KnowledgeDraft = {
  category: string;
  title: string;
  content: string;
  tags: string;
};

const defaultEntries: KnowledgeDraft[] = [
  {
    category: "职业成长",
    title: "我怎样从迷茫走到稳定成长",
    content: "",
    tags: "职业规划, 大学生, 职场起步",
  },
  {
    category: "关键转折",
    title: "改变我人生轨迹的一次决定",
    content: "",
    tags: "选择, 转折点, 决策",
  },
];

export default function CreateLifeAgentPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    headline: "",
    shortBio: "",
    longBio: "",
    audience: "",
    welcomeMessage: "你好，你可以把我当作一个有真实经历的人生经验顾问来聊。",
    pricePerQuestion: "990",
    expertiseTags: "大学生成长, 职业选择, 个人规划",
    sampleQuestions: "我适合考研还是就业？\n刚毕业找不到方向怎么办？\n转行之前应该先准备什么？",
  });
  const [entries, setEntries] = useState<KnowledgeDraft[]>(defaultEntries);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const updateEntry = (index: number, key: keyof KnowledgeDraft, value: string) => {
    setEntries((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, [key]: value } : entry)));
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { category: "经验主题", title: "", content: "", tags: "经验, 建议" },
    ]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      ...form,
      pricePerQuestion: parseInt(form.pricePerQuestion, 10),
      expertiseTags: form.expertiseTags
        .split(/[,，\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
      sampleQuestions: form.sampleQuestions
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      knowledgeEntries: entries.map((entry) => ({
        category: entry.category,
        title: entry.title,
        content: entry.content,
        tags: entry.tags
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter(Boolean),
      })),
    };

    const res = await fetch("/api/life-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error === "UNAUTHORIZED" ? "请先登录后再创建" : "创建失败，请检查输入内容");
      return;
    }

    router.push(`/life-agents/${data.id}`);
    router.refresh();
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">先登录，再创建你的人生 Agent</h1>
        <p className="mt-3 text-slate-600">
          你可以先注册账号，然后把自己的人生经验、职业方法和已知信息整理成可聊天的 Agent。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/login" className="btn-primary">
            去登录
          </Link>
          <Link href="/signup" className="btn-secondary">
            去注册
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/life-agents" className="text-sm text-slate-500 hover:text-sky-700">
          ← 返回人生 Agent 列表
        </Link>
        <h1 className="section-title mt-3">创建你的人生经验 Agent</h1>
        <p className="section-subtitle mt-3">
          用简单表单把你的背景、方法论和关键经历输进去，系统会基于这些内容生成一个可咨询的聊天 Agent。
        </p>
      </div>

      <form onSubmit={submit} className="space-y-8">
        <section className="glass-card p-6">
          <h2 className="text-xl font-semibold text-slate-900">1. 基本展示信息</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Agent 名称</label>
              <input
                className="input-shell"
                value={form.displayName}
                onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="例如：阿青学长"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">一句话介绍</label>
              <input
                className="input-shell"
                value={form.headline}
                onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
                placeholder="例如：陪大学生做职业选择的过来人"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">简短介绍</label>
              <textarea
                className="input-shell min-h-28"
                value={form.shortBio}
                onChange={(e) => setForm((prev) => ({ ...prev, shortBio: e.target.value }))}
                placeholder="用 2 到 3 句话介绍你是谁、经历了什么、适合帮助谁。"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">详细背景</label>
              <textarea
                className="input-shell min-h-40"
                value={form.longBio}
                onChange={(e) => setForm((prev) => ({ ...prev, longBio: e.target.value }))}
                placeholder="写清楚你的经历、阶段、长期积累和适合回答的问题范围。"
                required
              />
            </div>
          </div>
        </section>

        <section className="glass-card p-6">
          <h2 className="text-xl font-semibold text-slate-900">2. 聊天与收费设置</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">适合帮助的人群</label>
              <textarea
                className="input-shell min-h-28"
                value={form.audience}
                onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
                placeholder="例如：大学生、转行的人、刚进入社会的人。"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">首次欢迎语</label>
              <textarea
                className="input-shell min-h-28"
                value={form.welcomeMessage}
                onChange={(e) => setForm((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                placeholder="用户进入聊天页时看到的第一句话。"
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
                required
              />
              <p className="mt-2 text-sm text-slate-500">例如 `990` 代表 `9.90 元 / 次`。</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">擅长标签</label>
              <input
                className="input-shell"
                value={form.expertiseTags}
                onChange={(e) => setForm((prev) => ({ ...prev, expertiseTags: e.target.value }))}
                placeholder="用逗号分隔，例如：考研, 转行, 找工作"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">示例问题</label>
              <textarea
                className="input-shell min-h-28"
                value={form.sampleQuestions}
                onChange={(e) => setForm((prev) => ({ ...prev, sampleQuestions: e.target.value }))}
                placeholder={"每行一个示例问题"}
                required
              />
            </div>
          </div>
        </section>

        <section className="glass-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">3. 输入你的经验知识</h2>
              <p className="mt-1 text-sm text-slate-500">至少填写 2 条，写得越具体，聊天效果越好。</p>
            </div>
            <button type="button" onClick={addEntry} className="btn-secondary">
              新增一条经验
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {entries.map((entry, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">分类</label>
                    <input
                      className="input-shell"
                      value={entry.category}
                      onChange={(e) => updateEntry(index, "category", e.target.value)}
                      placeholder="例如：求职、情绪管理、创业"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">标题</label>
                    <input
                      className="input-shell"
                      value={entry.title}
                      onChange={(e) => updateEntry(index, "title", e.target.value)}
                      placeholder="例如：我第一次面试失败后做了什么"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">详细内容</label>
                    <textarea
                      className="input-shell min-h-36"
                      value={entry.content}
                      onChange={(e) => updateEntry(index, "content", e.target.value)}
                      placeholder="把当时发生了什么、你怎么判断、踩过什么坑、最后总结出什么方法写清楚。"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">关键词标签</label>
                    <input
                      className="input-shell"
                      value={entry.tags}
                      onChange={(e) => updateEntry(index, "tags", e.target.value)}
                      placeholder="例如：面试, 挫败, 复盘"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? "创建中..." : "发布我的 Agent"}
          </button>
          <Link href="/life-agents" className="btn-secondary">
            先返回看看
          </Link>
        </div>
      </form>
    </div>
  );
}
