/**
 * 为已存在的「活泼牢大2.0」Agent 进行音色训练（使用 voice_samples/laoda_reference 中的 MP3）
 *
 * 使用：node scripts/create-laoda-2-with-voice.mjs
 * 环境变量：
 *   TEST_BASE_URL  默认 http://localhost:8080（Go 后端）
 *   LAODA_SELLER_EMAIL  默认 tmxiand@gmail.com（与活泼牢大默认卖家一致）
 *   LAODA_SELLER_PASSWORD  默认 password123（与 db:seed 一致）
 *
 * 前置：已创建「活泼牢大2.0」且知悉其卖家账号，Go 后端已启动，DASHSCOPE 相关配置已就绪
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const VOICE_DIR = path.join(ROOT, "voice_samples", "laoda_reference");
const VOICE_FILE = path.join(VOICE_DIR, "laoda_voice.mp3");

const BASE = process.env.TEST_BASE_URL || "http://localhost:8080";
const SELLER_EMAIL = process.env.LAODA_SELLER_EMAIL || "tmxiand@gmail.com";
const SELLER_PASSWORD = process.env.LAODA_SELLER_PASSWORD || "password123";

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
  return { ok: res.ok, status: res.status, data, cookie: nextCookie };
}

async function login(email, password) {
  const r = await req("POST", "/api/auth/login", { email, password });
  return r;
}

const TARGET_DISPLAY_NAME = "活泼牢大2.0";

async function main() {
  console.log("=== 活泼牢大2.0 音色训练 ===\n");
  console.log("BASE:", BASE);

  if (!fs.existsSync(VOICE_FILE)) {
    console.error("❌ 未找到语音文件:", VOICE_FILE);
    console.error("   请将 MP3 放入 voice_samples/laoda_reference/laoda_voice.mp3");
    process.exit(1);
  }

  const buf = fs.readFileSync(VOICE_FILE);
  const base64 = buf.toString("base64");
  const voiceSampleBase64 = `data:audio/mpeg;base64,${base64}`;
  console.log("   ✅ 已读取语音:", VOICE_FILE, `(${(buf.length / 1024).toFixed(1)} KB)\n`);

  try {
    const ping = await fetch(`${BASE.replace(/\/$/, "")}/api/life-agents`);
    if (!ping.ok && ping.status !== 401 && ping.status !== 403) {
      console.warn("   ⚠️  预检 HTTP", ping.status, "（继续尝试）");
    }
  } catch (e) {
    console.error("❌ 无法连接后端，请先启动：cd backend && go run .");
    console.error(e.message || e);
    process.exit(1);
  }

  console.log("1️⃣  登录", SELLER_EMAIL);
  const loginRes = await login(SELLER_EMAIL, SELLER_PASSWORD);
  if (!loginRes.ok) {
    console.error("   ❌", loginRes.status, loginRes.data);
    process.exit(1);
  }
  console.log("   ✅ OK\n");

  console.log("2️⃣  获取我的 Agent 列表");
  const mineRes = await req("GET", "/api/life-agents/mine", null, loginRes.cookie);
  if (!mineRes.ok) {
    console.error("   ❌", mineRes.status, mineRes.data);
    process.exit(1);
  }
  const agents = Array.isArray(mineRes.data) ? mineRes.data : [];
  const target = agents.find((a) => a.displayName === TARGET_DISPLAY_NAME);
  if (!target) {
    console.error("   ❌ 未找到「" + TARGET_DISPLAY_NAME + "」，当前 Agent：", agents.map((a) => a.displayName).join(", ") || "(无)");
    process.exit(1);
  }
  console.log("   ✅ 找到", target.displayName, "id:", target.id, "\n");

  console.log("3️⃣  上传音色样本并训练");
  const patchRes = await req("PATCH", `/api/life-agents/${target.id}`, { voiceSampleBase64 }, loginRes.cookie);
  if (!patchRes.ok) {
    console.error("   ❌", patchRes.status, patchRes.data);
    process.exit(1);
  }
  const voiceCloneId = patchRes.data.voiceCloneId;
  if (voiceCloneId) {
    console.log("   ✅ 音色已复刻 voiceCloneId:", voiceCloneId);
  } else {
    console.log("   ⚠️  未返回 voiceCloneId，可能 TTS_PROVIDER 非 dashscope 或 DASHSCOPE 相关配置未就绪");
  }

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  console.log("\n✅ 音色训练完成");
  console.log("   聊天页:", `${base}/life-agents/${target.id}/chat`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
