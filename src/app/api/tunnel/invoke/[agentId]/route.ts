/**
 * 平台隧道 - 买方调用入口
 * POST /api/tunnel/invoke/[agentId]
 * 买方请求到此，平台将请求转发给已连接的 tunnel client
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyInvocationToken } from "@/lib/invocation";
import { enqueueTunnelRequest } from "@/lib/tunnel-store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await req.json().catch(() => ({}));

    const { request_id, license_id, agent_id, scope, input, input_hash, invocation_token } = body;

    if (!request_id || !license_id || !agent_id || !invocation_token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (agent_id !== agentId) {
      return NextResponse.json({ error: "agent_id_mismatch" }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) return NextResponse.json({ error: "AGENT_NOT_FOUND" }, { status: 404 });
    if (!agent.useTunnel) return NextResponse.json({ error: "Agent does not use tunnel" }, { status: 400 });

    const verify = await verifyInvocationToken(invocation_token);
    if (!verify.valid) {
      return NextResponse.json({ error: "unauthorized", detail: verify.error }, { status: 401 });
    }
    if (verify.requestId !== request_id || verify.licenseId !== license_id || verify.agentId !== agent_id) {
      return NextResponse.json({ error: "token_invalid" }, { status: 401 });
    }

    const response = await Promise.race([
      enqueueTunnelRequest(agentId, request_id, body),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tunnel timeout: no client responded in 60s")), 60000)
      ),
    ]);

    return NextResponse.json(response);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    if (msg.includes("timeout") || msg.includes("request_timeout")) {
      return NextResponse.json(
        { error: "tunnel_timeout", message: "隧道客户端未响应，请确保 tunnel-client 正在运行" },
        { status: 504 }
      );
    }
    return NextResponse.json({ error: "Tunnel failed", detail: msg }, { status: 500 });
  }
}
