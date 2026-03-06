/**
 * 本地调用他人 Agent - buyandsell.md 流程
 *
 * 1. 向平台申请 InvocationToken
 * 2. 直接调用小兰 Agent（携带 token）
 * 3. 小兰执行后返回结果，并向平台提交回执
 */
import crypto from "crypto";

const BASE = process.env.PLATFORM_URL || "http://localhost:3000";

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
  const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY;
  const LICENSE_ID = process.env.LICENSE_ID || "00000000-0000-0000-0000-000000000001";
  const AGENT_ID = process.env.AGENT_ID || "00000000-0000-0000-0000-000000000001";

  if (!PLATFORM_API_KEY) {
    console.log(`
用法（buyandsell.md 流程）:
1. 注册账号，购买 License（或使用种子数据的 License）
2. 控制台创建平台 API Key
3. 执行：

$env:PLATFORM_URL="http://localhost:3000   # dev 跑在 3000时
$env:PLATFORM_API_KEY="sk_live_xxx"
$env:LICENSE_ID="你的license_id"   # 不填则用种子 Demo License
node scripts/local-invoke-example.mjs
`);
    return;
  }

  const input = { scope: { records_target: 30, geography: "US" } };
  const inputHash = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");

  console.log("Step 1: 向平台申请 InvocationToken...");
  const tokenResp = await issueToken(
    PLATFORM_API_KEY,
    LICENSE_ID,
    AGENT_ID,
    "content.generate",
    inputHash
  );

  const { request_id, invocation_token, agent_base_url } = tokenResp;
  console.log("  request_id:", request_id);
  console.log("  agent_base_url:", agent_base_url);

  console.log("Step 2: 直接调用小兰 Agent...");
  const result = await invokeAgent(
    agent_base_url,
    request_id,
    LICENSE_ID,
    AGENT_ID,
    "content.generate",
    input,
    inputHash,
    invocation_token
  );

  console.log("Step 3: 执行结果");
  console.log("  status:", result.status);
  if (result.result?.report_md) {
    console.log("  report:", result.result.report_md.slice(0, 200) + "...");
  }
  if (result.warning) console.log("  warning:", result.warning);
}

main().catch(console.error);
