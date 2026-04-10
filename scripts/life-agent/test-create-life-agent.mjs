/**
 * 本地测试「创建人生 Agent」API（无需打开浏览器）
 *
 * 使用方式：
 *   1. 先启动本地服务：docker compose up -d  （或单独启动 mysql + backend + frontend）
 *   2. 运行：node scripts/life-agent/test-create-life-agent.mjs
 *
 * 演示账号：seller@demo.com / buyer@demo.com，密码：password123
 */
const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

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
  const data = await res.json().catch(() => ({}));
  const nextCookie = setCookie ? parseCookie(setCookie) : cookie;
  return { ok: res.ok, status: res.status, data, cookie: nextCookie };
}

const MINIMAL_CREATE_PAYLOAD = {
  displayName: "测试Agent",
  headline: "本地测试用的一句话介绍",
  shortBio: "简短介绍，用于测试创建流程。",
  longBio: "详细背景，描述经历和擅长领域，至少一段话。",
  audience: "大学生、职场新人",
  welcomeMessage: "你好，有什么想问的？",
  pricePerQuestion: 500,
  personaArchetype: "过来人型",
  toneStyle: "像朋友聊天",
  responseStyle: "先理解处境再建议",
  expertiseTags: ["测试", "求职"],
  sampleQuestions: ["第一个示例问题？", "第二个示例问题？"],
  exampleReplies: [
    "按我的经验，先把最关键的一步跑通，后面再慢慢修。",
    "这个问题我当时的做法是，先别急着追求完美，把第一步做好再说。",
  ],
  exampleReplies: [
    "按我自己的经历看，先把最关键的一步跑通再说。",
    "这个问题我经历过，建议你先别急着追求完美，一步步来。",
  ],
  knowledgeEntries: [
    {
      category: "经验",
      title: "测试经验1",
      content: "第一条知识条目的具体内容，需要有实际内容。",
      tags: ["经验"],
    },
    {
      category: "经验",
      title: "测试经验2",
      content: "第二条知识条目的具体内容，需要有实际内容。",
      tags: ["经验"],
    },
  ],
};

async function main() {
  const email = process.env.TEST_EMAIL || "seller@demo.com";
  const password = process.env.TEST_PASSWORD || "password123";

  console.log("1. 登录", email, "...");
  const login = await req("POST", "/api/auth/login", { email, password });
  if (!login.ok) {
    console.error("登录失败:", login.data);
    process.exit(1);
  }
  const cookie = login.cookie;
  if (!cookie) {
    console.error("未获取到 session cookie");
    process.exit(1);
  }
  console.log("   登录成功");

  console.log("2. 创建人生 Agent ...");
  const create = await req("POST", "/api/life-agents", MINIMAL_CREATE_PAYLOAD, cookie);
  if (!create.ok) {
    console.error("创建失败:", create.status, create.data);
    process.exit(1);
  }
  console.log("   Agent 已创建，ID:", create.data.id);
  console.log("\n✓ 测试通过");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
