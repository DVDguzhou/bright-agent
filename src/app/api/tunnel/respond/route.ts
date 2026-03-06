/**
 * 平台隧道 - 卖方客户端回传执行结果
 * POST /api/tunnel/respond
 * Body: { requestId, response }
 * Authorization: Bearer <seller API key>
 */
import { NextResponse } from "next/server";
import { respondTunnelRequest } from "@/lib/tunnel-store";
import { requireAuthOrApiKey } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAuthOrApiKey(req);

    const body = await req.json().catch(() => ({}));
    const { requestId, response } = body;
    if (!requestId) {
      return NextResponse.json({ error: "requestId required" }, { status: 400 });
    }

    const ok = respondTunnelRequest(requestId, response ?? body);
    if (!ok) {
      return NextResponse.json({ error: "request_not_found_or_expired" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Respond failed" }, { status: 500 });
  }
}
