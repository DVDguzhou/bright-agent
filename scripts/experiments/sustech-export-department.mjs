#!/usr/bin/env node
/**
 * 从 https://sustech-application.com 的 VitePress pages.data 拉取帖子，
 * 下载非 lean 页面包中的静态 HTML 正文，写成 Markdown（frontmatter + 纯文本正文）。
 *
 * 用法:
 *   # 仅某一院系（metadata.department 精确匹配）
 *   node scripts/experiments/sustech-export-department.mjs --dept bio --out "C:/Users/Caiqing/Desktop/post"
 *
 *   # 全站「研究生项目总结」侧栏院系：凡 metadata.department 非空的 /post/ 条目（约百余篇）
 *   node scripts/experiments/sustech-export-department.mjs --all --out "C:/Users/Caiqing/Desktop/post"
 *
 * 不含：无 department 的经验贴/招聘等；个别页面为运行时渲染无静态 HTML 时仅保留 frontmatter + 原文链接。
 *
 * 遵守站点 robots/使用条款；仅作个人备份与学习用途。
 */

import fs from "node:fs";
import path from "node:path";

const BASE = "https://sustech-application.com";

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k, d) => {
    const i = a.indexOf(k);
    return i >= 0 && a[i + 1] ? a[i + 1] : d;
  };
  const all = a.includes("--all");
  return {
    all,
    dept: all ? null : get("--dept", "bio"),
    out: get("--out", path.join(process.env.USERPROFILE || "", "Desktop", "post")),
  };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "sustech-export/1.1 (personal backup)" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/** 部分帖子仅 /slug/ 或仅 /slug 其一可访问，依次尝试 */
async function fetchPostPageHtml(postPath) {
  const noTrail = String(postPath || "").replace(/\/+$/, "");
  const candidates = [postPath, `${noTrail}/`, noTrail];
  const tried = new Set();
  let lastErr = "";
  for (const p of candidates) {
    if (tried.has(p)) continue;
    tried.add(p);
    const url = `${BASE}/post/${p}`;
    const res = await fetch(url, { headers: { "User-Agent": "sustech-export/1.1 (personal backup)" } });
    if (res.ok) return { html: await res.text(), pageUrl: url };
    lastErr = `${res.status} ${url}`;
  }
  throw new Error(lastErr);
}

/** 从 pages.data.*.js 中取出 JSON.parse('...') 的单引号参数字符串并 JSON.parse */
function parsePagesDataArray(js) {
  const marker = "JSON.parse('";
  const start = js.indexOf(marker);
  if (start < 0) throw new Error("JSON.parse(' not found in pages.data");
  let i = start + marker.length;
  let jsonStr = "";
  while (i < js.length) {
    const ch = js[i];
    if (ch === "\\") {
      const next = js[i + 1];
      if (next === "'" || next === "\\") {
        jsonStr += next === "'" ? "'" : "\\";
        i += 2;
        continue;
      }
      jsonStr += ch;
      i++;
      continue;
    }
    if (ch === "'" && js[i + 1] === ")") break;
    jsonStr += ch;
    i++;
  }
  return JSON.parse(jsonStr);
}

/** 任意院系页均可拿到同一份 pages.data chunk */
async function resolvePagesDataUrl() {
  const html = await fetchText(`${BASE}/department/bio`);
  const m = html.match(/\/assets\/chunks\/pages\.data\.[^"']+\.js/);
  if (!m) throw new Error("pages.data chunk not found in HTML");
  return `${BASE}${m[0]}`;
}

function htmlToPlainText(html) {
  let t = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n");
  t = t.replace(/<li[^>]*>/gi, "\n- ");
  t = t.replace(/<[^>]+>/g, "");
  t = t.replace(/&nbsp;/g, " ");
  t = t.replace(/&lt;/g, "<");
  t = t.replace(/&gt;/g, ">");
  t = t.replace(/&amp;/g, "&");
  t = t.replace(/&quot;/g, '"');
  t = t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

/** 从帖子页 HTML 取第一个 post_*.md.*.lean.js → 换为非 lean 的 .js */
function findPostBundleUrl(html) {
  const m = html.match(/\/assets\/(post_[^"']+\.md\.[^.]+\.lean\.js)/);
  if (!m) return null;
  return `${BASE}/assets/${m[1].replace(/\.lean\.js$/i, ".js")}`;
}

/** 从打包 JS 里抽出 createStaticVNode 的 HTML（旧版单引号 s('...')，新版模板字符串 s(`...`)） */
function extractStaticHtmlFromBundle(js) {
  const tryTick = () => {
    const heads = ["`<link", "`<h1", "`<h2", "`<h3", "`<h4", "`<div", "`<p"];
    let bt = -1;
    for (const h of heads) {
      const j = js.indexOf(h);
      if (j >= 0 && (bt < 0 || j < bt)) bt = j;
    }
    if (bt < 0) return null;
    let i = bt + 1;
    let out = "";
    while (i < js.length) {
      const ch = js[i];
      if (ch === "`") break;
      if (ch === "\\" && js[i + 1] === "`") {
        out += "`";
        i += 2;
        continue;
      }
      if (ch === "$" && js[i + 1] === "{") {
        let depth = 1;
        i += 2;
        while (i < js.length && depth > 0) {
          if (js[i] === "{") depth++;
          else if (js[i] === "}") depth--;
          i++;
        }
        continue;
      }
      out += ch;
      i++;
    }
    return out || null;
  };

  const tryQuote = () => {
    const candidates = ["'<link", "'<h1", "'<h2", "'<h3", "'<h4", "'<div", "'<p"];
    let idx = -1;
    for (const c of candidates) {
      const j = js.indexOf(c);
      if (j >= 0 && (idx < 0 || j < idx)) idx = j;
    }
    if (idx < 0) return null;
    let i = idx + 1;
    let out = "";
    while (i < js.length) {
      const ch = js[i];
      if (ch === "\\") {
        const next = js[i + 1];
        if (next === "'" || next === "\\") {
          out += next === "'" ? "'" : "\\";
          i += 2;
          continue;
        }
        out += ch;
        i++;
        continue;
      }
      if (ch === "'" && (js[i + 1] === "," || js[i + 1] === ")")) break;
      out += ch;
      i++;
    }
    return out || null;
  };

  /** post/foo/index.md：静态 HTML 拆成多段字符串 '...'+s+'...'+n+'... */
  const tryConcatSegments = () => {
    const m = js.match(/=\s*\[\s*[a-z]\s*\(\s*'/);
    if (!m) return null;
    let pos = m.index + m[0].length;
    let out = "";
    while (pos < js.length) {
      const ch = js[pos];
      if (ch === "\\") {
        const next = js[pos + 1];
        if (next === "'" || next === "\\") {
          out += next === "'" ? "'" : "\\";
          pos += 2;
          continue;
        }
        out += ch;
        pos++;
        continue;
      }
      if (ch === "'") {
        const after = js.slice(pos + 1);
        const cm = after.match(/^\s*\+\s*[\w$]+\s*\+\s*'/);
        if (cm) {
          pos += 1 + cm[0].length;
          continue;
        }
        if (/^\s*[,)]/.test(after)) break;
        return null;
      }
      out += ch;
      pos++;
    }
    return out.length ? out : null;
  };

  /** 含 '<link 且带 '+var+' 的须先于 tryQuote，否则会在首个 '+ 处截断 */
  return tryTick() || tryConcatSegments() || tryQuote();
}

/** 用于请求与落盘：保留站内路径习惯（不少条目必须带尾部 / 才 200） */
function postPathFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  const m = url.match(/^\/post\/(.+)$/);
  if (!m) return "";
  return m[1].replace(/^\/+/, "");
}

/** 落盘用 slug：去掉尾部 /，子路径用 / 分隔 */
function mdRelPathFromPostPath(postPath) {
  return String(postPath || "").replace(/\/+$/, "");
}

function canonicalPostKey(url) {
  return mdRelPathFromPostPath(postPathFromUrl(url));
}

async function fetchPostHtmlBody(postPath) {
  let pageUrl;
  let html;
  try {
    const r = await fetchPostPageHtml(postPath);
    pageUrl = r.pageUrl;
    html = r.html;
  } catch (e) {
    return { error: String(e.message || e), pageUrl: `${BASE}/post/${postPath}` };
  }
  const bundleUrl = findPostBundleUrl(html);
  if (!bundleUrl) return { error: "no bundle", pageUrl };
  const js = await fetchText(bundleUrl);
  const rawHtml = extractStaticHtmlFromBundle(js);
  if (!rawHtml) return { error: "no static html in bundle", pageUrl, bundleUrl };
  return { pageUrl, bundleUrl, plain: htmlToPlainText(rawHtml) };
}

function frontmatter(meta) {
  const lines = ["---"];
  if (meta.title) lines.push(`title: ${JSON.stringify(meta.title)}`);
  if (meta.date) lines.push(`date: ${JSON.stringify(meta.date)}`);
  if (meta.metadata) {
    const m = meta.metadata;
    if (m.year != null) lines.push(`year: ${m.year}`);
    if (m.type) lines.push(`type: ${JSON.stringify(m.type)}`);
    if (m.region) lines.push(`region: ${JSON.stringify(m.region)}`);
    if (m.department) lines.push(`department: ${JSON.stringify(m.department)}`);
    if (m.author) lines.push(`author: ${JSON.stringify(m.author)}`);
  }
  lines.push(`source: ${JSON.stringify(meta.url ? `${BASE}${meta.url}` : "")}`);
  lines.push("---", "");
  return lines.join("\n");
}

function mdFilePath(outDir, mdRel) {
  const safe = mdRel.split("/").filter(Boolean);
  if (safe.length === 0) return null;
  const dir = path.join(outDir, ...safe.slice(0, -1));
  const base = safe[safe.length - 1];
  return { dir, file: path.join(dir, `${base}.md`) };
}

function isDepartmentPost(p) {
  if (!p?.url || !String(p.url).startsWith("/post/")) return false;
  const d = p.metadata?.department;
  if (typeof d !== "string" || !d.trim()) return false;
  const pp = postPathFromUrl(p.url);
  const mdRel = mdRelPathFromPostPath(pp);
  if (!mdRel || mdRel.includes("[")) return false;
  return true;
}

async function main() {
  const { all, dept, out } = parseArgs();
  const outDir = path.resolve(out);
  fs.mkdirSync(outDir, { recursive: true });

  const dataUrl = await resolvePagesDataUrl();
  const dataJs = await fetchText(dataUrl);
  const rawList = parsePagesDataArray(dataJs);

  let posts = rawList.filter(isDepartmentPost);
  if (!all) {
    posts = posts.filter((p) => String(p.metadata.department).toLowerCase() === String(dept).toLowerCase());
  }

  const seen = new Set();
  posts = posts.filter((p) => {
    const key = canonicalPostKey(p.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  posts.sort((a, b) => canonicalPostKey(a.url).localeCompare(canonicalPostKey(b.url)));

  const byDept = {};
  for (const p of posts) {
    const d = p.metadata.department;
    byDept[d] = (byDept[d] || 0) + 1;
  }

  const index = {
    exportedAt: new Date().toISOString(),
    base: BASE,
    mode: all ? "all-departments" : `department:${dept}`,
    pagesData: dataUrl,
    totalPosts: posts.length,
    byDepartment: byDept,
    failed: [],
    items: [],
  };

  console.log(`Export ${index.mode}: ${posts.length} posts, departments:`, Object.keys(byDept).sort().join(", "));

  let n = 0;
  for (const p of posts) {
    n++;
    const postPath = postPathFromUrl(p.url);
    const mdRel = mdRelPathFromPostPath(postPath);
    const paths = mdFilePath(outDir, mdRel);
    if (!paths) continue;

    const item = {
      relPath: mdRel,
      title: p.title || null,
      url: `${BASE}${p.url}`,
      metadata: p.metadata || {},
    };

    try {
      const body = await fetchPostHtmlBody(postPath);
      item.fetch = body.error
        ? { ok: false, ...body }
        : { ok: true, pageUrl: body.pageUrl, bundleUrl: body.bundleUrl };
      if (!body.error && !body.plain) item.fetch.ok = false;

      const md =
        frontmatter({ title: p.title, date: p.metadata?.date, metadata: p.metadata, url: p.url }) +
        (body.plain || (body.error ? `_（正文拉取失败：${body.error}）_\n` : ""));

      fs.mkdirSync(paths.dir, { recursive: true });
      fs.writeFileSync(paths.file, md, "utf8");
      const tag = body.error ? "WARN" : "OK";
      console.log(`[${n}/${posts.length}] ${tag}`, mdRel);
      if (body.error) index.failed.push({ rel: mdRel, ...item.fetch });
    } catch (e) {
      item.fetch = { ok: false, error: String(e.message || e) };
      index.failed.push({ rel: mdRel, error: item.fetch.error });
      const md =
        frontmatter({ title: p.title, date: p.metadata?.date, metadata: p.metadata, url: p.url }) +
        `_（导出失败：${e.message || e}）_\n`;
      fs.mkdirSync(paths.dir, { recursive: true });
      fs.writeFileSync(paths.file, md, "utf8");
      console.warn(`[${n}/${posts.length}] FAIL`, mdRel, e.message);
    }

    index.items.push(item);
    await new Promise((r) => setTimeout(r, 100));
  }

  const indexName = all ? "all-departments-index.json" : `department-${dept}-index.json`;
  fs.writeFileSync(path.join(outDir, indexName), JSON.stringify(index, null, 2), "utf8");
  console.log("Wrote", path.join(outDir, indexName), "failed:", index.failed.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
