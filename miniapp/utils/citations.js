const SUPERSCRIPT_MAP = {
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

function parseCitationSegments(content) {
  if (!content) return [{ type: "text", text: "" }];
  const parts = [];
  let i = 0;
  while (i < content.length) {
    const bracket = content.slice(i).match(/^\[(\d{1,2})\]/);
    if (bracket) {
      parts.push({ type: "cite", text: bracket[0], citeIndex: parseInt(bracket[1], 10) });
      i += bracket[0].length;
      continue;
    }
    const ch = content[i];
    if (SUPERSCRIPT_MAP[ch]) {
      parts.push({ type: "cite", text: ch, citeIndex: SUPERSCRIPT_MAP[ch] });
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < content.length) {
      const next = content[j];
      if (SUPERSCRIPT_MAP[next] || content.slice(j).startsWith("[")) break;
      j += 1;
    }
    parts.push({ type: "text", text: content.slice(i, j) });
    i = j;
  }
  return parts.length ? parts : [{ type: "text", text: content }];
}

function sourceTypeLabel(sourceType, label) {
  if (label) return label;
  const map = {
    fact: "结构化事实",
    topic: "主题摘要",
    knowledge: "本人经历",
    liveUpdate: "最近动态",
    profile: "人设资料",
  };
  return map[sourceType] || "来源";
}

function attributionHint(attribution) {
  if (attribution === "general") return "基于通识建议，非本人亲身经历";
  return "";
}

module.exports = {
  parseCitationSegments,
  sourceTypeLabel,
  attributionHint,
};
