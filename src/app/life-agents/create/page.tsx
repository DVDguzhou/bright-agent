"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OFFICIAL_CONTACT } from "@/lib/official-contact";
import { translateLifeAgentValidationError } from "@/lib/life-agent-validation-i18n";
import { yuanInputToCents } from "@/lib/price";
import {
  COUNTRY_OPTIONS_FOR_CREATE,
  getProvinceOptionsForCreate,
  getCityOptionsForCreate,
  getCountyOptionsForCreate,
} from "@/lib/address-hierarchy";
import { VoiceRecordPanel } from "@/components/voice";

type KnowledgeEntry = {
  category: string;
  title: string;
  content: string;
  tags: string[];
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type ProfileChatField = {
  key:
    | "displayName"
    | "headline"
    | "shortBio"
    | "school"
    | "education"
    | "job"
    | "income"
    | "longBio"
    | "audience"
    | "welcomeMessage"
    | "expertiseTags"
    | "sampleQuestions";
  prompt: string;
  placeholder: string;
  required?: boolean;
};

type ProfileSummaryResponse = {
  summaryMessage?: string;
  profile?: {
    displayName?: string;
    headline?: string;
    shortBio?: string;
    school?: string;
    education?: string;
    job?: string;
    income?: string;
    longBio?: string;
    audience?: string;
    welcomeMessage?: string;
    expertiseTags?: string[];
    sampleQuestions?: string[];
  };
  knowledgeEntries?: KnowledgeEntry[];
};

const FIRST_QUESTION = "你希望分享什么样的经验或信息？可以简单说说你擅长的领域，或你最想帮助用户解决什么问题。";
const MBTI_OPTIONS = ["未设置", "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
const PERSONA_OPTIONS = ["学长学姐型", "朋友陪聊型", "前辈导师型", "冷静分析型", "过来人型", "本地熟人型"];
const TONE_OPTIONS = ["直接一点", "温柔一点", "理性克制", "接地气一点", "像朋友聊天", "稳重耐心"];
const RESPONSE_STYLE_OPTIONS = ["先给判断再解释", "先理解处境再建议", "多举自己的例子", "短一点别太满", "先拆选项再给建议", "像微信聊天少分点"];
const OPTIONAL_SKIP_RE = /^(跳过|不填|先空着|暂无|没有|无)$/;

function getPlaceholderExample(placeholder: string) {
  return placeholder.replace(/^例如[:：]\s*/, "").trim();
}

function autoResizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "0px";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

function ComposerActionButton({
  type = "button",
  onClick,
  disabled,
  children,
  title,
  tone = "neutral",
}: {
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  tone?: "neutral" | "primary";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border text-sm font-medium transition sm:h-11 sm:w-11 sm:rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "primary"
          ? "border-sky-400/80 bg-gradient-to-br from-sky-500 via-sky-500 to-cyan-400 text-white shadow-[0_16px_30px_-16px_rgba(14,165,233,0.95)] hover:brightness-[1.05]"
          : "border-white/70 bg-white/60 text-slate-600 shadow-[0_14px_28px_-18px_rgba(15,23,42,0.28)] backdrop-blur-xl hover:bg-white/72"
      }`}
    >
      {children}
    </button>
  );
}

const PROFILE_CHAT_FIELDS: readonly ProfileChatField[] = [
  {
    key: "displayName",
    prompt: "先给你的 Agent 起个名字吧。控制在 1 到 10 个字。",
    placeholder: "例如：阿青学长",
    required: true,
  },
  {
    key: "headline",
    prompt: "一句话向用户介绍你的 Agent 的功能。",
    placeholder: "例如：帮大学生做职业选择的过来人",
  },
  {
    key: "shortBio",
    prompt: "简短介绍你的 Agent。",
    placeholder: "例如：我是一个陪用户聊转行、求职和成长选择的过来人。",
  },
  {
    key: "school",
    prompt: "你最高学历的学校是？",
    placeholder: "例如：普通二本 / 985 / 海外本科",
  },
  {
    key: "education",
    prompt: "学历是什么？",
    placeholder: "例如：本科 / 硕士 / 博士",
  },
  {
    key: "job",
    prompt: "工作是什么？没有就写无。",
    placeholder: "例如：互联网产品经理 / 教师 / 转行顾问 / 无",
  },
  {
    key: "income",
    prompt: "收入是什么？没有就写无。",
    placeholder: "例如：年薪 30-50 万 / 无",
  },
  {
    key: "longBio",
    prompt: "详细介绍你的 Agent 背景。",
    placeholder: "例如：我经历过考研失败、转行、裸辞，后来慢慢找到适合自己的路。",
  },
  {
    key: "audience",
    prompt: "你的 Agent 适合帮助什么样的人群？",
    placeholder: "例如：大学生、转行的人、刚进社会的人",
  },
  {
    key: "welcomeMessage",
    prompt: "用户第一次打开聊天时，你希望 Agent 先说什么？",
    placeholder: "例如：你好，我会根据自己的真实经历，陪你一起想清楚下一步。",
    required: true,
  },
  {
    key: "expertiseTags",
    prompt: "你觉得你的 Agent 擅长什么？可以直接写几个关键词，我先给你几个例子：考研、转行、求职、职业规划。",
    placeholder: "例如：考研、转行、求职、职业规划",
  },
  {
    key: "sampleQuestions",
    prompt: "你觉得用户可以问你什么问题？可以连续写几个问题，一行一个会更清楚。",
    placeholder: "例如：\n我适合考研还是直接就业？\n裸辞后怎么重新找方向？",
  },
] as const;

export default function CreateLifeAgentPage() {
  const router = useRouter();
  const profileChatEndRef = useRef<HTMLDivElement>(null);
  const experienceChatEndRef = useRef<HTMLDivElement>(null);
  const profileFormRef = useRef<HTMLFormElement>(null);
  const experienceFormRef = useRef<HTMLFormElement>(null);
  const profileInputRef = useRef<HTMLTextAreaElement>(null);
  const experienceInputRef = useRef<HTMLTextAreaElement>(null);
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
    pricePerQuestion: "9.9",
    expertiseTags: "",
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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatDone, setChatDone] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [experienceHistory, setExperienceHistory] = useState<ChatMessage[]>([]);
  const [experienceInput, setExperienceInput] = useState("");
  const [experienceDone, setExperienceDone] = useState(false);
  const [experienceLoading, setExperienceLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sampleQuestionsList, setSampleQuestionsList] = useState<string[]>([]);
  const [sampleQuestionsDraft, setSampleQuestionsDraft] = useState("");
  const [chatFieldIndex, setChatFieldIndex] = useState(0);
  const [voiceSampleBase64, setVoiceSampleBase64] = useState<string | null>(null);
  const [voiceSkipped, setVoiceSkipped] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    profileChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    experienceChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [experienceHistory]);

  useEffect(() => {
    if (step === 1 && chatHistory.length === 0) {
      setChatHistory([{ role: "assistant", content: PROFILE_CHAT_FIELDS[0].prompt }]);
      setChatFieldIndex(0);
      setChatDone(false);
      setError("");
    }
  }, [step, chatHistory.length]);

  useEffect(() => {
    if (step === 2 && experienceHistory.length === 0) {
      setExperienceHistory([{ role: "assistant", content: FIRST_QUESTION }]);
      setExperienceDone(false);
      setError("");
    }
  }, [step, experienceHistory.length]);

  const currentChatField = PROFILE_CHAT_FIELDS[Math.min(chatFieldIndex, PROFILE_CHAT_FIELDS.length - 1)];
  const completedChatCount = chatDone ? PROFILE_CHAT_FIELDS.length : chatFieldIndex;

  const setChatFieldValue = (key: ProfileChatField["key"], value: string) => {
    switch (key) {
      case "sampleQuestions":
        setSampleQuestionsDraft(value);
        break;
      case "displayName":
      case "headline":
      case "shortBio":
      case "school":
      case "education":
      case "job":
      case "income":
      case "longBio":
      case "audience":
      case "welcomeMessage":
      case "expertiseTags":
        setForm((prev) => ({ ...prev, [key]: value }));
        break;
      default:
        break;
    }
  };

  const buildProfileSummaryPayload = (
    currentKey?: ProfileChatField["key"],
    currentValue?: string,
  ) => ({
    displayName: currentKey === "displayName" ? currentValue ?? "" : form.displayName,
    headline: currentKey === "headline" ? currentValue ?? "" : form.headline,
    shortBio: currentKey === "shortBio" ? currentValue ?? "" : form.shortBio,
    school: currentKey === "school" ? currentValue ?? "" : form.school,
    education: currentKey === "education" ? currentValue ?? "" : form.education,
    job: currentKey === "job" ? currentValue ?? "" : form.job,
    income: currentKey === "income" ? currentValue ?? "" : form.income,
    longBio: currentKey === "longBio" ? currentValue ?? "" : form.longBio,
    audience: currentKey === "audience" ? currentValue ?? "" : form.audience,
    welcomeMessage: currentKey === "welcomeMessage" ? currentValue ?? "" : form.welcomeMessage,
    expertiseTagsText: currentKey === "expertiseTags" ? currentValue ?? "" : form.expertiseTags,
    sampleQuestionsText: currentKey === "sampleQuestions" ? currentValue ?? "" : sampleQuestionsDraft,
  });

  const submitProfileSummary = async (payload: ReturnType<typeof buildProfileSummaryPayload>) => {
    const res = await fetch("/api/life-agents/create/profile-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as ProfileSummaryResponse & { detail?: string };
    if (!res.ok) {
      throw new Error(data.detail || "AI 整理基础资料失败，请重试");
    }
    return data;
  };

  const restartProfileChat = () => {
    setForm((prev) => ({
      ...prev,
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
      expertiseTags: "",
    }));
    setKnowledgeEntries([]);
    setSampleQuestionsList([]);
    setSampleQuestionsDraft("");
    setChatInput("");
    setChatDone(false);
    setChatFieldIndex(0);
    setExperienceHistory([]);
    setExperienceInput("");
    setExperienceDone(false);
    setError("");
    setChatHistory([{ role: "assistant", content: PROFILE_CHAT_FIELDS[0].prompt }]);
  };

  const submitExperienceAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    const answer = experienceInput.trim();
    if (!answer || experienceDone || experienceLoading) return;

    setExperienceInput("");
    setExperienceLoading(true);
    setError("");

    const updatedHistory = [...experienceHistory, { role: "user" as const, content: answer }];
    setExperienceHistory(updatedHistory);

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
          knowledgeEntries: updatedEntries.map((entry) => ({
            category: entry.category,
            title: entry.title,
            content: entry.content,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "生成下一问失败，请重试");
        setExperienceHistory((prev) => [
          ...prev,
          { role: "assistant", content: "出了点小问题，你可以继续补充回答，或稍后再试一次。" },
        ]);
        return;
      }

      if (data.extractedTone) {
        const tone = data.extractedTone;
        setForm((prev) => ({
          ...prev,
          ...(tone.personaArchetype && { personaArchetype: tone.personaArchetype }),
          ...(tone.toneStyle && { toneStyle: tone.toneStyle }),
          ...(tone.responseStyle && { responseStyle: tone.responseStyle }),
        }));
      }
      if (data.suggestedTags?.length) {
        setForm((prev) => {
          const existing = prev.expertiseTags.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
          const merged = Array.from(new Set([...existing, ...data.suggestedTags])).slice(0, 8);
          return { ...prev, expertiseTags: merged.join(", ") };
        });
      }
      if (data.knowledgeAdd?.length) {
        setKnowledgeEntries((prev) => {
          const existing = prev.map((entry) => entry.content);
          const added = data.knowledgeAdd.filter((item: { content: string }) => item.content && !existing.includes(item.content));
          return [
            ...prev,
            ...added.map((item: { category: string; title: string; content: string; tags?: string[] }) => ({
              category: item.category || "经验",
              title: item.title || item.content.slice(0, 20),
              content: item.content,
              tags: item.tags?.length ? item.tags : [item.category || "经验"],
            })),
          ];
        });
      }

      if (data.done) {
        setExperienceHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.summaryMessage || "很好！你的经验已经记录下来，可以继续下一步设置 Agent 的回答风格。",
          },
        ]);
        setExperienceDone(true);
      } else {
        setExperienceHistory((prev) => [...prev, { role: "assistant", content: data.nextQuestion || "还能补充一些具体经历吗？" }]);
      }
    } catch {
      setError("网络错误，请重试");
      setExperienceHistory((prev) => [
        ...prev,
        { role: "assistant", content: "出了点小问题，你可以继续补充回答，或稍后再试一次。" },
      ]);
    } finally {
      setExperienceLoading(false);
    }
  };

  const submitChatAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatDone || chatLoading) return;

    const field = PROFILE_CHAT_FIELDS[chatFieldIndex];
    const rawAnswer = chatInput.trim();
    let normalizedAnswer = rawAnswer;

    if (!rawAnswer) {
      if (field.required) {
        setError(field.key === "displayName" ? "请先填写 Agent 名称" : "这一项先回答一下再继续");
        return;
      }
      setError("请输入内容，或回复「跳过」以略过此项");
      return;
    }
    if (OPTIONAL_SKIP_RE.test(rawAnswer) && !field.required) {
      normalizedAnswer = "";
    }

    if (field.key === "displayName") {
      if (normalizedAnswer.length < 1 || normalizedAnswer.length > 10) {
        setError("Agent 名称长度需为 1 到 10 个字");
        return;
      }
    }

    if (field.key === "welcomeMessage" && normalizedAnswer.length < 1) {
      setError("首次欢迎语还不能为空哦");
      return;
    }

    setError("");
    setChatInput("");
    setChatFieldValue(field.key, normalizedAnswer);

    const nextHistory = [...chatHistory, { role: "user" as const, content: normalizedAnswer || "跳过" }];
    setChatHistory(nextHistory);

    const isLastField = chatFieldIndex === PROFILE_CHAT_FIELDS.length - 1;
    if (!isLastField) {
      const nextIndex = chatFieldIndex + 1;
      setChatFieldIndex(nextIndex);
      setChatHistory((prev) => [...prev, { role: "assistant", content: PROFILE_CHAT_FIELDS[nextIndex].prompt }]);
      return;
    }

    setChatDone(false);
    setChatLoading(true);
    try {
      const data = await submitProfileSummary(buildProfileSummaryPayload(field.key, normalizedAnswer));
      const profile = data.profile ?? {};
      const tags = profile.expertiseTags ?? [];
      const questions = profile.sampleQuestions ?? [];
      setForm((prev) => ({
        ...prev,
        displayName: profile.displayName ?? prev.displayName,
        headline: profile.headline ?? prev.headline,
        shortBio: profile.shortBio ?? prev.shortBio,
        school: profile.school ?? prev.school,
        education: profile.education ?? prev.education,
        job: profile.job ?? prev.job,
        income: profile.income ?? prev.income,
        longBio: profile.longBio ?? prev.longBio,
        audience: profile.audience ?? prev.audience,
        welcomeMessage: profile.welcomeMessage ?? prev.welcomeMessage,
        expertiseTags: tags.join(", "),
      }));
      setSampleQuestionsList(questions);
      setSampleQuestionsDraft(questions.join("\n"));
      setKnowledgeEntries((data.knowledgeEntries ?? []).filter((item) => item?.content?.trim()));
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.summaryMessage || "我已经帮你整理好基础资料，下一步继续补充你的真实经历和经验。",
        },
      ]);
      setChatDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "网络错误，请重试";
      setError(message);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "我刚刚整理资料时出了点小问题，你可以重新发送这一项，或者稍后再试一次。",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const displayName = form.displayName.trim();
    if (displayName.length < 1 || displayName.length > 10) {
      setError("Agent 名称长度需为 1 到 10 个字");
      setLoading(false);
      return;
    }

    if (!chatDone) {
      setError("请先完成基础资料对话整理");
      setLoading(false);
      return;
    }

    if (!experienceDone) {
      setError("请先完成经验信息整理");
      setLoading(false);
      return;
    }

    const validEntries = knowledgeEntries.filter((e) => e.content.trim().length >= 1);
    if (validEntries.length < 1) {
      setError("基础资料还没整理完成，请回到上一步重新生成");
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

    const pricePerQuestion = yuanInputToCents(form.pricePerQuestion);
    if (pricePerQuestion === null) {
      setError("请填写大于 0 的金额，单位是元，最多保留 2 位小数");
      setLoading(false);
      return;
    }

    const payload = {
      displayName,
      headline: form.headline.trim(),
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
      pricePerQuestion,
      mbti: form.mbti || undefined,
      personaArchetype: form.personaArchetype,
      toneStyle: form.toneStyle,
      responseStyle: form.responseStyle,
      forbiddenPhrases: forbiddenPhrasesArr.slice(0, 8),
      exampleReplies: exampleRepliesArr.slice(0, 3),
      expertiseTags: expertiseTagsArr.slice(0, 8),
      sampleQuestions: sampleQuestionsArr,
      voiceSampleBase64: voiceSampleBase64 ?? undefined,
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

  const fillProfileInput = (value: string) => setChatInput(value);

  const fillExperienceInput = (value: string) => {
    setExperienceInput((prev) => {
      if (!prev.trim()) return value;
      const needsBreak = prev.endsWith("\n") ? "" : "\n";
      return `${prev}${needsBreak}${value}`;
    });
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

  const scrollToLastMessage = () => {
    profileChatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const scrollToLastExperienceMessage = () => {
    experienceChatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const dismissKeyboard = () => {
    const el = document.activeElement as HTMLElement | null;
    if (el?.matches?.("input, textarea")) el.blur();
  };

  return (
    <div className="-mx-4 -mt-3 sm:-mt-8 -mb-20 lg:-mb-8 flex min-w-0 flex-col min-h-[calc(100dvh-6rem)] lg:min-h-[calc(100dvh-4rem)]">
      {/* 紧凑顶部栏 */}
      <header className="shrink-0 border-b border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-md sm:px-6 sm:py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <Link href="/life-agents" className="flex items-center gap-1 text-sm text-slate-500 hover:text-sky-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <div className="flex flex-1 items-center justify-center gap-2 min-w-0">
            <h1 className="truncate text-sm font-semibold text-slate-800 sm:text-base">创建 Agent</h1>
            <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
              {step}/5
            </span>
          </div>
          <div className="w-12 shrink-0 sm:w-16" />
        </div>
        <div className="mx-auto mt-1.5 max-w-5xl">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-sky-500" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>
      </header>

      {step === 1 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* 单行提示 */}
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-slate-500">
            <span>基础资料 {completedChatCount}/{PROFILE_CHAT_FIELDS.length}</span>
            <span>可回复「跳过」略过</span>
          </div>

          {/* 聊天区域 - 点击/触摸空白处收起键盘（和微信一样） */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4"
            onClick={dismissKeyboard}
            onTouchStart={dismissKeyboard}
            role="presentation"
          >
            <div className={`mx-auto max-w-3xl space-y-4 ${chatDone ? "pb-24" : "pb-4"}`}>
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-7 sm:max-w-[75%] ${
                      msg.role === "user"
                        ? "bg-sky-500 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {chatDone && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    基础资料已整理好，下一步补充真实经历。
                  </div>
                  <div className="grid gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-slate-200 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-400">Agent 名称</p>
                      <p className="text-slate-700">{form.displayName || "未填写"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">一句话介绍</p>
                      <p className="text-slate-700">{form.headline || "未填写"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-400">擅长标签</p>
                      <p className="text-slate-700">{form.expertiseTags || "未填写"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={restartProfileChat} className="btn-secondary min-h-[44px] flex-1">
                      重新开始
                    </button>
                    <button
                      type="button"
                      onClick={() => { setError(""); setStep(2); }}
                      className="btn-primary min-h-[44px] flex-1"
                    >
                      下一步：补充经验
                    </button>
                  </div>
                </div>
              )}
              <div ref={profileChatEndRef} />
            </div>
          </div>

          {error ? (
            <div className="shrink-0 mx-3 mb-1 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600 sm:mx-4">
              {error}
            </div>
          ) : null}

          {/* 输入栏 - 文档流内，自然位于底部导航上方（main 有 pb-20） */}
          {!chatDone && (
            <form
              ref={profileFormRef}
              onSubmit={submitChatAnswer}
              className="shrink-0 border-t border-slate-200/80 bg-white px-2 pt-2 pb-12 lg:pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
            >
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <div className="flex-1 min-w-0 rounded-2xl bg-slate-100 px-4 py-2.5">
                  <textarea
                    ref={profileInputRef}
                    onFocus={() => setTimeout(scrollToLastMessage, 150)}
                    className="max-h-36 min-h-[24px] w-full resize-none border-0 bg-transparent text-base leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      autoResizeTextarea(e.target);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder={chatLoading ? "AI 正在整理资料…" : currentChatField.placeholder}
                    required={Boolean(currentChatField.required)}
                    disabled={chatLoading}
                    rows={1}
                    enterKeyHint="send"
                  />
                </div>
                <ComposerActionButton type="submit" disabled={chatLoading} title="发送" tone="primary">
                  {chatLoading ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M3.72 2.94a.75.75 0 0 1 .8-.12l11.5 5.5a.75.75 0 0 1 0 1.36l-11.5 5.5A.75.75 0 0 1 3.45 14.5l1.34-4.05H9.5a.75.75 0 0 0 0-1.5H4.8L3.45 4.9a.75.75 0 0 1 .27-.96Z" />
                    </svg>
                  )}
                </ComposerActionButton>
              </div>
            </form>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* 单行提示 */}
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-slate-500">
            <span>记忆经验 · 已记录 {experienceHistory.filter((msg) => msg.role === "user").length} 轮</span>
            <span>越具体，Agent 越像你</span>
          </div>

          {/* 聊天区域 - 点击/触摸空白处收起键盘（和微信一样） */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4"
            onClick={dismissKeyboard}
            onTouchStart={dismissKeyboard}
            role="presentation"
          >
            <div className={`mx-auto max-w-3xl space-y-4 ${experienceDone ? "pb-24" : "pb-4"}`}>
              {experienceHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-7 sm:max-w-[75%] ${
                      msg.role === "user"
                        ? "bg-sky-500 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {experienceDone && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    经验记录得差不多了，可以进入下一步设置回答风格。
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError(""); }}
                      className="btn-secondary min-h-[44px] flex-1"
                    >
                      上一步
                    </button>
                    <button
                      type="button"
                      onClick={() => { setError(""); setStep(3); }}
                      className="btn-primary min-h-[44px] flex-1"
                    >
                      下一步：让回答更像你
                    </button>
                  </div>
                </div>
              )}
              <div ref={experienceChatEndRef} />
            </div>
          </div>

          {error ? (
            <div className="shrink-0 mx-3 mb-1 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600 sm:mx-4">
              {error}
            </div>
          ) : null}

          {/* 输入栏 - 文档流内，自然位于底部导航上方 */}
          {!experienceDone && (
            <form
              ref={experienceFormRef}
              onSubmit={submitExperienceAnswer}
              className="shrink-0 border-t border-slate-200/80 bg-white px-2 pt-2 pb-12 lg:pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
            >
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <div className="flex-1 min-w-0 rounded-2xl bg-slate-100 px-4 py-2.5">
                  <textarea
                    ref={experienceInputRef}
                    onFocus={() => setTimeout(scrollToLastExperienceMessage, 150)}
                    className="max-h-36 min-h-[24px] w-full resize-none border-0 bg-transparent text-base leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                    value={experienceInput}
                    onChange={(e) => {
                      setExperienceInput(e.target.value);
                      autoResizeTextarea(e.target);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder={experienceLoading ? "AI 正在思考下一问…" : "说出你需要分享的经验和信息"}
                    required
                    disabled={experienceLoading}
                    rows={1}
                    enterKeyHint="send"
                  />
                </div>
                <ComposerActionButton type="submit" disabled={experienceLoading} title="发送" tone="primary">
                  {experienceLoading ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M3.72 2.94a.75.75 0 0 1 .8-.12l11.5 5.5a.75.75 0 0 1 0 1.36l-11.5 5.5A.75.75 0 0 1 3.45 14.5l1.34-4.05H9.5a.75.75 0 0 0 0-1.5H4.8L3.45 4.9a.75.75 0 0 1 .27-.96Z" />
                    </svg>
                  )}
                </ComposerActionButton>
              </div>
            </form>
          )}
        </div>
      )}

      {step === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setStep(4);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
          <section className="border-b border-slate-200/80 pb-6">
              <h2 className="text-xl font-semibold text-slate-900">让回答更像你本人</h2>
              <p className="mt-1 text-slate-600">
                这里决定 Agent 说话的感觉。别只填标签，还要告诉它你平时怎么开口、讨厌什么套话。
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
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">你所在的地区（选填）</label>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <select
                      className="input-shell"
                      value={form.country}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({ ...prev, country: value, province: "", city: "", county: "" }));
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
                        const value = e.target.value;
                        setForm((prev) => ({ ...prev, province: value, city: "", county: "" }));
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
                        const value = e.target.value;
                        setForm((prev) => ({ ...prev, city: value, county: "" }));
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
                    {showAdvanced && <span className="text-xs font-normal text-slate-500">（不设置则默认无）</span>}
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
          </section>

          {error ? (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </p>
          ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-4 pb-24 sm:px-6 lg:pb-6">
            <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setError("");
                }}
                className="btn-secondary min-h-[44px]"
              >
                上一步
              </button>
              <button type="submit" className="btn-primary min-h-[44px]">
                下一步：采集音色
              </button>
            </div>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-2xl">
              <VoiceRecordPanel
                onComplete={async (blob) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = (reader.result as string).split(",")[1];
                    setVoiceSampleBase64(base64 ?? null);
                    setError("");
                    setStep(5);
                  };
                  reader.readAsDataURL(blob);
                }}
                onSkip={() => {
                  setVoiceSkipped(true);
                  setError("");
                  setStep(5);
                }}
                minDurationSeconds={10}
                maxDurationSeconds={30}
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-4 pb-24 sm:px-6 lg:pb-6">
            <div className="mx-auto flex max-w-2xl justify-between">
              <button
                type="button"
                onClick={() => { setStep(3); setError(""); }}
                className="btn-secondary min-h-[44px]"
              >
                上一步
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
          <section className="border-b border-slate-200/80 pb-6">
            <h2 className="text-xl font-semibold text-slate-900">设置收费</h2>
            <div className="mt-5 max-w-sm">
              <label className="mb-2 block text-sm font-medium text-slate-700">每次提问价格（元）</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input-shell"
                value={form.pricePerQuestion}
                onChange={(e) => setForm((prev) => ({ ...prev, pricePerQuestion: e.target.value }))}
                required
              />
            </div>
          </section>

          <section className="border-b border-slate-200/80 py-6">
            <p className="font-medium text-slate-900">申请官方认证</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              平台会核实你的经历真实性，认证后会显示认证标识。你可以在发布前或发布后联系官方申请。
            </p>
            <p className="mt-3 text-sm text-slate-700">
              {OFFICIAL_CONTACT.description}：{" "}
              <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="text-sky-600 underline hover:text-sky-700">
                {OFFICIAL_CONTACT.email}
              </a>
            </p>
          </section>

          <section className="border-b border-slate-200/80 py-6">
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
          </section>

          <section className="py-6">
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
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-800">擅长标签：</span>
                {form.expertiseTags || "未填写"}
              </p>
              <p className="mt-2">
                <span className="font-medium text-slate-800">示例问题：</span>
                {sampleQuestionsList.length > 0 ? sampleQuestionsList.join(" / ") : "未填写"}
              </p>
            </div>
          </section>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
          )}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-4 pb-24 sm:px-6 lg:pb-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep(4);
                  setError("");
                }}
                className="btn-secondary min-h-[44px]"
              >
                上一步
              </button>
              <button type="submit" disabled={loading} className="btn-primary min-h-[44px] disabled:opacity-60">
                {loading ? "创建中..." : "发布我的 Agent"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
