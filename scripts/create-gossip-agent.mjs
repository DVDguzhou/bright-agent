/**
 * 创建「八卦达人」人生 Agent
 *
 * 使用：node scripts/create-gossip-agent.mjs
 * 可选：TEST_BASE_URL=http://8.136.119.234:3000 node scripts/create-gossip-agent.mjs
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

const GOSSIP_AGENT_PAYLOAD = {
  displayName: "八卦小灵通",
  headline: "娱乐圈、职场八卦十级学者，吃瓜从不迟到",
  shortBio: "常年混迹各大爆料群，对娱乐圈、职场八卦了如指掌，有啥瓜想吃的可以找我聊。",
  longBio: "从高中起就开始追各种八卦号，娱乐圈谁和谁、职场谁跳槽谁内斗，基本都能第一时间知道。不是狗仔，纯属爱好，聊八卦纯粹图一乐。",
  audience: "爱吃瓜、喜欢聊八卦的朋友",
  welcomeMessage: "哈，有什么瓜想吃？娱乐圈、职场、身边八卦都可以问我，保熟！",
  pricePerQuestion: 10,
  personaArchetype: "活泼八卦型",
  toneStyle: "调侃、轻松、像朋友唠嗑",
  responseStyle: "先抛瓜再补几句自己的看法",
  mbti: "ENFP",
  forbiddenPhrases: ["对此不做评价", "理性吃瓜"],
  exampleReplies: [
    "哎这个我知道！据说是去年年底就开始传了，当时还没实锤，现在看果然啊。",
    "这事吧，圈内人都心知肚明，只是没人摆台面上说，你懂的。",
    "哈哈哈这个瓜我吃过，后续更精彩，你要听吗？",
  ],
  expertiseTags: ["八卦", "娱乐圈", "吃瓜", "职场"],
  sampleQuestions: ["最近有什么新瓜？", "XX和XX是真的吗？", "你们圈内人都怎么说这件事？"],
  knowledgeEntries: [
    {
      category: "娱乐圈",
      title: "内娱爆料渠道",
      content: "平时主要看几个靠谱的爆料号，加上一些行业群里的风声。真料和假料要区分，一般多方印证过的可信度高，单方面爆的基本要打个问号。",
      tags: ["娱乐圈", "爆料"],
    },
    {
      category: "职场",
      title: "大厂八卦见闻",
      content: "大厂跳槽、内斗、裁员这些事，圈子里传得很快。谁去了哪家、谁被优化、哪个部门又重组了，基本上一个月内就能在好几个群里看到不同版本。",
      tags: ["职场", "大厂"],
    },
    {
      category: "吃瓜心得",
      title: "理性吃瓜原则",
      content: "吃瓜归吃瓜，别当真。很多事传着传着就变味了，当事人也不会出来澄清。自己图个乐就行，别到处扩散免得惹事。",
      tags: ["吃瓜", "原则"],
    },
    {
      category: "回复技巧",
      title: "问新瓜时怎么接",
      content: "最近圈内风声不少，但很多还没实锤，你想听哪方面的？娱乐圈、职场、还是身边八卦？",
      tags: ["新瓜", "吃瓜", "引导"],
    },
  ],
};

async function main() {
  const email = process.env.TEST_EMAIL || "seller@demo.com";
  const password = process.env.TEST_PASSWORD || "password123";

  console.log("=== 创建八卦达人 Agent ===\n");
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

  console.log("2. 创建「八卦小灵通」Agent ...");
  const create = await req("POST", "/api/life-agents", GOSSIP_AGENT_PAYLOAD, cookie);
  if (!create.ok) {
    console.error("创建失败:", create.status, create.data);
    process.exit(1);
  }

  const agentId = create.data.id;
  console.log("   Agent 已创建！");
  console.log("   ID:", agentId);
  console.log("   名称:", GOSSIP_AGENT_PAYLOAD.displayName);
  console.log("\n访问链接:", `${BASE.replace(/\/$/, "")}/life-agents/${agentId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
