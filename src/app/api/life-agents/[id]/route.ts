import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, requireAuth } from "@/lib/auth";
import { lifeAgentUpdateSchema } from "@/lib/validators";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  const profile = await prisma.lifeAgentProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      knowledgeEntries: { orderBy: { sortOrder: "asc" } },
      questionPacks: session
        ? {
            where: { buyerId: session.id, status: "paid" },
            select: { questionCount: true, questionsUsed: true },
          }
        : false,
      _count: {
        select: {
          chatSessions: true,
          questionPacks: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const remainingQuestions = Array.isArray(profile.questionPacks)
    ? profile.questionPacks.reduce((sum, item) => sum + item.questionCount - item.questionsUsed, 0)
    : 0;

  return NextResponse.json({
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
    creator: profile.user,
    knowledgeEntries: profile.knowledgeEntries,
    stats: {
      sessionCount: profile._count.chatSessions,
      soldQuestionPacks: profile._count.questionPacks,
      knowledgeCount: profile.knowledgeEntries.length,
    },
    viewerState: {
      isLoggedIn: Boolean(session),
      isOwner: session?.id === profile.userId,
      remainingQuestions,
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const data = lifeAgentUpdateSchema.parse(body);

    const profile = await prisma.lifeAgentProfile.findUnique({ where: { id } });
    if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (profile.userId !== user.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    if (data.knowledgeEntries) {
      await prisma.lifeAgentKnowledgeEntry.deleteMany({ where: { profileId: id } });
    }

    const updated = await prisma.lifeAgentProfile.update({
      where: { id },
      data: {
        ...(data.displayName != null && { displayName: data.displayName }),
        ...(data.headline != null && { headline: data.headline }),
        ...(data.shortBio != null && { shortBio: data.shortBio }),
        ...(data.longBio != null && { longBio: data.longBio }),
        ...(data.audience != null && { audience: data.audience }),
        ...(data.welcomeMessage != null && { welcomeMessage: data.welcomeMessage }),
        ...(data.pricePerQuestion != null && { pricePerQuestion: data.pricePerQuestion }),
        ...(data.published != null && { published: data.published }),
        ...(data.expertiseTags != null && { expertiseTags: data.expertiseTags }),
        ...(data.sampleQuestions != null && { sampleQuestions: data.sampleQuestions }),
        ...(data.knowledgeEntries && {
          knowledgeEntries: {
            create: data.knowledgeEntries.map((entry, index) => ({
              category: entry.category,
              title: entry.title,
              content: entry.content,
              tags: entry.tags,
              sortOrder: index,
            })),
          },
        }),
      },
      include: { knowledgeEntries: true },
    });

    return NextResponse.json(updated);
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
