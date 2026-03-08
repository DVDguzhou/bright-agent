import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const profile = await prisma.lifeAgentProfile.findUnique({
      where: { id },
      include: {
        knowledgeEntries: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (profile.userId !== user.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    const [questionPacks, chatSessions, revenue, counts] = await Promise.all([
      prisma.lifeAgentQuestionPack.findMany({
        where: { profileId: id },
        include: { buyer: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.lifeAgentChatSession.findMany({
        where: { profileId: id },
        include: {
          buyer: { select: { email: true, name: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.lifeAgentQuestionPack.aggregate({
        where: { profileId: id, status: "paid" },
        _sum: { amountPaid: true },
      }),
      prisma.lifeAgentProfile.findUnique({
        where: { id },
        select: {
          _count: {
            select: { questionPacks: true, chatSessions: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        headline: profile.headline,
        shortBio: profile.shortBio,
        longBio: profile.longBio,
        audience: profile.audience,
        welcomeMessage: profile.welcomeMessage,
        pricePerQuestion: profile.pricePerQuestion,
        expertiseTags: profile.expertiseTags,
        sampleQuestions: profile.sampleQuestions,
        published: profile.published,
        knowledgeEntries: profile.knowledgeEntries,
      },
      stats: {
        totalRevenue: revenue._sum.amountPaid ?? 0,
        soldPacks: counts?._count.questionPacks ?? 0,
        sessionCount: counts?._count.chatSessions ?? 0,
      },
      questionPacks: questionPacks.map((p) => ({
        id: p.id,
        questionCount: p.questionCount,
        questionsUsed: p.questionsUsed,
        amountPaid: p.amountPaid,
        createdAt: p.createdAt,
        buyer: p.buyer,
      })),
      chatSessions: chatSessions.map((s) => ({
        id: s.id,
        title: s.title,
        messageCount: s._count.messages,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        buyer: s.buyer,
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
