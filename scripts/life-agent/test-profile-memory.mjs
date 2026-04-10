/**
 * 测试模型是否记住了 Agent 的 profile 配置（名称、语气、知识库、禁止套话等）
 *
 * 流程：创建带明显特征的 Agent → 购买额度 → 发起聊天 → 输出回复供人工核对
 *
 * 使用：node scripts/life-agent/test-profile-memory.mjs
 * 可选：TEST_EMAIL=buyer@demo.com node scripts/life-agent/test-profile-memory.mjs（用 buyer 购买后聊天）
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

// 带明显特征的 Agent，便于人工核对模型是否「记住」
const PROFILE_TEST_PAYLOAD = {
  displayName: "记忆测试小明",
  headline: "2023年北京创业大赛第三名，做本地生活项目的过来人",
  shortBio: "参加过创业比赛，有一点实战经验，愿意分享。",
  longBio: "2023年参加北京创业大赛，做的是本地生活类项目，拿了第三名。经历过从零到一的阶段。",
  audience: "想参加创业比赛的大学生",
  welcomeMessage: "你好，我是小明，可以问我比赛相关的事。",
  pricePerQuestion: 1, // 1分便于测试购买
  mbti: "ISTJ", // 冷静、务实，配合 persona/tone 让人设更立体
  personaArchetype: "冷静分析型",
  toneStyle: "直接一点",
  responseStyle: "先给判断再解释",
  forbiddenPhrases: ["希望这些对你有帮助", "保持积极心态"],
  exampleReplies: [
    "按我当时参赛的经验，评委最看重的是落地可行性，不是点子多炫。",
    "我那次能拿第三，主要是因为展示的数据和案例都比较实在。",
  ],
  expertiseTags: ["创业比赛", "本地生活", "路演"],
  sampleQuestions: ["创业比赛评委看重什么？", "你当时怎么准备的？"],
  knowledgeEntries: [
    {
      category: "经验",
      title: "北京创业大赛经历",
      content: "2023年参加北京创业大赛，项目是本地生活类，最终获得第三名。评委主要问了商业模式和团队构成，我当时重点讲了数据验证和用户反馈。",
      tags: ["创业", "比赛"],
    },
    {
      category: "经验",
      title: "路演准备心得",
      content: "路演时不要讲太多概念，多讲具体做了什么、用户数据、下一步计划。评委时间有限，最烦冗长的铺垫。",
      tags: ["路演", "准备"],
    },
  ],
};

async function main() {
  const sellerEmail = process.env.TEST_EMAIL || "seller@demo.com";
  const buyerEmail = process.env.TEST_BUYER || "buyer@demo.com";
  const password = process.env.TEST_PASSWORD || "password123";

  console.log("=== 测试：模型是否记住 Agent 的 profile 配置 ===\n");

  // 1. 用 seller 登录，创建 Agent
  console.log("1. 登录", sellerEmail, "并创建 Agent ...");
  const sellerLogin = await req("POST", "/api/auth/login", {
    email: sellerEmail,
    password,
  });
  if (!sellerLogin.ok) {
    console.error("   seller 登录失败:", sellerLogin.data);
    process.exit(1);
  }
  const sellerCookie = sellerLogin.cookie;
  if (!sellerCookie) {
    console.error("   未获取到 session cookie");
    process.exit(1);
  }

  const create = await req("POST", "/api/life-agents", PROFILE_TEST_PAYLOAD, sellerCookie);
  if (!create.ok) {
    console.error("   创建失败:", create.status, create.data);
    process.exit(1);
  }
  const agentId = create.data.id;
  console.log("   Agent 已创建，ID:", agentId);
  console.log("   配置摘要: 名称=" + PROFILE_TEST_PAYLOAD.displayName + ", 知识库含「北京创业大赛第三名」\n");

  // 2. 用 buyer 登录，购买额度
  console.log("2. 登录", buyerEmail, "并购买 1 次提问额度 ...");
  const buyerLogin = await req("POST", "/api/auth/login", {
    email: buyerEmail,
    password,
  });
  if (!buyerLogin.ok) {
    console.error("   buyer 登录失败:", buyerLogin.data);
    process.exit(1);
  }
  const buyerCookie = buyerLogin.cookie;

  const purchase = await req(
    "POST",
    `/api/life-agents/${agentId}/purchase`,
    { questionCount: 1, amountPaid: 1 },
    buyerCookie
  );
  if (!purchase.ok) {
    console.error("   购买失败:", purchase.status, purchase.data);
    process.exit(1);
  }
  console.log("   购买成功，剩余:", purchase.data.remainingQuestions, "次\n");

  // 3. 发起聊天（问题设计成会触发知识库内容）
  const testQuestion =
    process.env.TEST_QUESTION || "你参加的创业大赛叫什么";
  console.log("3. 发起聊天，提问:", testQuestion);
  const chat = await req(
    "POST",
    `/api/life-agents/${agentId}/chat`,
    { message: testQuestion },
    buyerCookie
  );
  if (!chat.ok) {
    console.error("   聊天失败:", chat.status, chat.data);
    process.exit(1);
  }
  const reply = chat.data.reply;

  // 4. 输出结果供人工核对
  console.log("\n--- Agent 回复 ---");
  console.log(reply);
  console.log("\n--- 核对要点 ---");
  console.log("□ 回复是否自称「小明」或类似身份？");
  console.log("□ 是否提到「北京创业大赛」「第三名」等知识库内容？");
  console.log("□ 语气是否偏「冷静分析」「直接」？");
  console.log("□ 是否未出现禁止套话：「希望这些对你有帮助」「保持积极心态」？");
  console.log("\n若以上基本符合，则模型成功记住了 profile 配置。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
