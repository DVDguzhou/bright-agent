export type CreateRecallMessage = {
  role: "assistant" | "user";
  content: string;
  fieldKey?: string;
  sampleIndex?: number;
};

export function isRecalledMessage(content: string) {
  return String(content || "").includes("你撤回了一条消息");
}

export function countUserAnswersBefore(history: CreateRecallMessage[], endIndex: number) {
  let count = 0;
  for (let i = 0; i < endIndex; i++) {
    if (history[i]?.role === "user" && !isRecalledMessage(history[i].content)) count++;
  }
  return count;
}

export function isExperienceSkipIntent(value: string) {
  const v = String(value || "").trim();
  return /^(没有了|够了|可以了|跳过|pass|结束|下一步)$/i.test(v);
}

export function countValidKnowledgeEntries(entries: Array<{ content: string }>) {
  return entries.filter((e) => (e.content || "").trim().length >= 1).length;
}

export function canCompleteExperiencePhase(entries: Array<{ content: string }>) {
  return countValidKnowledgeEntries(entries) >= 2;
}

export type KnowledgeEntryLike = {
  content: string;
  category?: string;
  title?: string;
  tags?: string[];
};

export function mergeKnowledgeAdds(
  entries: KnowledgeEntryLike[],
  additions: KnowledgeEntryLike[] | undefined | null,
): KnowledgeEntryLike[] {
  if (!additions?.length) return entries;
  const existing = new Set(
    entries.map((e) => (e.content || "").trim()).filter((c) => c.length > 0),
  );
  const next = [...entries];
  for (const item of additions) {
    const content = (item.content || "").trim();
    if (!content || existing.has(content)) continue;
    existing.add(content);
    next.push({
      category: item.category || "经验",
      title: item.title || content.slice(0, 20),
      content,
      tags: item.tags?.length ? item.tags : [item.category || "经验"],
    });
  }
  return next;
}

export function isDefaultAvatarUrl(url?: string | null) {
  return /default-cover\.(png|svg)/i.test(String(url || ""));
}

export function confirmRecallMessage() {
  return window.confirm("撤回后需重新回答该问题，之后的内容也会一并清除。");
}
