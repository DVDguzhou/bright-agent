import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthOrApiKey } from "@/lib/auth";
import { issueTokenSchema } from "@/lib/validators";
import {
  generateRequestId,
  generateNonce,
  createSignedTokenPayload,
} from "@/lib/invocation";
import { checkLicenseForInvocation } from "@/lib/license";
import { InvocationTokenStatus } from "@prisma/client";

const TOKEN_TTL_SEC = 15 * 60;

export async function POST(req: Request) {
  try {
    const user = await requireAuthOrApiKey(req);
    const body = await req.json();
    const data = issueTokenSchema.parse(body);

    const check = await checkLicenseForInvocation(data.licenseId, data.agentId, user.id, data.scope);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const license = await prisma.license.findUnique({
      where: { id: data.licenseId },
      include: { agent: true },
    });
    if (!license) return NextResponse.json({ error: "LICENSE_NOT_FOUND" }, { status: 404 });

    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const agentBaseUrl = license.agent.useTunnel
      ? `${base.replace(/\/$/, "")}/api/tunnel/invoke/${license.agent.id}`
      : license.agent.baseUrl;

    const requestId = generateRequestId();
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_SEC * 1000);

    const tokenRecord = await prisma.invocationToken.create({
      data: {
        licenseId: data.licenseId,
        agentId: data.agentId,
        buyerId: user.id,
        sellerId: license.sellerId,
        requestId,
        scope: data.scope ?? license.scope ?? undefined,
        expiresAt,
        nonce,
        signature: "computed",
        status: InvocationTokenStatus.ISSUED,
      },
    });

    const signedToken = createSignedTokenPayload(
      requestId,
      data.licenseId,
      data.agentId,
      user.id,
      nonce,
      expiresAt
    );

    await prisma.invocationRequest.create({
      data: {
        requestId,
        licenseId: data.licenseId,
        agentId: data.agentId,
        buyerId: user.id,
        tokenId: tokenRecord.id,
        inputHash: data.inputHash,
        scope: data.scope ?? license.scope ?? undefined,
      },
    });

    return NextResponse.json({
      request_id: requestId,
      token_id: tokenRecord.id,
      invocation_token: signedToken,
      expires_at: expiresAt.toISOString(),
      agent_base_url: agentBaseUrl,
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
