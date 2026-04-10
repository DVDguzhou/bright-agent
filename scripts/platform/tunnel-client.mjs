/**
 * 平台隧道客户端 - 无需 ngrok，本地 Agent 通过隧道对外提供服务
 *
 * 流程：本脚本向平台发起轮询（outbound），平台将买方请求转发过来，
 *       本脚本再转发到本地 Agent，最后将结果回传平台。全程无需公网 IP。
 *
 * 用法:
 *   1. 在平台注册 Agent，勾选「使用平台隧道」
 *   2. 启动本地 Agent: node scripts/platform/seller-agent-example.mjs
 *   3. 启动隧道客户端: node scripts/platform/tunnel-client.mjs
 *
 * 环境变量:
 *   PLATFORM_URL      平台地址，默认 http://localhost:3000
 *   SELLER_API_KEY    小兰的 API Key（控制台创建）
 *   AGENT_ID          要隧道的 Agent ID（平台注册后获得）
 *   LOCAL_AGENT_URL   本地 Agent 地址，默认 http://localhost:3333/invoke
 *   POLL_INTERVAL_MS  轮询间隔，默认 1500
 */
const PLATFORM_URL = process.env.PLATFORM_URL || "http://localhost:3000";
const SELLER_API_KEY = process.env.SELLER_API_KEY;
const AGENT_ID = process.env.AGENT_ID;
const LOCAL_AGENT_URL = process.env.LOCAL_AGENT_URL || "http://localhost:3333/invoke";
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "1500", 10);

async function poll() {
  const res = await fetch(`${PLATFORM_URL}/api/tunnel/poll?agentId=${AGENT_ID}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${SELLER_API_KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Poll failed");
  return data;
}

async function respond(requestId, response) {
  const res = await fetch(`${PLATFORM_URL}/api/tunnel/respond`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SELLER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requestId, response }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Respond failed");
  return data;
}

async function forwardToLocal(body) {
  const res = await fetch(LOCAL_AGENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data;
}

async function run() {
  if (!SELLER_API_KEY || !AGENT_ID) {
    console.log(`
平台隧道客户端 - 本地 Agent 免 ngrok 接入

用法:
  1. 平台注册 Agent，勾选「使用平台隧道」
  2. 启动本地 Agent: node scripts/platform/seller-agent-example.mjs
  3. 配置并启动:

$env:PLATFORM_URL="http://localhost:3000"
$env:SELLER_API_KEY="sk_live_xxx"
$env:AGENT_ID="你的agent_id"
$env:LOCAL_AGENT_URL="http://localhost:3333/invoke"   # 可选
node scripts/platform/tunnel-client.mjs
`);
    process.exit(1);
  }

  console.log("Tunnel client started.");
  console.log("  Platform:", PLATFORM_URL);
  console.log("  Agent ID:", AGENT_ID);
  console.log("  Local Agent:", LOCAL_AGENT_URL);
  console.log("  Polling every", POLL_INTERVAL_MS, "ms\n");

  while (true) {
    try {
      const data = await poll();
      if (data.pending && data.requestId && data.body) {
        console.log("[", new Date().toISOString(), "] Request", data.requestId, "-> forwarding to local...");
        const response = await forwardToLocal(data.body);
        await respond(data.requestId, response);
        console.log("[", new Date().toISOString(), "] Request", data.requestId, "<- done");
      }
    } catch (e) {
      console.error("Tunnel error:", e.message);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

run().catch(console.error);
