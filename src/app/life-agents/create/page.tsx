"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OFFICIAL_CONTACT } from "@/lib/official-contact";
import { translateLifeAgentValidationError } from "@/lib/life-agent-validation-i18n";
import { AGENT_CATEGORIES } from "@/lib/life-agent-category";
import { yuanInputToCents } from "@/lib/price";
import {
  COUNTRY_OPTIONS_FOR_CREATE,
  getProvinceOptionsForCreate,
  getCityOptionsForCreate,
  getCountyOptionsForCreate,
} from "@/lib/address-hierarchy";
import { VoiceRecordPanel } from "@/components/voice";
import { LifeAgentMessageComposer } from "@/components/LifeAgentMessageComposer";
import { LifeAgentCoverPicker } from "@/components/LifeAgentCoverPicker";
import { AgentTypingIndicator } from "@/components/AgentTypingIndicator";
import {
  clearLifeAgentCreateDraft,
  loadLifeAgentCreateDraft,
  saveLifeAgentCreateDraft,
  type LifeAgentCreateDraftV1,
} from "@/lib/life-agent-create-draft";
import { cleanLifeAgentIntroText } from "@/lib/life-agent-intro-clean";
import { notifyLifeAgentOwnedChange } from "@/lib/bound-life-agents";
import {
  CHAT_PAGE_BACKGROUND_CLASSNAME,
  CHAT_SCROLL_SURFACE_CLASSNAME,
  getChatBubbleClassName,
} from "@/lib/chat-glass";
import { useIsDesktop, useKeyboardViewport, chatInputFooterPaddingClass } from "@/hooks/use-keyboard-viewport";

type KnowledgeEntry = {
  category: string;
  title: string;
  content: string;
  tags: string[];
};

type StructuredFact = {
  factKey: string;
  factValue: string;
  factType?: string;
  source?: string;
  confidence?: string;
  status?: string;
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
    | "expertiseTags";
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
  structuredFacts?: StructuredFact[];
};

type CreateQuestionResponse = {
  done?: boolean;
  nextQuestion?: string;
  questionDimension?: "fact" | "decision" | "regret" | "adaptation" | "advice" | "current" | "local";
  summaryMessage?: string;
  extractedTone?: {
    personaArchetype?: string;
    toneStyle?: string;
    responseStyle?: string;
  };
  suggestedTags?: string[];
  knowledgeAdd?: Array<{
    category: string;
    title: string;
    content: string;
    tags?: string[];
  }>;
  factCandidates?: StructuredFact[];
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
  detail?: string;
};

function isEventStreamResponse(res: Response) {
  return (res.headers.get("content-type") || "").includes("text/event-stream");
}

async function readEventStreamPayload<T>(
  res: Response,
  onContent: (chunk: string) => void,
): Promise<T> {
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("流式响应不可用，请重试");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload: T | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      let eventType = "";
      let eventData = "";
      for (const line of part.split("\n")) {
        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
        else if (line.startsWith("data: ")) eventData = line.slice(6);
      }
      if (!eventData) continue;

      const parsed = JSON.parse(eventData) as Record<string, unknown>;
      if (eventType === "content" && typeof parsed.content === "string") {
        onContent(parsed.content);
      } else if (eventType === "done") {
        donePayload = parsed as T;
      }
    }
  }

  if (!donePayload) {
    throw new Error("流式响应不完整，请重试");
  }
  return donePayload;
}

const FIRST_QUESTION = "为了帮你打造更像你的 Agent，请先选择一个方向开始：";

const EXPERIENCE_TOPICS = [
  { key: "experience", label: "真实经历", description: "分享一段成长过程或做事心得" },
  { key: "personality", label: "性格兴趣", description: "聊聊你的性格、兴趣和说话方式" },
  { key: "daily", label: "日常生活", description: "分享日常场景和习惯" },
] as const;

type ExperienceTopic = (typeof EXPERIENCE_TOPICS)[number]["key"];
const MBTI_OPTIONS = ["未设置", "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
const PERSONA_OPTIONS = ["学长学姐型", "朋友陪聊型", "前辈导师型", "冷静分析型", "过来人型", "本地熟人型"];
const TONE_OPTIONS = ["直接一点", "温柔一点", "理性克制", "接地气一点", "像朋友聊天", "稳重耐心"];
const RESPONSE_STYLE_OPTIONS = ["先给判断再解释", "先理解处境再建议", "多举自己的例子", "短一点别太满", "先拆选项再给建议", "像微信聊天少分点"];
function getPlaceholderExample(placeholder: string) {
  return placeholder.replace(/^例如[:：]\s*/, "").trim();
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
    prompt: "简单说说你的相关经历或背景，让用户知道为什么你能帮到他。",
    placeholder: "例如：我自己考研上岸过，知道备考有多难，也知道选对方向比埋头刷题重要",
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
] as const;

type CreateAgentFormState = {
  displayName: string;
  headline: string;
  shortBio: string;
  longBio: string;
  education: string;
  school: string;
  job: string;
  income: string;
  country: string;
  province: string;
  city: string;
  county: string;
  audience: string;
  welcomeMessage: string;
  pricePerQuestion: string;
  expertiseTags: string;
  mbti: string;
  personaArchetype: string;
  toneStyle: string;
  responseStyle: string;
  forbiddenPhrases: string;
  exampleReply1: string;
  exampleReply2: string;
  exampleReply3: string;
};

const DEFAULT_FORM: CreateAgentFormState = {
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
};

type QuickStartTemplate = {
  label: string;
  desc: string;
  form: Partial<CreateAgentFormState>;
  sampleQuestions: string[];
};

const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    label: "考研上岸",
    desc: "分享考研备考、选校、调剂的真实经历",
    form: {
      headline: "陪你想清楚考研这件事的过来人",
      shortBio: "考研上岸过，知道备考有多难，也知道选对方向比埋头刷题重要。",
      audience: "正在考虑考研、正在备考、或者在纠结二战的同学",
      welcomeMessage: "考研的事可以随便问我，我自己走过一遍，知道哪些坑不用踩。",
      expertiseTags: "考研, 备考, 选校, 调剂, 二战",
      personaArchetype: "学长学姐型",
    },
    sampleQuestions: ["我这个专业值得考研吗？", "一战没上岸，要不要二战？", "怎么选目标院校？"],
  },
  {
    label: "转行互联网",
    desc: "分享非科班转行产品、运营、开发的经验",
    form: {
      headline: "从传统行业转到互联网的过来人",
      shortBio: "转过行，知道中间的纠结、焦虑和真实的准备过程。",
      audience: "想从传统行业转到互联网，或者在犹豫要不要转行的人",
      welcomeMessage: "转行的事我自己经历过，有什么想聊的直接说。",
      expertiseTags: "转行, 互联网, 产品经理, 职业规划, 简历",
      personaArchetype: "过来人型",
    },
    sampleQuestions: ["非科班转产品经理可行吗？", "转行需要准备多久？", "降薪转行值不值得？"],
  },
  {
    label: "留学申请",
    desc: "分享留学选校、申请、海外生活的真实体验",
    form: {
      headline: "留过学，知道申请和真实生活是两回事",
      shortBio: "经历过留学申请全流程，也在海外生活过，能聊的不只是怎么申请。",
      audience: "正在准备留学、在纠结去哪个国家/学校、或者想了解海外真实生活的人",
      welcomeMessage: "留学的事随便问，我自己申请过，也在那边生活过。",
      expertiseTags: "留学, 申请, 选校, 海外生活, 签证",
      personaArchetype: "学长学姐型",
    },
    sampleQuestions: ["这两个学校怎么选？", "留学真实花费大概多少？", "海外找工作难不难？"],
  },
  {
    label: "应届求职",
    desc: "分享秋招、春招、选 offer 的第一手经验",
    form: {
      headline: "刚经历过秋招的应届生",
      shortBio: "秋招春招都走过一遍，简历、面试、选 offer 的坑都踩过。",
      audience: "正在准备秋招/春招、或者拿了多个 offer 不知道怎么选的同学",
      welcomeMessage: "求职的事我刚经历完，记忆还很新鲜，有什么想问的直说。",
      expertiseTags: "秋招, 春招, 面试, 选offer, 简历",
      personaArchetype: "朋友陪聊型",
    },
    sampleQuestions: ["大厂和小公司怎么选？", "面试总被问职业规划怎么答？", "实习经历不够怎么办？"],
  },
  {
    label: "自由创建",
    desc: "从零开始，一步步填写你的 Agent 信息",
    form: {},
    sampleQuestions: [],
  },
];

export default function CreateLifeAgentPage() {
  const router = useRouter();
  const profileChatEndRef = useRef<HTMLDivElement>(null);
  const experienceChatEndRef = useRef<HTMLDivElement>(null);
  const profileFormRef = useRef<HTMLFormElement>(null);
  const experienceFormRef = useRef<HTMLFormElement>(null);
  const profileInputRef = useRef<HTMLTextAreaElement>(null);
  const experienceInputRef = useRef<HTMLTextAreaElement>(null);
  const [profileMoreOpen, setProfileMoreOpen] = useState(false);
  const [experienceMoreOpen, setExperienceMoreOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [existingAgentCount, setExistingAgentCount] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreateAgentFormState>(() => ({ ...DEFAULT_FORM }));
  const [notSuitableFor, setNotSuitableFor] = useState("");
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [structuredFacts, setStructuredFacts] = useState<StructuredFact[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatDone, setChatDone] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [experienceHistory, setExperienceHistory] = useState<ChatMessage[]>([]);
  const [experienceInput, setExperienceInput] = useState("");
  const [experienceDone, setExperienceDone] = useState(false);
  const [experienceLoading, setExperienceLoading] = useState(false);
  const [isContinuingExperience, setIsContinuingExperience] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ExperienceTopic | null>(null);
  const [showRetractMenu, setShowRetractMenu] = useState<{ type: 'chat' | 'experience' | 'sample', index: number } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sampleQuestionsList, setSampleQuestionsList] = useState<string[]>([]);
  const [sampleQuestionsDraft, setSampleQuestionsDraft] = useState("");
  const [sampleQuestionsHistory, setSampleQuestionsHistory] = useState<ChatMessage[]>([]);
  const [sampleQuestionsInput, setSampleQuestionsInput] = useState("");
  const [sampleQuestionsDone, setSampleQuestionsDone] = useState(false);
  const [sampleQuestionsLoading, setSampleQuestionsLoading] = useState(false);
  const [chatFieldIndex, setChatFieldIndex] = useState(0);
  const [voiceSampleBase64, setVoiceSampleBase64] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [voiceSkipped, setVoiceSkipped] = useState(false);
  const [templatePicked, setTemplatePicked] = useState(false);
  const [draftDrawerOpen, setDraftDrawerOpen] = useState(false);
  const [draftDrawerExpanded, setDraftDrawerExpanded] = useState(false);
  /** 为 true 表示已尝试从 localStorage 恢复草稿，避免与「空聊天自动插入首条」冲突 */
  const [draftReady, setDraftReady] = useState(false);
  const saveDraftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftSnapshotRef = useRef<LifeAgentCreateDraftV1 | null>(null);
  const isDesktop = useIsDesktop();
  const { containerStyle: mobileContainerStyle, keyboardVisible } = useKeyboardViewport(!isDesktop);

  useLayoutEffect(() => {
    if (!user?.id) {
      setDraftReady(false);
      return;
    }
    const draft = loadLifeAgentCreateDraft(user.id);
    if (draft) {
      // Compatibility: old drafts used 5 steps, new uses 6 (expertise selector inserted between profile and experience)
      const rawStep = Math.floor(Number(draft.step)) || 1;
      const migratedStep = rawStep <= 1 ? rawStep : rawStep + 1;
      const stepClamped = Math.max(1, Math.min(6, migratedStep));
      const maxField = PROFILE_CHAT_FIELDS.length - 1;
      const idx = Math.max(0, Math.min(maxField, Math.floor(Number(draft.chatFieldIndex)) || 0));
      setStep(stepClamped);
      setForm({ ...DEFAULT_FORM, ...draft.form });
      setNotSuitableFor(draft.notSuitableFor);
      setKnowledgeEntries(
        draft.knowledgeEntries.map((e) => ({
          category: e.category,
          title: e.title,
          content: e.content,
          tags: e.tags,
        })),
      );
      setStructuredFacts(Array.isArray(draft.structuredFacts) ? draft.structuredFacts : []);
      setChatHistory(draft.chatHistory);
      setChatInput(draft.chatInput);
      setChatDone(draft.chatDone);
      setChatFieldIndex(idx);
      setExperienceHistory(draft.experienceHistory);
      setExperienceInput(draft.experienceInput);
      setExperienceDone(draft.experienceDone);
      setShowAdvanced(draft.showAdvanced);
      setSampleQuestionsList(draft.sampleQuestionsList);
      setSampleQuestionsDraft(draft.sampleQuestionsDraft);
      setSampleQuestionsHistory(draft.sampleQuestionsHistory || []);
      setSampleQuestionsInput(draft.sampleQuestionsInput || "");
      setSampleQuestionsDone(draft.sampleQuestionsDone || false);
      const validTopics: ExperienceTopic[] = ["experience", "personality", "daily"];
      setSelectedTopic(
        draft.selectedTopic && validTopics.includes(draft.selectedTopic as ExperienceTopic)
          ? (draft.selectedTopic as ExperienceTopic)
          : null
      );
      setVoiceSampleBase64(null);
      setVoiceSkipped(draft.voiceSkipped);
      setCoverImageUrl(draft.coverImageUrl);
      setTemplatePicked(true);
      setError("");
    }
    setDraftReady(true);
  }, [user?.id]);

  const buildDraftSnapshot = useCallback((): LifeAgentCreateDraftV1 => {
    return {
      v: 1,
      savedAt: Date.now(),
      step,
      form: { ...form },
      notSuitableFor,
      knowledgeEntries,
      structuredFacts,
      chatHistory,
      chatInput,
      chatDone,
      chatFieldIndex,
      experienceHistory,
      experienceInput,
      experienceDone,
      showAdvanced,
      sampleQuestionsList,
      sampleQuestionsDraft,
      sampleQuestionsHistory,
      sampleQuestionsInput,
      sampleQuestionsDone,
      selectedTopic,
      voiceSkipped,
      coverImageUrl,
    };
  }, [
    step,
    form,
    notSuitableFor,
    knowledgeEntries,
    structuredFacts,
    chatHistory,
    chatInput,
    chatDone,
    chatFieldIndex,
    experienceHistory,
    experienceInput,
    experienceDone,
    showAdvanced,
    sampleQuestionsList,
    sampleQuestionsDraft,
    sampleQuestionsHistory,
    sampleQuestionsInput,
    sampleQuestionsDone,
    selectedTopic,
    voiceSkipped,
    coverImageUrl,
  ]);

  useEffect(() => {
    latestDraftSnapshotRef.current = buildDraftSnapshot();
  }, [buildDraftSnapshot]);

  const persistDraftNow = useCallback((overrides?: Partial<LifeAgentCreateDraftV1>) => {
    const uid = user?.id;
    if (!uid || !draftReady) return;
    if (saveDraftTimerRef.current) {
      clearTimeout(saveDraftTimerRef.current);
      saveDraftTimerRef.current = null;
    }
    const nextDraft = {
      ...(latestDraftSnapshotRef.current ?? buildDraftSnapshot()),
      ...(overrides ?? {}),
    };
    latestDraftSnapshotRef.current = nextDraft;
    saveLifeAgentCreateDraft(uid, nextDraft);
  }, [user?.id, draftReady, buildDraftSnapshot]);

  const flushSaveDraft = useCallback(() => {
    persistDraftNow();
  }, [persistDraftNow]);

  const isSkipField = useCallback((value: string) => {
    const skipPatterns = [/^暂无$/, /^无$/, /^没有$/, /^跳过$/, /^pass$/i];
    return skipPatterns.some((pattern) => pattern.test(value.trim()));
  }, []);

  const isFilledField = useCallback(
    (value: string) => {
      const s = value.trim();
      return s !== "" && !isSkipField(s);
    },
    [isSkipField],
  );

  const validateStep1ForNext = useCallback((): string | null => {
    if (!chatDone) return "请先完成基础资料对话";
    if (!sampleQuestionsDone) return "请先完成示例问题，或直接说「没有了」结束";
    const displayName = form.displayName.trim();
    if (!isFilledField(displayName)) return "请填写 Agent 名称（1 到 10 个字），此项不可跳过";
    if (displayName.length < 1 || displayName.length > 10) return "Agent 名称长度需为 1 到 10 个字";
    if (!isFilledField(form.welcomeMessage)) return "请填写首次欢迎语，此项不可跳过";
    return null;
  }, [chatDone, sampleQuestionsDone, form.displayName, form.welcomeMessage, isFilledField]);

  const validateStep2ForNext = useCallback((): string | null => {
    const tags = form.expertiseTags
      .split(/[,，、\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (tags.length < 1) return "请至少选择一个擅长领域";
    return null;
  }, [form.expertiseTags]);

  const validateStep3ForNext = useCallback((): string | null => {
    if (!experienceDone) return "请先完成经验补充对话";
    const validEntries = knowledgeEntries.filter((e) => e.content.trim().length >= 1);
    if (validEntries.length < 2) return "至少需要记录 2 条有效经验，请继续补充";
    return null;
  }, [experienceDone, knowledgeEntries]);

  const validateStep4ForNext = useCallback((): string | null => {
    if (!form.personaArchetype.trim() || !form.toneStyle.trim() || !form.responseStyle.trim()) {
      return "请设置 Agent 的角色、语气和回答习惯";
    }
    return null;
  }, [form.personaArchetype, form.toneStyle, form.responseStyle]);

  const validateBeforeLeaveStep = useCallback(
    (currentStep: number): string | null => {
      switch (currentStep) {
        case 1:
          return validateStep1ForNext();
        case 2:
          return validateStep2ForNext();
        case 3:
          return validateStep3ForNext();
        case 4:
          return validateStep4ForNext();
        default:
          return null;
      }
    },
    [validateStep1ForNext, validateStep2ForNext, validateStep3ForNext, validateStep4ForNext],
  );

  const goToStep = useCallback(
    (nextStep: number, overrides?: Partial<LifeAgentCreateDraftV1>) => {
      if (nextStep > step) {
        const validationError = validateBeforeLeaveStep(step);
        if (validationError) {
          setError(validationError);
          return;
        }
      }
      setError("");
      setStep(nextStep);
      persistDraftNow({ step: nextStep, ...(overrides ?? {}) });
    },
    [step, persistDraftNow, validateBeforeLeaveStep],
  );

  const handleCoverImageChange = useCallback((nextCoverImageUrl: string) => {
    setCoverImageUrl(nextCoverImageUrl);
    persistDraftNow({ coverImageUrl: nextCoverImageUrl });
  }, [persistDraftNow]);

  const flushSaveDraftRef = useRef(flushSaveDraft);
  flushSaveDraftRef.current = flushSaveDraft;

  useEffect(() => {
    if (!user?.id || !draftReady) return;
    if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);
    saveDraftTimerRef.current = setTimeout(() => {
      saveDraftTimerRef.current = null;
      flushSaveDraftRef.current();
    }, 500);
    return () => {
      if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);
    };
  }, [
    user?.id,
    draftReady,
    step,
    form,
    notSuitableFor,
    knowledgeEntries,
    structuredFacts,
    chatHistory,
    chatInput,
    chatDone,
    chatFieldIndex,
    experienceHistory,
    experienceInput,
    experienceDone,
    showAdvanced,
    sampleQuestionsList,
    sampleQuestionsDraft,
    voiceSkipped,
    coverImageUrl,
  ]);

  useEffect(() => {
    if (!user?.id || !draftReady) return;
    const flush = () => flushSaveDraftRef.current();
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, [user?.id, draftReady]);

  useEffect(() => {
    return () => {
      if (saveDraftTimerRef.current) {
        clearTimeout(saveDraftTimerRef.current);
        saveDraftTimerRef.current = null;
      }
      flushSaveDraftRef.current();
    };
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setExistingAgentCount(null);
      return;
    }
    let cancelled = false;
    fetch("/api/life-agents/mine", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        setExistingAgentCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => {
        if (cancelled) return;
        setExistingAgentCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    profileChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    experienceChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [experienceHistory]);

  useEffect(() => {
    if (!draftReady) return;
    if (step === 1 && chatHistory.length === 0 && templatePicked) {
      setChatHistory([{ role: "assistant", content: PROFILE_CHAT_FIELDS[0].prompt }]);
      setChatFieldIndex(0);
      setChatDone(false);
      setError("");
    }
  }, [draftReady, step, chatHistory.length]);

  useEffect(() => {
    if (!draftReady) return;
    if (step === 3 && experienceHistory.length === 0) {
      setExperienceHistory([{ role: "assistant", content: FIRST_QUESTION }]);
      setExperienceDone(false);
      setError("");
    }
  }, [draftReady, step, experienceHistory.length]);

  useEffect(() => {
    if (!draftReady) return;
    if (step === 1 && chatDone && sampleQuestionsHistory.length === 0) {
      setSampleQuestionsHistory([{ role: "assistant", content: "用户可能会问你什么问题？" }]);
      setSampleQuestionsDone(false);
      setError("");
    }
  }, [draftReady, step, chatDone, sampleQuestionsHistory.length]);

  const currentChatField = PROFILE_CHAT_FIELDS[Math.min(chatFieldIndex, PROFILE_CHAT_FIELDS.length - 1)];
  const completedChatCount = chatDone ? PROFILE_CHAT_FIELDS.length : chatFieldIndex;

  const setChatFieldValue = (key: ProfileChatField["key"], value: string) => {
    switch (key) {
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
  });

  const submitProfileSummary = async (
    payload: ReturnType<typeof buildProfileSummaryPayload>,
    onContent?: (chunk: string) => void,
  ) => {
    const res = await fetch("/api/life-agents/create/profile-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (isEventStreamResponse(res)) {
      return readEventStreamPayload<ProfileSummaryResponse & { detail?: string }>(res, onContent ?? (() => {}));
    }
    const data = (await res.json()) as ProfileSummaryResponse & { detail?: string };
    if (!res.ok) {
      throw new Error(data.detail || "AI 整理基础资料失败，请重试");
    }
    return data;
  };

  const restartProfileChat = () => {
    if (user?.id) clearLifeAgentCreateDraft(user.id);
    setForm({ ...DEFAULT_FORM });
    setKnowledgeEntries([]);
    setStructuredFacts([]);
    setSampleQuestionsList([]);
    setSampleQuestionsDraft("");
    setChatInput("");
    setChatDone(false);
    setChatFieldIndex(0);
    setExperienceHistory([]);
    setExperienceInput("");
    setExperienceDone(false);
    setVoiceSampleBase64(null);
    setVoiceSkipped(false);
    setCoverImageUrl("");
    setError("");
    setChatHistory([{ role: "assistant", content: PROFILE_CHAT_FIELDS[0].prompt }]);
  };

  const applyTemplate = (template: QuickStartTemplate) => {
    const merged = { ...DEFAULT_FORM, ...template.form };
    setForm(merged);
    if (template.sampleQuestions.length > 0) {
      setSampleQuestionsList(template.sampleQuestions);
      setSampleQuestionsDraft(template.sampleQuestions.join("\n"));
    }
    setTemplatePicked(true);

    if (Object.keys(template.form).length === 0) {
      setChatHistory([{ role: "assistant", content: PROFILE_CHAT_FIELDS[0].prompt }]);
      setChatFieldIndex(0);
      setChatDone(false);
      return;
    }

    // Skip pre-filled fields by finding the first empty required field
    let startIdx = PROFILE_CHAT_FIELDS.length;
    for (let i = 0; i < PROFILE_CHAT_FIELDS.length; i++) {
      const f = PROFILE_CHAT_FIELDS[i];
      const val = merged[f.key as keyof CreateAgentFormState];
      if (!val || val.trim() === "") {
        startIdx = i;
        break;
      }
    }

    if (startIdx >= PROFILE_CHAT_FIELDS.length) {
      const summary: ChatMessage[] = [
        { role: "assistant", content: `已按「${template.label}」模板自动填好了基础资料。你只需要补充自己的具体信息。` },
        { role: "assistant", content: `名字还没填——${PROFILE_CHAT_FIELDS[0].prompt}` },
      ];
      setChatHistory(summary);
      setChatFieldIndex(0);
      setChatDone(false);
    } else {
      const summary: ChatMessage[] = [
        { role: "assistant", content: `已按「${template.label}」模板自动填好了大部分资料，接下来补充几个你的具体信息就行。` },
        { role: "assistant", content: PROFILE_CHAT_FIELDS[startIdx].prompt },
      ];
      setChatHistory(summary);
      setChatFieldIndex(startIdx);
      setChatDone(false);
    }
  };

  const handleTopicSelection = async (topic: ExperienceTopic) => {
    setSelectedTopic(topic);
    setExperienceLoading(true);
    setError("");

    const topicLabel = EXPERIENCE_TOPICS.find((t) => t.key === topic)?.label || topic;
    const updatedHistory = [
      ...experienceHistory,
      { role: "user" as const, content: topicLabel },
      { role: "assistant" as const, content: "" },
    ];
    const assistantRowIndex = updatedHistory.length - 1;
    setExperienceHistory(updatedHistory);

    try {
      const res = await fetch("/api/life-agents/create/next-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        credentials: "include",
        body: JSON.stringify({
          basicInfo: { displayName: form.displayName, headline: form.headline, shortBio: form.shortBio },
          chatHistory: updatedHistory.slice(0, -1),
          knowledgeEntries: knowledgeEntries.map((entry) => ({
            category: entry.category,
            title: entry.title,
            content: entry.content,
          })),
          topic,
        }),
      });

      const data = isEventStreamResponse(res)
        ? await readEventStreamPayload<CreateQuestionResponse>(res, (chunk) => {
            setExperienceHistory((prev) =>
              prev.map((msg, index) =>
                index === assistantRowIndex ? { ...msg, content: msg.content + chunk } : msg
              )
            );
          })
        : ((await res.json()) as CreateQuestionResponse);

      if (!res.ok) {
        setError(data.detail || "生成下一问失败，请重试");
        setExperienceHistory((prev) =>
          prev.map((msg, index) =>
            index === assistantRowIndex ? { ...msg, content: "出了点小问题，你可以继续补充回答，或稍后再试一次。" } : msg
          )
        );
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
          const existing = prev.expertiseTags.split(/[,，、\n]/).map((item) => item.trim()).filter(Boolean);
          const suggestedTags = data.suggestedTags ?? [];
          const merged = Array.from(new Set([...existing, ...suggestedTags])).slice(0, 8);
          return { ...prev, expertiseTags: merged.join(", ") };
        });
      }
      if (data.knowledgeAdd?.length) {
        setKnowledgeEntries((prev) => {
          const existing = prev.map((entry) => entry.content);
          const knowledgeAdd = data.knowledgeAdd ?? [];
          const added = knowledgeAdd.filter((item: { content: string }) => item.content && !existing.includes(item.content));
          return [
            ...prev,
            ...added.map((item: { category: string; title: string; content: string; tags?: string[] }) => ({
              category: item.category || "经验",
              title: item.title,
              content: item.content,
              tags: item.tags || [],
            })),
          ];
        });
      }
      if (data.factCandidates?.length) {
        setStructuredFacts((prev) => {
          const existing = prev.map((f) => f.factKey);
          const candidates = data.factCandidates ?? [];
          const added = candidates.filter((f) => f.factKey && !existing.includes(f.factKey));
          return [...prev, ...added];
        });
      }
    } catch (err) {
      setError("网络错误，请重试");
      setExperienceHistory((prev) =>
        prev.map((msg, index) =>
          index === assistantRowIndex ? { ...msg, content: "出了点小问题，你可以继续补充回答，或稍后再试一次。" } : msg
        )
      );
    } finally {
      setExperienceLoading(false);
    }
  };

  const submitSampleQuestionsAnswer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const answer = sampleQuestionsInput.trim();
    if (!answer || sampleQuestionsDone || sampleQuestionsLoading) return;

    setSampleQuestionsInput("");
    setSampleQuestionsLoading(true);
    setError("");

    const updatedHistory = [...sampleQuestionsHistory, { role: "user" as const, content: answer }];
    const assistantRowIndex = updatedHistory.length;
    setSampleQuestionsHistory([...updatedHistory, { role: "assistant", content: "" }]);

    const replaceAssistantMessage = (text: string) => {
      setSampleQuestionsHistory((prev) =>
        prev.map((msg, index) => (index === assistantRowIndex ? { ...msg, content: text } : msg))
      );
    };

    try {
      const res = await fetch("/api/life-agents/create/next-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          basicInfo: { displayName: form.displayName, headline: form.headline, shortBio: form.shortBio },
          chatHistory: updatedHistory,
          knowledgeEntries: knowledgeEntries.map((entry) => ({
            category: entry.category,
            title: entry.title,
            content: entry.content,
          })),
          topic: "sample_questions",
        }),
      });

      const data = (await res.json()) as CreateQuestionResponse;

      if (!res.ok) {
        replaceAssistantMessage("出了点小问题，你可以继续补充回答，或稍后再试一次。");
        return;
      }

      // Check if LLM detected skip intent
      if (data.done) {
        replaceAssistantMessage("示例问题已记录完成，确认无误后可进入下一步。");
        setSampleQuestionsDone(true);
        return;
      }

      // Add question to list
      setSampleQuestionsList((prev) => [...prev, answer]);

      // Ask follow-up
      replaceAssistantMessage("还有其他问题吗？可以继续写，或者直接说'没有了'或'跳过'。");
    } catch {
      replaceAssistantMessage("出了点小问题，你可以继续补充回答，或稍后再试一次。");
    } finally {
      setSampleQuestionsLoading(false);
    }
  };

  const submitExperienceAnswer = async (e?: React.FormEvent, voiceText?: string) => {
    e?.preventDefault();
    const answer = (voiceText ?? experienceInput).trim();
    if (!answer || experienceDone || experienceLoading) return;

    setExperienceInput("");
    setExperienceLoading(true);
    setError("");

    const updatedHistory = [...experienceHistory, { role: "user" as const, content: answer }];
    const assistantRowIndex = updatedHistory.length;
    setExperienceHistory([...updatedHistory, { role: "assistant", content: "" }]);

    const replaceAssistantMessage = (text: string) => {
      setExperienceHistory((prev) =>
        prev.map((msg, index) => (index === assistantRowIndex ? { ...msg, content: text } : msg))
      );
    };

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
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        credentials: "include",
        body: JSON.stringify({
          basicInfo: { displayName: form.displayName, headline: form.headline, shortBio: form.shortBio },
          chatHistory: updatedHistory,
          knowledgeEntries: updatedEntries.map((entry) => ({
            category: entry.category,
            title: entry.title,
            content: entry.content,
          })),
          topic: selectedTopic ?? "experience",
        }),
      });
      const data = isEventStreamResponse(res)
        ? await readEventStreamPayload<CreateQuestionResponse>(res, (chunk) => {
            setExperienceHistory((prev) =>
              prev.map((msg, index) =>
                index === assistantRowIndex ? { ...msg, content: msg.content + chunk } : msg
              )
            );
          })
        : ((await res.json()) as CreateQuestionResponse);

      if (!res.ok) {
        setError(data.detail || "生成下一问失败，请重试");
        replaceAssistantMessage("出了点小问题，你可以继续补充回答，或稍后再试一次。");
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
          const existing = prev.expertiseTags.split(/[,，、\n]/).map((item) => item.trim()).filter(Boolean);
          const suggestedTags = data.suggestedTags ?? [];
          const merged = Array.from(new Set([...existing, ...suggestedTags])).slice(0, 8);
          return { ...prev, expertiseTags: merged.join(", ") };
        });
      }
      if (data.knowledgeAdd?.length) {
        setKnowledgeEntries((prev) => {
          const existing = prev.map((entry) => entry.content);
          const knowledgeAdd = data.knowledgeAdd ?? [];
          const added = knowledgeAdd.filter((item: { content: string }) => item.content && !existing.includes(item.content));
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
      if (data.factCandidates?.length) {
        setStructuredFacts((prev) => {
          const existing = new Set(prev.map((item) => `${item.factKey}:${item.factValue}`));
          const next = [...prev];
          for (const item of data.factCandidates as StructuredFact[]) {
            const key = `${item.factKey}:${item.factValue}`;
            if (!item.factKey || !item.factValue || existing.has(key)) continue;
            existing.add(key);
            next.push(item);
          }
          return next;
        });
      }

      if (data.done && !isContinuingExperience) {
        replaceAssistantMessage(
          data.summaryMessage || "很好！你的经验已经记录下来，可以继续下一步设置 Agent 的回答风格。"
        );
        setExperienceDone(true);
      } else {
        replaceAssistantMessage(data.nextQuestion || "还能补充一些具体经历吗？");
      }
      if (isContinuingExperience) {
        setIsContinuingExperience(false);
      }
    } catch {
      setError("网络错误，请重试");
      replaceAssistantMessage("出了点小问题，你可以继续补充回答，或稍后再试一次。");
    } finally {
      setExperienceLoading(false);
    }
  };

  const submitChatAnswer = async (e?: React.FormEvent, voiceText?: string) => {
    e?.preventDefault();
    if (chatDone || chatLoading) return;

    const rawAnswer = (voiceText ?? chatInput).trim();

    if (!rawAnswer) {
      setError("请输入内容，或回复「跳过」以略过非必填项");
      return;
    }

    const currentField = PROFILE_CHAT_FIELDS[chatFieldIndex];
    if (currentField?.required && isSkipField(rawAnswer)) {
      setError(
        currentField.key === "displayName"
          ? "Agent 名称为必填项，请填写 1 到 10 个字"
          : "首次欢迎语为必填项，请填写后再继续",
      );
      return;
    }

    setError("");
    setChatInput("");

    const nextHistory = [...chatHistory, { role: "user" as const, content: rawAnswer }];
    const assistantRowIndex = nextHistory.length;
    setChatHistory([...nextHistory, { role: "assistant", content: "" }]);
    setChatLoading(true);

    const replaceAssistantMessage = (text: string) => {
      setChatHistory((prev) =>
        prev.map((msg, index) => (index === assistantRowIndex ? { ...msg, content: text } : msg))
      );
    };

    if (currentField) {
      setChatFieldValue(currentField.key, rawAnswer);
    }

    const profilePayload = buildProfileSummaryPayload(currentField?.key, rawAnswer);

    // Move to next field
    const nextFieldIndex = chatFieldIndex + 1;
    if (nextFieldIndex < PROFILE_CHAT_FIELDS.length) {
      setChatFieldIndex(nextFieldIndex);
      replaceAssistantMessage(PROFILE_CHAT_FIELDS[nextFieldIndex].prompt);
    } else {
      if (!isFilledField(profilePayload.displayName)) {
        replaceAssistantMessage("还缺少 Agent 名称，请重新填写（1 到 10 个字）。");
        setError("Agent 名称为必填项，请填写后再继续");
        setChatLoading(false);
        return;
      }
      if (profilePayload.displayName.trim().length > 10) {
        replaceAssistantMessage("Agent 名称不能超过 10 个字，请重新填写。");
        setError("Agent 名称长度需为 1 到 10 个字");
        setChatLoading(false);
        return;
      }
      if (!isFilledField(profilePayload.welcomeMessage)) {
        replaceAssistantMessage("还缺少首次欢迎语，请重新填写。");
        setError("首次欢迎语为必填项，请填写后再继续");
        setChatLoading(false);
        return;
      }
      replaceAssistantMessage("很好！基础资料收集完成。接下来用户可能会问你什么问题？");
      setChatDone(true);
      setChatLoading(false);
      return;
    }

    setChatLoading(false);
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
    if (validEntries.length < 2) {
      setError("至少需要记录 2 条有效经验，请回到第 3 步补充");
      setLoading(false);
      return;
    }

    const expertiseTagsArr = form.expertiseTags
      .split(/[,，、\n]/)
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
      voiceSampleBase64: !voiceSkipped ? voiceSampleBase64 ?? undefined : undefined,
      knowledgeEntries: validEntries.map((e) => {
        const tags = Array.isArray(e.tags) ? e.tags.filter((t) => t && String(t).trim()) : [];
        return {
          category: e.category,
          title: e.title,
          content: e.content,
          tags: tags.length >= 1 ? tags : [e.category],
        };
      }),
      structuredFacts: structuredFacts
        .filter((item) => item.factKey && item.factValue)
        .map((item) => ({
          factKey: item.factKey,
          factValue: item.factValue,
          factType: item.factType,
          source: item.source,
          confidence: item.confidence,
          status: item.status,
        })),
      ...(coverImageUrl.trim() ? { coverImageUrl: coverImageUrl.trim() } : {}),
    };

    const res = await fetch("/api/life-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      id?: string;
      voiceCloneId?: string;
      error?: string;
      detail?: unknown;
    };
    setLoading(false);

    if (!res.ok) {
      const msg =
        data.error === "UNAUTHORIZED"
          ? "请先登录后再创建"
          : data.error === "LIFE_AGENT_LIMIT_REACHED"
            ? "每个账号目前只能创建 1 个 Agent。你已经创建过了，可以去“我的人生 Agent”继续管理。"
          : data.detail != null
            ? translateLifeAgentValidationError(String(data.detail))
            : "创建失败，请检查输入内容";
      setError(msg);
      return;
    }

    const newId = data.id;
    if (user?.id) clearLifeAgentCreateDraft(user.id);
    notifyLifeAgentOwnedChange();
    if (newId && voiceSampleBase64 && !voiceSkipped && !data.voiceCloneId) {
      try {
        sessionStorage.setItem(`la-voice-warn:${newId}`, "1");
      } catch {
        /* ignore */
      }
    }
    router.push(`/life-agents/${newId}`);
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
      <div className={`min-h-[min(100dvh,720px)] px-4 py-12 ${CHAT_PAGE_BACKGROUND_CLASSNAME}`}>
        <div className="mx-auto max-w-2xl rounded-[28px] border border-hairline/40 bg-paper/[0.985] p-10 text-center shadow-[0_8px_36px_rgba(26,23,20,0.06),0_1px_0_rgba(255,255,255,0.85)_inset] backdrop-blur-md">
          <h1 className="text-3xl font-bold text-ink">先登录，再创建你的人生 Agent</h1>
          <p className="mt-3 text-ink-500">
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
      </div>
    );
  }

  if (existingAgentCount === null) {
    return (
      <div className={`min-h-[min(100dvh,720px)] px-4 py-12 ${CHAT_PAGE_BACKGROUND_CLASSNAME}`}>
        <div className="mx-auto max-w-2xl rounded-[28px] border border-hairline/40 bg-paper/[0.985] p-10 text-center shadow-[0_8px_36px_rgba(26,23,20,0.06),0_1px_0_rgba(255,255,255,0.85)_inset] backdrop-blur-md">
          <h1 className="text-3xl font-bold text-ink">正在检查创建资格</h1>
          <p className="mt-3 text-ink-500">请稍等一下，我先确认你当前账号是否已经创建过 Agent。</p>
        </div>
      </div>
    );
  }

  if (existingAgentCount > 0) {
    return (
      <div className={`min-h-[min(100dvh,720px)] px-4 py-12 ${CHAT_PAGE_BACKGROUND_CLASSNAME}`}>
        <div className="mx-auto max-w-2xl rounded-[28px] border border-hairline/40 bg-paper/[0.985] p-10 text-center shadow-[0_8px_36px_rgba(26,23,20,0.06),0_1px_0_rgba(255,255,255,0.85)_inset] backdrop-blur-md">
          <h1 className="text-3xl font-bold text-ink">当前账号已创建过 Agent</h1>
          <p className="mt-3 text-ink-500">
            现在起每个账号最多只能创建 1 个 Agent。你已创建过 {existingAgentCount} 个，已有内容不会受影响。
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/dashboard/life-agents" className="btn-primary">
              去管理我的 Agent
            </Link>
            <Link href="/life-agents" className="btn-secondary">
              返回发现页
            </Link>
          </div>
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

  // 计算档案完成项数
  const profileCompletionCount = (() => {
    let count = 0;
    const requiredFields = [
      form.displayName,
      form.headline,
      form.shortBio,
      form.longBio,
      form.audience,
      form.welcomeMessage,
    ];
    requiredFields.forEach((field) => {
      if (field && isFilledField(field)) count++;
    });
    if (isFilledField(form.school)) count++;
    if (isFilledField(form.education)) count++;
    if (isFilledField(form.job)) count++;
    if (isFilledField(form.income)) count++;
    if (isFilledField(form.expertiseTags)) count++;
    if (isFilledField(form.personaArchetype)) count++;
    if (isFilledField(form.toneStyle)) count++;
    if (isFilledField(form.responseStyle)) count++;
    return count;
  })();

  return (
    <div
      className={
        "flex min-w-0 flex-col overflow-hidden " +
        /* 窄屏：占满视口并禁止整页滚动，避免 sticky 顶栏盖住「基础资料」等首行（main 的 padding + min-h-dvh 常会多出一点可滚动高度） */
        `max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-30 max-lg:m-0 max-lg:w-full max-lg:min-h-0 max-lg:overflow-hidden ${CHAT_PAGE_BACKGROUND_CLASSNAME} ` +
        /* 宽屏：薰衣草顶到底部留白 */
        "lg:relative lg:z-auto lg:-mt-8 lg:-mb-8 lg:min-h-[calc(100dvh-4rem)] max-lg:min-h-0"
      }
      style={isDesktop ? undefined : mobileContainerStyle}
    >
      {/* 顶替全局顶栏：窄屏随全屏容器固定；宽屏 sticky 防止长表单滚动时丢失上下文 */}
      <header className="z-40 shrink-0 border-b border-hairline/30 bg-paper/[0.91] px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-[0_4px_28px_-10px_rgba(26,23,20,0.07)] backdrop-blur-xl max-lg:relative sm:px-6 sm:pb-3 sm:pt-[max(0.75rem,env(safe-area-inset-top))] lg:sticky lg:top-0">
        <div className="mx-auto grid max-w-5xl grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 sm:grid-cols-[3rem_1fr_3rem]">
          <Link
            href="/life-agents"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-700/80 transition hover:bg-paper-50"
            aria-label="返回"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 text-center sm:flex-row sm:gap-2">
            <h1 className="text-[15px] font-semibold text-ink sm:text-base">创建 Agent</h1>
            <span className="shrink-0 rounded-full bg-gradient-to-r from-paper-100 to-paper-100 px-2.5 py-0.5 text-xs font-semibold text-ink shadow-sm ring-1 ring-hairline/40">
              {step >= 6 ? step - 1 : step}/5
            </span>
          </div>
          <span className="justify-self-end sm:w-12" aria-hidden />
        </div>
        <div className="mx-auto mt-2 max-w-5xl">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => {
              const visualStep = step >= 6 ? step - 1 : step;
              return (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all ${s <= visualStep ? "bg-gradient-to-r from-ink via-ink-400 to-oxblood shadow-[0_0_10px_rgba(122,31,31,0.25)]" : "bg-paper-100/80"}`}
                />
              );
            })}
          </div>
        </div>
      </header>

      {step === 1 && !templatePicked && draftReady && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
          <h2 className="text-lg font-bold text-ink">选一个最接近你的场景</h2>
          <p className="mt-1 text-sm text-ink-400">模板会帮你预填大部分资料，你只需补充自己的具体信息</p>
          <div className="mt-6 grid w-full max-w-md gap-3">
            {QUICK_START_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="group flex items-center gap-3 rounded-2xl bg-paper px-4 py-4 text-left shadow-sm ring-1 ring-hairline/50 transition hover:ring-hairline hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-200 text-base font-bold text-ink-600 group-hover:bg-paper-300 transition-colors">
                  {tpl.label.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{tpl.label}</p>
                  <p className="mt-0.5 text-xs text-ink-400">{tpl.desc}</p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-ink-200 group-hover:text-oxblood transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && templatePicked && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* 单行提示 */}
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-ink-400/50">
            <span>
              {!chatDone ? `基础资料 ${completedChatCount}/${PROFILE_CHAT_FIELDS.length}` : sampleQuestionsDone ? "基础资料完成" : "示例问题"}
            </span>
            <span>可回复「跳过」略过</span>
          </div>

          {/* 聊天区域 - 点击/触摸空白处收起键盘（和微信一样） */}
          <div
            className={`flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 ${CHAT_SCROLL_SURFACE_CLASSNAME}`}
            onClick={dismissKeyboard}
            onTouchStart={dismissKeyboard}
            role="presentation"
          >
            <div className={`mx-auto max-w-3xl space-y-4 ${chatDone ? (sampleQuestionsDone ? "pb-24" : "pb-4") : "pb-4"}`}>
              {/* Profile chat messages */}
              {chatHistory.map((msg, i) => (
                <div key={`profile-${i}`} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" ? (
                    <img
                      src="/life-agent-cover-presets/default-cover.png"
                      alt="AI"
                      className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-paper shadow-sm"
                    />
                  ) : null}
                  <div
                    className={getChatBubbleClassName(msg.role)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (msg.role === "user" && i > 0 && !chatDone && !msg.content.includes("你撤回了一条消息")) {
                        setShowRetractMenu({ type: 'chat', index: i });
                      }
                    }}
                  >
                    {msg.role === "assistant" && !msg.content.trim() && chatLoading ? (
                      <AgentTypingIndicator />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-300 text-xs font-bold text-ink-600 shadow-sm ring-2 ring-paper">
                      我
                    </div>
                  ) : null}
                </div>
              ))}

              {/* Sample questions chat messages */}
              {chatDone && sampleQuestionsHistory.map((msg, i) => (
                <div key={`sample-${i}`} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" ? (
                    <img
                      src="/life-agent-cover-presets/default-cover.png"
                      alt="AI"
                      className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-paper shadow-sm"
                    />
                  ) : null}
                  <div
                    className={getChatBubbleClassName(msg.role)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (msg.role === "user" && i > 0 && !sampleQuestionsDone && !msg.content.includes("你撤回了一条消息")) {
                        setShowRetractMenu({ type: 'sample', index: i });
                      }
                    }}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-300 text-xs font-bold text-ink-600 shadow-sm ring-2 ring-paper">
                      我
                    </div>
                  ) : null}
                </div>
              ))}

              {/* Summary shown when both profile chat and sample questions are done */}
              {chatDone && sampleQuestionsDone && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-2xl border border-hairline/30 bg-gradient-to-r from-paper-50/[0.92] to-paper/[0.78] px-4 py-3 text-sm text-ink-800 shadow-[0_4px_22px_rgba(26,23,20,0.05)] backdrop-blur-[2px]">
                    基础资料已整理好，下一步补充真实经历。
                  </div>
                  <div className="grid gap-3 rounded-[22px] border border-hairline/40 bg-paper/[0.98] p-4 text-sm shadow-[0_6px_30px_-12px_rgba(26,23,20,0.07)] backdrop-blur-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-ink-400/60">Agent 名称</p>
                      <p className="text-ink-600">{form.displayName || "未填写"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-400/60">一句话介绍</p>
                      <p className="text-ink-600">
                        {cleanLifeAgentIntroText(form.headline, form.displayName) || "未填写"}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-ink-400/60">擅长标签</p>
                      <p className="text-ink-600">{form.expertiseTags || "未填写"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={restartProfileChat} className="btn-secondary min-h-[44px] flex-1">
                      重新开始
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="btn-primary min-h-[44px] flex-1"
                    >
                      下一步：选择擅长领域
                    </button>
                  </div>
                </div>
              )}
              <div ref={profileChatEndRef} />
            </div>
          </div>

          {error ? (
            <div className="shrink-0 mx-3 mb-1 rounded-2xl border border-hairline/80 bg-paper-200/90 px-4 py-2 text-sm text-oxblood-700/90 sm:mx-4">
              {error}
            </div>
          ) : null}

          {/* 输入栏（与 Agent 聊天页同款） */}
          {chatDone && !sampleQuestionsDone ? (
            <div className={`shrink-0 border-t border-hairline/25 bg-paper/[0.94] px-3 pt-2 shadow-[0_-4px_28px_-8px_rgba(26,23,20,0.06)] backdrop-blur-lg sm:px-4 relative ${chatInputFooterPaddingClass(keyboardVisible)}`}>
              {draftReady && (
                <div className="absolute -top-12 right-4 z-10">
                  <button
                    type="button"
                    onClick={() => setDraftDrawerOpen(!draftDrawerOpen)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-paper-500 to-paper0 shadow-lg shadow-ink/20 transition hover:scale-105 hover:from-ink hover:to-oxblood"
                  >
                    <svg
                      className={`h-3 w-3 shrink-0 text-paper transition-transform ${draftDrawerOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="mx-auto max-w-3xl">
                <LifeAgentMessageComposer
                  formRef={profileFormRef}
                  textareaRef={profileInputRef}
                  value={sampleQuestionsInput}
                  onChange={setSampleQuestionsInput}
                  onSubmit={(e) => void submitSampleQuestionsAnswer(e)}
                  disabled={sampleQuestionsLoading}
                  placeholder={sampleQuestionsLoading ? "AI 正在整理…" : "输入一个问题，或说「没有了」结束"}
                  required={false}
                  onTextareaFocus={() => {
                    setTimeout(scrollToLastMessage, 280);
                    setTimeout(scrollToLastMessage, 520);
                  }}
                />
              </div>
            </div>
          ) : !chatDone && (
            <div className={`shrink-0 border-t border-hairline/25 bg-paper/[0.94] px-3 pt-2 shadow-[0_-4px_28px_-8px_rgba(26,23,20,0.06)] backdrop-blur-lg sm:px-4 relative ${chatInputFooterPaddingClass(keyboardVisible)}`}>
              {draftReady && (
                <div className="absolute -top-12 right-4 z-10">
                  <button
                    type="button"
                    onClick={() => setDraftDrawerOpen(!draftDrawerOpen)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-paper-500 to-paper0 shadow-lg shadow-ink/20 transition hover:scale-105 hover:from-ink hover:to-oxblood"
                  >
                    <svg
                      className={`h-3 w-3 shrink-0 text-paper transition-transform ${draftDrawerOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="mx-auto max-w-3xl">
                <LifeAgentMessageComposer
                  formRef={profileFormRef}
                  textareaRef={profileInputRef}
                  value={chatInput}
                  onChange={setChatInput}
                  onSubmit={(e) => void submitChatAnswer(e)}
                  disabled={chatLoading || chatDone}
                  placeholder={chatLoading ? "AI 正在整理资料…" : currentChatField.placeholder}
                  required={Boolean(currentChatField.required)}
                  onTextareaFocus={() => {
                    setTimeout(scrollToLastMessage, 280);
                    setTimeout(scrollToLastMessage, 520);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-paper">
          <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 text-center">
                <h2 className="text-xl font-semibold text-ink">选择你的擅长领域</h2>
                <p className="mt-2 text-sm text-ink-400">
                  选择你最熟悉、最有经验的领域，帮助用户更快找到你
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {AGENT_CATEGORIES.map((cat) => {
                  const selected = form.expertiseTags
                    .split(/[,，、\n]/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .includes(cat.label);
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => {
                        setForm((prev) => {
                          const tags = prev.expertiseTags
                            .split(/[,，、\n]/)
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const isSelected = tags.includes(cat.label);
                          if (isSelected) {
                            const newTags = tags.filter((t) => t !== cat.label);
                            return { ...prev, expertiseTags: newTags.join(", ") };
                          } else if (tags.length < 5) {
                            const newTags = [...tags, cat.label];
                            return { ...prev, expertiseTags: newTags.join(", ") };
                          }
                          return prev;
                        });
                      }}
                      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                        selected
                          ? "border-ink bg-ink text-paper shadow-sm"
                          : "border-hairline bg-paper text-ink-600 hover:border-hairline hover:bg-paper-50"
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: selected ? "#fff" : cat.color }}
                      />
                      <span className="min-w-0 truncate font-medium">{cat.label}</span>
                      {selected && (
                        <svg className="ml-auto h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error ? (
            <div className="shrink-0 mx-4 mb-2 rounded-2xl border border-hairline/80 bg-paper-200/90 px-4 py-2 text-sm text-oxblood-700/90 sm:mx-6">
              {error}
            </div>
          ) : null}

          <div className="shrink-0 border-t border-hairline/50 bg-paper px-4 py-4 pb-24 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.06)] sm:px-6 lg:pb-6">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <div className="text-sm text-ink-400">
                已选{" "}
                <span className="font-semibold text-ink">
                  {form.expertiseTags.split(/[,，、\n]/).filter(Boolean).length}
                </span>
                /5
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="btn-secondary min-h-[44px]"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="btn-primary min-h-[44px]"
                >
                  下一步：补充经验
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* 单行提示 */}
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-ink-400/50">
            <span>记忆经验 · 已记录 {experienceHistory.filter((msg) => msg.role === "user").length} 轮</span>
            <span>越具体，Agent 越像你</span>
          </div>

          {/* 聊天区域 - 点击/触摸空白处收起键盘（和微信一样） */}
          <div
            className={`flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 ${CHAT_SCROLL_SURFACE_CLASSNAME}`}
            onClick={dismissKeyboard}
            onTouchStart={dismissKeyboard}
            role="presentation"
          >
            <div className={`mx-auto max-w-3xl space-y-4 ${experienceDone ? "pb-24" : "pb-4"}`}>
              {experienceHistory.map((msg, i) => (
                <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" ? (
                    <img
                      src="/life-agent-cover-presets/default-cover.png"
                      alt="AI"
                      className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-paper shadow-sm"
                    />
                  ) : null}
                  <div
                    className={getChatBubbleClassName(msg.role)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (msg.role === "user" && i > 0 && !experienceDone && !msg.content.includes("你撤回了一条消息")) {
                        setShowRetractMenu({ type: 'experience', index: i });
                      }
                    }}
                  >
                    {msg.role === "assistant" && !msg.content.trim() && experienceLoading ? (
                      <AgentTypingIndicator />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-300 text-xs font-bold text-ink-600 shadow-sm ring-2 ring-paper">
                      我
                    </div>
                  ) : null}
                </div>
              ))}

              {/* Topic selector shown only on first message and no topic selected yet */}
              {experienceHistory.length === 1 && !selectedTopic && !experienceDone && (
                <div className="space-y-2 pt-2">
                  {EXPERIENCE_TOPICS.map((topic) => (
                    <button
                      key={topic.key}
                      type="button"
                      onClick={() => void handleTopicSelection(topic.key)}
                      disabled={experienceLoading}
                      className="group flex items-center gap-3 rounded-2xl bg-paper px-4 py-4 text-left shadow-sm ring-1 ring-hairline/50 transition hover:ring-hairline hover:shadow-md disabled:opacity-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-200 text-base font-bold text-ink-600 group-hover:bg-paper-300 transition-colors">
                        {topic.label.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink">{topic.label}</div>
                        <div className="mt-0.5 text-xs text-ink-400">{topic.description}</div>
                      </div>
                      <svg className="h-4 w-4 shrink-0 text-ink-200 group-hover:text-oxblood transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {experienceDone && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-2xl border border-hairline/30 bg-gradient-to-r from-paper-50/[0.92] to-paper/[0.78] px-4 py-3 text-sm text-ink-800 shadow-[0_4px_22px_rgba(26,23,20,0.05)] backdrop-blur-[2px]">
                    经验记录得差不多了，可以进入下一步设置回答风格。也可以继续补充更多信息～
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="btn-secondary min-h-[44px] flex-1"
                    >
                      上一步
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setExperienceDone(false);
                        setIsContinuingExperience(true);
                        setError("");
                        setExperienceLoading(true);
                        const updatedHistory = [...experienceHistory, { role: "assistant" as const, content: "" }];
                        const assistantRowIndex = updatedHistory.length - 1;
                        setExperienceHistory(updatedHistory);

                        const replaceAssistantMessage = (text: string) => {
                          setExperienceHistory((prev) =>
                            prev.map((msg, index) => (index === assistantRowIndex ? { ...msg, content: text } : msg))
                          );
                        };

                        try {
                          const res = await fetch("/api/life-agents/create/next-question", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Accept: "text/event-stream",
                            },
                            credentials: "include",
                            body: JSON.stringify({
                              basicInfo: { displayName: form.displayName, headline: form.headline, shortBio: form.shortBio },
                              chatHistory: experienceHistory,
                              knowledgeEntries: knowledgeEntries.map((entry) => ({
                                category: entry.category,
                                title: entry.title,
                                content: entry.content,
                              })),
                              topic: selectedTopic ?? "experience",
                            }),
                          });
                          const data = isEventStreamResponse(res)
                            ? await readEventStreamPayload<CreateQuestionResponse>(res, (chunk) => {
                                setExperienceHistory((prev) =>
                                  prev.map((msg, index) =>
                                    index === assistantRowIndex ? { ...msg, content: msg.content + chunk } : msg
                                  )
                                );
                              })
                            : ((await res.json()) as CreateQuestionResponse);

                          if (!res.ok) {
                            setError(data.detail || "生成下一问失败，请重试");
                            replaceAssistantMessage("出了点小问题，你可以继续补充回答，或稍后再试一次。");
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
                              const existing = prev.expertiseTags.split(/[,，、\n]/).map((item) => item.trim()).filter(Boolean);
                              const suggestedTags = data.suggestedTags ?? [];
                              const merged = Array.from(new Set([...existing, ...suggestedTags])).slice(0, 8);
                              return { ...prev, expertiseTags: merged.join(", ") };
                            });
                          }
                          if (data.knowledgeAdd?.length) {
                            setKnowledgeEntries((prev) => {
                              const existing = prev.map((entry) => entry.content);
                              const knowledgeAdd = data.knowledgeAdd ?? [];
                              const added = knowledgeAdd.filter((item: { content: string }) => item.content && !existing.includes(item.content));
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
                          if (data.factCandidates?.length) {
                            setStructuredFacts((prev) => {
                              const existing = new Set(prev.map((item) => `${item.factKey}:${item.factValue}`));
                              const next = [...prev];
                              for (const item of data.factCandidates as StructuredFact[]) {
                                const key = `${item.factKey}:${item.factValue}`;
                                if (!item.factKey || !item.factValue || existing.has(key)) continue;
                                existing.add(key);
                                next.push(item);
                              }
                              return next;
                            });
                          }

                          if (data.nextQuestion) {
                            replaceAssistantMessage(data.nextQuestion);
                          } else {
                            replaceAssistantMessage("还能补充一些具体经历吗？");
                          }
                        } catch {
                          setError("网络错误，请重试");
                          replaceAssistantMessage("出了点小问题，你可以继续补充回答，或稍后再试一次。");
                        } finally {
                          setExperienceLoading(false);
                        }
                      }}
                      className="btn-secondary min-h-[44px] flex-1"
                    >
                      继续补充
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(4)}
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
            <div className="shrink-0 mx-3 mb-1 rounded-2xl border border-hairline/80 bg-paper-200/90 px-4 py-2 text-sm text-oxblood-700/90 sm:mx-4">
              {error}
            </div>
          ) : null}

          {/* 输入栏（与 Agent 聊天页同款） */}
          {!experienceDone && selectedTopic && (
            <div className={`shrink-0 border-t border-hairline/25 bg-paper/[0.94] px-3 pt-2 shadow-[0_-4px_28px_-8px_rgba(26,23,20,0.06)] backdrop-blur-lg sm:px-4 relative ${chatInputFooterPaddingClass(keyboardVisible)}`}>
              {draftReady && (
                <div className="absolute -top-12 right-4 z-10">
                  <button
                    type="button"
                    onClick={() => setDraftDrawerOpen(!draftDrawerOpen)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-paper-500 to-paper0 shadow-lg shadow-ink/20 transition hover:scale-105 hover:from-ink hover:to-oxblood"
                  >
                    <svg
                      className={`h-3 w-3 shrink-0 text-paper transition-transform ${draftDrawerOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
              )}
              {experienceHistory.filter((m) => m.role === "user").length >= 4 && (
                <div className="mx-auto mb-2 max-w-3xl text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setExperienceDone(true);
                      setError("");
                    }}
                    className="text-sm text-ink-700/65 underline decoration-hairline/70 underline-offset-2 hover:text-ink"
                  >
                    已记录 4 轮，跳过直接进入下一步
                  </button>
                </div>
              )}
              <div className="mx-auto max-w-3xl">
                <LifeAgentMessageComposer
                  formRef={experienceFormRef}
                  textareaRef={experienceInputRef}
                  value={experienceInput}
                  onChange={setExperienceInput}
                  onSubmit={(e) => void submitExperienceAnswer(e)}
                  disabled={experienceLoading || experienceDone}
                  placeholder={experienceLoading ? "AI 正在思考下一问…" : "说出你需要分享的经验和信息"}
                  required
                  onVoiceFinal={(text) => void submitExperienceAnswer(undefined, text.trim())}
                  onTextareaFocus={() => {
                    setTimeout(scrollToLastExperienceMessage, 280);
                    setTimeout(scrollToLastExperienceMessage, 520);
                  }}
                  moreOpen={experienceMoreOpen}
                  onMoreClick={() => setExperienceMoreOpen((o) => !o)}
                  onCloseMorePanel={() => setExperienceMoreOpen(false)}
                  morePanel={
                    <div className="rounded-2xl border border-hairline/40 bg-paper/[0.98] p-2 shadow-[0_8px_36px_-10px_rgba(26,23,20,0.08)] backdrop-blur-md">
                      <Link
                        href="/life-agents"
                        className="block rounded-xl px-3 py-2.5 text-sm text-ink-600 hover:bg-paper-50/90"
                        onClick={() => setExperienceMoreOpen(false)}
                      >
                        返回发现页
                      </Link>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToStep(6);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
          <section className="border-b border-hairline/40 pb-6">
              <h2 className="text-xl font-semibold text-ink">让回答更像你本人</h2>
              <p className="mt-1 text-ink-500">
                这里决定 Agent 说话的感觉。别只填标签，还要告诉它你平时怎么开口、讨厌什么套话。
              </p>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-600">MBTI（选填）</label>
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
                  <p className="mt-1 text-xs text-ink-400">更多是气质参考，真正决定回答风格的是下面几项</p>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-ink-600">你所在的地区（选填）</label>
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
                  <p className="mt-2 text-xs text-ink-400">按国家→省/州→城市→区县逐级选择</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-600">你更像哪种角色</label>
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
                  <label className="mb-2 block text-sm font-medium text-ink-600">语气</label>
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
                  <label className="mb-2 block text-sm font-medium text-ink-600">回答习惯</label>
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
                    className="flex items-center gap-2 text-sm font-medium text-ink-700/70 hover:text-ink"
                  >
                    {showAdvanced ? "▼" : "▶"} 高级选项：示范回答、禁止套话
                    {showAdvanced && <span className="text-xs font-normal text-ink-700/45">（不设置则默认无）</span>}
                  </button>
                  {showAdvanced && (
                    <div className="mt-4 space-y-4 rounded-[22px] border border-hairline/30 bg-paper/[0.97] p-4 shadow-[0_5px_28px_-10px_rgba(26,23,20,0.07)] backdrop-blur-sm">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-ink-600">你最讨厌的 AI 套话</label>
                        <textarea
                          className="input-shell min-h-16"
                          value={form.forbiddenPhrases}
                          onChange={(e) => setForm((prev) => ({ ...prev, forbiddenPhrases: e.target.value }))}
                          placeholder="每行一个，例如：希望这些对你有帮助、首先其次最后、保持积极心态"
                        />
                        <p className="mt-1 text-xs text-ink-400">这些话会尽量避免出现在最终回答里</p>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-ink-600">示范回答 1</label>
                        <textarea
                          className="input-shell min-h-24"
                          value={form.exampleReply1}
                          onChange={(e) => setForm((prev) => ({ ...prev, exampleReply1: e.target.value }))}
                          placeholder="写一段你自己平时真的会怎么回复用户的话。越像你本人越好。"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-ink-600">示范回答 2</label>
                        <textarea
                          className="input-shell min-h-24"
                          value={form.exampleReply2}
                          onChange={(e) => setForm((prev) => ({ ...prev, exampleReply2: e.target.value }))}
                          placeholder="再写一段不同场景下的回复，比如安慰、劝退、给建议。"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-ink-600">示范回答 3（选填）</label>
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
            <p className="rounded-2xl border border-hairline/80 bg-paper-200/90 px-4 py-3 text-sm text-oxblood-700/90">
              {error}
            </p>
          ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-hairline/30 bg-paper/[0.94] px-4 py-4 pb-24 shadow-[0_-5px_32px_-10px_rgba(26,23,20,0.07)] backdrop-blur-lg sm:px-6 lg:pb-6">
            <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  setError("");
                }}
                className="btn-secondary min-h-[44px]"
              >
                上一步
              </button>
              <button type="submit" className="btn-primary min-h-[44px]">
                下一步：确认发布
              </button>
            </div>
          </div>
        </form>
      )}

      {step === 6 && (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
          <section className="border-b border-hairline/40 pb-6">
            <LifeAgentCoverPicker
              accent="pastel"
              coverImageUrl={coverImageUrl}
              onChange={handleCoverImageChange}
              disabled={loading}
            />
          </section>

          {/* 原「设置收费」区块，审核期暂隐藏
          <section className="border-b border-hairline/40 pb-6">
            <h2 className="text-xl font-semibold text-ink">设置收费</h2>
            <div className="mt-5 max-w-sm">
              <label className="mb-2 block text-sm font-medium text-ink-600">每次提问价格（元）</label>
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
          */}

          <section className="border-b border-hairline/40 py-6">
            <p className="font-medium text-ink">申请官方认证</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              平台会核实你的经历真实性，认证后会显示认证标识。你可以在发布前或发布后联系官方申请。
            </p>
            <p className="mt-3 text-sm text-ink-600">
              {OFFICIAL_CONTACT.description}：{" "}
              <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="font-medium text-ink-600 underline decoration-hairline/70 underline-offset-2 hover:text-ink">
                {OFFICIAL_CONTACT.email}
              </a>
            </p>
          </section>

          <section className="border-b border-hairline/40 py-6">
            <label className="mb-2 block text-sm font-medium text-ink-600">
              有什么你不能回答或不想回答的问题？（选填）
            </label>
            <textarea
              className="input-shell min-h-20"
              value={notSuitableFor}
              onChange={(e) => setNotSuitableFor(e.target.value)}
              placeholder="例如：投资理财、医疗建议、超出我行业的问题..."
            />
            <p className="mt-1 text-xs text-ink-400">用户提问到这类问题时，AI 会明确说明无法回答</p>
          </section>

          <section className="py-6">
            <h3 className="font-medium text-ink">已记录的经验预览</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              {knowledgeEntries.slice(0, 5).map((e, i) => (
                <li key={i}>
                  {e.category} · {e.title}
                  {e.content.length > 40 ? `：${e.content.slice(0, 40)}...` : `：${e.content}`}
                </li>
              ))}
              {knowledgeEntries.length > 5 && (
                <li className="text-ink-400">... 共 {knowledgeEntries.length} 条</li>
              )}
            </ul>
            <div className="mt-5 rounded-[22px] border border-hairline/30 bg-gradient-to-br from-paper/[0.98] to-paper-50/[0.55] p-4 text-sm text-ink-500 shadow-[0_5px_26px_rgba(26,23,20,0.05)] backdrop-blur-sm">
              <p>
                <span className="font-medium text-ink-700">擅长标签：</span>
                {form.expertiseTags || "未填写"}
              </p>
              <p className="mt-2">
                <span className="font-medium text-ink-700">示例问题：</span>
                {sampleQuestionsList.length > 0 ? sampleQuestionsList.join(" / ") : "未填写"}
              </p>
            </div>
          </section>

          {error && (
            <p className="rounded-2xl border border-hairline/80 bg-paper-200/90 px-4 py-3 text-sm text-oxblood-700/90">{error}</p>
          )}
            </div>
          </div>

          <div className="shrink-0 border-t border-hairline/30 bg-paper/[0.94] px-4 py-4 pb-24 shadow-[0_-5px_32px_-10px_rgba(26,23,20,0.07)] backdrop-blur-lg sm:px-6 lg:pb-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => goToStep(4)}
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

      {/* 底部抽屉：草稿详情 */}
      {draftDrawerOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-paper/98 shadow-[0_-8px_40px_-12px_rgba(26,23,20,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-hairline/30 px-4 py-3 sm:px-6">
            <h3 className="text-base font-semibold text-ink">Agent 档案草稿</h3>
            <button
              type="button"
              onClick={() => {
                setDraftDrawerOpen(false);
                setDraftDrawerExpanded(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition hover:bg-paper-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-500">名称：</span>
                <span className="text-sm text-ink">{form.displayName || "未填写"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-500">一句话介绍：</span>
                <span className="text-sm text-ink">{form.headline || "未填写"}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-ink-500 shrink-0">人格：</span>
                <span className="text-sm text-ink">{form.personaArchetype || "未填写"}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-ink-500 shrink-0">擅长：</span>
                <span className="text-sm text-ink">{form.expertiseTags || "未填写"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-500">记忆：</span>
                <span className="text-sm text-ink">{knowledgeEntries.length} 条候选</span>
              </div>
              {draftDrawerExpanded && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-ink-500 shrink-0">简介：</span>
                    <span className="text-sm text-ink">{form.shortBio || "未填写"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-ink-500 shrink-0">详细介绍：</span>
                    <span className="text-sm text-ink">{form.longBio || "未填写"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-500">目标用户：</span>
                    <span className="text-sm text-ink">{form.audience || "未填写"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-500">欢迎语：</span>
                    <span className="text-sm text-ink">{form.welcomeMessage || "未填写"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-500">学校：</span>
                    <span className="text-sm text-ink">{form.school || "未填写"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-500">学历：</span>
                    <span className="text-sm text-ink">{form.education || "未填写"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-500">职业：</span>
                    <span className="text-sm text-ink">{form.job || "未填写"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-500">收入：</span>
                    <span className="text-sm text-ink">{form.income || "未填写"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-500">语气风格：</span>
                    <span className="text-sm text-ink">{form.toneStyle || "未填写"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-500">回复风格：</span>
                    <span className="text-sm text-ink">{form.responseStyle || "未填写"}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="border-t border-hairline/30 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-2xl gap-3">
              <button
                type="button"
                onClick={() => {
                  setDraftDrawerOpen(false);
                  setDraftDrawerExpanded(false);
                }}
                className="flex-1 rounded-xl border border-hairline/40 bg-paper px-4 py-2.5 text-sm font-medium text-ink-600 shadow-sm transition hover:bg-paper-50"
              >
                继续创建
              </button>
              <button
                type="button"
                onClick={() => setDraftDrawerExpanded(!draftDrawerExpanded)}
                className="flex-1 rounded-xl bg-gradient-to-r from-ink to-oxblood px-4 py-2.5 text-sm font-medium text-paper shadow-lg shadow-ink/15 transition hover:from-ink-700 hover:to-oxblood-700"
              >
                {draftDrawerExpanded ? "收起" : "查看全部"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retract context menu (WeChat style) */}
      {showRetractMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center"
          onClick={() => setShowRetractMenu(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-paper p-4 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-center text-sm font-semibold text-ink">撤回消息</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRetractMenu(null)}
                className="flex-1 rounded-xl bg-paper-200 px-4 py-3 text-sm font-medium text-ink-600 transition hover:bg-paper-300"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const { type, index } = showRetractMenu;
                  if (type === 'chat') {
                    setChatHistory((prev: ChatMessage[]) => {
                      const newHistory = [...prev];
                      newHistory[index] = { ...newHistory[index], content: "你撤回了一条消息" };
                      return newHistory;
                    });
                  } else if (type === 'experience') {
                    setExperienceHistory((prev: ChatMessage[]) => {
                      const newHistory = [...prev];
                      newHistory[index] = { ...newHistory[index], content: "你撤回了一条消息" };
                      return newHistory;
                    });
                  } else if (type === 'sample') {
                    setSampleQuestionsHistory((prev: ChatMessage[]) => {
                      const newHistory = [...prev];
                      newHistory[index] = { ...newHistory[index], content: "你撤回了一条消息" };
                      return newHistory;
                    });
                    setSampleQuestionsList((prev: string[]) => prev.slice(0, index));
                  }
                  setShowRetractMenu(null);
                }}
                className="flex-1 rounded-xl bg-oxblood-500 px-4 py-3 text-sm font-medium text-paper transition hover:bg-oxblood-600"
              >
                撤回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
