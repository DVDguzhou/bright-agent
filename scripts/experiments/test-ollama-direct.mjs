/**
 * 直接调用 Ollama，模拟 Life Agent 的 prompt，查看模型原始回复
 * 不需要 MySQL、backend，只要有 Ollama 即可
 *
 * 使用：node scripts/experiments/test-ollama-direct.mjs
 * 可选：TEST_QUESTION="你的问题" node scripts/experiments/test-ollama-direct.mjs
 */
const BASE = process.env.OLLAMA_BASE || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "qwen3.5:4b";
const QUESTION = process.env.TEST_QUESTION || "你是谁";

// 与 test-profile-memory.mjs 一致的 profile + 知识库
const PROFILE = {
  displayName: "记忆测试小明",
  headline: "2023年北京创业大赛第三名，做本地生活项目的过来人",
  audience: "想参加创业比赛的大学生",
  welcomeMessage: "你好，我是小明，可以问我比赛相关的事。",
  personaArchetype: "冷静分析型",
  toneStyle: "直接一点",
  responseStyle: "先给判断再解释",
  mbti: "ISTJ",
  forbiddenPhrases: ["希望这些对你有帮助", "保持积极心态"],
  exampleReplies: [
    "按我当时参赛的经验，评委最看重的是落地可行性，不是点子多炫。",
    "我那次能拿第三，主要是因为展示的数据和案例都比较实在。",
  ],
};

const ENTRIES = [
  {
    title: "北京创业大赛经历",
    category: "经验",
    content:
      "2023年参加北京创业大赛，项目是本地生活类，最终获得第三名。评委主要问了商业模式和团队构成，我当时重点讲了数据验证和用户反馈。",
  },
  {
    title: "路演准备心得",
    category: "经验",
    content:
      "路演时不要讲太多概念，多讲具体做了什么、用户数据、下一步计划。评委时间有限，最烦冗长的铺垫。",
  },
];

function buildSystemPrompt() {
  const lines = [
    `你是「${PROFILE.displayName}」，你不是通用 AI 助手，你是一个真实的人在用自己的经历和知识跟人聊天。`,
    "",
    "【事实边界 - 不可逾越】",
    "你的名字、学历、工作、经历、时间地点人物等事实，必须且仅能来自下方【身份信息】和【知识库】。知识库没有的一律说「这个我不太清楚」「我没有这方面的经验」，绝对不要编造。",
    "",
    "【核心目标】直接回答用户的问题。用户问什么就答什么，不要绕弯子。",
    "【回答原则】用户问「XXX叫什么」时，直接答名称（如「北京创业大赛」），绝不要用条目标题（如「北京创业大赛经历」）做开头。",
    "",
    "【风格约束】",
    `角色原型: ${PROFILE.personaArchetype}`,
    `MBTI: ${PROFILE.mbti}`,
    `语气: ${PROFILE.toneStyle}`,
    `回答习惯: ${PROFILE.responseStyle}`,
    "",
    "【身份信息】",
    `名字: ${PROFILE.displayName}`,
    `一句话介绍: ${PROFILE.headline}`,
    "",
    "--- 知识库 ---",
    ...ENTRIES.map((e) => `[${e.title}]（${e.category}）\n${e.content}`),
    "",
    "只输出自然聊天文本，不要分点或标题。",
  ];
  return lines.join("\n");
}

async function main() {
  console.log(`=== 直接测试 Ollama 模型回复 ===`);
  console.log(`模型: ${MODEL}`);
  console.log(`问题: ${QUESTION}\n`);

  const systemPrompt = buildSystemPrompt();
  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `直接回答这个问题，知识库里有就说，没有就说不知道：\n${QUESTION}` },
    ],
    stream: false,
    options: { temperature: 0.4 },
  };

  try {
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "(无回复)";

    console.log("--- 模型回复 ---");
    console.log(reply);
    console.log("\n--- 结束 ---");
  } catch (err) {
    console.error("错误:", err.message);
    console.error("请确认 Ollama 已启动，且已 pull", MODEL);
    process.exit(1);
  }
}

main();
