/**
 * Agent Swarm - 并行调用多个 Agent，可选聚合
 *
 * 用法:
 *   $env:PLATFORM_API_KEY="sk_live_xxx"
 *   $env:PLATFORM_URL="http://localhost:3000"
 *   node scripts/invoke-swarm.mjs
 *
 * 示例：并行分析 3 个 URL（Web Analyzer），再聚合为报告（Report Builder）
 */
const BASE = process.env.PLATFORM_URL || "http://localhost:3000";
const API_KEY = process.env.PLATFORM_API_KEY;

const WEB_ANALYZER = { agentId: "00000000-0000-0000-0000-000000000002", licenseId: "00000000-0000-0000-0000-000000000002" };
const REPORT_BUILDER = { agentId: "00000000-0000-0000-0000-000000000003", licenseId: "00000000-0000-0000-0000-000000000003" };

async function main() {
  if (!API_KEY) {
    console.log(`
Agent Swarm Demo - 并行调用 + 聚合

用法:
  $env:PLATFORM_API_KEY="sk_live_xxx"
  $env:PLATFORM_URL="http://localhost:3000"
  node scripts/invoke-swarm.mjs

示例：Web Analyzer × 3 并行 → Report Builder 聚合
`);
    return;
  }

  const urls = ["https://example.com", "https://github.com", "https://nodejs.org"];
  const tasks = urls.map((url) => ({
    agentId: WEB_ANALYZER.agentId,
    licenseId: WEB_ANALYZER.licenseId,
    scope: "data.fetch",
    input: { url },
  }));

  const body = {
    tasks,
    aggregator: {
      agentId: REPORT_BUILDER.agentId,
      licenseId: REPORT_BUILDER.licenseId,
      scope: "content.generate",
      transform: "web_analyzer_to_report",
    },
  };

  console.log("Swarm: 并行分析", urls.length, "个 URL，再聚合...");
  const start = Date.now();
  const res = await fetch(`${BASE}/api/invocations/swarm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const elapsed = Date.now() - start;

  if (!res.ok) {
    console.error("Error:", data.error || data);
    return;
  }

  console.log("\n--- Swarm 完成 ---");
  console.log("耗时:", elapsed, "ms");
  console.log("并行结果数:", data.count);
  if (data.aggregated?.report_md) {
    console.log("\n聚合报告 (前 500 字符):");
    console.log(data.aggregated.report_md.slice(0, 500) + "...");
  } else if (data.results) {
    console.log("\n并行结果:", JSON.stringify(data.results, null, 2).slice(0, 400) + "...");
  }
}

main().catch(console.error);
