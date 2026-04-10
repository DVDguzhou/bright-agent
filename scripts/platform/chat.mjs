#!/usr/bin/env node
/**
 * 交互式聊天测试 —— 模拟生产环境对话
 *
 * 用法：
 *   # 列出所有 Agent
 *   node scripts/platform/chat.mjs --list
 *
 *   # 跟某个 Agent 聊天（交互模式）
 *   node scripts/platform/chat.mjs --agent <AGENT_ID>
 *
 *   # 单条消息模式（不进入交互）
 *   node scripts/platform/chat.mjs --agent <AGENT_ID> --msg "考研数学怎么复习？"
 *
 * 环境变量：
 *   TEST_BASE_URL  后端地址，默认 http://backend:8080
 *   TEST_EMAIL     登录邮箱，默认 buyer@demo.com
 *   TEST_PASSWORD  登录密码，默认 password123（与 db:seed / create:laoda 中买家一致）
 */
import { createInterface } from "node:readline";

const BASE = process.env.TEST_BASE_URL || "http://backend:8080";

// ---------- HTTP helpers ----------
function parseCookie(setCookie) {
  if (!setCookie) return "";
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!first || typeof first !== "string") return "";
  return first.split(";")[0].trim();
}

let _cookie = "";
async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(_cookie && { Cookie: _cookie }),
    },
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const sc = res.headers.get("set-cookie") || res.headers.getSetCookie?.();
  if (sc) _cookie = parseCookie(sc) || _cookie;
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ---------- Auth ----------
async function login(email, password) {
  let r = await api("POST", "/api/auth/login", { email, password });
  if (r.ok) return true;
  r = await api("POST", "/api/auth/signup", { email, password, name: email.split("@")[0] });
  return r.ok;
}

// ---------- Parse args ----------
function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}
const hasFlag = (f) => process.argv.includes(f);

// ---------- Main ----------
async function main() {
  const email = process.env.TEST_EMAIL || "buyer@demo.com";
  const password = process.env.TEST_PASSWORD || "password123";

  console.log(`\n🔑 登录 ${email} ...`);
  if (!(await login(email, password))) {
    console.error("❌ 登录失败，请检查 TEST_EMAIL / TEST_PASSWORD");
    process.exit(1);
  }
  console.log("✅ 登录成功\n");

  // --list: 列出所有 Agent
  if (hasFlag("--list")) {
    const r = await api("GET", "/api/life-agents");
    if (!r.ok) { console.error("获取列表失败:", r.data); process.exit(1); }
    const agents = r.data.profiles || r.data || [];
    if (agents.length === 0) { console.log("暂无 Agent"); return; }
    console.log("可用的 Agent：\n");
    for (const a of agents) {
      console.log(`  📌 ${a.displayName || a.display_name}`);
      console.log(`     ID: ${a.id}`);
      console.log(`     ${a.headline || ""}\n`);
    }
    console.log("使用：node scripts/platform/chat.mjs --agent <ID>");
    return;
  }

  // --agent: 聊天
  const agentId = getArg("--agent");
  if (!agentId) {
    console.log("用法：");
    console.log("  node scripts/platform/chat.mjs --list              列出所有 Agent");
    console.log("  node scripts/platform/chat.mjs --agent <ID>        交互式聊天");
    console.log('  node scripts/platform/chat.mjs --agent <ID> --msg "你好"  单条消息');
    return;
  }

  // 获取 Agent 信息
  const info = await api("GET", `/api/life-agents/${agentId}`);
  if (!info.ok) { console.error("❌ Agent 不存在:", agentId); process.exit(1); }
  const name = info.data.displayName || info.data.display_name || "Agent";
  console.log(`💬 开始和「${name}」聊天\n`);

  // 确保有提问额度
  async function ensureQuota() {
    const price = info.data.pricePerQuestion || info.data.price_per_question || 5;
    const r = await api("POST", `/api/life-agents/${agentId}/purchase`, {
      questionCount: 50, amountPaid: price * 50,
    });
    if (r.ok) console.log("  💰 已补充 50 次提问额度");
  }
  await ensureQuota();

  // 发送一条消息的函数
  async function sendMessage(msg) {
    const t0 = Date.now();
    process.stdout.write(`\n🤖 ${name}: `);
    let r = await api("POST", `/api/life-agents/${agentId}/chat`, { message: msg });
    // 额度不足时自动购买并重试
    if (!r.ok && r.status === 402) {
      await ensureQuota();
      r = await api("POST", `/api/life-agents/${agentId}/chat`, { message: msg });
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    if (!r.ok) {
      console.log(`\n❌ 请求失败 (${r.status}):`, r.data);
      return;
    }
    const reply = r.data.reply || r.data.content || "(空回复)";
    const refs = r.data.references || [];
    console.log(reply);
    if (refs.length > 0) {
      console.log(`\n  📎 引用 ${refs.length} 条知识：`);
      for (const ref of refs) {
        console.log(`     - [${ref.category}] ${ref.title}: ${ref.excerpt || ""}`);
      }
    }
    console.log(`  ⏱  ${elapsed}s`);
  }

  // --msg: 单条消息模式
  const singleMsg = getArg("--msg");
  if (singleMsg) {
    console.log(`👤 你: ${singleMsg}`);
    await sendMessage(singleMsg);
    return;
  }

  // 交互模式
  console.log("输入消息后回车发送，输入 q 退出\n");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () => rl.question("👤 你: ", async (input) => {
    const msg = input.trim();
    if (!msg || msg === "q" || msg === "quit" || msg === "exit") {
      console.log("\n👋 再见");
      rl.close();
      return;
    }
    await sendMessage(msg);
    console.log();
    prompt();
  });
  prompt();
}

main().catch((err) => { console.error(err); process.exit(1); });
