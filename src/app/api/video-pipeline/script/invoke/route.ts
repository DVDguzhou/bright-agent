/**
 * 视频流水线 - Script Agent（Demo 模拟）
 * 输入: { brief: string } → 输出: { script: { title, scenes } }
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

    const brief = input?.brief || "未提供 brief";
    const script = {
      title: `成片：${brief.slice(0, 30)}...`,
      duration_sec: 60,
      scenes: [
        { id: 1, type: "intro", duration: 5, narration: `开场：${brief.slice(0, 50)}` },
        { id: 2, type: "main", duration: 45, narration: "主内容段落" },
        { id: 3, type: "outro", duration: 10, narration: "结尾与 CTA" },
      ],
    };

    const resultJson = JSON.stringify(script);
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
      result: { script },
      output_hash: outputHash,
    });
  } catch (e) {
    return NextResponse.json({ error: "Execution failed", detail: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
