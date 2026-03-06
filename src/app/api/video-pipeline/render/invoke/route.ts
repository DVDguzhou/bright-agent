/**
 * 视频流水线 - Render Agent（Demo 模拟重算力）
 * 输入: { script, assets } → 模拟 3 秒「集群渲染」→ 输出: { video_url }
 * 实际生产中：TB 素材 + 多 GPU 集群，调用方零配置
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyInvocationToken } from "@/lib/invocation";
import crypto from "crypto";

const MOCK_RENDER_DELAY_MS = 3000;

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

    // 模拟重算力：集群渲染延迟（实际为 TB 素材 + 多 GPU）
    await new Promise((r) => setTimeout(r, MOCK_RENDER_DELAY_MS));

    const videoId = crypto.randomBytes(8).toString("hex");
    const video_url = `https://cdn.example.com/rendered/${videoId}.mp4`;

    const resultJson = JSON.stringify({ video_url });
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
      result: { video_url, render_time_ms: MOCK_RENDER_DELAY_MS, mock: "Demo 模拟 3s 渲染" },
      output_hash: outputHash,
    });
  } catch (e) {
    return NextResponse.json({ error: "Execution failed", detail: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
