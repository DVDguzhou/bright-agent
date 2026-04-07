import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const MAX_MESSAGES = 400;
const MAX_CONTENT = 32000;

function parseChatHistory(raw: unknown): Prisma.InputJsonValue {
  if (!Array.isArray(raw)) return [];
  const out: Prisma.JsonArray = [];
  for (const item of raw.slice(0, MAX_MESSAGES)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const role = o.role;
    const content = o.content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    out.push({ role, content: content.slice(0, MAX_CONTENT) });
  }
  return out;
}

async function assertProfileOwner(profileId: string, userId: string) {
  return prisma.lifeAgentProfile.findFirst({
    where: { id: profileId, userId },
    select: { id: true },
  });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const profileId = params.id;
    if (!(await assertProfileOwner(profileId, user.id))) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const row = await prisma.lifeAgentCoEditState.findUnique({
      where: { profileId },
    });

    return NextResponse.json({
      chatHistory: row?.chatHistory ?? [],
      lastChange: row?.lastChange ?? null,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const profileId = params.id;
    if (!(await assertProfileOwner(profileId, user.id))) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const chatHistory = parseChatHistory(body.chatHistory);

    let lastChange: Prisma.InputJsonValue | null | undefined;
    if ("lastChange" in body) {
      lastChange =
        body.lastChange === null || body.lastChange === undefined ? null : (body.lastChange as Prisma.InputJsonValue);
      if (
        lastChange != null &&
        (typeof lastChange !== "object" || Array.isArray(lastChange))
      ) {
        return NextResponse.json({ error: "INVALID_LAST_CHANGE" }, { status: 400 });
      }
    }

    const lastChangeWrite =
      lastChange === undefined
        ? undefined
        : lastChange === null
          ? Prisma.DbNull
          : lastChange;

    await prisma.lifeAgentCoEditState.upsert({
      where: { profileId },
      create: {
        profileId,
        userId: user.id,
        chatHistory,
        ...(lastChangeWrite !== undefined ? { lastChange: lastChangeWrite } : {}),
      },
      update: {
        chatHistory,
        ...(lastChangeWrite !== undefined ? { lastChange: lastChangeWrite } : {}),
        userId: user.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
