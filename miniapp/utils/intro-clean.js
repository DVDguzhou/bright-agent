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
    s = s.replace(new RegExp(escapeRegExp(name), "g"), "");
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
