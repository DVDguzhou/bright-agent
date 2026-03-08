import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const profiles = await prisma.lifeAgentProfile.findMany({
      where: { userId: user.id },
      include: {
        knowledgeEntries: { select: { id: true } },
        _count: {
          select: {
            chatSessions: true,
            questionPacks: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const withStats = await Promise.all(
      profiles.map(async (p) => {
        const revenue = await prisma.lifeAgentQuestionPack.aggregate({
          where: { profileId: p.id, status: "paid" },
          _sum: { amountPaid: true },
        });
        return {
          id: p.id,
          displayName: p.displayName,
          headline: p.headline,
          shortBio: p.shortBio,
          pricePerQuestion: p.pricePerQuestion,
          published: p.published,
          knowledgeCount: p.knowledgeEntries.length,
          sessionCount: p._count.chatSessions,
          soldPacks: p._count.questionPacks,
          totalRevenue: revenue._sum.amountPaid ?? 0,
        };
      })
    );

    return NextResponse.json(withStats);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
