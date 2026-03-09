import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getSession } from "@/lib/auth";
import { agentCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const ownerMe = searchParams.get("owner") === "me";

  const where: { sellerId?: string; status?: string } = {};
  if (ownerMe) {
    try {
      const user = await requireAuth();
      where.sellerId = user.id;
    } catch {
      return NextResponse.json([], { status: 200 });
    }
  } else {
    where.status = "approved";
  }

  let agents = await prisma.agent.findMany({
    where,
    include: { seller: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (scope) {
    agents = agents.filter((a: { supportedScopes: unknown }) => {
      const scopes = Array.isArray(a.supportedScopes) ? (a.supportedScopes as string[]) : [];
      return scopes.includes(scope);
    });
  }

  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = agentCreateSchema.parse(body);

    const agent = await prisma.agent.create({
      data: {
        sellerId: user.id,
        name: data.name,
        description: data.description,
        baseUrl: data.baseUrl,
        useTunnel: data.useTunnel ?? false,
        publicKey: data.publicKey,
        supportedScopes: data.supportedScopes,
        pricingConfig: data.pricingConfig ? JSON.parse(JSON.stringify(data.pricingConfig)) : undefined,
        riskLevel: data.riskLevel ?? "low",
        status: "pending",
      },
    });
    return NextResponse.json(agent);
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
