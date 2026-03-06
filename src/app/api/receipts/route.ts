import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthOrApiKey } from "@/lib/auth";
import { receiptCreateSchema } from "@/lib/validators";
import { reconcileReceipt } from "@/lib/receipt";

/**
 * 小兰执行完成后提交执行回执
 * buyandsell.md § Step 6B, Step 7
 */
export async function POST(req: Request) {
  try {
    const user = await requireAuthOrApiKey(req);
    const body = await req.json();
    const data = receiptCreateSchema.parse(body);

    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
    });
    if (!agent) return NextResponse.json({ error: "AGENT_NOT_FOUND" }, { status: 404 });
    if (agent.sellerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN", message: "Only agent seller can submit receipt" }, { status: 403 });
    }

    const result = await reconcileReceipt(
      data.requestId,
      data.licenseId,
      data.agentId,
      data.inputHash,
      user.id
    );

    if (!result.valid) {
      return NextResponse.json({ error: "RECONCILIATION_FAILED", reason: result.reason }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Receipt accepted and quota decremented" });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (e instanceof Error && "issues" in e) {
      return NextResponse.json({ error: "VALIDATION_ERROR", details: e }, { status: 400 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
