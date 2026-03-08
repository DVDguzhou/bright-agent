/**
 * 报告合成 Agent - 将多个分析结果整合为结构化报告
 * 输入: { analyses: [...], topic?: "选品" | "竞品" | "通用" }
 * 典型场景：Web Analyzer 分析多个 URL 后，本 Agent 生成综合报告
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyInvocationToken } from "@/lib/invocation";
import crypto from "crypto";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function buildReport(analyses: unknown[], topic: string): string {
  const items = Array.isArray(analyses) ? analyses : [];
  const topicLabel = { 选品: "选品", 竞品: "竞品分析", 通用: "综合调研" }[topic] || "综合调研";

  let report = `# ${topicLabel} 报告\n\n`;
  report += `生成时间: ${new Date().toISOString()}\n\n`;
  report += `## 数据来源\n共 ${items.length} 个页面/来源\n\n`;

  items.forEach((item, i: number) => {
    const a = toRecord(item);
    const url = a.url ?? a.source ?? `来源 ${i + 1}`;
    report += `### ${i + 1}. ${typeof url === "string" ? url : "未知"}\n`;
    if (a.title) report += `- **标题**: ${a.title}\n`;
    if (a.description) report += `- **描述**: ${String(a.description).slice(0, 300)}${String(a.description).length > 300 ? "..." : ""}\n`;
    if (a.wordCount) report += `- **字数**: ${a.wordCount}\n`;
    if (Array.isArray(a.headings) && a.headings.length > 0) {
      report += `- **标题结构**: ${a.headings.slice(0, 5).join(" → ")}${a.headings.length > 5 ? " ..." : ""}\n`;
    }
    if (Array.isArray(a.links) && a.links.length > 0) {
      report += `- **外链数**: ${a.links.length}\n`;
    }
    report += "\n";
  });

  report += `## 要点归纳\n`;
  const titles = items.map((item) => toRecord(item).title).filter(Boolean);
  if (titles.length > 0) {
    report += `- 涉及主题: ${titles.join("、")}\n`;
  }
  report += `- 建议结合业务场景进一步验证数据有效性\n`;
  report += `- 可基于外链与标题结构做深度爬取扩展\n\n`;

  report += `## 风险提示\n`;
  report += `- 本报告基于公开页面抓取，不代表完整商业情报\n`;
  report += `- 数据时效性取决于抓取时间\n`;

  return report;
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

    const analyses = input?.analyses;
    const topic = input?.topic ?? "通用";

    const computedHash = crypto.createHash("sha256").update(JSON.stringify(input ?? {})).digest("hex");
    const expectedHash = typeof input_hash === "string" ? input_hash.replace("sha256:", "") : input_hash;
    if (expectedHash && computedHash !== expectedHash) {
      return NextResponse.json({ error: "input_hash_mismatch" }, { status: 400 });
    }

    const report = buildReport(
      Array.isArray(analyses) ? analyses : [],
      typeof topic === "string" ? topic : "通用"
    );
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
      status: "success",
      result: { report_md: report },
      output_hash: outputHash,
      agent_version: "report-builder/1.0",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Execution failed", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
