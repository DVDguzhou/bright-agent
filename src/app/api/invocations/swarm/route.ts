/**
 * Agent Swarm - 并行调用多个 Agent，可选聚合（fan-out + fan-in）
 *
 * POST body: {
 *   tasks: [{ agentId, licenseId, scope, input }],
 *   aggregator?: { agentId, licenseId, scope }  // 可选，将并行结果聚合
 * }
 *
 * 流程: 1. 并行申请各 task 的 token
 *       2. 并行调用各 Agent
 *       3. 若提供 aggregator，将 results 作为 input 调用聚合 Agent
 */
import { NextResponse } from "next/server";
import { requireAuthOrApiKey } from "@/lib/auth";
import { swarmInvokeSchema } from "@/lib/validators";
import crypto from "crypto";

const BASE = process.env.NEXTAUTH_URL || "http://localhost:3000";

function authHeaders(req: Request): Record<string, string> {
  const auth = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth?.startsWith("Bearer ")) headers.Authorization = auth;
  else if (cookie) headers.Cookie = cookie;
  return headers;
}

async function issueToken(
  req: Request,
  licenseId: string,
  agentId: string,
  scope: string | undefined,
  inputHash: string
) {
  const res = await fetch(`${BASE}/api/invocations/issue-token`, {
    method: "POST",
    headers: authHeaders(req),
    credentials: "include",
    body: JSON.stringify({ licenseId, agentId, scope, inputHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Issue token failed");
  return data;
}

async function invokeAgent(
  baseUrl: string,
  requestId: string,
  licenseId: string,
  agentId: string,
  scope: string | undefined,
  input: unknown,
  inputHash: string,
  invocationToken: string
) {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id: requestId,
      license_id: licenseId,
      agent_id: agentId,
      scope,
      input,
      input_hash: inputHash,
      invocation_token: invocationToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Invoke failed");
  return data;
}

export async function POST(req: Request) {
  try {
    await requireAuthOrApiKey(req);
    const body = await req.json();
    const data = swarmInvokeSchema.parse(body);

    const tokens = await Promise.all(
      data.tasks.map(async (task) => {
        const inputHash = crypto.createHash("sha256").update(JSON.stringify(task.input)).digest("hex");
        const token = await issueToken(req, task.licenseId, task.agentId, task.scope, inputHash);
        return { task, token, inputHash };
      })
    );

    const results = await Promise.all(
      tokens.map(({ task, token, inputHash }) =>
        invokeAgent(
          token.agent_base_url,
          token.request_id,
          task.licenseId,
          task.agentId,
          task.scope,
          task.input,
          inputHash,
          token.invocation_token
        )
      )
    );

    let aggregated: unknown = null;
    if (data.aggregator && results.length > 0) {
      let aggInput: unknown;
      if (data.aggregator.transform === "web_analyzer_to_report") {
        aggInput = {
          analyses: results.map((r, i) => ({
            url: data.tasks[i]?.input && typeof data.tasks[i].input === "object" && "url" in data.tasks[i].input
              ? (data.tasks[i].input as { url?: string }).url
              : undefined,
            ...(typeof r.result === "object" && r.result !== null && "analysis" in r.result
              ? (r.result as { analysis?: Record<string, unknown> }).analysis
              : {}),
          })),
          topic: "竞品",
        };
      } else {
        aggInput = { results: results.map((r) => r.result) };
      }
      const aggHash = crypto.createHash("sha256").update(JSON.stringify(aggInput)).digest("hex");
      const aggToken = await issueToken(req, data.aggregator.licenseId, data.aggregator.agentId, data.aggregator.scope, aggHash);
      const aggResult = await invokeAgent(
        aggToken.agent_base_url,
        aggToken.request_id,
        data.aggregator.licenseId,
        data.aggregator.agentId,
        data.aggregator.scope,
        aggInput,
        aggHash,
        aggToken.invocation_token
      );
      aggregated = aggResult.result;
    }

    return NextResponse.json({
      status: "success",
      results: results.map((r) => r.result),
      aggregated: aggregated ?? undefined,
      count: results.length,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (e instanceof Error && "issues" in e) {
      return NextResponse.json({ error: "VALIDATION_ERROR", details: e }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Swarm failed", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
