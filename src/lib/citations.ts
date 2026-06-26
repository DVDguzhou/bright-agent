export type CitationReference = {
  id: string;
  sourceType?: string;
  sourceTypeLabel?: string;
  factKey?: string;
  category?: string;
  title: string;
  excerpt: string;
  displayExcerpt?: string;
  fullContent?: string;
  citeIndex?: number | string;
  confidence?: string;
  parentId?: string;
  parentTitle?: string;
  chunkIndex?: number | string;
  charStart?: number | string;
  charEnd?: number | string;
  evidenceKind?: string;
};

export type ReplyAttribution = "grounded" | "general" | "fallback" | "";

const SUPERSCRIPT_MAP: Record<string, number> = {
  "¹": 1,
  "²": 2,
  "³": 3,
  "⁴": 4,
  "⁵": 5,
  "⁶": 6,
  "⁷": 7,
  "⁸": 8,
  "⁹": 9,
};

export function parseCiteIndex(value: number | string | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export type CitationContentPart =
  | { type: "text"; value: string }
  | { type: "cite"; value: string; citeIndex: number };

export function splitCitationContent(content: string): CitationContentPart[] {
  if (!content) return [];
  const parts: CitationContentPart[] = [];
  let i = 0;
  while (i < content.length) {
    const ch = content[i];
    const bracket = content.slice(i).match(/^\[(\d{1,2})\]/);
    if (bracket) {
      parts.push({ type: "cite", value: bracket[0], citeIndex: Number.parseInt(bracket[1], 10) });
      i += bracket[0].length;
      continue;
    }
    if (SUPERSCRIPT_MAP[ch]) {
      parts.push({ type: "cite", value: ch, citeIndex: SUPERSCRIPT_MAP[ch] });
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < content.length) {
      const next = content[j];
      if (SUPERSCRIPT_MAP[next] || content.slice(j).startsWith("[")) break;
      j += 1;
    }
    parts.push({ type: "text", value: content.slice(i, j) });
    i = j;
  }
  return parts;
}

export function sourceTypeLabel(sourceType?: string, label?: string): string {
  if (label) return label;
  switch (sourceType) {
    case "fact":
      return "确认信息";
    case "topic":
      return "经历摘要";
    case "knowledge":
      return "经历片段";
    case "liveUpdate":
      return "最近动态";
    case "profile":
      return "个人资料";
    default:
      return "来源";
  }
}

export function attributionHint(attribution?: ReplyAttribution): string | null {
  if (attribution === "general") return "基于通识建议，非本人亲身经历";
  return null;
}
