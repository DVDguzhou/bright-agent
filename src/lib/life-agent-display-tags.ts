import { AGENT_CATEGORIES } from "@/lib/life-agent-category";

const GENERIC_ENGLISH_TAGS = new Set([
  "Study",
  "Thesis",
  "CEO",
  "HR",
  "Web",
  "IT",
  "AI",
  "GPT",
  "LLM",
  "AGI",
  "SAT",
  "GRE",
  "CPA",
  "CFA",
  "UI",
  "UP",
]);

export function isShortLifeAgentTag(s?: string | null): s is string {
  const v = (s ?? "").trim();
  if (!v) return false;
  if (v.length > 12) return false;
  if (/[，。；：、！？,;:!?·…—\-—·"'""''()（）\s→↔]/.test(v)) return false;
  return true;
}

/** 详情页标签：允许短英文词组（含空格），仍过滤句子级文本。 */
export function isDisplayableLifeAgentTag(s?: string | null): s is string {
  const v = (s ?? "").trim();
  if (!v) return false;
  if (v.length > 20) return false;
  if (/[，。；：、！？,;:!?·…—→↔]/.test(v)) return false;
  return true;
}

function normalizeForMatch(s: string): string {
  return s.trim().toLowerCase();
}

function matchingCategoryLabels(corpus: string): Set<string> {
  const matched = new Set<string>();
  for (const cat of AGENT_CATEGORIES) {
    for (const kw of cat.kw) {
      if (corpus.includes(kw)) {
        matched.add(cat.label);
        break;
      }
    }
  }
  return matched;
}

function scoreLifeAgentDisplayTag(tag: string, corpus: string, index: number, categoryLabels: Set<string>): number {
  const trimmed = tag.trim();
  const lowerTag = normalizeForMatch(trimmed);
  const lowerCorpus = normalizeForMatch(corpus);
  let score = Math.max(0, 16 - index);

  if (lowerCorpus.includes(lowerTag)) score += 120;
  if (categoryLabels.has(trimmed)) score += 90;
  if (/^[\u4e00-\u9fff]{2,8}$/.test(trimmed)) score += 28;
  if (/^E[NSFT][NSFT][JTPI]$/i.test(trimmed)) score += 24;
  if (GENERIC_ENGLISH_TAGS.has(trimmed)) score -= 18;

  return score;
}

/** 详情页展示用：从 MBTI + 专长标签中选出最相关的前 N 个。 */
export function selectTopLifeAgentDisplayTags(args: {
  mbti?: string | null;
  expertiseTags?: string[] | null;
  headline?: string | null;
  audience?: string | null;
  shortBio?: string | null;
  sampleQuestions?: string[] | null;
  limit?: number;
}): string[] {
  const limit = args.limit ?? 5;
  const candidates = [args.mbti, ...(args.expertiseTags ?? [])]
    .filter(isDisplayableLifeAgentTag)
    .filter((tag, i, arr) => arr.indexOf(tag) === i);

  if (candidates.length <= limit) return candidates;

  const corpus = [args.headline, args.audience, args.shortBio, ...(args.sampleQuestions ?? [])]
    .filter(Boolean)
    .join(" ");
  const categoryLabels = matchingCategoryLabels(corpus);

  return [...candidates]
    .map((tag, index) => ({ tag, score: scoreLifeAgentDisplayTag(tag, corpus, index, categoryLabels) }))
    .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag, "zh-CN"))
    .slice(0, limit)
    .map(({ tag }) => tag);
}
