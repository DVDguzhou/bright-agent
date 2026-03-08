/**
 * 调用 TikTok 选品 Agent - 买方测试脚本
 *
 * 用法：
 *   $env:PLATFORM_URL="http://localhost:3000"
 *   $env:PLATFORM_API_KEY="sk_live_xxx"
 *   $env:LICENSE_ID="你的license_id"
 *   $env:AGENT_ID="你的agent_id"
 *   node scripts/invoke-crawler-agent.mjs
 *
 * 若 Agent 使用隧道，AGENT_BASE_URL 由平台返回；若直连，需设置：
 *   $env:AGENT_BASE_URL="http://localhost:3334/invoke"   # 或 ngrok 地址
 */
import crypto from "crypto";

const PLATFORM_URL = process.env.PLATFORM_URL || "http://localhost:3000";

async function issueToken(apiKey, licenseId, agentId, scope, inputHash) {
  const res = await fetch(`${PLATFORM_URL}/api/invocations/issue-token`, {
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
  const LICENSE_ID = process.env.LICENSE_ID;
  const AGENT_ID = process.env.AGENT_ID;
  const AGENT_BASE_URL = process.env.AGENT_BASE_URL; // 可选，不填则用平台返回的 agent_base_url

  if (!PLATFORM_API_KEY || !LICENSE_ID || !AGENT_ID) {
    console.log(`
用法（TikTok 选品 Agent 调用）:
1. 买方购买 License
2. 控制台创建平台 API Key
3. 执行：

$env:PLATFORM_URL="http://localhost:3000"
$env:PLATFORM_API_KEY="sk_live_xxx"
$env:LICENSE_ID="你的license_id"
$env:AGENT_ID="你的agent_id"
# 若 Agent 直连（非隧道），需设置：
$env:AGENT_BASE_URL="http://localhost:3334/invoke"
node scripts/invoke-crawler-agent.mjs
`);
    return;
  }

  const input = {
    category: process.env.CATEGORY || "beauty",
    region: process.env.REGION || "US",
    records_target: parseInt(process.env.RECORDS_TARGET || "30", 10),
    price_range: { min: 10, max: 40 },
  };
  const inputHash = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");

  console.log("Step 1: 向平台申请 InvocationToken...");
  const tokenResp = await issueToken(
    PLATFORM_API_KEY,
    LICENSE_ID,
    AGENT_ID,
    "data.fetch",
    inputHash
  );

  const { request_id, invocation_token, agent_base_url } = tokenResp;
  const baseUrl = AGENT_BASE_URL || agent_base_url;
  if (!baseUrl) {
    console.error("错误: 未获取到 agent_base_url，请设置 AGENT_BASE_URL 或使用平台隧道");
    return;
  }

  console.log("  request_id:", request_id);
  console.log("  agent_base_url:", baseUrl);

  console.log("Step 2: 直接调用 TikTok 选品 Agent...");
  const result = await invokeAgent(
    baseUrl,
    request_id,
    LICENSE_ID,
    AGENT_ID,
    "data.fetch",
    input,
    inputHash,
    invocation_token
  );

  console.log("Step 3: 执行结果");
  console.log("  status:", result.status);
  if (result.result) {
    console.log("  record_count:", result.result.record_count);
    console.log("  executed_at:", result.result.executed_at);
    if (result.result.products?.length) {
      console.log("  首条产品:", result.result.products[0].title, result.result.products[0].price_usd);
    }
  }
  if (result.warning) console.log("  warning:", result.warning);
}

main().catch(console.error);
