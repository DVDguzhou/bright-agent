/**
 * 视频流水线 Demo - 串联 Script → Asset → Render → Compliance
 *
 * 用法:
 *   $env:PLATFORM_API_KEY="sk_live_xxx"
 *   $env:PLATFORM_URL="http://localhost:3000"
 *   node scripts/invoke-video-pipeline.mjs
 *
 * 可传环境变量:
 *   VIDEO_BRIEF  创作 brief，默认 "产品宣传片 30 秒"
 */
import crypto from "crypto";

const BASE = process.env.PLATFORM_URL || "http://localhost:3000";
const API_KEY = process.env.PLATFORM_API_KEY;
const BRIEF = process.env.VIDEO_BRIEF || "产品宣传片 30 秒";

const PIPELINE = [
  { name: "Script", agentId: "00000000-0000-0000-0000-000000000005", licenseId: "00000000-0000-0000-0000-000000000005", scope: "content.generate" },
  { name: "Asset", agentId: "00000000-0000-0000-0000-000000000006", licenseId: "00000000-0000-0000-0000-000000000006", scope: "content.generate" },
  { name: "Render", agentId: "00000000-0000-0000-0000-000000000007", licenseId: "00000000-0000-0000-0000-000000000007", scope: "resource.proxy" },
  { name: "Compliance", agentId: "00000000-0000-0000-0000-000000000008", licenseId: "00000000-0000-0000-0000-000000000008", scope: "permission.access" },
];

async function issueToken(apiKey, licenseId, agentId, scope, inputHash) {
  const res = await fetch(`${BASE}/api/invocations/issue-token`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ licenseId, agentId, scope, inputHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Issue token failed");
  return data;
}

async function invokeAgent(baseUrl, requestId, licenseId, agentId, scope, input, inputHash, invocationToken) {
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

async function main() {
  if (!API_KEY) {
    console.log(`
视频流水线 Demo - Script → Asset → Render → Compliance

用法:
  $env:PLATFORM_API_KEY="sk_live_xxx"
  $env:PLATFORM_URL="http://localhost:3000"
  $env:VIDEO_BRIEF="你的创作 brief"   # 可选
  node scripts/invoke-video-pipeline.mjs

需先执行 npx prisma db seed 以创建视频流水线 Agent 与 License。
`);
    return;
  }

  let input = { brief: BRIEF };
  let script, assets, video, compliance;

  for (let i = 0; i < PIPELINE.length; i++) {
    const step = PIPELINE[i];
    const inputHash = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
    console.log(`\n[${i + 1}/4] ${step.name} Agent...`);
    const tokenResp = await issueToken(API_KEY, step.licenseId, step.agentId, step.scope, inputHash);
    const result = await invokeAgent(
      tokenResp.agent_base_url,
      tokenResp.request_id,
      step.licenseId,
      step.agentId,
      step.scope,
      input,
      inputHash,
      tokenResp.invocation_token
    );
    if (step.name === "Script") {
      script = result.result?.script;
      input = { script };
    } else if (step.name === "Asset") {
      assets = result.result?.assets;
      input = { script, assets };
    } else if (step.name === "Render") {
      video = result.result;
      input = { video_url: result.result?.video_url };
    } else {
      compliance = result.result;
    }
  }

  console.log("\n--- 流水线完成 ---");
  console.log("Brief:", BRIEF);
  console.log("Script:", JSON.stringify(script, null, 2));
  console.log("Assets:", assets?.length, "个");
  console.log("Video URL:", video?.video_url);
  console.log("Render 模拟耗时:", video?.render_time_ms, "ms");
  console.log("Compliance:", compliance?.passed ? "通过" : "未通过");
  if (compliance?.report) console.log("\n合规报告:\n", compliance.report);
}

main().catch(console.error);
