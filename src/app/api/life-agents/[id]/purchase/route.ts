import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { lifeAgentPurchaseSchema } from "@/lib/validators";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const data = lifeAgentPurchaseSchema.parse(body);

    const profile = await prisma.lifeAgentProfile.findUnique({ where: { id } });
    if (!profile || !profile.published) {
      return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
    }

    const expectedAmount = profile.pricePerQuestion * data.questionCount;
    if (data.amountPaid < expectedAmount) {
      return NextResponse.json({ error: "INSUFFICIENT_PAYMENT" }, { status: 400 });
    }

    const pack = await prisma.lifeAgentQuestionPack.create({
      data: {
        profileId: profile.id,
        buyerId: user.id,
        questionCount: data.questionCount,
        amountPaid: data.amountPaid,
        status: "paid",
      },
    });

    const remainingQuestions = await prisma.lifeAgentQuestionPack.aggregate({
      where: {
        profileId: profile.id,
        buyerId: user.id,
        status: "paid",
      },
      _sum: {
        questionCount: true,
        questionsUsed: true,
      },
    });

    return NextResponse.json({
      packId: pack.id,
      remainingQuestions:
        (remainingQuestions._sum.questionCount ?? 0) - (remainingQuestions._sum.questionsUsed ?? 0),
    });
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
