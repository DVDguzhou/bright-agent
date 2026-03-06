/**
 * Demo Agent 内部使用 - 提交执行回执
 * 由 /api/demo-agent/invoke 调用，使用 PLATFORM_DEMO_SECRET 鉴权
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { reconcileReceipt } from "@/lib/receipt";

export async function POST(req: Request) {
  const secret = req.headers.get("x-platform-demo-secret");
  if (secret !== process.env.PLATFORM_DEMO_SECRET) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { requestId, licenseId, agentId, inputHash, sellerId } = body;
    if (!requestId || !licenseId || !agentId || !inputHash || !sellerId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await reconcileReceipt(requestId, licenseId, agentId, inputHash, sellerId);
    if (!result.valid) {
      return NextResponse.json({ error: "RECONCILIATION_FAILED", reason: result.reason }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
