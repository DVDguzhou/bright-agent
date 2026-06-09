function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripParentheticalSegments(input) {
  let s = input;
  const ascii = /\([^()]*\)/g;
  const fullWidth = /\（[^（）]*\）/g;
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(ascii, "").replace(fullWidth, "");
  }
  return s;
}

function tidyIntroSeparators(s) {
  return s
    .replace(/\s*[·•]\s*/g, " · ")
    .replace(/^\s*·\s*|\s*·\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLifeAgentIntroText(raw, displayName) {
  if (raw == null || raw === "") return "";
  let s = stripParentheticalSegments(String(raw));
  const name = (displayName || "").trim();
  if (name.length > 0) {
    // 保留「我是X」「这里是X」「我叫X」等自我介绍里的名字（紧跟在 是/叫 后面的不删），
    // 只删冗余重复出现的名字，避免把欢迎语「我是鲸鱼ya在跑步。」清成「我是。」。
    s = s.replace(new RegExp("([是叫])?" + escapeRegExp(name), "g"), function (m, lead) {
      return lead ? m : "";
    });
  }
  return tidyIntroSeparators(s);
}

function cleanLifeAgentIntroMultiline(raw, displayName) {
  if (raw == null || raw === "") return "";
  return String(raw)
    .split(/\n/)
    .map((line) => cleanLifeAgentIntroText(line, displayName))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = { cleanLifeAgentIntroText, cleanLifeAgentIntroMultiline };
