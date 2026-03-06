/**
 * Demo Agent 的 invoke 端点 - 模拟小兰 AgentB
 * 买方直接 POST 到此（当 agent.baseUrl 指向此时）
 * buyandsell.md § Step 4, 5, 6
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyInvocationToken } from "@/lib/invocation";
import crypto from "crypto";

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

    const computedHash = crypto.createHash("sha256").update(JSON.stringify(input ?? {})).digest("hex");
    const expectedHash = typeof input_hash === "string" ? input_hash.replace("sha256:", "") : input_hash;
    if (expectedHash && computedHash !== expectedHash) {
      return NextResponse.json(
        { error: "input_hash_mismatch" },
        { status: 400 }
      );
    }

    const startedAt = new Date();
    const recordsTarget = (input?.scope as { records_target?: number })?.records_target ?? 30;
    const mockReport = `# Demo Agent 执行报告

## 任务
- request_id: ${request_id}
- scope: ${scope || "无"}

## 执行摘要
本报告由 Demo Agent 自动生成，模拟数据采集完成。

## 数据概览
- 采集记录数: ${recordsTarget}
- 执行时间: ${startedAt.toISOString()}
`;
    const finishedAt = new Date();
    const outputHash = crypto.createHash("sha256").update(mockReport).digest("hex");

    const agent = await prisma.agent.findUnique({ where: { id: agent_id }, select: { sellerId: true } });
    if (!agent) return NextResponse.json({ error: "AGENT_NOT_FOUND" }, { status: 500 });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";
    const demoSecret = process.env.PLATFORM_DEMO_SECRET;
    if (demoSecret) {
      const receiptRes = await fetch(`${baseUrl}/api/demo-agent/submit-receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Platform-Demo-Secret": demoSecret,
        },
        body: JSON.stringify({
          requestId: request_id,
          licenseId: license_id,
          agentId: agent_id,
          inputHash: expectedHash || computedHash,
          sellerId: agent.sellerId,
        }),
      }).catch(() => null);
      if (!receiptRes?.ok) {
        return NextResponse.json({
          request_id,
          status: "success",
          result: { report_md: mockReport },
          output_hash: outputHash,
          agent_version: "demo/1.0",
          warning: "Receipt submission failed - set PLATFORM_DEMO_SECRET in .env",
        });
      }
    }

    return NextResponse.json({
      request_id,
      status: "success",
      result: { report_md: mockReport },
      output_hash: outputHash,
      agent_version: "demo/1.0",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Execution failed", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
