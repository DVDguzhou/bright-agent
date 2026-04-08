/**
 * 展示用：去掉中英文括号及其中内容，并去掉与 Agent 名称重复的「名字」片段（如导入模板里的重复称呼）。
 * 不修改服务端存储，仅在渲染前清洗。
 */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 反复剥掉最内层 () 与 （），以处理多层括号 */
export function stripParentheticalSegments(input: string): string {
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

function tidyIntroSeparators(s: string): string {
  return s
    .replace(/\s*[·•]\s*/g, " · ")
    .replace(/^\s*·\s*|\s*·\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 单行/短文本：去括号内容 + 去掉 displayName 的全部出现 + 整理分隔符。
 */
export function cleanLifeAgentIntroText(
  raw: string | null | undefined,
  displayName: string | null | undefined,
): string {
  if (raw == null || raw === "") return "";
  let s = stripParentheticalSegments(String(raw));
  const name = (displayName ?? "").trim();
  if (name.length > 0) {
    s = s.replace(new RegExp(escapeRegExp(name), "g"), "");
  }
  return tidyIntroSeparators(s);
}

/**
 * 可能含换行的简介（适合人群、欢迎语等）：逐行清洗后合并。
 */
export function cleanLifeAgentIntroMultiline(
  raw: string | null | undefined,
  displayName: string | null | undefined,
): string {
  if (raw == null || raw === "") return "";
  return String(raw)
    .split(/\n/)
    .map((line) => cleanLifeAgentIntroText(line, displayName))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
