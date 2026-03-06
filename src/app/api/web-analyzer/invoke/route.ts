/**
 * Web 页面分析 Agent - 真实抓取并分析网页
 * 输入: { url: "https://example.com" }
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyInvocationToken } from "@/lib/invocation";
import crypto from "crypto";

function extractText(html: string, regex: RegExp, maxItems = 20): string[] {
  const matches = html.matchAll(regex);
  const results: string[] = [];
  for (const m of matches) {
    if (results.length >= maxItems) break;
    const text = (m[1] || m[0])
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (text && text.length < 500) results.push(text);
  }
  return results;
}

async function analyzeUrl(url: string): Promise<{
  ok: boolean;
  error?: string;
  title?: string;
  description?: string;
  headings?: string[];
  links?: string[];
  wordCount?: number;
  htmlLength?: number;
}> {
  try {
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { ok: false, error: "只支持 http/https" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WebAnalyzer/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    const htmlLength = html.length;

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 200) : undefined;

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim().slice(0, 500) : undefined;

    const headings = extractText(html, /<h[123][^>]*>([\s\S]*?)<\/h[123]>/gi, 15);
    const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi);
    const links: string[] = [];
    for (const m of linkMatches) {
      if (links.length >= 30) break;
      const href = m[1].trim();
      if (href.startsWith("http") && !links.includes(href)) links.push(href);
    }

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyText = (bodyMatch ? bodyMatch[1] : html).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ");
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    return { ok: true, title, description, headings, links, wordCount, htmlLength };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("abort")) return { ok: false, error: "请求超时" };
    return { ok: false, error: msg.slice(0, 100) };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      request_id,
      license_id,
      agent_id,
      scope,
      input,
      input_hash,
      invocation_token,
    } = body;

    if (!request_id || !license_id || !agent_id || !invocation_token) {
      return NextResponse.json(
        { error: "Missing request_id, license_id, agent_id or invocation_token" },
        { status: 400 }
      );
    }

    const verify = await verifyInvocationToken(invocation_token);
    if (!verify.valid) {
      return NextResponse.json(
        { error: "unauthorized", detail: verify.error },
        { status: 401 }
      );
    }
    if (verify.requestId !== request_id || verify.licenseId !== license_id || verify.agentId !== agent_id) {
      return NextResponse.json(
        { error: "token_invalid", message: "Token does not match request" },
        { status: 401 }
      );
    }

    const url = typeof input?.url === "string" ? input.url.trim() : "";
    if (!url) {
      return NextResponse.json(
        { error: "input_invalid", message: "需要 input.url" },
        { status: 400 }
      );
    }

    const computedHash = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const expectedHash = typeof input_hash === "string" ? input_hash.replace("sha256:", "") : input_hash;
    if (expectedHash && computedHash !== expectedHash) {
      return NextResponse.json({ error: "input_hash_mismatch" }, { status: 400 });
    }

    const startedAt = new Date();
    const analysis = await analyzeUrl(url);
    const finishedAt = new Date();

    let report: string;
    if (!analysis.ok) {
      report = `# Web 页面分析报告\n\n## 任务\n- URL: ${url}\n- 状态: 失败\n- 原因: ${analysis.error}\n`;
    } else {
      report = `# Web 页面分析报告

## URL
${url}

## 执行时间
${startedAt.toISOString()} → ${finishedAt.toISOString()}

## 分析结果

### 标题
${analysis.title || "(未找到)"}

### 描述 (meta description)
${analysis.description || "(未找到)"}

### 字数统计
- 正文约 ${analysis.wordCount?.toLocaleString() ?? 0} 词
- 原始 HTML ${analysis.htmlLength?.toLocaleString() ?? 0} 字节

### 标题结构 (H1-H3，前15个)
${(analysis.headings?.length ? analysis.headings.map((h, i) => `${i + 1}. ${h}`).join("\n") : "(无)")}

### 外链 (前30个)
${(analysis.links?.length ? analysis.links.slice(0, 30).map((l) => `- ${l}`).join("\n") : "(无)")}
`;
    }

    const outputHash = crypto.createHash("sha256").update(report).digest("hex");

    const agent = await prisma.agent.findUnique({ where: { id: agent_id }, select: { sellerId: true } });
    if (!agent) return NextResponse.json({ error: "AGENT_NOT_FOUND" }, { status: 500 });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const secret = process.env.PLATFORM_DEMO_SECRET;
    if (secret) {
      await fetch(`${baseUrl}/api/demo-agent/submit-receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Platform-Demo-Secret": secret,
        },
        body: JSON.stringify({
          requestId: request_id,
          licenseId: license_id,
          agentId: agent_id,
          inputHash: expectedHash || computedHash,
          sellerId: agent.sellerId,
        }),
      }).catch(() => null);
    }

    return NextResponse.json({
      request_id,
      status: analysis.ok ? "success" : "partial",
      result: { report_md: report, ...(analysis.ok && { analysis }) },
      output_hash: outputHash,
      agent_version: "web-analyzer/1.0",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Execution failed", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
