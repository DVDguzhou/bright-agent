/**
 * 调用小红的编排 Agent
 *
 * 输入: { urls: string[], topic?: "选品"|"竞品" }
 * 编排 Agent 会协调 Web Analyzer × N 与 Report Builder，返回综合报告
 *
 * 用法:
 *   $env:PLATFORM_API_KEY="sk_live_xxx"   # 或 ORCHESTRATOR_BUYER_API_KEY（小红的 Key）
 *   node scripts/workflows/invoke-orchestrator.mjs
 *
 * 可传环境变量:
 *   PLATFORM_URL    平台地址，默认 http://localhost:3000
 *   PLATFORM_API_KEY 或 ORCHESTRATOR_BUYER_API_KEY
 */
import crypto from "crypto";

const BASE = process.env.PLATFORM_URL || "http://localhost:3000";
const API_KEY = process.env.PLATFORM_API_KEY || process.env.ORCHESTRATOR_BUYER_API_KEY;

const ORCHESTRATOR = {
  agentId: "00000000-0000-0000-0000-000000000004",
  licenseId: "00000000-0000-0000-0000-000000000004",
};

async function issueToken(apiKey, licenseId, agentId, scope, inputHash) {
  const res = await fetch(`${BASE}/api/invocations/issue-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ licenseId, agentId, scope, inputHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Issue token failed");
  return data;
}

async function invokeAgent(agentBaseUrl, requestId, licenseId, agentId, scope, input, inputHash, invocationToken) {
  const res = await fetch(agentBaseUrl, {
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

async function main() {
  if (!API_KEY) {
    console.log(`
用法：调用小红的编排 Agent（协调 Web Analyzer + Report Builder）

1. 确保 .env 中有 ORCHESTRATOR_BUYER_API_KEY（种子会输出，或使用 buyer 的 API Key）
2. 执行：

$env:PLATFORM_URL="http://localhost:3000"
$env:PLATFORM_API_KEY="sk_live_xxx"   # 或 ORCHESTRATOR_BUYER_API_KEY
node scripts/workflows/invoke-orchestrator.mjs

默认会分析 https://example.com 与 https://github.com，生成竞品报告。
可通过修改脚本内的 input 自定义。
`);
    return;
  }

  const input = {
    urls: ["https://example.com", "https://github.com"],
    topic: "竞品",
  };
  const inputHash = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");

  console.log("Step 1: 向平台申请编排 Agent 的 InvocationToken...");
  const tokenResp = await issueToken(
    API_KEY,
    ORCHESTRATOR.licenseId,
    ORCHESTRATOR.agentId,
    "content.generate",
    inputHash
  );

  const { request_id, invocation_token, agent_base_url } = tokenResp;
  console.log("  request_id:", request_id);
  console.log("  agent_base_url:", agent_base_url);

  console.log("Step 2: 调用小红的编排 Agent...");
  const result = await invokeAgent(
    agent_base_url,
    request_id,
    ORCHESTRATOR.licenseId,
    ORCHESTRATOR.agentId,
    "content.generate",
    input,
    inputHash,
    invocation_token
  );

  console.log("Step 3: 执行结果");
  console.log("  status:", result.status);
  if (result.result?.report_md) {
    console.log("  report (前 500 字符):");
    console.log("  " + result.result.report_md.slice(0, 500).replace(/\n/g, "\n  ") + "...");
  }
  if (result.warning) console.log("  warning:", result.warning);
}

main().catch(console.error);
