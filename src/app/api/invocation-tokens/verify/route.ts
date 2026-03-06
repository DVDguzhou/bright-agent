import { NextResponse } from "next/server";
import { verifyInvocationToken } from "@/lib/invocation";

/**
 * 小兰 Agent 服务端校验 InvocationToken 时调用
 * buyandsell.md § Step 5
 *
 * 支持 GET（query / header）和 POST（body），便于外部 Agent 任意 HTTP 客户端
 */
function extractToken(req: Request): string | null {
  const { searchParams } = new URL(req.url);
  const fromQuery = searchParams.get("token");
  const fromHeader = req.headers.get("x-invocation-token");
  if (fromQuery) return fromQuery;
  if (fromHeader) return fromHeader;
  return null;
}

async function handleVerify(req: Request): Promise<Response> {
  let token: string | null = extractToken(req);
  if (!token && req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      token = body.token ?? body.invocation_token ?? null;
    } catch {
      /* ignore */
    }
  }
  if (!token) {
    return NextResponse.json({ valid: false, error: "token_required" }, { status: 400 });
  }

  const result = await verifyInvocationToken(token);
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 200 });
  }
  return NextResponse.json({
    valid: true,
    requestId: result.requestId,
    licenseId: result.licenseId,
    agentId: result.agentId,
    buyerId: result.buyerId,
    scope: result.scope,
  });
}

export async function GET(req: Request) {
  return handleVerify(req);
}

export async function POST(req: Request) {
  return handleVerify(req);
}
