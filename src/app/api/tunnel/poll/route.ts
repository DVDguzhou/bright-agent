/**
 * 平台隧道 - 卖方客户端轮询获取待处理请求
 * GET /api/tunnel/poll?agentId=xxx
 * Authorization: Bearer <seller API key>
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthOrApiKey } from "@/lib/auth";
import { pollTunnelRequest } from "@/lib/tunnel-store";

export async function GET(req: Request) {
  try {
    const user = await requireAuthOrApiKey(req);
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) return NextResponse.json({ error: "AGENT_NOT_FOUND" }, { status: 404 });
    if (agent.sellerId !== user.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    if (!agent.useTunnel) return NextResponse.json({ error: "Agent does not use tunnel" }, { status: 400 });

    const item = pollTunnelRequest(agentId);
    if (!item) {
      return NextResponse.json({ pending: false }, { status: 200 });
    }
    return NextResponse.json({
      pending: true,
      requestId: item.requestId,
      body: item.body,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Poll failed" }, { status: 500 });
  }
}
