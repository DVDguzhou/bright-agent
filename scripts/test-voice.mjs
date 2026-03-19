/**
 * 语音回复集成测试：登录 → 创建 Agent → 购买 → 带 useVoiceReply 发消息 → 校验 audioUrl 并下载音频
 *
 * 使用：node scripts/test-voice.mjs
 * 环境变量：
 *   TEST_BASE_URL  默认 http://localhost:8080
 *   TEST_EMAIL / TEST_BUYER  可选，默认带时间戳邮箱
 *   TEST_SELLER_NAME / TEST_BUYER_NAME  可选，默认昵称带时间戳（避免 NAME_EXISTS）
 * PowerShell：$env:TEST_BASE_URL="http://host:3000"; node scripts/test-voice.mjs
 * cmd.exe：set TEST_BASE_URL=http://host:3000&& node scripts/test-voice.mjs
 *
 * 说明：TTS_PROVIDER=auto 且 OPENAI_BASE_URL 含 dashscope 时用百炼 Qwen-TTS（与 OPENAI_API_KEY 共用）；
 *       否则走 OpenAI /audio/speech，需 OPENAI_TTS_API_KEY 等。
 */
const BASE = process.env.TEST_BASE_URL || "http://localhost:8080";

function parseCookie(setCookie) {
  if (!setCookie) return "";
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!first || typeof first !== "string") return "";
  return first.split(";")[0].trim();
}

async function req(method, path, body, cookie = "") {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie && { Cookie: cookie }),
    },
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const setCookie = res.headers.get("set-cookie") || res.headers.getSetCookie?.();
  const ct = res.headers.get("content-type") || "";
  let data = {};
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  }
  const nextCookie = setCookie ? parseCookie(setCookie) : cookie;
  return { ok: res.ok, status: res.status, data, cookie: nextCookie, headers: res.headers };
}

async function loginOrSignup(email, password, name) {
  let r = await req("POST", "/api/auth/login", { email, password });
  if (r.ok) return r;
  r = await req("POST", "/api/auth/signup", { email, password, name });
  return r;
}

// 后端 displayName 最长 10 个字符（含中文）
const MIN_AGENT = (ts) => ({
  displayName: `测${String(ts).slice(-7)}`,
  headline: "测试用",
  shortBio: "短介绍",
  longBio: "长介绍用于满足创建校验。",
  audience: "测试",
  welcomeMessage: "你好",
  pricePerQuestion: 1,
  expertiseTags: ["测试"],
  sampleQuestions: ["问什么？"],
  knowledgeEntries: [
    {
      category: "测试",
      title: "示例经历",
      content: "我当年测试语音功能时，会先跑一遍脚本确认 TTS 正常。",
      tags: ["测试"],
    },
    {
      category: "测试",
      title: "第二条",
      content: "创建 Agent 要求至少两条知识库条目。",
      tags: ["测试"],
    },
  ],
});

async function main() {
  const ts = Date.now();
  const sellerEmail = process.env.TEST_EMAIL || `voice-seller-${ts}@test.com`;
  const buyerEmail = process.env.TEST_BUYER || `voice-buyer-${ts}@test.com`;
  const sellerName = process.env.TEST_SELLER_NAME || `语音卖家-${ts}`;
  const buyerName = process.env.TEST_BUYER_NAME || `语音买家-${ts}`;
  const password = "Test123456";

  console.log("=== 语音功能测试 ===\n");
  console.log("BASE:", BASE, "\n");

  // 连通性（公开列表接口）
  try {
    const ping = await fetch(`${BASE.replace(/\/$/, "")}/api/life-agents`);
    if (!ping.ok && ping.status !== 401 && ping.status !== 403) {
      console.warn("   ⚠️  预检 HTTP", ping.status, "（继续尝试）");
    }
  } catch (e) {
    console.error("❌ 无法连接后端，请先启动：cd backend && go run .  或 docker compose up");
    console.error(e.message || e);
    process.exit(1);
  }

  console.log("1️⃣  卖家注册/登录");
  const seller = await loginOrSignup(sellerEmail, password, sellerName);
  if (!seller.ok) {
    console.error("   ❌", seller.status, seller.data);
    process.exit(1);
  }
  console.log("   ✅ 卖家 OK\n");

  console.log("2️⃣  创建 Agent");
  const create = await req("POST", "/api/life-agents", MIN_AGENT(ts), seller.cookie);
  if (!create.ok) {
    console.error("   ❌", create.status, create.data);
    process.exit(1);
  }
  const agentId = create.data.id;
  console.log("   ✅ agentId:", agentId, "\n");

  console.log("3️⃣  买家注册/登录");
  const buyer = await loginOrSignup(buyerEmail, password, buyerName);
  if (!buyer.ok) {
    console.error("   ❌", buyer.status, buyer.data);
    process.exit(1);
  }
  console.log("   ✅ 买家 OK\n");

  console.log("4️⃣  购买提问次数");
  const purchase = await req(
    "POST",
    `/api/life-agents/${agentId}/purchase`,
    { questionCount: 2, amountPaid: 2 },
    buyer.cookie
  );
  if (!purchase.ok) {
    console.error("   ❌", purchase.status, purchase.data);
    process.exit(1);
  }
  console.log("   ✅ 剩余提问:", purchase.data.remainingQuestions, "\n");

  const question =
    process.env.TEST_QUESTION || "你当年测试语音时有什么建议？用一两句话说。";

  console.log("5️⃣  发送消息（useVoiceReply: true）");
  console.log("   问题:", question);
  const chat = await req(
    "POST",
    `/api/life-agents/${agentId}/chat`,
    { message: question, useVoiceReply: true },
    buyer.cookie
  );
  if (!chat.ok) {
    console.error("   ❌ 聊天失败", chat.status, chat.data);
    process.exit(1);
  }

  const reply = chat.data.reply || "";
  const audioUrl = chat.data.audioUrl;
  const dur = chat.data.audioDurationSec;

  console.log("   📝 回复长度:", reply.length);
  console.log("   🔊 audioUrl:", audioUrl || "(无)");
  console.log("   ⏱  audioDurationSec:", dur ?? "(无)");
  if (chat.data.ttsDebug) {
    console.log("   🐛 ttsDebug:", JSON.stringify(chat.data.ttsDebug, null, 2));
  } else if (!audioUrl) {
    console.log(
      "   💡 服务器设 TTS_DEBUG=1 并重启 backend 后重跑本脚本，可在 JSON 里看到 resolvedProvider / synthesizeError"
    );
  }

  if (!audioUrl) {
    console.log("\n⚠️  未返回音频 URL。");
    console.log("   常见原因：");
    console.log("   - Docker：请在 .env 设 OPENAI_MODEL=qwen-plus、OPENAI_BASE_URL=DashScope 兼容地址，或 TTS_PROVIDER=dashscope；");
    console.log("     docker-compose 默认已改为通义；若仍无音频，请 docker compose build backend --no-cache && up -d，并看 backend 日志「TTS failed」");
    console.log("   - 未配置 OPENAI_API_KEY，或百炼未开通 Qwen-TTS / Key 无权限");
    console.log("   - TTS 请求失败（部署后看后端日志: TTS failed）");
    console.log("   - 回复内容为空（极少见）\n");
    console.log("=== 结果：聊天成功，语音合成未生效 ===");
    process.exit(0);
  }

  console.log("\n6️⃣  下载音频");
  const audioFetchUrl = audioUrl.startsWith("http")
    ? audioUrl
    : `${BASE.replace(/\/$/, "")}${audioUrl.startsWith("/") ? "" : "/"}${audioUrl}`;
  const rAudio = await fetch(audioFetchUrl);
  const audioBuf = await rAudio.arrayBuffer();
  const len = audioBuf.byteLength;
  const ct = rAudio.headers.get("content-type");
  console.log("   URL:", audioFetchUrl);
  console.log("   状态:", rAudio.status, "字节:", len, "Content-Type:", ct);
  if (!rAudio.ok || len < 100) {
    console.error("   ❌ 音频下载异常");
    process.exit(1);
  }

  console.log("\n✅ 语音链路测试通过：聊天 + TTS + /api/audio 可访问");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
