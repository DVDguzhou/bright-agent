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

function isDisplayableLifeAgentTag(s) {
  const v = (s || "").trim();
  if (!v || v.length > 20) return false;
  if (/[，。；：、！？,;:!?·…—→↔]/.test(v)) return false;
  return true;
}

function normalizeForMatch(s) {
  return String(s || "").trim().toLowerCase();
}

function scoreLifeAgentDisplayTag(tag, corpus, index) {
  const trimmed = String(tag || "").trim();
  const lowerTag = normalizeForMatch(trimmed);
  const lowerCorpus = normalizeForMatch(corpus);
  let score = Math.max(0, 16 - index);

  if (lowerCorpus.includes(lowerTag)) score += 120;
  if (/^[\u4e00-\u9fff]{2,8}$/.test(trimmed)) score += 28;
  if (/^E[NSFT][NSFT][JTPI]$/i.test(trimmed)) score += 24;
  if (GENERIC_ENGLISH_TAGS.has(trimmed)) score -= 18;

  return score;
}

function selectTopLifeAgentDisplayTags(args) {
  const limit = args.limit || 5;
  const candidates = [args.mbti].concat(args.expertiseTags || [])
    .filter(isDisplayableLifeAgentTag)
    .filter(function (tag, i, arr) { return arr.indexOf(tag) === i; });

  if (candidates.length <= limit) return candidates;

  const corpus = [args.headline, args.audience, args.shortBio]
    .concat(args.sampleQuestions || [])
    .filter(Boolean)
    .join(" ");

  return candidates
    .map(function (tag, index) {
      return { tag: tag, score: scoreLifeAgentDisplayTag(tag, corpus, index) };
    })
    .sort(function (a, b) {
      return b.score - a.score || String(a.tag).localeCompare(String(b.tag), "zh-CN");
    })
    .slice(0, limit)
    .map(function (item) { return item.tag; });
}

module.exports = {
  isDisplayableLifeAgentTag: isDisplayableLifeAgentTag,
  selectTopLifeAgentDisplayTags: selectTopLifeAgentDisplayTags,
};
