"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RatingStars } from "@/components/RatingStars";
import { OFFICIAL_CONTACT } from "@/lib/official-contact";
import { centsToYuanInput, yuanInputToCents } from "@/lib/price";
import { VoiceRecordPanel } from "@/components/voice";
import { LifeAgentCoverPicker } from "@/components/LifeAgentCoverPicker";

type ManageData = {
    profile: {
    id: string;
    displayName: string;
    headline: string;
    shortBio: string;
    longBio: string;
    audience: string;
    welcomeMessage: string;
    notSuitableFor?: string;
    pricePerQuestion: number;
    expertiseTags: string[];
    sampleQuestions: string[];
    education?: string;
    income?: string;
    job?: string;
    school?: string;
    country?: string;
    province?: string;
    city?: string;
    county?: string;
    regions?: string[];
    verificationStatus?: string;
    mbti?: string;
    personaArchetype?: string;
    toneStyle?: string;
    responseStyle?: string;
    forbiddenPhrases?: string[];
    exampleReplies?: string[];
    published: boolean;
    voiceCloneId?: string | null;
    hasVoiceClone?: boolean;
    coverImageUrl?: string;
    coverPresetKey?: string;
    coverUrl?: string;
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
  feedback?: {
    counts: { helpful: number; notSpecific: number; notSuitable: number };
    ratings?: {
      averageScore: number;
      raters: number;
      recent: Array<{
        id: string;
        score: number;
        comment?: string | null;
        updatedAt: string;
      }>;
    };
    recent: Array<{
      id: string;
      feedbackType: string;
      assistantExcerpt?: string | null;
      comment?: string | null;
      createdAt: string;
    }>;
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

const MBTI_OPTIONS = ["", "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
const PERSONA_OPTIONS = ["学长学姐型", "朋友陪聊型", "前辈导师型", "冷静分析型", "过来人型", "本地熟人型"];
const TONE_OPTIONS = ["直接一点", "温柔一点", "理性克制", "接地气一点", "像朋友聊天", "稳重耐心"];
const RESPONSE_STYLE_OPTIONS = ["先给判断再解释", "先理解处境再建议", "多举自己的例子", "短一点别太满", "先拆选项再给建议", "像微信聊天少分点"];
const REGION_OPTIONS = ["温州", "杭州", "宁波", "台州", "绍兴", "上海", "北京", "深圳", "广州", "东京", "大阪", "新加坡"];
const TAB_ITEMS = [
  { id: "feedback", label: "消息", hint: "看用户反馈" },
  { id: "modify", label: "对话修改", hint: "像聊天一样改" },
  { id: "edit", label: "编辑资料", hint: "手动调整资料" },
  { id: "sales", label: "销量记录", hint: "看购买情况" },
  { id: "sessions", label: "聊天记录", hint: "看会话列表" },
] as const;

export default function LifeAgentManageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modifyChatEndRef = useRef<HTMLDivElement>(null);
  const id = params.id as string;
  const [data, setData] = useState<ManageData | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "modify" | "sales" | "sessions" | "feedback">("feedback");
  const [form, setForm] = useState({
    displayName: "",
    headline: "",
    shortBio: "",
    longBio: "",
    education: "",
    school: "",
    job: "",
    income: "",
    regions: "",
    country: "",
    province: "",
    city: "",
    county: "",
    audience: "",
    welcomeMessage: "",
    notSuitableFor: "",
    pricePerQuestion: "9.9",
    expertiseTags: "",
    sampleQuestions: "",
    mbti: "",
    personaArchetype: "过来人型",
    toneStyle: "像朋友聊天",
    responseStyle: "先理解处境再建议",
    forbiddenPhrases: "",
    exampleReply1: "",
    exampleReply2: "",
    exampleReply3: "",
    published: true,
    coverImageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modifyChatHistory, setModifyChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [modifyInput, setModifyInput] = useState("");
  const [modifyLoading, setModifyLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [voiceSamplePending, setVoiceSamplePending] = useState<string | null>(null);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [voiceSaving, setVoiceSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/life-agents/${id}/manage`, { credentials: "include" })
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
            education: p.education ?? "",
            school: p.school ?? "",
            job: p.job ?? "",
            income: p.income ?? "",
            regions: Array.isArray(p.regions) ? p.regions.join(", ") : "",
            country: p.country ?? "",
            province: p.province ?? "",
            city: p.city ?? "",
            county: p.county ?? "",
            audience: p.audience,
            welcomeMessage: p.welcomeMessage,
            notSuitableFor: p.notSuitableFor ?? "",
            pricePerQuestion: centsToYuanInput(p.pricePerQuestion),
            expertiseTags: Array.isArray(p.expertiseTags) ? p.expertiseTags.join(", ") : "",
            sampleQuestions: Array.isArray(p.sampleQuestions) ? p.sampleQuestions.join("\n") : "",
            mbti: p.mbti ?? "",
            personaArchetype: p.personaArchetype ?? "过来人型",
            toneStyle: p.toneStyle ?? "像朋友聊天",
            responseStyle: p.responseStyle ?? "先理解处境再建议",
            forbiddenPhrases: Array.isArray(p.forbiddenPhrases) ? p.forbiddenPhrases.join("\n") : "",
            exampleReply1: Array.isArray(p.exampleReplies) ? p.exampleReplies[0] ?? "" : "",
            exampleReply2: Array.isArray(p.exampleReplies) ? p.exampleReplies[1] ?? "" : "",
            exampleReply3: Array.isArray(p.exampleReplies) ? p.exampleReplies[2] ?? "" : "",
            published: p.published,
            coverImageUrl: p.coverImageUrl ?? "",
          });
        }
      })
      .catch(() => setData(null));
  }, [id]);

  useEffect(() => {
    modifyChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [modifyChatHistory]);

  const deleteAgent = async () => {
    if (!confirm("确定删除这个人生 Agent 吗？删除后无法恢复，包括知识、聊天记录等。")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/life-agents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "删除失败");
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const selectedRegions = form.regions
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const toggleRegion = (region: string) => {
    const next = selectedRegions.includes(region)
      ? selectedRegions.filter((item) => item !== region)
      : selectedRegions.length < 2
      ? [...selectedRegions, region]
      : selectedRegions;
    setForm((prev) => ({ ...prev, regions: next.join(", ") }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const exampleReplies = [form.exampleReply1, form.exampleReply2, form.exampleReply3].map((s) => s.trim()).filter(Boolean);

    const displayName = form.displayName.trim();
    if (displayName.length < 1 || displayName.length > 10) {
      setError("Agent 名称长度需为 1 到 10 个字");
      setLoading(false);
      return;
    }

    const regions = form.regions.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean);
    if (regions.length > 2) {
      setError("地区最多保留 2 个");
      setLoading(false);
      return;
    }

    const pricePerQuestion = yuanInputToCents(form.pricePerQuestion);
    if (pricePerQuestion === null) {
      setError("请填写大于 0 的金额，单位是元，最多保留 2 位小数");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      displayName,
      headline: form.headline.trim(),
      education: form.education || undefined,
      school: form.school || undefined,
      job: form.job || undefined,
      income: form.income || undefined,
      regions,
      country: form.country || undefined,
      province: form.province || undefined,
      city: form.city || undefined,
      county: form.county || undefined,
      pricePerQuestion,
      mbti: form.mbti || undefined,
      expertiseTags: form.expertiseTags.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean),
      sampleQuestions: form.sampleQuestions.split("\n").map((s) => s.trim()).filter(Boolean),
      forbiddenPhrases: form.forbiddenPhrases.split("\n").map((s) => s.trim()).filter(Boolean),
      exampleReplies,
      coverImageUrl: form.coverImageUrl.trim(),
      ...(voiceSamplePending ? { voiceSampleBase64: voiceSamplePending } : {}),
    };

    const res = await fetch(`/api/life-agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const resData = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(resData.error === "FORBIDDEN" ? "无权编辑" : "保存失败，请检查输入");
      return;
    }
    setVoiceSamplePending(null);
    setVoicePanelOpen(false);
    setData((prev) => (prev ? { ...prev, profile: resData } : prev));
    router.refresh();
  };

  const saveVoiceOnly = async () => {
    if (!voiceSamplePending) {
      setError("请先录制一段样本");
      return;
    }
    setError("");
    setVoiceSaving(true);
    try {
      const res = await fetch(`/api/life-agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ voiceSampleBase64: voiceSamplePending }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error === "FORBIDDEN" ? "无权编辑" : "音色上传失败，请稍后重试");
        return;
      }
      setVoiceSamplePending(null);
      setVoicePanelOpen(false);
      setData((prev) => (prev ? { ...prev, profile: resData } : prev));
      router.refresh();
    } finally {
      setVoiceSaving(false);
    }
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
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <h1 className="section-title break-words">{data.profile.displayName}</h1>
            <p className="section-subtitle mt-1">{data.profile.headline}</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2 lg:flex lg:flex-none lg:flex-wrap lg:justify-end lg:pl-6">
            <Link
              href={`/life-agents/${id}`}
              className="btn-secondary min-h-[48px] px-4 text-center whitespace-nowrap touch-manipulation"
            >
              查看展示页
            </Link>
            <Link
              href={`/life-agents/${id}/chat`}
              className="btn-primary min-h-[48px] px-4 text-center whitespace-nowrap touch-manipulation"
            >
              进入聊天
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div
          className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition ${
            activeTab === "feedback"
              ? "border-sky-400 bg-sky-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("feedback")}
          role="button"
          tabIndex={0}
        >
          <p className="text-sm text-slate-500">用户反馈</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {(data.feedback?.counts.helpful ?? 0) +
              (data.feedback?.counts.notSpecific ?? 0) +
              (data.feedback?.counts.notSuitable ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            有帮助 {(data.feedback?.counts.helpful ?? 0)} · 不够具体 {(data.feedback?.counts.notSpecific ?? 0)} · 不适合 {(data.feedback?.counts.notSuitable ?? 0)}
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/80 bg-white/75 p-2 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.32)] backdrop-blur-xl">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`group min-h-[64px] rounded-2xl px-4 py-3 text-left transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-[0_18px_40px_-24px_rgba(14,165,233,0.8)]"
                : "bg-white/80 text-slate-600 ring-1 ring-slate-200/80 hover:bg-sky-50/80 hover:text-sky-700 hover:ring-sky-200"
            }`}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span
              className={`mt-1 block text-xs ${
                activeTab === tab.id ? "text-white/80" : "text-slate-400 group-hover:text-sky-500"
              }`}
            >
              {tab.hint}
            </span>
          </button>
        ))}
        </div>
      </div>

      {activeTab === "modify" && (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.3)] backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-slate-900">当前 Agent 状态</h2>
            <p className="mt-1 text-sm text-slate-600">修改后会实时更新，方便你确认当前配置。</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-slate-500">名称 / 介绍</p>
                <p className="mt-1 text-sm text-slate-800">{data.profile.displayName}</p>
                <p className="text-sm text-slate-600 line-clamp-1">{data.profile.headline}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">擅长标签</p>
                <p className="mt-1 text-sm text-slate-800">
                  {(data.profile.expertiseTags ?? []).length > 0
                    ? (data.profile.expertiseTags ?? []).join("、")
                    : "未设置"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">知识条目</p>
                <p className="mt-1 text-sm text-slate-800">{(data.profile.knowledgeEntries ?? []).length} 条</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">语气 / 风格</p>
                <p className="mt-1 text-sm text-slate-800">
                  {[data.profile.personaArchetype, data.profile.toneStyle, data.profile.responseStyle]
                    .filter(Boolean)
                    .join(" · ") || "未设置"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-500">欢迎语</p>
                <p className="mt-1 text-sm text-slate-800 line-clamp-2">{data.profile.welcomeMessage}</p>
              </div>
            </div>
          </section>
          <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/80 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-3xl">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-[8%] top-[24%] h-40 w-40 rounded-full bg-sky-200/35 blur-3xl" />
              <div className="absolute bottom-[18%] right-[10%] h-44 w-44 rounded-full bg-orange-200/25 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.93)_0%,rgba(255,255,255,0.84)_100%)]" />
            </div>
            <div className="relative flex min-h-[70vh] flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="w-10 shrink-0" />
                <div className="text-center">
                  <p className="text-base font-semibold tracking-[0.08em] text-slate-800">对话修改</p>
                  <p className="mt-1 text-xs text-slate-500">像聊天一样说，你想改什么我帮你处理</p>
                </div>
                <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-white/80 px-3 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
                  AI
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full bg-sky-100/90 px-3 py-1 text-xs font-medium text-sky-700 backdrop-blur">
                  已处理 {modifyChatHistory.filter((item) => item.role === "user").length} 次修改
                </span>
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200/80 backdrop-blur">
                  支持改文案、标签、欢迎语、风格和知识内容
                </span>
              </div>

              <div className="mt-5 rounded-3xl border border-white/80 bg-white/55 p-4 text-sm text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl sm:p-5">
                <p className="font-medium text-slate-800">直接说你的修改需求就行。</p>
                <p className="mt-2 leading-7">
              用自然语言说明你想怎么改，例如：「把擅长标签改成考研、转行」「添加一条关于面试技巧的经验：我当时面了5家公司…」「欢迎语改成更亲切一点」
                </p>
              </div>

              <div className="mt-5 flex-1 overflow-y-auto px-1 pb-4 pt-2">
                <div className="space-y-4">
                  {modifyChatHistory.length === 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-[24px] border border-white/90 bg-white/88 px-4 py-3 text-sm leading-7 text-slate-700 shadow-sm backdrop-blur-xl sm:px-5">
                        说一句你想怎么修改，AI 会帮你更新 Agent。
                      </div>
                    </div>
                  )}
                  {modifyChatHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm sm:px-5 ${
                          m.role === "user"
                            ? "bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-sky-200/70"
                            : "border border-white/90 bg-white/88 text-slate-700 backdrop-blur-xl"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={modifyChatEndRef} />
                </div>
              </div>

            <form
              className="mx-1 mt-2 rounded-[28px] border border-white/85 bg-white/90 p-3 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.28)] backdrop-blur-2xl"
              onSubmit={async (e) => {
                e.preventDefault();
                const msg = modifyInput.trim();
                if (!msg || modifyLoading) return;
                setModifyInput("");
                setModifyChatHistory((prev) => [...prev, { role: "user", content: msg }]);
                setModifyLoading(true);
                try {
                  const res = await fetch(`/api/life-agents/${id}/modify-via-chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      message: msg,
                      chatHistory: modifyChatHistory.map((m) => ({ role: m.role, content: m.content })),
                    }),
                  });
                  const d = await res.json();
                  if (!res.ok) {
                    setModifyChatHistory((prev) => [...prev, { role: "assistant", content: d.detail || "修改失败，请重试" }]);
                    return;
                  }
                  setModifyChatHistory((prev) => [...prev, { role: "assistant", content: d.assistantMessage }]);
                  if (d.profile) {
                    setData((prev) => (prev ? { ...prev, profile: d.profile } : prev));
                    const p = d.profile;
                    setForm((f) => ({
                      ...f,
                      displayName: p.displayName ?? f.displayName,
                      headline: p.headline ?? f.headline,
                      shortBio: p.shortBio ?? f.shortBio,
                      longBio: p.longBio ?? f.longBio,
                      expertiseTags: Array.isArray(p.expertiseTags) ? p.expertiseTags.join(", ") : f.expertiseTags,
                      sampleQuestions: Array.isArray(p.sampleQuestions) ? p.sampleQuestions.join("\n") : f.sampleQuestions,
                      welcomeMessage: p.welcomeMessage ?? f.welcomeMessage,
                      personaArchetype: p.personaArchetype ?? f.personaArchetype,
                      toneStyle: p.toneStyle ?? f.toneStyle,
                      responseStyle: p.responseStyle ?? f.responseStyle,
                      forbiddenPhrases: Array.isArray(p.forbiddenPhrases) ? p.forbiddenPhrases.join("\n") : f.forbiddenPhrases,
                      exampleReply1: Array.isArray(p.exampleReplies) ? (p.exampleReplies[0] ?? "") : f.exampleReply1,
                      exampleReply2: Array.isArray(p.exampleReplies) ? (p.exampleReplies[1] ?? "") : f.exampleReply2,
                      exampleReply3: Array.isArray(p.exampleReplies) ? (p.exampleReplies[2] ?? "") : f.exampleReply3,
                    }));
                  }
                } catch {
                  setModifyChatHistory((prev) => [...prev, { role: "assistant", content: "请求失败，请检查网络后重试" }]);
                } finally {
                  setModifyLoading(false);
                }
              }}
            >
              <div className="flex flex-col gap-3">
                <textarea
                  className="min-h-[88px] w-full resize-none rounded-2xl border-0 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  value={modifyInput}
                  onChange={(e) => setModifyInput(e.target.value)}
                  placeholder={modifyLoading ? "AI 正在处理这次修改…" : "例如：把擅长标签改成考研、转行、找工作"}
                  disabled={modifyLoading}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">用自然语言说清楚你想改什么就行。</p>
                  <button type="submit" className="btn-primary min-w-[96px] px-5 py-2.5 text-sm disabled:opacity-60" disabled={modifyLoading}>
                    {modifyLoading ? "处理中…" : "发送"}
                  </button>
                </div>
              </div>
            </form>
            </div>
          </section>
        </div>
      )}

      {activeTab === "edit" && (
        <form onSubmit={submit} className="space-y-6">
          <section className="glass-card p-6">
            <LifeAgentCoverPicker
              coverImageUrl={form.coverImageUrl}
              onChange={(u) => setForm((prev) => ({ ...prev, coverImageUrl: u }))}
              disabled={loading}
            />
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">语音回复音色</h2>
            <p className="mt-2 text-sm text-slate-600">
              用户在聊天中选择「语音回复」时，会使用此处绑定的音色。上传样本后由服务端向百炼注册，成功后会显示{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">voiceCloneId</code>。
            </p>
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>
                状态：
                {data.profile.hasVoiceClone
                  ? "已可用于语音合成"
                  : "未就绪（未绑定音色、或 Key/权限不足，请查服务端日志）"}
              </p>
              {data.profile.voiceCloneId ? (
                <p className="mt-1 break-all font-mono text-xs text-slate-600">
                  voiceCloneId：{data.profile.voiceCloneId}
                </p>
              ) : (
                <p className="mt-1 text-slate-500">尚未写入 voiceCloneId</p>
              )}
            </div>
            {voiceSamplePending ? (
              <p className="mt-3 text-sm text-emerald-700">
                已录制新样本，可点「仅上传音色」立即提交，或保存本页全部资料时一并提交。
              </p>
            ) : null}
            {!voicePanelOpen ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setVoicePanelOpen(true);
                    setError("");
                  }}
                >
                  录制音色样本
                </button>
                {voiceSamplePending ? (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={voiceSaving}
                    onClick={() => void saveVoiceOnly()}
                  >
                    {voiceSaving ? "上传中…" : "仅上传音色"}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <VoiceRecordPanel
                  onComplete={(blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = (reader.result as string).split(",")[1];
                      setVoiceSamplePending(base64 ?? null);
                      setVoicePanelOpen(false);
                      setError("");
                    };
                    reader.readAsDataURL(blob);
                  }}
                />
                <button type="button" className="btn-secondary text-sm" onClick={() => setVoicePanelOpen(false)}>
                  取消
                </button>
              </div>
            )}
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">基本展示信息</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Agent 名称</label>
                <input
                  className="input-shell"
                  value={form.displayName}
                  onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  maxLength={10}
                  required
                />
                <p className="mt-1 text-xs text-slate-500">必填，1 到 10 个字</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">一句话介绍</label>
                <input
                  className="input-shell"
                  value={form.headline}
                  onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
                  placeholder="可以不填"
                />
                <p className="mt-1 text-xs text-slate-500">选填，可以留空</p>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">简短介绍（选填）</label>
                <textarea
                  className="input-shell min-h-24"
                  value={form.shortBio}
                  onChange={(e) => setForm((prev) => ({ ...prev, shortBio: e.target.value }))}
                  placeholder="可以不填"
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
                <label className="mb-2 block text-sm font-medium text-slate-700">地区（选填）</label>
                <div className="flex flex-wrap gap-2">
                  {REGION_OPTIONS.map((region) => {
                    const active = selectedRegions.includes(region);
                    const disabled = !active && selectedRegions.length >= 2;
                    return (
                      <button
                        key={region}
                        type="button"
                        onClick={() => toggleRegion(region)}
                        disabled={disabled}
                        className={`rounded-full px-3 py-2 text-sm transition ${
                          active
                            ? "bg-sky-600 text-white"
                            : disabled
                            ? "bg-slate-100 text-slate-300"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  最多选 2 个，当前已选：{selectedRegions.length > 0 ? selectedRegions.join(" / ") : "未选择"}
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">国家 / 地区</label>
                <input
                  className="input-shell"
                  value={form.country}
                  onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="例如：中国、日本、美国、新加坡"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">省 / 州</label>
                <input
                  className="input-shell"
                  value={form.province}
                  onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))}
                  placeholder="例如：河北省、加州、东京都"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">城市</label>
                <input
                  className="input-shell"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="例如：石家庄市、东京、旧金山"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">区县 / 区域</label>
                <input
                  className="input-shell"
                  value={form.county}
                  onChange={(e) => setForm((prev) => ({ ...prev, county: e.target.value }))}
                  placeholder="例如：正定县、涩谷区、Manhattan"
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
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-700">
                  {data?.profile?.verificationStatus === "verified"
                    ? "已认证"
                    : "申请官方认证"}
                </p>
                {data?.profile?.verificationStatus === "verified" ? (
                  <p className="mt-1 text-sm text-green-600">该 Agent 已完成官方认证。</p>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-slate-600">平台会核实你的经历真实性，认证后显示认证标识。</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {OFFICIAL_CONTACT.description}：{" "}
                      <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="text-sky-600 hover:text-sky-700 underline">
                        {OFFICIAL_CONTACT.email}
                      </a>
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">聊天与收费设置</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">适合帮助的人群（选填）</label>
                <textarea
                  className="input-shell min-h-24"
                  value={form.audience}
                  onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
                  placeholder="可以不填"
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
                <label className="mb-2 block text-sm font-medium text-slate-700">每次提问价格（元）</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="input-shell"
                  value={form.pricePerQuestion}
                  onChange={(e) => setForm((prev) => ({ ...prev, pricePerQuestion: e.target.value }))}
                />
                <p className="mt-2 text-sm text-slate-500">
                  直接填写元即可，例如 3 表示 3 元，9.9 表示 9.9 元。不能免费，但不限制最高金额。
                </p>
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
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">不能/不想回答的问题</label>
                <textarea
                  className="input-shell min-h-16"
                  value={form.notSuitableFor}
                  onChange={(e) => setForm((prev) => ({ ...prev, notSuitableFor: e.target.value }))}
                  placeholder="例如：投资理财、医疗建议、超出我行业的问题..."
                />
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
                  placeholder="选填，每行一个"
                />
                <p className="mt-1 text-xs text-slate-500">可以留空，字数不限制</p>
              </div>
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-base font-semibold text-slate-900">人设与语气</h3>
                <p className="mt-1 text-sm text-slate-600">这里会直接影响聊天时像不像你本人。</p>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">MBTI（选填）</label>
                    <select
                      className="input-shell"
                      value={form.mbti}
                      onChange={(e) => setForm((prev) => ({ ...prev, mbti: e.target.value }))}
                    >
                      <option value="">未设置</option>
                      {MBTI_OPTIONS.filter(Boolean).map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">角色原型</label>
                    <select
                      className="input-shell"
                      value={form.personaArchetype}
                      onChange={(e) => setForm((prev) => ({ ...prev, personaArchetype: e.target.value }))}
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
                    >
                      {RESPONSE_STYLE_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">禁用套话</label>
                    <textarea
                      className="input-shell min-h-20"
                      value={form.forbiddenPhrases}
                      onChange={(e) => setForm((prev) => ({ ...prev, forbiddenPhrases: e.target.value }))}
                      placeholder="每行一个"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 1</label>
                    <textarea
                      className="input-shell min-h-24"
                      value={form.exampleReply1}
                      onChange={(e) => setForm((prev) => ({ ...prev, exampleReply1: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 2</label>
                    <textarea
                      className="input-shell min-h-24"
                      value={form.exampleReply2}
                      onChange={(e) => setForm((prev) => ({ ...prev, exampleReply2: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 3（选填）</label>
                    <textarea
                      className="input-shell min-h-24"
                      value={form.exampleReply3}
                      onChange={(e) => setForm((prev) => ({ ...prev, exampleReply3: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
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

      {activeTab === "feedback" && (
        <div className="glass-card overflow-hidden">
          <h3 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-900">
            用户反馈汇总
          </h3>
          <div className="p-6">
            <p className="mb-4 text-sm text-slate-600">
              用户对回复的轻反馈，可帮你发现哪里需要补充经验或改进回答。
            </p>
            {data?.feedback ? (
              <>
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-green-50 p-4">
                    <p className="text-sm text-green-700">有帮助</p>
                    <p className="mt-1 text-2xl font-semibold text-green-800">{data.feedback.counts.helpful}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">不够具体</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-800">{data.feedback.counts.notSpecific}</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-4">
                    <p className="text-sm text-rose-700">不适合我</p>
                    <p className="mt-1 text-2xl font-semibold text-rose-800">{data.feedback.counts.notSuitable}</p>
                  </div>
                </div>
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">当前评分</p>
                  <div className="mt-2 flex items-center gap-2">
                    <RatingStars score={data.feedback.ratings?.averageScore ?? 0} size="md" />
                    <p className="text-2xl font-semibold text-sky-700">
                      {data.feedback.ratings && data.feedback.ratings.raters > 0
                        ? data.feedback.ratings.averageScore.toFixed(1)
                        : "--"}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {data.feedback.ratings?.raters ?? 0} 位用户已评分
                  </p>
                </div>
                <h4 className="mb-3 font-medium text-slate-800">最近反馈（最近 20 条）</h4>
                {!data.feedback.recent?.length ? (
                  <p className="text-slate-500">暂无反馈，用户反馈后会显示在这里</p>
                ) : (
                  <ul className="space-y-4">
                    {data.feedback.recent.map((fb) => (
                      <li key={fb.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              fb.feedbackType === "helpful"
                                ? "bg-green-100 text-green-700"
                                : fb.feedbackType === "not_specific"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {fb.feedbackType === "helpful" ? "有帮助" : fb.feedbackType === "not_specific" ? "不够具体" : "不适合我"}
                          </span>
                          <span className="text-xs text-slate-500">{fb.createdAt}</span>
                        </div>
                        {fb.assistantExcerpt && (
                          <p className="mt-1 text-sm text-slate-600">
                            <span className="font-medium text-slate-500">回复摘要：</span>
                            {(fb.assistantExcerpt ?? "").length > 120 ? (fb.assistantExcerpt ?? "").slice(0, 120) + "..." : fb.assistantExcerpt}
                          </p>
                        )}
                        {fb.comment && (
                          <p className="mt-1 text-sm text-slate-700 italic">补充：{fb.comment}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <h4 className="mb-3 mt-8 font-medium text-slate-800">最近评分</h4>
                {!data.feedback.ratings?.recent?.length ? (
                  <p className="text-slate-500">暂无评分</p>
                ) : (
                  <ul className="space-y-4">
                    {data.feedback.ratings.recent.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-700">
                            <RatingStars score={item.score} size="sm" />
                            {item.score}/5 分
                          </span>
                          <span className="text-xs text-slate-500">{item.updatedAt}</span>
                        </div>
                        {item.comment && <p className="mt-2 text-sm text-slate-700">{item.comment}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="text-slate-500">加载中...</p>
            )}
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
                  <th className="px-6 py-3 text-left font-medium text-slate-600">隐私保护</th>
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
                      <td className="px-6 py-4 max-w-[240px] text-slate-500">{s.title}</td>
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

      <section className="rounded-3xl border border-red-200 bg-red-50/70 p-6">
        <h2 className="text-lg font-semibold text-red-700">危险操作</h2>
        <p className="mt-2 text-sm leading-6 text-red-600">
          删除人生 Agent 后，相关知识、聊天记录、反馈和销量记录都将无法恢复。请确认你不再需要它时再执行。
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={deleteAgent}
            disabled={deleting}
            className="min-h-[48px] rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 active:bg-red-200 touch-manipulation disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="删除此人生 Agent"
          >
            {deleting ? "删除中..." : "删除人生 Agent"}
          </button>
        </div>
      </section>
    </div>
  );
}
