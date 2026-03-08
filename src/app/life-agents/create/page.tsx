"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type KnowledgeEntry = {
  category: string;
  title: string;
  content: string;
  tags: string[];
};

const KNOWLEDGE_QUESTIONS: { question: string; category: string; title: string }[] = [
  {
    question: "请分享一段你从迷茫到找到方向的故事。包括你当时做了什么、踩过什么坑、最后总结出什么方法。",
    category: "职业成长",
    title: "从迷茫到找到方向",
  },
  {
    question: "有没有一次面试或职场转折让你印象深刻？当时的情况和你的应对是什么？",
    category: "关键转折",
    title: "印象深刻的面试或转折",
  },
  {
    question: "你觉得自己最擅长帮助哪类人解决什么问题？为什么？",
    category: "擅长领域",
    title: "最擅长的帮助领域",
  },
  {
    question: "有什么具体的建议或方法，是你反复验证过、觉得确实有效的？",
    category: "方法论",
    title: "验证有效的方法",
  },
  {
    question: "如果还有想补充的经验或教训，可以直接写在这里（没有可写「暂无」跳过）",
    category: "补充经验",
    title: "其他想补充的经验",
  },
];

export default function CreateLifeAgentPage() {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    headline: "",
    shortBio: "",
    longBio: "",
    education: "",
    school: "",
    job: "",
    income: "",
    audience: "",
    welcomeMessage: "你好，你可以把我当作一个有真实经历的人生经验顾问来聊。",
    pricePerQuestion: "990",
    expertiseTags: "大学生成长, 职业选择, 个人规划",
    sampleQuestions: "我适合考研还是就业？\n刚毕业找不到方向怎么办？\n转行之前应该先准备什么？",
  });
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: "assistant" | "user"; content: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const startKnowledgeChat = () => {
    const first = KNOWLEDGE_QUESTIONS[0];
    setChatHistory([{ role: "assistant", content: first.question }]);
    setCurrentQuestionIndex(0);
  };

  const submitChatAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = chatInput.trim();
    if (!answer) return;
    if (currentQuestionIndex >= KNOWLEDGE_QUESTIONS.length) return;

    const q = KNOWLEDGE_QUESTIONS[currentQuestionIndex];
    const extracted = answer.slice(0, 80).match(/[\u4e00-\u9fa5a-zA-Z]{2,}/g)?.slice(0, 3) ?? [];
    const tagsFromContent = extracted.length > 0 ? extracted : [q.category];

    setChatHistory((prev) => [...prev, { role: "user", content: answer }]);
    setChatInput("");
    if (!/^暂无$|^无$|^没有$/i.test(answer.trim())) {
      setKnowledgeEntries((prev) => [
        ...prev,
        {
          category: q.category,
          title: q.title,
          content: answer,
          tags: tagsFromContent,
        },
      ]);
    }

    if (currentQuestionIndex + 1 < KNOWLEDGE_QUESTIONS.length) {
      const next = KNOWLEDGE_QUESTIONS[currentQuestionIndex + 1];
      setChatHistory((prev) => [...prev, { role: "assistant", content: next.question }]);
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      setCurrentQuestionIndex(KNOWLEDGE_QUESTIONS.length);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "很好，你的经验已经记录下来。点击下方「下一步」进入收费设置。" },
      ]);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validEntries = knowledgeEntries.filter((e) => e.content.trim().length >= 10);
    if (validEntries.length < 2) {
      setError("请至少完成 2 个问题的回答（每个回答至少 10 字）");
      setLoading(false);
      return;
    }

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
      knowledgeEntries: validEntries,
    };

    const res = await fetch("/api/life-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
        <div className="mt-3 flex items-center gap-3">
          <h1 className="section-title">创建你的人生经验 Agent</h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            第 {step} / 3 步
          </span>
        </div>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-sky-500" : "bg-slate-200"}`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
            startKnowledgeChat();
          }}
          className="space-y-6"
        >
          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">基本展示信息</h2>
            <p className="mt-1 text-sm text-slate-500">填写你的名字、背景和擅长领域，方便用户了解你。</p>
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
                  className="input-shell min-h-24"
                  value={form.shortBio}
                  onChange={(e) => setForm((prev) => ({ ...prev, shortBio: e.target.value }))}
                  placeholder="用 2 到 3 句话介绍你是谁、经历了什么、适合帮助谁。"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">学校</label>
                <input
                  className="input-shell"
                  value={form.school}
                  onChange={(e) => setForm((prev) => ({ ...prev, school: e.target.value }))}
                  placeholder="例如：普通二本"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">学历</label>
                <input
                  className="input-shell"
                  value={form.education}
                  onChange={(e) => setForm((prev) => ({ ...prev, education: e.target.value }))}
                  placeholder="例如：本科、硕士"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">工作</label>
                <input
                  className="input-shell"
                  value={form.job}
                  onChange={(e) => setForm((prev) => ({ ...prev, job: e.target.value }))}
                  placeholder="例如：互联网产品经理"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">收入</label>
                <input
                  className="input-shell"
                  value={form.income}
                  onChange={(e) => setForm((prev) => ({ ...prev, income: e.target.value }))}
                  placeholder="例如：年薪 30-50 万"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">详细背景</label>
                <textarea
                  className="input-shell min-h-32"
                  value={form.longBio}
                  onChange={(e) => setForm((prev) => ({ ...prev, longBio: e.target.value }))}
                  placeholder="写清楚你的经历、阶段、长期积累和适合回答的问题范围。"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">适合帮助的人群</label>
                <textarea
                  className="input-shell min-h-20"
                  value={form.audience}
                  onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
                  placeholder="例如：大学生、转行的人、刚进入社会的人。"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">首次欢迎语</label>
                <textarea
                  className="input-shell min-h-20"
                  value={form.welcomeMessage}
                  onChange={(e) => setForm((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="用户进入聊天页时看到的第一句话。"
                  required
                />
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
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">示例问题</label>
                <textarea
                  className="input-shell min-h-20"
                  value={form.sampleQuestions}
                  onChange={(e) => setForm((prev) => ({ ...prev, sampleQuestions: e.target.value }))}
                  placeholder="每行一个示例问题"
                  required
                />
              </div>
            </div>
          </section>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              下一步：记录经验
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <section className="glass-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">让 AI 记住你的经验</h2>
              <p className="mt-1 text-sm text-slate-500">
                系统会依次提问，你像聊天一样回答。回答得越具体，聊天效果越好。至少完成 2 题。
              </p>
            </div>
            <div className="flex min-h-[400px] flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-7 ${
                        msg.role === "user"
                          ? "bg-sky-600 text-white"
                          : "border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {currentQuestionIndex < KNOWLEDGE_QUESTIONS.length && (
                <form onSubmit={submitChatAnswer} className="border-t border-slate-200 bg-white p-4">
                  <div className="flex gap-3">
                    <textarea
                      className="input-shell min-h-[80px] flex-1 resize-none"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="输入你的回答..."
                      required
                    />
                    <button type="submit" className="btn-primary self-end">
                      发送
                    </button>
                  </div>
                </form>
              )}
            </div>
            {knowledgeEntries.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                <p className="text-sm text-slate-600">
                  已记录 {knowledgeEntries.length} 条经验
                  {knowledgeEntries.length >= 2 && " · 可以继续回答或进入下一步"}
                </p>
              </div>
            )}
          </section>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setChatHistory([]);
                setKnowledgeEntries([]);
                setCurrentQuestionIndex(0);
              }}
              className="btn-secondary"
            >
              上一步
            </button>
            <button
              type="button"
              onClick={() => {
                if (knowledgeEntries.length < 2) {
                  setError("请至少完成 2 个问题的回答");
                  return;
                }
                setStep(3);
                setError("");
              }}
              className="btn-primary"
            >
              下一步：设置收费
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={submit} className="space-y-6">
          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">设置收费</h2>
            <p className="mt-1 text-sm text-slate-500">用户每次提问将扣除对应额度，你获得的收入按此单价计算。</p>
            <div className="mt-5 max-w-sm">
              <label className="mb-2 block text-sm font-medium text-slate-700">每次提问价格（分）</label>
              <input
                type="number"
                min={100}
                step={100}
                className="input-shell"
                value={form.pricePerQuestion}
                onChange={(e) => setForm((prev) => ({ ...prev, pricePerQuestion: e.target.value }))}
                required
              />
              <p className="mt-2 text-sm text-slate-500">
                例如 990 = 9.90 元/次，500 = 5.00 元/次
              </p>
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            <h3 className="font-medium text-slate-900">已记录的经验预览</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {knowledgeEntries.slice(0, 5).map((e, i) => (
                <li key={i}>
                  {e.category} · {e.title}
                  {e.content.length > 40 ? `：${e.content.slice(0, 40)}...` : `：${e.content}`}
                </li>
              ))}
              {knowledgeEntries.length > 5 && (
                <li className="text-slate-500">... 共 {knowledgeEntries.length} 条</li>
              )}
            </ul>
          </div>

          {error && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary"
            >
              上一步
            </button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? "创建中..." : "发布我的 Agent"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
