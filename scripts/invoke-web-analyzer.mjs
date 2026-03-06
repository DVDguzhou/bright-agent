/**
 * 调用 Web 页面分析 Agent - 真实抓取并分析网页
 * 用法: node scripts/invoke-web-analyzer.mjs [url]
 */
import crypto from "crypto";

const BASE = process.env.PLATFORM_URL || "http://localhost:3000";
const AGENT_ID = "00000000-0000-0000-0000-000000000002";
const LICENSE_ID = "00000000-0000-0000-0000-000000000002";

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
  const apiKey = process.env.PLATFORM_API_KEY;
  const url = process.argv[2] || "https://example.com";

  if (!apiKey) {
    console.log(`
用法:
  $env:PLATFORM_URL="http://localhost:3000"
  $env:PLATFORM_API_KEY="sk_live_xxx"
  node scripts/invoke-web-analyzer.mjs [url]

示例:
  node scripts/invoke-web-analyzer.mjs https://www.baidu.com
  node scripts/invoke-web-analyzer.mjs https://github.com
`);
    return;
  }

  const input = { url };
  const inputHash = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");

  console.log("分析 URL:", url);
  console.log("Step 1: 申请 Token...");
  const tokenResp = await issueToken(apiKey, LICENSE_ID, AGENT_ID, "data.fetch", inputHash);

  console.log("Step 2: 调用 Web Analyzer Agent...");
  const result = await invokeAgent(
    tokenResp.agent_base_url,
    tokenResp.request_id,
    LICENSE_ID,
    AGENT_ID,
    "data.fetch",
    input,
    inputHash,
    tokenResp.invocation_token
  );

  console.log("\n========== 分析报告 ==========\n");
  if (result.result?.report_md) {
    console.log(result.result.report_md);
  } else {
    console.log(result);
  }
}

main().catch(console.error);
