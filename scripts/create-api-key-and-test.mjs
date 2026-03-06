/**
 * 一键测试：登录 → 创建 API Key → 用 Key 本地调用 Agent
 * 用于验证「个人本地借用他人 Agent」流程
 */
const BASE = "http://localhost:3000";

async function main() {
  console.log("1. 登录 owner@demo.com ...");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@demo.com", password: "password123" }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error("登录失败", loginData);
    process.exit(1);
  }
  const setCookie = loginRes.headers.get("set-cookie");
  const sessionCookie = setCookie?.split(";")[0] || "";
  if (!sessionCookie) {
    console.error("未获取 session，请检查登录响应");
    process.exit(1);
  }

  console.log("2. 创建平台 API Key ...");
  const keyRes = await fetch(`${BASE}/api/user-api-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({ name: "本地测试 Key" }),
  });
  const keyData = await keyRes.json();
  if (!keyRes.ok) {
    console.error("创建 Key 失败", keyData);
    process.exit(1);
  }
  const apiKey = keyData.key;
  console.log("  已创建 Key:", apiKey.slice(0, 16) + "...");

  console.log("3. 使用 Key 本地调用 Demo Agent ...");
  process.env.PLATFORM_API_KEY = apiKey;
  process.env.PLATFORM_URL = BASE;
  await import("./local-invoke-example.mjs");
}

main().catch(console.error);
