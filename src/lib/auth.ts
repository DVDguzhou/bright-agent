import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "./db";

const SESSION_COOKIE = "agent_fiverr_session";
const PLATFORM_KEY_PREFIX = "sk_live_";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  roleFlags: { is_buyer?: boolean; is_seller?: boolean } | null;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true, email: true, name: true, roleFlags: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roleFlags: user.roleFlags as SessionUser["roleFlags"],
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function getAuthFromRequest(req: Request): Promise<SessionUser | null> {
  const session = await getSession();
  if (session) return session;
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!bearer) return null;
  if (bearer.startsWith(PLATFORM_KEY_PREFIX)) {
    const hashed = hashKey(bearer);
    const key = await prisma.userApiKey.findFirst({
      where: { keyHash: hashed },
      include: { user: { select: { id: true, email: true, name: true, roleFlags: true } } },
    });
    if (!key) return null;
    return {
      id: key.user.id,
      email: key.user.email,
      name: key.user.name,
      roleFlags: key.user.roleFlags as SessionUser["roleFlags"],
    };
  }
  return null;
}

export async function requireAuthOrApiKey(req: Request): Promise<SessionUser> {
  const user = await getAuthFromRequest(req);
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function createUserApiKey(userId: string, name?: string): Promise<{ key: string; id: string }> {
  const raw = crypto.randomBytes(24).toString("hex");
  const key = `${PLATFORM_KEY_PREFIX}${raw}`;
  const prefix = key.slice(0, 16);
  const record = await prisma.userApiKey.create({
    data: { userId, keyHash: hashKey(key), keyPrefix: prefix, name },
  });
  return { key, id: record.id };
}

// buyandsell.md: 平台签发 InvocationToken，不再使用 AgentInvokeKey (aaim_xxx)
