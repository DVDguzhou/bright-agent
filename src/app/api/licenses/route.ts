import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthOrApiKey } from "@/lib/auth";
import { licenseCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const user = await requireAuthOrApiKey(req);
    const licenses = await prisma.license.findMany({
      where: { buyerId: user.id },
      include: {
        agent: { select: { id: true, name: true, baseUrl: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(licenses);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuthOrApiKey(req);
    const body = await req.json();
    const data = licenseCreateSchema.parse(body);

    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
      include: { seller: true },
    });
    if (!agent) return NextResponse.json({ error: "AGENT_NOT_FOUND" }, { status: 404 });
    if (agent.status !== "approved") return NextResponse.json({ error: "AGENT_NOT_APPROVED" }, { status: 400 });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

    const license = await prisma.license.create({
      data: {
        agentId: data.agentId,
        buyerId: user.id,
        sellerId: agent.sellerId,
        scope: data.scope ?? undefined,
        quotaTotal: data.quotaTotal,
        quotaUsed: 0,
        expiresAt,
      },
      include: {
        agent: { select: { id: true, name: true, baseUrl: true } },
      },
    });
    return NextResponse.json(license);
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
