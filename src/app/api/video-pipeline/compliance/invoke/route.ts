/**
 * 视频流水线 - Compliance Agent（Demo 模拟）
 * 输入: { video_url } → 输出: { passed, report }
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyInvocationToken } from "@/lib/invocation";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { request_id, license_id, agent_id, scope, input, input_hash, invocation_token } = body;

    if (!request_id || !license_id || !agent_id || !invocation_token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const verify = await verifyInvocationToken(invocation_token);
    if (!verify.valid) return NextResponse.json({ error: "unauthorized", detail: verify.error }, { status: 401 });
    if (verify.requestId !== request_id || verify.licenseId !== license_id || verify.agentId !== agent_id) {
      return NextResponse.json({ error: "token_invalid" }, { status: 401 });
    }

    const computedHash = crypto.createHash("sha256").update(JSON.stringify(input ?? {})).digest("hex");
    const expectedHash = (input_hash || "").replace("sha256:", "");
    if (expectedHash && computedHash !== expectedHash) {
      return NextResponse.json({ error: "input_hash_mismatch" }, { status: 400 });
    }

    const video_url = input?.video_url || "";
    const report = `# 合规检查报告

- 视频 URL: ${video_url}
- 版权检测: ✅ 通过
- 违禁词扫描: ✅ 无
- 水印检测: ✅ 已添加
- 结论: **通过**`;
    const passed = true;

    const result = { passed, report };
    const resultJson = JSON.stringify(result);
    const outputHash = crypto.createHash("sha256").update(resultJson).digest("hex");
    const agent = await prisma.agent.findUnique({ where: { id: agent_id }, select: { sellerId: true } });
    if (!agent) return NextResponse.json({ error: "AGENT_NOT_FOUND" }, { status: 500 });

    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const secret = process.env.PLATFORM_DEMO_SECRET;
    if (secret) {
      await fetch(`${base}/api/demo-agent/submit-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Platform-Demo-Secret": secret },
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
      result,
      output_hash: outputHash,
    });
  } catch (e) {
    return NextResponse.json({ error: "Execution failed", detail: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
