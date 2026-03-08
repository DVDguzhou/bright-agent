import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { lifeAgentChatSchema } from "@/lib/validators";
import { buildLifeAgentReply } from "@/lib/life-agent-ai";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const data = lifeAgentChatSchema.parse(body);

    const profile = await prisma.lifeAgentProfile.findUnique({
      where: { id },
      include: {
        knowledgeEntries: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!profile || !profile.published) {
      return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
    }

    const packs = await prisma.lifeAgentQuestionPack.findMany({
      where: {
        profileId: id,
        buyerId: user.id,
        status: "paid",
      },
      orderBy: { createdAt: "asc" },
    });

    const remainingQuestions = packs.reduce(
      (sum, item) => sum + item.questionCount - item.questionsUsed,
      0
    );

    if (remainingQuestions <= 0) {
      return NextResponse.json({ error: "NO_QUESTIONS_LEFT" }, { status: 402 });
    }

    let sessionId = data.sessionId;
    if (sessionId) {
      const existingSession = await prisma.lifeAgentChatSession.findFirst({
        where: { id: sessionId, profileId: id, buyerId: user.id },
      });
      if (!existingSession) {
        return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
      }
    } else {
      const newSession = await prisma.lifeAgentChatSession.create({
        data: {
          profileId: id,
          buyerId: user.id,
          title: data.message.slice(0, 40),
        },
      });
      sessionId = newSession.id;
    }

    const history = await prisma.lifeAgentChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 12,
    });

    const reply = buildLifeAgentReply({
      profile: {
        displayName: profile.displayName,
        headline: profile.headline,
        audience: profile.audience,
        welcomeMessage: profile.welcomeMessage,
        expertiseTags: profile.expertiseTags,
      },
      entries: profile.knowledgeEntries,
      history,
      message: data.message,
    });

    const packToConsume = packs.find((item) => item.questionsUsed < item.questionCount);
    if (!packToConsume) {
      return NextResponse.json({ error: "NO_QUESTIONS_LEFT" }, { status: 402 });
    }

    await prisma.$transaction([
      prisma.lifeAgentChatMessage.create({
        data: {
          sessionId,
          role: "user",
          content: data.message,
        },
      }),
      prisma.lifeAgentChatMessage.create({
        data: {
          sessionId,
          role: "assistant",
          content: reply.content,
          refs: reply.references,
        },
      }),
      prisma.lifeAgentQuestionPack.update({
        where: { id: packToConsume.id },
        data: { questionsUsed: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      sessionId,
      reply: reply.content,
      references: reply.references,
      remainingQuestions: remainingQuestions - 1,
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
