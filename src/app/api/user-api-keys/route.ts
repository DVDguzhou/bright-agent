import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, createUserApiKey } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const keys = await prisma.userApiKey.findMany({
      where: { userId: user.id },
      select: { id: true, keyPrefix: true, name: true, createdAt: true },
    });
    return NextResponse.json(keys.map((k) => ({ ...k, keyPrefix: `${k.keyPrefix}...` })));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const name = (body.name as string) || "API Key";
    const { key, id } = await createUserApiKey(user.id, name);
    return NextResponse.json({ id, key, name, warning: "请妥善保存，此 key 仅显示一次" });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
