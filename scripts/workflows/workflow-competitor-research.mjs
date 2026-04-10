/**
 * 竞品调研工作流 - Agent 协作场景
 *
 * 流程: Web Analyzer × N 个 URL → 收集分析结果 → Report Builder 生成综合报告
 *
 * 用法: node scripts/workflows/workflow-competitor-research.mjs [url1] [url2] ...
 * 示例: node scripts/workflows/workflow-competitor-research.mjs https://example.com https://github.com
 */
import crypto from "crypto";

const BASE = process.env.PLATFORM_URL || "http://localhost:3000";
const WEB_ANALYZER_AGENT = "00000000-0000-0000-0000-000000000002";
const WEB_ANALYZER_LICENSE = "00000000-0000-0000-0000-000000000002";
const REPORT_BUILDER_AGENT = "00000000-0000-0000-0000-000000000003";
const REPORT_BUILDER_LICENSE = "00000000-0000-0000-0000-000000000003";

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

async function runWebAnalyzer(apiKey, url) {
  const input = { url };
  const inputHash = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const tokenResp = await issueToken(apiKey, WEB_ANALYZER_LICENSE, WEB_ANALYZER_AGENT, "data.fetch", inputHash);
  const result = await invokeAgent(
    tokenResp.agent_base_url,
    tokenResp.request_id,
    WEB_ANALYZER_LICENSE,
    WEB_ANALYZER_AGENT,
    "data.fetch",
    input,
    inputHash,
    tokenResp.invocation_token
  );
  return { url, ...(result.result?.analysis || {}), report: result.result?.report_md };
}

async function runReportBuilder(apiKey, analyses, topic = "竞品") {
  const input = { analyses, topic };
  const inputHash = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const tokenResp = await issueToken(apiKey, REPORT_BUILDER_LICENSE, REPORT_BUILDER_AGENT, "content.generate", inputHash);
  const result = await invokeAgent(
    tokenResp.agent_base_url,
    tokenResp.request_id,
    REPORT_BUILDER_LICENSE,
    REPORT_BUILDER_AGENT,
    "content.generate",
    input,
    inputHash,
    tokenResp.invocation_token
  );
  return result.result?.report_md;
}

async function main() {
  const apiKey = process.env.PLATFORM_API_KEY;
  const urls = process.argv.slice(2).filter((u) => u.startsWith("http"));

  if (!apiKey) {
    console.log(`
用法（竞品调研工作流 - Agent 协作）:
  $env:PLATFORM_URL="http://localhost:3000"
  $env:PLATFORM_API_KEY="sk_live_xxx"
  node scripts/workflows/workflow-competitor-research.mjs <url1> <url2> ...

示例:
  node scripts/workflows/workflow-competitor-research.mjs https://example.com https://github.com https://www.baidu.com
`);
    return;
  }

  if (urls.length === 0) {
    console.log("请提供至少一个 URL，例如: node scripts/workflows/workflow-competitor-research.mjs https://example.com");
    return;
  }

  console.log("========== 竞品调研工作流 ==========\n");
  console.log("Step 1: Web Analyzer 分析", urls.length, "个 URL\n");

  const analyses = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`  [${i + 1}/${urls.length}] 分析 ${url}...`);
    try {
      const result = await runWebAnalyzer(apiKey, url);
      analyses.push({ url, title: result.title, description: result.description, headings: result.headings, links: result.links, wordCount: result.wordCount });
      console.log(`    ✓ 完成 (title: ${(result.title || "").slice(0, 40)}...)`);
    } catch (e) {
      console.log(`    ✗ 失败: ${e.message}`);
      analyses.push({ url, error: String(e.message) });
    }
  }

  if (analyses.length === 0) {
    console.log("\n无有效分析结果，退出");
    return;
  }

  console.log("\nStep 2: Report Builder 合成报告...\n");
  const report = await runReportBuilder(apiKey, analyses, "竞品");

  console.log("========== 综合报告 ==========\n");
  console.log(report || "(无输出)");
}

main().catch(console.error);
