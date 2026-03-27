/**
 * 给「活泼牢大」固定 ID 的 Agent 上传音色样本（voice_samples/laoda_reference/laoda_voice.mp3）
 * 成功后百炼会写入 voiceCloneId，聊天语音条会用复刻音色。
 *
 * 使用（在服务器项目根目录，需能访问后端 API）：
 *   export TEST_BASE_URL="https://brightagent.cn"
 *   export LAODA_OWNER_EMAIL="tmxiand@gmail.com"
 *   export LAODA_OWNER_PASSWORD="你的密码"
 *   node scripts/enroll-laoda-voice.mjs
 *
 * LAODA_OWNER 必须是该 Agent 在库里的「创建者」账号。
 * 脚本 create-laoda 写的是 seller@demo.com；若你在网页创建或历史数据是 tmxiand@gmail.com，请用对应邮箱。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const VOICE_FILE = path.join(ROOT, "voice_samples", "laoda_reference", "laoda_voice.mp3");

const LAODA_AGENT_ID = "10000000-0000-0000-0000-000000000002";

const BASE = process.env.TEST_BASE_URL || "http://localhost:8080";
const EMAIL = process.env.LAODA_OWNER_EMAIL || "tmxiand@gmail.com";
const PASSWORD = process.env.LAODA_OWNER_PASSWORD || "";

function parseCookie(setCookie) {
  if (!setCookie) return "";
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!first || typeof first !== "string") return "";
  return first.split(";")[0].trim();
}

async function req(method, p, body, cookie = "") {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie && { Cookie: cookie }),
    },
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE.replace(/\/$/, "")}${p}`, opts);
  const setCookie = res.headers.get("set-cookie") || res.headers.getSetCookie?.();
  const ct = res.headers.get("content-type") || "";
  let data = {};
  if (ct.includes("application/json")) data = await res.json().catch(() => ({}));
  const nextCookie = setCookie ? parseCookie(setCookie) : cookie;
  return { ok: res.ok, status: res.status, data, cookie: nextCookie };
}

async function main() {
  console.log("=== 活泼牢大 音色复刻上传 ===\n");
  console.log("BASE:", BASE);
  console.log("Agent ID:", LAODA_AGENT_ID);

  if (!PASSWORD) {
    console.error("请设置环境变量 LAODA_OWNER_PASSWORD（卖家账号密码）");
    process.exit(1);
  }
  if (!fs.existsSync(VOICE_FILE)) {
    console.error("未找到:", VOICE_FILE);
    process.exit(1);
  }

  const buf = fs.readFileSync(VOICE_FILE);
  const voiceSampleBase64 = `data:audio/mpeg;base64,${buf.toString("base64")}`;
  console.log("样本:", VOICE_FILE, `(${(buf.length / 1024).toFixed(1)} KB)\n`);

  const loginRes = await req("POST", "/api/auth/login", { email: EMAIL, password: PASSWORD });
  if (!loginRes.ok) {
    console.error("登录失败", loginRes.status, loginRes.data);
    process.exit(1);
  }

  const patchRes = await req(
    "PATCH",
    `/api/life-agents/${LAODA_AGENT_ID}`,
    { voiceSampleBase64 },
    loginRes.cookie
  );
  if (!patchRes.ok) {
    console.error("上传失败", patchRes.status, patchRes.data);
    if (patchRes.status === 403) console.error("（当前账号不是该 Agent 的创建者，请换卖家账号）");
    process.exit(1);
  }

  const vid = patchRes.data.voiceCloneId;
  console.log("✅ 完成");
  if (vid) console.log("voiceCloneId:", vid);
  else console.log("未返回 voiceCloneId：请确认后端 TTS 为 dashscope 且百炼声音复刻配置正确");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
