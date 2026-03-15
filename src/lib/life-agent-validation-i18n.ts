/**
 * 将 Go validator 返回的英文错误信息转换为中文，并引导用户到具体位置修正。
 * Go validator 格式示例：
 *   Key: 'DisplayName' Error:Field validation for 'DisplayName' failed on the 'min' tag
 */

const FIELD_MAP: Record<string, { label: string; step: number; section: string }> = {
  DisplayName: { label: "Agent 名称", step: 1, section: "基本展示信息" },
  Headline: { label: "一句话介绍", step: 1, section: "基本展示信息" },
  ShortBio: { label: "简短介绍", step: 1, section: "基本展示信息" },
  LongBio: { label: "详细背景", step: 1, section: "基本展示信息" },
  Audience: { label: "适合帮助的人群", step: 1, section: "基本展示信息" },
  WelcomeMessage: { label: "首次欢迎语", step: 1, section: "基本展示信息" },
  PersonaArchetype: { label: "你更像哪种角色", step: 1, section: "基本展示信息" },
  ToneStyle: { label: "语气", step: 1, section: "基本展示信息" },
  ResponseStyle: { label: "回答习惯", step: 1, section: "基本展示信息" },
  ExpertiseTags: { label: "擅长标签", step: 1, section: "基本展示信息" },
  SampleQuestions: { label: "示例问题", step: 1, section: "基本展示信息" },
  KnowledgeEntries: { label: "经验对话", step: 2, section: "逐步丰富你的经验" },
};

const TAG_MAP: Record<string, string> = {
  min: "长度不足",
  max: "超出限制",
  required: "必填项未填写",
  len: "长度不符合要求",
};

function parseFieldName(key: string): string {
  const match = key.match(/^(\w+)(?:\[\d+\])?$/);
  return match ? match[1] : key;
}

export function translateLifeAgentValidationError(detail: string): string {
  if (!detail || typeof detail !== "string") return "请检查输入内容";
  const lines = detail.split(/Key:/).filter(Boolean);
  const messages: string[] = [];
  const seenSteps = new Set<number>();

  for (const line of lines) {
    const trimmed = line.trim();
    const keyMatch = trimmed.match(/'([^']+)'\s+Error:.*?'([^']+)'\s+tag/);
    if (!keyMatch) continue;
    const rawKey = keyMatch[1];
    const tag = keyMatch[2];
    const fieldKey = parseFieldName(rawKey);
    const meta = FIELD_MAP[fieldKey];
    const tagDesc = TAG_MAP[tag] ?? tag;

    if (meta) {
      const stepHint = `请回到第 ${meta.step} 步「${meta.section}」`;
      let msg = `${meta.label}${tagDesc}`;
      if (fieldKey === "SampleQuestions" || rawKey.startsWith("SampleQuestions")) {
        msg = "示例问题至少需要 2 个，且每条至少 3 个字符";
      } else if (fieldKey === "KnowledgeEntries") {
        msg = "至少需要完成 2 轮与 AI 的对话，记录你的经验";
      }
      messages.push(`${msg}，${stepHint}中修正。`);
      seenSteps.add(meta.step);
    } else {
      messages.push(`${rawKey} ${tagDesc}`);
    }
  }

  const unique = Array.from(new Set(messages));
  if (unique.length === 0) return "请检查输入内容是否符合要求";
  return unique.join(" ");
}
