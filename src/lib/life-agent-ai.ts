type ProfileForAi = {
  displayName: string;
  headline: string;
  audience: string;
  welcomeMessage: string;
  expertiseTags: string[];
};

type KnowledgeEntryForAi = {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
};

type ChatMessageForAi = {
  role: string;
  content: string;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      normalize(value)
        .split(/[\s,.;:!?()[\]{}"'"“”‘’、，。；：！？\-_/]+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2)
    )
  );
}

function firstSentence(value: string, maxLength = 70) {
  const trimmed = value.trim();
  const matched = trimmed.match(/.*?[。！？.!?]/);
  const sentence = matched?.[0] ?? trimmed;
  return sentence.length > maxLength ? `${sentence.slice(0, maxLength).trim()}...` : sentence;
}

function scoreEntry(message: string, entry: KnowledgeEntryForAi) {
  const normalizedMessage = normalize(message);
  const tokens = tokenize(message);
  let score = 0;

  for (const tag of entry.tags) {
    const normalizedTag = normalize(tag);
    if (normalizedTag && normalizedMessage.includes(normalizedTag)) score += 7;
  }

  if (normalizedMessage.includes(normalize(entry.title))) score += 5;
  if (normalizedMessage.includes(normalize(entry.category))) score += 3;

  for (const token of tokens) {
    if (normalize(entry.title).includes(token)) score += 3;
    if (normalize(entry.content).includes(token)) score += 2;
    if (entry.tags.some((tag) => normalize(tag).includes(token))) score += 3;
  }

  return score;
}

export function buildLifeAgentReply(args: {
  profile: ProfileForAi;
  entries: KnowledgeEntryForAi[];
  history: ChatMessageForAi[];
  message: string;
}) {
  const { profile, entries, history, message } = args;
  const ranked = [...entries]
    .map((entry) => ({ entry, score: scoreEntry(message, entry) }))
    .sort((a, b) => b.score - a.score);

  const topEntries = ranked.filter((item) => item.score > 0).slice(0, 3).map((item) => item.entry);
  const fallbackEntries = entries.slice(0, 2);
  const selectedEntries = topEntries.length > 0 ? topEntries : fallbackEntries;
  const lastUserTurn = [...history].reverse().find((item) => item.role === "user")?.content;

  const intro =
    topEntries.length > 0
      ? `结合 ${profile.displayName} 过往分享里最相关的几段经验，我建议你先把问题拆小。`
      : `${profile.displayName} 目前没有完全对应的现成经验，我先基于他的整体经历给你一个稳妥建议。`;

  const reflection = lastUserTurn && lastUserTurn !== message
    ? `你这次的问题和上一轮提到的“${firstSentence(lastUserTurn, 24)}”是连着的，所以先保持同一目标，不要一次改太多变量。`
    : `先想清楚你现在最想解决的是结果、路径，还是情绪压力，这会决定下一步动作。`;

  const bullets = selectedEntries
    .map((entry, index) => `${index + 1}. ${entry.title}：${firstSentence(entry.content, 90)}`)
    .join("\n");

  const closing = `如果你愿意，我下一轮可以继续按“现状分析 / 选项比较 / 具体行动”三步陪你往下拆。`;

  return {
    content: [
      `你好，我会尽量用 ${profile.displayName} 的经验视角来回答你。`,
      intro,
      reflection,
      `你可以重点参考这几条：\n${bullets}`,
      closing,
    ].join("\n\n"),
    references: selectedEntries.map((entry) => ({
      id: entry.id,
      category: entry.category,
      title: entry.title,
      excerpt: firstSentence(entry.content, 80),
    })),
  };
}
