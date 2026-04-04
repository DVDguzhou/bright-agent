/**
 * 创建人生 Agent 流程本地草稿（按用户 id 分 key）。
 * 不含录音 Base64，避免超出 localStorage 配额；离开页面后若停在采集音色步需重新录制。
 */
const STORAGE_PREFIX = "brightagent:life-agent-create-draft:";
export const LIFE_AGENT_CREATE_DRAFT_VERSION = 1 as const;

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

/** 与创建页 form state 字段一致；便于恢复时 merge */
export type LifeAgentCreateDraftForm = Record<string, string>;

export type LifeAgentCreateDraftV1 = {
  v: typeof LIFE_AGENT_CREATE_DRAFT_VERSION;
  savedAt: number;
  step: number;
  form: LifeAgentCreateDraftForm;
  notSuitableFor: string;
  knowledgeEntries: LifeAgentCreateDraftKnowledgeEntry[];
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
    const knowledgeEntries = Array.isArray(o.knowledgeEntries)
      ? o.knowledgeEntries.filter(isKnowledgeEntry)
      : [];

    return {
      v: LIFE_AGENT_CREATE_DRAFT_VERSION,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      step: o.step,
      form: o.form as LifeAgentCreateDraftForm,
      notSuitableFor: typeof o.notSuitableFor === "string" ? o.notSuitableFor : "",
      knowledgeEntries,
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
      voiceSkipped: Boolean(o.voiceSkipped),
      coverImageUrl: typeof o.coverImageUrl === "string" ? o.coverImageUrl : "",
    };
  } catch {
    return null;
  }
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
