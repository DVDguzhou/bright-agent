"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OFFICIAL_CONTACT } from "@/lib/official-contact";
import { translateLifeAgentValidationError } from "@/lib/life-agent-validation-i18n";
import {
  COUNTRY_OPTIONS_FOR_CREATE,
  getProvinceOptionsForCreate,
  getCityOptionsForCreate,
  getCountyOptionsForCreate,
} from "@/lib/address-hierarchy";

type KnowledgeEntry = {
  category: string;
  title: string;
  content: string;
  tags: string[];
};

const FIRST_QUESTION = "你希望分享什么样的经验或信息？可以简单说说你擅长的领域或想帮别人解决什么问题。";

const MBTI_OPTIONS = ["未设置", "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
const PERSONA_OPTIONS = ["学长学姐型", "朋友陪聊型", "前辈导师型", "冷静分析型", "过来人型", "本地熟人型"];
const TONE_OPTIONS = ["直接一点", "温柔一点", "理性克制", "接地气一点", "像朋友聊天", "稳重耐心"];
const RESPONSE_STYLE_OPTIONS = ["先给判断再解释", "先理解处境再建议", "多举自己的例子", "短一点别太满", "先拆选项再给建议", "像微信聊天少分点"];

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
    country: "",
    province: "",
    city: "",
    county: "",
    audience: "",
    welcomeMessage: "你好，我是基于本地真实经验的顾问，你可以问我关于我亲身经历的问题。",
    pricePerQuestion: "990",
    expertiseTags: "大学生成长, 职业选择, 个人规划",
    mbti: "",
    personaArchetype: "过来人型",
    toneStyle: "像朋友聊天",
    responseStyle: "先理解处境再建议",
    forbiddenPhrases: "",
    exampleReply1: "",
    exampleReply2: "",
    exampleReply3: "",
  });
  const [notSuitableFor, setNotSuitableFor] = useState("");
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: "assistant" | "user"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatDone, setChatDone] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sampleQuestionsList, setSampleQuestionsList] = useState<string[]>(["", ""]);

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
    setChatHistory([{ role: "assistant", content: FIRST_QUESTION }]);
    setChatDone(false);
  };

  const submitChatAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    const answer = chatInput.trim();
    if (!answer) return;
    if (chatDone || chatLoading) return;

    setChatInput("");
    setChatLoading(true);
    setError("");

    const updatedHistory = [...chatHistory, { role: "user" as const, content: answer }];
    setChatHistory(updatedHistory);

    let updatedEntries = knowledgeEntries;
    if (!/^暂无$|^无$|^没有$/i.test(answer)) {
      const extracted = answer.slice(0, 80).match(/[\u4e00-\u9fa5a-zA-Z]{2,}/g)?.slice(0, 3) ?? [];
      const newEntry: KnowledgeEntry = {
        category: "经验",
        title: answer.length > 20 ? answer.slice(0, 20) + "…" : answer,
        content: answer,
        tags: extracted.length > 0 ? extracted : ["经验"],
      };
      updatedEntries = [...knowledgeEntries, newEntry];
      setKnowledgeEntries(updatedEntries);
    }

    try {
      const res = await fetch("/api/life-agents/create/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          basicInfo: { displayName: form.displayName, headline: form.headline, shortBio: form.shortBio },
          chatHistory: updatedHistory,
          knowledgeEntries: updatedEntries.map((e) => ({ category: e.category, title: e.title, content: e.content })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "生成下一问失败，请重试");
        setChatHistory((prev) => [...prev, { role: "assistant", content: "出了点小问题，你可以继续补充回答，或点击「下一步」看看是否已有足够经验。" }]);
        return;
      }

      // 应用 AI 学习到的语气风格（悄悄写入 form）
      if (data.extractedTone) {
        const t = data.extractedTone;
        setForm((prev) => ({
          ...prev,
          ...(t.personaArchetype && { personaArchetype: t.personaArchetype }),
          ...(t.toneStyle && { toneStyle: t.toneStyle }),
          ...(t.responseStyle && { responseStyle: t.responseStyle }),
        }));
      }
      if (data.suggestedTags?.length) {
        setForm((prev) => {
          const existing = prev.expertiseTags.split(/[,，\n]/).map((x) => x.trim()).filter(Boolean);
          const merged = Array.from(new Set([...existing, ...data.suggestedTags])).slice(0, 8);
          return { ...prev, expertiseTags: merged.join(", ") };
        });
      }
      if (data.knowledgeAdd?.length) {
        setKnowledgeEntries((prev) => {
          const existing = prev.map((e) => e.content);
          const added = data.knowledgeAdd.filter((a: { content: string }) => a.content && !existing.includes(a.content));
          return [...prev, ...added.map((a: { category: string; title: string; content: string; tags?: string[] }) => ({
            category: a.category || "经验",
            title: a.title || a.content.slice(0, 20),
            content: a.content,
            tags: a.tags?.length ? a.tags : [a.category || "经验"],
          }))];
        });
      }

      if (data.done) {
        setChatHistory((prev) => [...prev, { role: "assistant", content: data.summaryMessage || "很好！你的经验已经记录下来，AI 会基于这些内容来回答来访者。点击下方「下一步」设置收费即可～" }]);
        setChatDone(true);
      } else {
        setChatHistory((prev) => [...prev, { role: "assistant", content: data.nextQuestion || "还能补充一些具体经历吗？" }]);
      }
    } catch {
      setError("网络错误，请重试");
      setChatHistory((prev) => [...prev, { role: "assistant", content: "出了点小问题，你可以继续补充回答，或点击「下一步」看看是否已有足够经验。" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validEntries = knowledgeEntries.filter((e) => e.content.trim().length >= 1);
    if (validEntries.length < 2) {
      setError("请至少完成 2 个问题的回答哦～");
      setLoading(false);
      return;
    }

    const expertiseTagsArr = form.expertiseTags
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const sampleQuestionsArr = sampleQuestionsList
      .map((item) => item.trim())
      .filter(Boolean);
    if (expertiseTagsArr.length < 1) {
      setError("请填写至少 1 个擅长标签");
      setLoading(false);
      return;
    }
    if (sampleQuestionsArr.length < 2) {
      setError("请填写至少 2 个示例问题");
      setLoading(false);
      return;
    }
    const forbiddenPhrasesArr = form.forbiddenPhrases
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const exampleRepliesArr = [form.exampleReply1, form.exampleReply2, form.exampleReply3]
      .map((item) => item.trim())
      .filter(Boolean);

    if (!form.personaArchetype || !form.toneStyle || !form.responseStyle) {
      setError("请先把 Agent 的角色、语气和回答习惯设置好");
      setLoading(false);
      return;
    }

    const payload = {
      displayName: form.displayName,
      headline: form.headline,
      shortBio: form.shortBio,
      longBio: form.longBio,
      education: form.education,
      school: form.school,
      job: form.job,
      income: form.income,
      country: form.country || "",
      province: form.province || "",
      city: form.city || "",
      county: form.county || "",
      regions: [],
      audience: form.audience,
      welcomeMessage: form.welcomeMessage,
      notSuitableFor: notSuitableFor.trim() || undefined,
      pricePerQuestion: parseInt(form.pricePerQuestion, 10) || 990,
      mbti: form.mbti || undefined,
      personaArchetype: form.personaArchetype,
      toneStyle: form.toneStyle,
      responseStyle: form.responseStyle,
      forbiddenPhrases: forbiddenPhrasesArr.slice(0, 8),
      exampleReplies: exampleRepliesArr.slice(0, 3),
      expertiseTags: expertiseTagsArr.slice(0, 8),
      sampleQuestions: sampleQuestionsArr.slice(0, 6),
      knowledgeEntries: validEntries.map((e) => {
        const tags = Array.isArray(e.tags) ? e.tags.filter((t) => t && String(t).trim()) : [];
        return {
          category: e.category,
          title: e.title,
          content: e.content,
          tags: tags.length >= 1 ? tags : [e.category],
        };
      }),
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
      const msg =
        data.error === "UNAUTHORIZED"
          ? "请先登录后再创建"
          : data.detail
            ? translateLifeAgentValidationError(String(data.detail))
            : "创建失败，请检查输入内容";
      setError(msg);
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
          你可以先注册账号，然后把自己的本地经验、踩坑总结和亲身经历整理成可聊天的 Agent。
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
          <h1 className="section-title">创建你的本地经验 Agent</h1>
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
            <p className="mt-1 text-slate-600">
              填写你的名字、背景和擅长领域，让来访者第一眼就能了解你是谁、能帮什么忙。
            </p>
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-sky-800">💡 填写提示</p>
              <ul className="mt-2 space-y-1">
                <li>• 信息越真实具体，用户越愿意信任你</li>
                <li>• 学历、工作、收入选填，但会提高可信度</li>
                <li>• 简短介绍、详细背景和适合人群写清楚即可，不限字数</li>
              </ul>
            </div>
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
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">详细地区（选填）</label>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <select
                    className="input-shell"
                    value={form.country}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((prev) => ({ ...prev, country: v, province: "", city: "", county: "" }));
                    }}
                  >
                    {COUNTRY_OPTIONS_FOR_CREATE.map((item) => (
                      <option key={item || "_empty"} value={item}>
                        {item === "" ? "不填" : item}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input-shell"
                    value={form.province}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((prev) => ({ ...prev, province: v, city: "", county: "" }));
                    }}
                    disabled={!form.country}
                  >
                    {getProvinceOptionsForCreate(form.country).map((item) => (
                      <option key={item || "_empty"} value={item}>
                        {item === "" ? "不填" : item}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input-shell"
                    value={form.city}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((prev) => ({ ...prev, city: v, county: "" }));
                    }}
                    disabled={!form.province}
                  >
                    {getCityOptionsForCreate(form.country, form.province).map((item) => (
                      <option key={item || "_empty"} value={item}>
                        {item === "" ? "不填" : item}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input-shell"
                    value={form.county}
                    onChange={(e) => setForm((prev) => ({ ...prev, county: e.target.value }))}
                    disabled={!form.city}
                  >
                    {getCountyOptionsForCreate(form.country, form.province, form.city).map((item) => (
                      <option key={item || "_empty"} value={item}>
                        {item === "" ? "不填" : item}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-xs text-slate-500">按国家→省/州→城市→区县逐级选择</p>
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
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-700">申请官方认证</p>
                <p className="mt-1 text-sm text-slate-600">
                  平台会核实你的经历真实性（如考研院校、本地菜市场等），认证后显示认证标识。
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {OFFICIAL_CONTACT.description}：{" "}
                  <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="text-sky-600 hover:text-sky-700 underline">
                    {OFFICIAL_CONTACT.email}
                  </a>
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">详细背景</label>
                <textarea
                  className="input-shell min-h-32"
                  value={form.longBio}
                  onChange={(e) => setForm((prev) => ({ ...prev, longBio: e.target.value }))}
                  placeholder="例如：二本毕业，先后在 X 公司做产品、Y 公司带团队，经历过考研失败、转行、裸辞，现在年薪 xx。擅长帮大学生做职业规划和转行决策。"
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
                <p className="mt-1 text-xs text-slate-500">至少 1 个，最多 8 个</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">示例问题</label>
                <p className="mb-2 text-xs text-slate-500">用户可点击快速提问，至少 2 个，最多 6 个</p>
                <div className="space-y-2">
                  {sampleQuestionsList.map((q, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="input-shell flex-1"
                        value={q}
                        onChange={(e) => {
                          const next = [...sampleQuestionsList];
                          next[i] = e.target.value;
                          setSampleQuestionsList(next);
                        }}
                        placeholder={`示例问题 ${i + 1}，如：我适合考研还是就业？`}
                        required={i < 2}
                      />
                      {sampleQuestionsList.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setSampleQuestionsList((prev) => prev.filter((_, j) => j !== i))}
                          className="rounded-lg border border-slate-200 px-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          title="删除"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  ))}
                  {sampleQuestionsList.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setSampleQuestionsList((prev) => [...prev, ""])}
                      className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-sky-400 hover:bg-sky-50/50 hover:text-sky-700"
                    >
                      + 添加示例问题
                    </button>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-base font-semibold text-slate-900">让回答更像你本人</h3>
                <p className="mt-1 text-sm text-slate-600">
                  这里决定 AI 说话的感觉。别只填“专业标签”，还要告诉它你平时怎么开口、讨厌什么套话。
                </p>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">MBTI（选填）</label>
                    <select
                      className="input-shell"
                      value={form.mbti}
                      onChange={(e) => setForm((prev) => ({ ...prev, mbti: e.target.value === "未设置" ? "" : e.target.value }))}
                    >
                      {MBTI_OPTIONS.map((item) => (
                        <option key={item} value={item === "未设置" ? "" : item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">更多是气质参考，真正决定回答风格的是下面几项</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">你更像哪种角色</label>
                    <select
                      className="input-shell"
                      value={form.personaArchetype}
                      onChange={(e) => setForm((prev) => ({ ...prev, personaArchetype: e.target.value }))}
                      required
                    >
                      {PERSONA_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">语气</label>
                    <select
                      className="input-shell"
                      value={form.toneStyle}
                      onChange={(e) => setForm((prev) => ({ ...prev, toneStyle: e.target.value }))}
                      required
                    >
                      {TONE_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">回答习惯</label>
                    <select
                      className="input-shell"
                      value={form.responseStyle}
                      onChange={(e) => setForm((prev) => ({ ...prev, responseStyle: e.target.value }))}
                      required
                    >
                      {RESPONSE_STYLE_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced((v) => !v)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      {showAdvanced ? "▼" : "▶"} 高级选项：示范回答、禁止套话
                      {showAdvanced && (
                        <span className="text-xs font-normal text-slate-500">（不设置则默认无）</span>
                      )}
                    </button>
                    {showAdvanced && (
                      <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">你最讨厌的 AI 套话</label>
                          <textarea
                            className="input-shell min-h-16"
                            value={form.forbiddenPhrases}
                            onChange={(e) => setForm((prev) => ({ ...prev, forbiddenPhrases: e.target.value }))}
                            placeholder="每行一个，例如：希望这些对你有帮助、首先其次最后、保持积极心态"
                          />
                          <p className="mt-1 text-xs text-slate-500">这些话会尽量避免出现在最终回答里</p>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 1</label>
                          <textarea
                            className="input-shell min-h-24"
                            value={form.exampleReply1}
                            onChange={(e) => setForm((prev) => ({ ...prev, exampleReply1: e.target.value }))}
                            placeholder="写一段你自己平时真的会怎么回复用户的话。越像你本人越好。"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 2</label>
                          <textarea
                            className="input-shell min-h-24"
                            value={form.exampleReply2}
                            onChange={(e) => setForm((prev) => ({ ...prev, exampleReply2: e.target.value }))}
                            placeholder="再写一段不同场景下的回复，比如安慰、劝退、给建议。"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 3（选填）</label>
                          <textarea
                            className="input-shell min-h-24"
                            value={form.exampleReply3}
                            onChange={(e) => setForm((prev) => ({ ...prev, exampleReply3: e.target.value }))}
                            placeholder="如果你还有更有代表性的说话方式，可以再补一条。"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
            <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900">逐步丰富你的经验</h2>
              <p className="mt-2 text-slate-600">
                我会根据你的回答继续追问，直到收集到全面、具体的经验信息。回答得越具体，AI 越能帮来访者解决真实问题。
              </p>
              <p className="mt-3 rounded-xl bg-sky-100 px-4 py-3 text-sm font-medium text-sky-900">
                ⚠️ 请至少与 AI 进行 <strong>两轮对话</strong>（回答 2 个问题以上），再进入下一步。当前已记录 {knowledgeEntries.length} 轮。
              </p>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm">
                <p className="font-medium text-amber-900">✨ 回答技巧</p>
                <ul className="mt-2 space-y-1 text-amber-800">
                  <li>• <strong>写具体</strong>：步骤、时间、数字比泛泛而谈更有用</li>
                  <li>• <strong>写过程</strong>：你做了什么、踩过什么坑、怎么解决的</li>
                  <li>• 回答得越具体，AI 越能帮来访者解决真实问题</li>
                  <li>• 没有可写「暂无」跳过当前题</li>
                </ul>
              </div>
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
              {!chatDone && (
                <form onSubmit={submitChatAnswer} className="border-t border-slate-200 bg-white p-4">
                  <div className="flex gap-3">
                    <textarea
                      className="input-shell min-h-[80px] flex-1 resize-none"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={chatLoading ? "AI 正在思考下一问…" : "输入你的回答，写得越具体 AI 越能帮你回答来访者…"}
                      required
                      disabled={chatLoading}
                    />
                    <button type="submit" className="btn-primary self-end disabled:opacity-60" disabled={chatLoading}>
                      {chatLoading ? "生成中…" : "发送"}
                    </button>
                  </div>
                </form>
              )}
            </div>
            {knowledgeEntries.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                <p className="text-sm text-slate-600">
                  已记录 {knowledgeEntries.length} 条经验
                  {knowledgeEntries.length >= 2 ? (
                    " · 可以继续回答或进入下一步"
                  ) : (
                    <>
                      {" · "}
                      <span className="font-medium text-amber-700">
                        还需 {2 - knowledgeEntries.length} 轮对话，请继续在下方回答
                      </span>
                    </>
                  )}
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
                setChatDone(false);
              }}
              className="btn-secondary"
            >
              上一步
            </button>
            <button
              type="button"
              onClick={() => {
                if (knowledgeEntries.length < 2) {
                  setError(
                    `请至少完成 2 轮对话才能继续。你已记录 ${knowledgeEntries.length} 轮，还需至少 ${2 - knowledgeEntries.length} 轮。请在下方输入框继续回答 AI 的问题。`
                  );
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
            <p className="mt-1 text-slate-600">用户每次提问会消耗 1 次额度，你按此单价获得收入。可以先设低一点，等有人用再慢慢调。</p>
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
                单位是「分」：990 = 9.9 元/次，500 = 5 元/次。新手建议 500～990 试试水。
              </p>
            </div>
          </section>

          <div className="glass-card p-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              有什么你不能回答或不想回答的问题？（选填）
            </label>
            <textarea
              className="input-shell min-h-20"
              value={notSuitableFor}
              onChange={(e) => setNotSuitableFor(e.target.value)}
              placeholder="例如：投资理财、医疗建议、超出我行业的问题..."
            />
            <p className="mt-1 text-xs text-slate-500">用户提问到这类问题时，AI 会明确说明无法回答</p>
          </div>

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
