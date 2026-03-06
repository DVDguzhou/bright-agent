import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: { seller: { select: { id: true, name: true, email: true } } },
  });
  if (!agent) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(agent);
}
