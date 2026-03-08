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

const TOPIC_OPTIONS: { id: string; label: string; questions: { question: string; category: string; title: string }[] }[] = [
  {
    id: "yasi",
    label: "雅思 / 英语备考",
    questions: [
      { question: "你的英语基础如何？备考前大概什么水平？用了多久、怎么考到的目标分数？", category: "备考经历", title: "基础与备考周期" },
      { question: "听力/阅读/写作/口语，你哪部分提升最明显？具体用了什么方法、每天练多久？", category: "方法经验", title: "各科提升方法" },
      { question: "备考过程中踩过什么坑？哪些方法试过但效果不好？", category: "踩坑总结", title: "踩坑与无效方法" },
    ],
  },
  {
    id: "qiuzhi",
    label: "求职 / 面试",
    questions: [
      { question: "你印象最深的一次面试是怎样的？当时问了你什么、你怎么答的、结果如何？", category: "面试经历", title: "印象深刻的面试" },
      { question: "你觉得面试中最重要的是什么？你有什么具体技巧或话术？", category: "面试技巧", title: "面试技巧与话术" },
      { question: "你收到过哪些反馈（通过/没通过）？你后来怎么调整的？", category: "复盘调整", title: "反馈与调整" },
    ],
  },
  {
    id: "zhive",
    label: "职业发展 / 转行",
    questions: [
      { question: "请分享你从迷茫到找到方向的经历。当时做了什么、踩过什么坑、最后怎么走出来的？", category: "职业成长", title: "从迷茫到方向" },
      { question: "你转行或换岗的经历？怎么准备的、花了多久、有哪些关键节点？", category: "转行经历", title: "转行/换岗经历" },
      { question: "你有什么反复验证过、觉得确实有效的方法？可以写步骤、时间线或具体数字。", category: "方法论", title: "验证有效的方法" },
    ],
  },
  {
    id: "kaoyan",
    label: "考研",
    questions: [
      { question: "你考研的目标院校、专业？当时的基础和备考周期？", category: "备考背景", title: "考研目标与周期" },
      { question: "各科你是怎么复习的？时间安排、资料选择、重点突破？", category: "复习方法", title: "各科复习方法" },
      { question: "考研过程中踩过什么坑？心态上怎么调整的？", category: "踩坑心态", title: "踩坑与心态" },
    ],
  },
  {
    id: "liuxue",
    label: "留学",
    questions: [
      { question: "你的留学背景？去的哪里、学什么、什么时候去的？", category: "留学背景", title: "留学背景" },
      { question: "申请过程中你做了哪些准备？选校、文书、语言、时间线？", category: "申请经验", title: "申请准备" },
      { question: "有什么你当时希望早点知道的事？给后来人的建议？", category: "建议", title: "给后来人的建议" },
    ],
  },
  {
    id: "chuangye",
    label: "创业 / 副业",
    questions: [
      { question: "你的创业或副业经历？从想法到落地的过程？", category: "创业经历", title: "创业/副业经历" },
      { question: "你觉得哪些行业或方向值得尝试？你的判断依据是什么？", category: "方向建议", title: "值得尝试的方向" },
      { question: "从零开始你建议怎么做？有什么具体的步骤或避坑点？", category: "实操建议", title: "从零开始的建议" },
    ],
  },
  {
    id: "bendi",
    label: "本地生活（菜市场、酒吧、探店等）",
    questions: [
      { question: "你经常逛/体验什么地方？能具体说说哪些摊位/店铺/区域好、哪些不好？", category: "本地经验", title: "具体推荐与避坑" },
      { question: "你是怎么判断好坏、性价比的？有什么挑选技巧？", category: "挑选技巧", title: "挑选技巧" },
      { question: "还有什么想补充的实用信息？比如时段、价格区间、注意事项？", category: "补充信息", title: "补充信息" },
    ],
  },
  {
    id: "qita",
    label: "其他经验",
    questions: [
      { question: "你最擅长帮助哪类人解决什么问题？可以举一个具体例子。", category: "擅长领域", title: "最擅长的帮助" },
      { question: "如果还有想补充的经验或教训，可以直接写在这里。没有可写「暂无」跳过～", category: "补充经验", title: "其他补充" },
    ],
  },
];

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
    audience: "",
    welcomeMessage: "你好，我是基于本地真实经验的顾问，你可以问我关于我亲身经历的问题。",
    pricePerQuestion: "990",
    expertiseTags: "大学生成长, 职业选择, 个人规划",
    sampleQuestions: "我适合考研还是就业？\n刚毕业找不到方向怎么办？\n转行之前应该先准备什么？",
    mbti: "",
    personaArchetype: "过来人型",
    toneStyle: "像朋友聊天",
    responseStyle: "先理解处境再建议",
    forbiddenPhrases: "希望这些对你有帮助\n首先其次最后\n保持积极心态",
    exampleReply1: "如果按我自己的经历看，你现在最该先判断是不是要把主要精力放在英语上。我当时不是一上来就全科平均推进，而是先把最拖后腿的那块补起来，不然每天很忙但分数其实不怎么动。",
    exampleReply2: "这个问题我不太会给特别标准的答案，我只能说按我当时踩过的坑来看，先别急着追求完美计划，先把最关键的一步跑通，后面再慢慢修。",
    exampleReply3: "",
  });
  const [step2Phase, setStep2Phase] = useState<"topics" | "chat">("topics");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [notSuitableFor, setNotSuitableFor] = useState("");
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: "assistant" | "user"; content: string }[]>([]);
  const [dynamicQuestions, setDynamicQuestions] = useState<{ question: string; category: string; title: string }[]>([]);
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
    const questions: { question: string; category: string; title: string }[] = [];
    for (const tid of selectedTopics) {
      const topic = TOPIC_OPTIONS.find((t) => t.id === tid);
      if (topic) questions.push(...topic.questions);
    }
    setDynamicQuestions(questions);
    if (questions.length > 0) {
      setChatHistory([{ role: "assistant", content: questions[0].question }]);
    }
    setCurrentQuestionIndex(0);
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const submitChatAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = chatInput.trim();
    if (!answer) return;
    if (currentQuestionIndex >= dynamicQuestions.length) return;

    const q = dynamicQuestions[currentQuestionIndex];
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

    if (currentQuestionIndex + 1 < dynamicQuestions.length) {
      const next = dynamicQuestions[currentQuestionIndex + 1];
      setChatHistory((prev) => [...prev, { role: "assistant", content: next.question }]);
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      setCurrentQuestionIndex(dynamicQuestions.length);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "很好！你的经验已经记录下来，AI 会基于这些内容来回答来访者。点击下方「下一步」设置收费即可～" },
      ]);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validEntries = knowledgeEntries.filter((e) => e.content.trim().length >= 20);
    if (validEntries.length < 2) {
      setError("请至少完成 2 个问题的回答哦，每个回答至少 20 个字～");
      setLoading(false);
      return;
    }

    const expertiseTagsArr = form.expertiseTags
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const sampleQuestionsArr = form.sampleQuestions
      .split("\n")
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
    if (exampleRepliesArr.length < 2) {
      setError("请至少填写 2 条示范回答，这样 AI 才更像你本人");
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
      const msg = data.error === "UNAUTHORIZED" ? "请先登录后再创建" : data.detail ? `验证失败：${data.detail}` : "创建失败，请检查输入内容";
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
            setStep2Phase("topics");
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
                <li>• 简短介绍 10–180 字，详细背景至少 30 字</li>
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
                  placeholder="用 2 到 3 句话介绍你是谁、经历了什么、适合帮助谁。（至少 10 字）"
                  required
                  minLength={10}
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
                  placeholder="例如：二本毕业，先后在 X 公司做产品、Y 公司带团队，经历过考研失败、转行、裸辞，现在年薪 xx。擅长帮大学生做职业规划和转行决策。（至少 30 字）"
                  required
                  minLength={30}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">适合帮助的人群</label>
                <textarea
                  className="input-shell min-h-20"
                  value={form.audience}
                  onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
                  placeholder="例如：大学生、转行的人、刚进入社会的人。（至少 3 字）"
                  required
                  minLength={3}
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
                <textarea
                  className="input-shell min-h-20"
                  value={form.sampleQuestions}
                  onChange={(e) => setForm((prev) => ({ ...prev, sampleQuestions: e.target.value }))}
                  placeholder="每行一个，用户可点击快速提问。至少 2 个，例如：我适合考研还是就业？转行之前应该先准备什么？"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">至少 2 个，每行一个，会展示在聊天页供用户参考</p>
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
                    <label className="mb-2 block text-sm font-medium text-slate-700">你最讨厌的 AI 套话</label>
                    <textarea
                      className="input-shell min-h-20"
                      value={form.forbiddenPhrases}
                      onChange={(e) => setForm((prev) => ({ ...prev, forbiddenPhrases: e.target.value }))}
                      placeholder={"每行一个，例如：\n希望这些对你有帮助\n首先其次最后\n保持积极心态"}
                    />
                    <p className="mt-1 text-xs text-slate-500">这些话会尽量避免出现在最终回答里</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 1</label>
                    <textarea
                      className="input-shell min-h-24"
                      value={form.exampleReply1}
                      onChange={(e) => setForm((prev) => ({ ...prev, exampleReply1: e.target.value }))}
                      placeholder="写一段你自己平时真的会怎么回复用户的话。越像你本人越好。"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 2</label>
                    <textarea
                      className="input-shell min-h-24"
                      value={form.exampleReply2}
                      onChange={(e) => setForm((prev) => ({ ...prev, exampleReply2: e.target.value }))}
                      placeholder="再写一段不同场景下的回复，比如安慰、劝退、给建议。"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 3（选填）</label>
                    <textarea
                      className="input-shell min-h-24"
                      value={form.exampleReply3}
                      onChange={(e) => setForm((prev) => ({ ...prev, exampleReply3: e.target.value }))}
                      placeholder="如果你还有更有代表性的说话方式，可以再补一条。"
                    />
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

      {step === 2 && step2Phase === "topics" && (
        <div className="space-y-6">
          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">你能提供哪方面的经验信息？</h2>
            <p className="mt-2 text-slate-600">
              多选你真正有经历、能具体分享的主题，我们会根据你的选择逐步引导你丰富信息。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {TOPIC_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTopic(t.id)}
                  className={`rounded-2xl border-2 px-5 py-3 text-sm font-medium transition ${
                    selectedTopics.includes(t.id)
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-8">
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
          </section>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              上一步
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedTopics.length === 0) {
                  setError("请至少选择 1 个经验主题");
                  return;
                }
                setError("");
                setStep2Phase("chat");
                startKnowledgeChat();
              }}
              className="btn-primary"
            >
              开始记录经验
            </button>
          </div>
        </div>
      )}

      {step === 2 && step2Phase === "chat" && (
        <div className="space-y-6">
          <section className="glass-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900">逐步丰富你的经验</h2>
              <p className="mt-2 text-slate-600">
                根据你选择的主题，我们会依次问你一些问题。回答得越具体，AI 越能帮来访者解决真实问题。至少完成 2 题。
              </p>
              <p className="mt-1 text-sm text-slate-500">
                已选主题：{TOPIC_OPTIONS.filter((t) => selectedTopics.includes(t.id)).map((t) => t.label).join("、")}
              </p>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm">
                <p className="font-medium text-amber-900">✨ 回答技巧</p>
                <ul className="mt-2 space-y-1 text-amber-800">
                  <li>• <strong>写具体</strong>：步骤、时间、数字比泛泛而谈更有用</li>
                  <li>• <strong>写过程</strong>：你做了什么、踩过什么坑、怎么解决的</li>
                  <li>• 每条至少 20 字，AI 才能更好利用</li>
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
              {currentQuestionIndex < dynamicQuestions.length && (
                <form onSubmit={submitChatAnswer} className="border-t border-slate-200 bg-white p-4">
                  <div className="flex gap-3">
                    <textarea
                      className="input-shell min-h-[80px] flex-1 resize-none"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="输入你的回答，写得越具体 AI 越能帮你回答来访者..."
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
                setStep2Phase("topics");
                setChatHistory([]);
                setKnowledgeEntries([]);
                setDynamicQuestions([]);
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
                  setError("请至少完成 2 个问题的回答才能继续哦～");
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
