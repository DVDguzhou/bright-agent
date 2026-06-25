/**
 * 创建人生 Agent 流程本地草稿（按用户 id 分 key）。
 * 不含录音 Base64，避免超出 localStorage 配额；离开页面后若停在采集音色步需重新录制。
 */
import { canCompleteExperiencePhase } from "@/lib/life-agent-create-recall";

const STORAGE_PREFIX = "brightagent:life-agent-create-draft:";
export const LIFE_AGENT_CREATE_DRAFT_VERSION = 1 as const;
/** 当前创建流程内部步数（展示为 5 步时 step 6 映射为 5/5） */
export const LIFE_AGENT_CREATE_STEP_SCHEMA = 6 as const;

export type LifeAgentCreateDraftChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export type LifeAgentCreateDraftKnowledgeEntry = {
  category: string;
  title: string;
  content: string;
  tags: string[];
};

export type LifeAgentCreateDraftStructuredFact = {
  factKey: string;
  factValue: string;
  factType?: string;
  source?: string;
  confidence?: string;
  status?: string;
};

/** 与创建页 form state 字段一致；便于恢复时 merge */
export type LifeAgentCreateDraftForm = Record<string, string>;

export type LifeAgentCreateDraftV1 = {
  v: typeof LIFE_AGENT_CREATE_DRAFT_VERSION;
  savedAt: number;
  step: number;
  /** 6 = 当前 6 步流程；缺省表示旧版 5 步草稿，加载时需 +1 迁移 */
  stepSchema?: number;
  form: LifeAgentCreateDraftForm;
  notSuitableFor: string;
  knowledgeEntries: LifeAgentCreateDraftKnowledgeEntry[];
  structuredFacts: LifeAgentCreateDraftStructuredFact[];
  chatHistory: LifeAgentCreateDraftChatMessage[];
  chatInput: string;
  chatDone: boolean;
  chatFieldIndex: number;
  experienceHistory: LifeAgentCreateDraftChatMessage[];
  experienceInput: string;
  experienceDone: boolean;
  showAdvanced: boolean;
  sampleQuestionsList: string[];
  sampleQuestionsDraft: string;
  sampleQuestionsHistory: LifeAgentCreateDraftChatMessage[];
  sampleQuestionsInput: string;
  sampleQuestionsDone: boolean;
  selectedTopic: string | null;
  voiceSkipped: boolean;
  coverImageUrl: string;
};

export function lifeAgentCreateDraftKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function isChatMessage(x: unknown): x is LifeAgentCreateDraftChatMessage {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (o.role === "assistant" || o.role === "user") && typeof o.content === "string";
}

function isKnowledgeEntry(x: unknown): x is LifeAgentCreateDraftKnowledgeEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.category === "string" &&
    typeof o.title === "string" &&
    typeof o.content === "string" &&
    Array.isArray(o.tags) &&
    o.tags.every((t) => typeof t === "string")
  );
}

function isStructuredFact(x: unknown): x is LifeAgentCreateDraftStructuredFact {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.factKey === "string" && typeof o.factValue === "string";
}

export function parseLifeAgentCreateDraft(raw: string): LifeAgentCreateDraftV1 | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const o = data as Record<string, unknown>;
    if (o.v !== LIFE_AGENT_CREATE_DRAFT_VERSION) return null;
    if (typeof o.step !== "number" || typeof o.form !== "object" || o.form === null) return null;

    const chatHistory = Array.isArray(o.chatHistory) ? o.chatHistory.filter(isChatMessage) : [];
    const experienceHistory = Array.isArray(o.experienceHistory)
      ? o.experienceHistory.filter(isChatMessage)
      : [];
    const sampleQuestionsHistory = Array.isArray(o.sampleQuestionsHistory)
      ? o.sampleQuestionsHistory.filter(isChatMessage)
      : [];
    const knowledgeEntries = Array.isArray(o.knowledgeEntries)
      ? o.knowledgeEntries.filter(isKnowledgeEntry)
      : [];
    const structuredFacts = Array.isArray(o.structuredFacts)
      ? o.structuredFacts.filter(isStructuredFact)
      : [];

    return {
      v: LIFE_AGENT_CREATE_DRAFT_VERSION,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      step: o.step,
      stepSchema: typeof o.stepSchema === "number" ? o.stepSchema : undefined,
      form: o.form as LifeAgentCreateDraftForm,
      notSuitableFor: typeof o.notSuitableFor === "string" ? o.notSuitableFor : "",
      knowledgeEntries,
      structuredFacts,
      chatHistory,
      chatInput: typeof o.chatInput === "string" ? o.chatInput : "",
      chatDone: Boolean(o.chatDone),
      chatFieldIndex: typeof o.chatFieldIndex === "number" ? o.chatFieldIndex : 0,
      experienceHistory,
      experienceInput: typeof o.experienceInput === "string" ? o.experienceInput : "",
      experienceDone: Boolean(o.experienceDone),
      showAdvanced: Boolean(o.showAdvanced),
      sampleQuestionsList: Array.isArray(o.sampleQuestionsList)
        ? o.sampleQuestionsList.filter((s): s is string => typeof s === "string")
        : [],
      sampleQuestionsDraft: typeof o.sampleQuestionsDraft === "string" ? o.sampleQuestionsDraft : "",
      sampleQuestionsHistory,
      sampleQuestionsInput: typeof o.sampleQuestionsInput === "string" ? o.sampleQuestionsInput : "",
      sampleQuestionsDone: Boolean(o.sampleQuestionsDone),
      selectedTopic: typeof o.selectedTopic === "string" ? o.selectedTopic : null,
      voiceSkipped: Boolean(o.voiceSkipped),
      coverImageUrl: typeof o.coverImageUrl === "string" ? o.coverImageUrl : "",
    };
  } catch {
    return null;
  }
}

export function resolveLifeAgentCreateDraftStep(draft: Pick<LifeAgentCreateDraftV1, "step" | "stepSchema">): number {
  const raw = Math.max(1, Math.floor(Number(draft.step)) || 1);
  if (draft.stepSchema === LIFE_AGENT_CREATE_STEP_SCHEMA) {
    return Math.min(LIFE_AGENT_CREATE_STEP_SCHEMA, raw);
  }
  // 旧版 5 步草稿：step≥2 时映射到新流程 +1
  const migrated = raw <= 1 ? raw : raw + 1;
  return Math.min(LIFE_AGENT_CREATE_STEP_SCHEMA, migrated);
}

const EXPERIENCE_PHASE_COMPLETE_HINT = "可以继续下一步设置 Agent 的回答风格";

function hasExperienceCompletionMessage(
  history: LifeAgentCreateDraftChatMessage[] | undefined,
): boolean {
  return (history ?? []).some(
    (m) => m.role === "assistant" && m.content.includes(EXPERIENCE_PHASE_COMPLETE_HINT),
  );
}

/** 恢复草稿时校准 step / experienceDone，并生成可读的恢复提示 */
export function resolveLifeAgentCreateDraftResume(draft: LifeAgentCreateDraftV1): {
  step: number;
  experienceDone: boolean;
  resumeHint: string;
} {
  let step = resolveLifeAgentCreateDraftStep(draft);
  const entries = draft.knowledgeEntries ?? [];
  const enoughExperience = canCompleteExperiencePhase(entries);

  let experienceDone =
    draft.experienceDone && enoughExperience;

  if (
    !experienceDone &&
    enoughExperience &&
    hasExperienceCompletionMessage(draft.experienceHistory)
  ) {
    experienceDone = true;
  }

  // 经验不足时不允许停在第 4 步及之后，回退到经验补充
  if (step >= 4 && !enoughExperience) {
    step = 3;
    experienceDone = false;
  }

  const visual = step >= 6 ? step - 1 : step;
  let suffix = "";
  if (step === 3) {
    if (experienceDone) {
      suffix = "，经验已够，可点下一步";
    } else if (enoughExperience) {
      suffix = "，可说「没有了」结束经验补充";
    } else {
      suffix = "，继续补充至少 2 条经历";
    }
  }

  return {
    step,
    experienceDone,
    resumeHint: `已恢复上次进度（${visual}/5）${suffix}`,
  };
}

export function loadLifeAgentCreateDraft(userId: string): LifeAgentCreateDraftV1 | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(lifeAgentCreateDraftKey(userId));
    if (!raw) return null;
    return parseLifeAgentCreateDraft(raw);
  } catch {
    return null;
  }
}

export function saveLifeAgentCreateDraft(userId: string, draft: LifeAgentCreateDraftV1): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(lifeAgentCreateDraftKey(userId), JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* quota / private mode */
  }
}

export function clearLifeAgentCreateDraft(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.removeItem(lifeAgentCreateDraftKey(userId));
  } catch {
    /* ignore */
  }
}
