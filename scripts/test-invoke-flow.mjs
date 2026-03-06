/**
 * 测试「借用别人 Agent」全流程
 * 1. 登录 2. 直接调用 Demo Agent 3. 支付托管 4. 等待自动交付 5. 验收
 */
const BASE = "http://localhost:3000";

async function req(method, path, body, cookies = "") {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookies && { Cookie: cookies }),
    },
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const setCookie = res.headers.get("set-cookie");
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data, cookies: setCookie || cookies };
}

async function main() {
  console.log("1. 登录 owner@demo.com ...");
  const login = await req("POST", "/api/auth/login", {
    email: "owner@demo.com",
    password: "password123",
  });
  if (!login.ok) {
    console.error("登录失败", login.data);
    process.exit(1);
  }
  const cookies = login.cookies;
  if (!cookies) {
    console.error("未获取到 session cookie，请检查登录 API");
    process.exit(1);
  }
  const sessionCookie = cookies.includes(";") ? cookies.split(";")[0] : cookies;
  const authCookie = sessionCookie;

  console.log("2. 直接调用 Demo Agent ...");
  const demoAgentId = "00000000-0000-0000-0000-000000000001";
  const invoke = await req(
    "POST",
    `/api/agents/${demoAgentId}/invoke`,
    {
      title: "测试：获取 30 款 TikTok 美妆选品",
      problemStatement: "区域 US，$10–40",
      budget: 5000,
      scope: { records_target: 30, geography: "US" },
    },
    authCookie
  );
  if (!invoke.ok) {
    console.error("调用失败", invoke.data);
    process.exit(1);
  }
  const taskId = invoke.data.id;
  console.log("  任务已创建:", taskId);

  console.log("3. 支付托管 ...");
  const fund = await req("POST", `/api/tasks/${taskId}/fund`, {}, authCookie);
  if (!fund.ok) {
    console.error("支付失败", fund.data);
    process.exit(1);
  }
  console.log("  托管已支付，Demo Agent 将自动执行...");

  console.log("4. 等待 3 秒（Agent 执行中）...");
  await new Promise((r) => setTimeout(r, 3000));

  console.log("5. 检查任务状态 ...");
  const taskRes = await fetch(`${BASE}/api/tasks/${taskId}`, {
    headers: { Cookie: authCookie },
  });
  const task = await taskRes.json();
  console.log("  状态:", task.status);
  if (task.deliveries?.length > 0) {
    console.log("  交付已提交:", task.deliveries[0].payload?.report_md?.slice(0, 80) + "...");
  }

  if (task.status === "DELIVERED") {
    console.log("\n✓ 测试通过！Demo Agent 已自动执行并提交交付");
    console.log("  下一步：登录 owner@demo.com，在任务页点击「接受交付」完成流程");
  } else if (task.status === "IN_PROGRESS") {
    console.log("\n? 任务仍在执行中，Demo Agent 可能未正确回调，请检查 /api/demo-agent/run");
  } else {
    console.log("\n  当前状态:", task.status);
  }
}

main().catch(console.error);
