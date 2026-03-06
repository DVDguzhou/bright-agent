/**
 * 编排 Agent - 小红的 Agent，协调调用 Web Analyzer + Report Builder
 *
 * 小红的 Agent 持有小红的 API Key，在收到任务后：
 * 1. 用小红 License 调用 Web Analyzer × N
 * 2. 用小红 License 调用 Report Builder
 * 3. 返回综合报告
 *
 * 输入: { urls: string[], topic?: "选品"|"竞品" }
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyInvocationToken } from "@/lib/invocation";
import crypto from "crypto";

const WEB_ANALYZER_AGENT = "00000000-0000-0000-0000-000000000002";
const WEB_ANALYZER_LICENSE = "00000000-0000-0000-0000-000000000002";
const REPORT_BUILDER_AGENT = "00000000-0000-0000-0000-000000000003";
const REPORT_BUILDER_LICENSE = "00000000-0000-0000-0000-000000000003";

async function issueToken(apiKey: string, licenseId: string, agentId: string, scope: string, inputHash: string) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/invocations/issue-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ licenseId, agentId, scope, inputHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Issue token failed");
  return data;
}

async function invokeAgent(
  baseUrl: string,
  requestId: string,
  licenseId: string,
  agentId: string,
  scope: string,
  input: unknown,
  inputHash: string,
  invocationToken: string
) {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id: requestId,
      license_id: licenseId,
      agent_id: agentId,
      scope,
      input,
      input_hash: inputHash,
      invocation_token: invocationToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Invoke failed");
  return data;
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

    const apiKey = process.env.ORCHESTRATOR_BUYER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "config_error", message: "ORCHESTRATOR_BUYER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const urls = input?.urls;
    const topic = input?.topic ?? "竞品";
    const urlList = Array.isArray(urls) ? urls.filter((u: unknown) => typeof u === "string" && u.startsWith("http")) : [];

    const computedHash = crypto.createHash("sha256").update(JSON.stringify(input ?? {})).digest("hex");
    const expectedHash = typeof input_hash === "string" ? input_hash.replace("sha256:", "") : input_hash;
    if (expectedHash && computedHash !== expectedHash) {
      return NextResponse.json({ error: "input_hash_mismatch" }, { status: 400 });
    }

    if (urlList.length === 0) {
      return NextResponse.json(
        { error: "input_invalid", message: "需要 input.urls 数组" },
        { status: 400 }
      );
    }

    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const analyses: Array<Record<string, unknown>> = [];
    for (const url of urlList) {
      const webInput = { url };
      const webHash = crypto.createHash("sha256").update(JSON.stringify(webInput)).digest("hex");
      const webToken = await issueToken(apiKey, WEB_ANALYZER_LICENSE, WEB_ANALYZER_AGENT, "data.fetch", webHash);
      const webResult = await invokeAgent(
        webToken.agent_base_url,
        webToken.request_id,
        WEB_ANALYZER_LICENSE,
        WEB_ANALYZER_AGENT,
        "data.fetch",
        webInput,
        webHash,
        webToken.invocation_token
      );
      const a = webResult.result?.analysis;
      analyses.push({
        url,
        title: a?.title,
        description: a?.description,
        headings: a?.headings,
        links: a?.links,
        wordCount: a?.wordCount,
      });
    }

    const reportInput = { analyses, topic };
    const reportHash = crypto.createHash("sha256").update(JSON.stringify(reportInput)).digest("hex");
    const reportToken = await issueToken(apiKey, REPORT_BUILDER_LICENSE, REPORT_BUILDER_AGENT, "content.generate", reportHash);
    const reportResult = await invokeAgent(
      reportToken.agent_base_url,
      reportToken.request_id,
      REPORT_BUILDER_LICENSE,
      REPORT_BUILDER_AGENT,
      "content.generate",
      reportInput,
      reportHash,
      reportToken.invocation_token
    );

    const report = reportResult.result?.report_md ?? "";
    const outputHash = crypto.createHash("sha256").update(report).digest("hex");

    const agent = await prisma.agent.findUnique({ where: { id: agent_id }, select: { sellerId: true } });
    if (!agent) return NextResponse.json({ error: "AGENT_NOT_FOUND" }, { status: 500 });

    const secret = process.env.PLATFORM_DEMO_SECRET;
    if (secret) {
      await fetch(`${base}/api/demo-agent/submit-receipt`, {
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
      agent_version: "orchestrator/1.0",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Execution failed", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
