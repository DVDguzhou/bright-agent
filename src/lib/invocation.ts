/**
 * invocation_service - 生成 request_id、InvocationToken、签名、token 校验、防重放
 * buyandsell.md § 规则 1-5
 */
import crypto from "crypto";
import { prisma } from "./db";
import { InvocationTokenStatus } from "@prisma/client";

const TOKEN_TTL_SEC = 15 * 60; // 15 分钟
const PLATFORM_SECRET = process.env.PLATFORM_SIGNING_SECRET || "dev-platform-secret-change-in-production";

export function generateRequestId(): string {
  return `req_${crypto.randomBytes(12).toString("hex")}`;
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function signToken(payload: { requestId: string; licenseId: string; agentId: string; buyerId: string; nonce: string; expiresAt: number }): string {
  const data = JSON.stringify(payload);
  return crypto.createHmac("sha256", PLATFORM_SECRET).update(data).digest("hex");
}

export function verifyTokenSignature(payload: Record<string, unknown>, signature: string): boolean {
  const { requestId, licenseId, agentId, buyerId, nonce, expiresAt } = payload as {
    requestId?: string;
    licenseId?: string;
    agentId?: string;
    buyerId?: string;
    nonce?: string;
    expiresAt?: number;
  };
  if (!requestId || !licenseId || !agentId || !buyerId || !nonce || !expiresAt) return false;
  const expected = signToken({ requestId, licenseId, agentId, buyerId, nonce, expiresAt });
  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}

export async function verifyInvocationToken(
  tokenValue: string
): Promise<{
  valid: boolean;
  error?: string;
  requestId?: string;
  licenseId?: string;
  agentId?: string;
  buyerId?: string;
  scope?: string;
}> {
  try {
    const parts = tokenValue.split(".");
    if (parts.length !== 2) return { valid: false, error: "invalid_format" };
    const [payloadB64, sigHex] = parts;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as Record<string, unknown>;
    const { requestId, licenseId, agentId, buyerId, nonce, expiresAt } = payload;

    if (typeof expiresAt !== "number" || Date.now() > expiresAt * 1000) {
      return { valid: false, error: "token_expired" };
    }
    if (!verifyTokenSignature(payload as never, sigHex as string)) {
      return { valid: false, error: "invalid_signature" };
    }

    const record = await prisma.invocationToken.findFirst({
      where: { nonce: nonce as string, requestId: requestId as string },
      include: { license: true, agent: true },
    });
    if (!record) return { valid: false, error: "token_not_found" };
    if (record.status !== InvocationTokenStatus.ISSUED) {
      return { valid: false, error: record.status === InvocationTokenStatus.USED ? "token_already_used" : "token_invalid" };
    }

    return {
      valid: true,
      requestId: record.requestId,
      licenseId: record.licenseId,
      agentId: record.agentId,
      buyerId: record.buyerId,
      scope: record.scope ?? undefined,
    };
  } catch {
    return { valid: false, error: "parse_error" };
  }
}

export function createSignedTokenPayload(
  requestId: string,
  licenseId: string,
  agentId: string,
  buyerId: string,
  nonce: string,
  expiresAt: Date
): string {
  const payload = {
    requestId,
    licenseId,
    agentId,
    buyerId,
    nonce,
    expiresAt: Math.floor(expiresAt.getTime() / 1000),
  };
  const sig = signToken(payload);
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${b64}.${sig}`;
}
