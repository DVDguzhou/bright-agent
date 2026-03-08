import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { lifeAgentCreateSchema } from "@/lib/validators";

export async function GET() {
  const profiles = await prisma.lifeAgentProfile.findMany({
    where: { published: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
      knowledgeEntries: {
        select: { id: true },
      },
      _count: {
        select: {
          questionPacks: true,
          chatSessions: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    profiles.map((profile) => ({
      id: profile.id,
      displayName: profile.displayName,
      headline: profile.headline,
      shortBio: profile.shortBio,
      audience: profile.audience,
      welcomeMessage: profile.welcomeMessage,
      pricePerQuestion: profile.pricePerQuestion,
      expertiseTags: profile.expertiseTags,
      sampleQuestions: profile.sampleQuestions,
      creator: {
        id: profile.user.id,
        name: profile.user.name,
        email: profile.user.email,
      },
      knowledgeCount: profile.knowledgeEntries.length,
      soldQuestionPacks: profile._count.questionPacks,
      sessionCount: profile._count.chatSessions,
    }))
  );
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = lifeAgentCreateSchema.parse(body);

    const profile = await prisma.lifeAgentProfile.create({
      data: {
        userId: user.id,
        displayName: data.displayName,
        headline: data.headline,
        shortBio: data.shortBio,
        longBio: data.longBio,
        audience: data.audience,
        welcomeMessage: data.welcomeMessage,
        pricePerQuestion: data.pricePerQuestion,
        expertiseTags: data.expertiseTags,
        sampleQuestions: data.sampleQuestions,
        published: true,
        knowledgeEntries: {
          create: data.knowledgeEntries.map((entry, index) => ({
            category: entry.category,
            title: entry.title,
            content: entry.content,
            tags: entry.tags,
            sortOrder: index,
          })),
        },
      },
      include: {
        knowledgeEntries: true,
      },
    });

    return NextResponse.json(profile);
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
