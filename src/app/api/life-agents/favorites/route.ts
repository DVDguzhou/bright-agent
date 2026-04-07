import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const MAX_IMPORT = 200;

export async function GET() {
  try {
    const user = await requireAuth();
    const rows = await prisma.lifeAgentFavorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { profileId: true },
    });
    return NextResponse.json({ ids: rows.map((r) => r.profileId) });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

/** Toggle favorite for one profile. Body: `{ profileId: string }` */
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const profileId = typeof body.profileId === "string" ? body.profileId.trim() : "";
    if (!profileId) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }

    const profile = await prisma.lifeAgentProfile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
    }

    const existing = await prisma.lifeAgentFavorite.findUnique({
      where: { userId_profileId: { userId: user.id, profileId } },
    });

    if (existing) {
      await prisma.lifeAgentFavorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.lifeAgentFavorite.create({
      data: { userId: user.id, profileId },
    });
    return NextResponse.json({ favorited: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

/** Merge local favorites after login. Body: `{ profileIds: string[] }` */
export async function PUT(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const raw = body.profileIds;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }
    const profileIds = raw
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_IMPORT);

    if (profileIds.length === 0) {
      return NextResponse.json({ imported: 0 });
    }

    const existingProfiles = await prisma.lifeAgentProfile.findMany({
      where: { id: { in: profileIds } },
      select: { id: true },
    });
    const valid = new Set(existingProfiles.map((p) => p.id));
    const toCreate = profileIds.filter((id) => valid.has(id));
    if (toCreate.length === 0) {
      return NextResponse.json({ imported: 0 });
    }

    const { count } = await prisma.lifeAgentFavorite.createMany({
      data: toCreate.map((profileId) => ({ userId: user.id, profileId })),
      skipDuplicates: true,
    });

    return NextResponse.json({ imported: count });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
