import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthOrApiKey } from "@/lib/auth";
import { disputeCreateSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const user = await requireAuthOrApiKey(req);
    const body = await req.json();
    const data = disputeCreateSchema.parse(body);

    const license = await prisma.license.findUnique({
      where: { id: data.licenseId },
      include: { invocationRequests: { where: { id: data.invocationReqId } } },
    });
    if (!license) return NextResponse.json({ error: "LICENSE_NOT_FOUND" }, { status: 404 });
    if (license.buyerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN", message: "Only license buyer can create dispute" }, { status: 403 });
    }

    const reqRecord = license.invocationRequests[0];
    if (!reqRecord) return NextResponse.json({ error: "INVOCATION_REQUEST_NOT_FOUND" }, { status: 404 });

    const dispute = await prisma.dispute.create({
      data: {
        licenseId: data.licenseId,
        invocationReqId: data.invocationReqId,
        receiptId: data.receiptId ?? undefined,
        buyerId: user.id,
        sellerId: license.sellerId,
        reason: data.reason,
        evidenceRefs: data.evidenceRefs ? data.evidenceRefs : undefined,
      },
    });
    return NextResponse.json(dispute);
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
