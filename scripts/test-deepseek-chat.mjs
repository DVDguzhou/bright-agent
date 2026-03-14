/**
 * 测试 DeepSeek AI 聊天是否正常工作
 *
 * 使用：node scripts/test-deepseek-chat.mjs
 * 可选环境变量：
 *   TEST_BASE_URL  默认 http://localhost:8080（直接走后端）
 *   TEST_QUESTION  自定义提问
 */
const BASE = process.env.TEST_BASE_URL || "http://backend:8080";

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

async function loginOrSignup(email, password, name) {
  let r = await req("POST", "/api/auth/login", { email, password });
  if (r.ok) return r;
  r = await req("POST", "/api/auth/signup", { email, password, name });
  return r;
}

const AGENT_PAYLOAD = {
  displayName: "考研老王",
  headline: "985计算机硕士，三个月上岸选手",
  shortBio: "本科双非，跨考985计算机，总分410+上岸。擅长分享高效备考方法和心态调节。",
  longBio: "大三决定考研，目标是北京某985计算机专业。备考过程踩过不少坑，最后三个月冲刺阶段找到了节奏，初试410+顺利上岸。现在读研中，回头看那段经历收获很大。",
  audience: "准备考研的同学",
  welcomeMessage: "有什么考研相关的问题尽管问，能帮的我一定帮。",
  pricePerQuestion: 5,
  personaArchetype: "务实学长型",
  toneStyle: "直接、实在、不灌鸡汤",
  responseStyle: "先给结论再展开",
  mbti: "INTJ",
  forbiddenPhrases: ["加油你一定可以的", "相信自己"],
  exampleReplies: [
    "数学这块别死磕偏题怪题，把真题近15年刷三遍比啥都强。",
    "政治不用太早开始，9月份跟肖秀荣完全来得及，重点是选择题。",
    "专业课408的话，数据结构和计组是大头，操作系统其次，计网最后背就行。",
  ],
  expertiseTags: ["考研", "计算机", "备考方法", "心态"],
  sampleQuestions: ["考研数学怎么复习？", "专业课408难吗？", "最后三个月怎么安排？"],
  knowledgeEntries: [
    {
      category: "备考方法",
      title: "数学复习策略",
      content: "数学我是跟张宇的基础班入门，然后李永乐的线代讲义，概率论用的浙大教材。真题从9月开始刷，近15年的做了三遍。第一遍按年份，第二遍按题型，第三遍只做错题。最后一个月每周模拟一次，严格计时。",
      tags: ["数学", "复习"],
    },
    {
      category: "备考方法",
      title: "专业课408复习",
      content: "408四门课里数据结构最重要，分值最高也最容易拿分。王道的书配视频过一遍，然后刷真题。计组比较抽象，需要反复看。操作系统理解了就不难。计网最简单，最后一个月集中背就行。",
      tags: ["专业课", "408"],
    },
    {
      category: "心态调节",
      title: "备考心态管理",
      content: "考研最难的不是知识本身，是坚持。我中间有两周完全学不进去，后来调整了作息，每天固定6点起11点睡，中午午休半小时。状态不好就去操场跑两圈，别硬撑。另外少刷考研论坛，焦虑会传染。",
      tags: ["心态", "坚持"],
    },
    {
      category: "时间规划",
      title: "最后三个月冲刺安排",
      content: "最后三个月我的安排是：上午数学3小时（真题+错题），下午专业课3小时，晚上政治2小时+英语1小时。周末做整套模拟。每周日晚上复盘一周进度，调整下周计划。",
      tags: ["冲刺", "时间管理"],
    },
  ],
};

async function main() {
  const ts = Date.now();
  const sellerEmail = process.env.TEST_EMAIL || `test-seller-${ts}@test.com`;
  const buyerEmail = process.env.TEST_BUYER || `test-buyer-${ts}@test.com`;
  const password = "Test123456";

  const questions = [
    process.env.TEST_QUESTION || "考研数学最后两个月怎么复习比较好？",
    "专业课408有什么复习建议吗？",
    "感觉坚持不下去了怎么办？",
  ];

  console.log("=== 测试：DeepSeek AI 聊天 ===\n");

  // 1. 卖家登录/注册 + 创建 Agent
  console.log("1️⃣  登录/注册卖家", sellerEmail);
  const sellerLogin = await loginOrSignup(sellerEmail, password, "测试卖家");
  if (!sellerLogin.ok) {
    console.error("   ❌ 卖家登录/注册失败:", sellerLogin.data);
    process.exit(1);
  }
  const sellerCookie = sellerLogin.cookie;
  console.log("   ✅ 卖家就绪");

  console.log("   创建「考研老王」...");
  const create = await req("POST", "/api/life-agents", AGENT_PAYLOAD, sellerCookie);
  if (!create.ok) {
    console.error("   ❌ 创建失败:", create.status, create.data);
    process.exit(1);
  }
  const agentId = create.data.id;
  console.log("   ✅ Agent ID:", agentId, "\n");

  // 2. 买家登录/注册 + 购买
  console.log("2️⃣  登录/注册买家", buyerEmail);
  const buyerLogin = await loginOrSignup(buyerEmail, password, "测试买家");
  if (!buyerLogin.ok) {
    console.error("   ❌ 买家登录/注册失败:", buyerLogin.data);
    process.exit(1);
  }
  const buyerCookie = buyerLogin.cookie;
  console.log("   ✅ 买家就绪");

  const purchase = await req(
    "POST",
    `/api/life-agents/${agentId}/purchase`,
    { questionCount: questions.length, amountPaid: 5 * questions.length },
    buyerCookie
  );
  if (!purchase.ok) {
    console.error("   ❌ 购买失败:", purchase.status, purchase.data);
    process.exit(1);
  }
  console.log("   ✅ 购买成功，额度:", purchase.data.remainingQuestions, "次\n");

  // 3. 逐条提问并检查回复
  let allPassed = true;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`3️⃣ -${i + 1} 提问: "${q}"`);
    const t0 = Date.now();
    const chat = await req(
      "POST",
      `/api/life-agents/${agentId}/chat`,
      { message: q },
      buyerCookie
    );
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    if (!chat.ok) {
      console.error(`   ❌ 聊天失败 (${elapsed}s):`, chat.status, chat.data);
      allPassed = false;
      continue;
    }

    const reply = chat.data.reply || "";
    const refs = chat.data.references || [];
    console.log(`   ⏱  耗时: ${elapsed}s`);
    console.log(`   📝 回复: ${reply.slice(0, 200)}${reply.length > 200 ? "..." : ""}`);
    console.log(`   📎 引用: ${refs.length} 条`);

    // 检查是否是模板回复（每次都一样的 fallback）
    const fallbackPatterns = [
      "我是考研老王。",
      "这个我不敢瞎猜",
      "我的知识库里还没有",
    ];
    const isFallback = fallbackPatterns.some((p) => reply.startsWith(p));
    if (isFallback) {
      console.log("   ⚠️  疑似 fallback 模板回复，AI 可能未生效");
      allPassed = false;
    } else if (reply.length < 20) {
      console.log("   ⚠️  回复太短，可能有问题");
      allPassed = false;
    } else {
      console.log("   ✅ 回复看起来正常");
    }
    console.log();
  }

  // 4. 总结
  console.log("=== 结果 ===");
  if (allPassed) {
    console.log("✅ 所有测试通过，DeepSeek AI 聊天正常工作！");
  } else {
    console.log("⚠️  部分测试未通过，请检查后端日志：");
    console.log("   docker logs regr-backend-1 2>&1 | grep LLM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
