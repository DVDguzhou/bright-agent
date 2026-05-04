/**
 * 测试 Step 2 Topic 选择和 LLM 追问功能
 *
 * 使用：node scripts/experiments/test-topic-followup.mjs
 * 会从项目根目录 .env 读取 TEST_BASE_URL（默认 http://localhost:8080）
 * 可选：TEST_TOPIC="experience|personality|daily" 指定测试的 topic
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:8080";
const TEST_TOPIC = process.env.TEST_TOPIC || "experience";

async function testTopicFollowup() {
  console.log("=== 测试 Step 2 Topic 选择和 LLM 追问 ===\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`测试 Topic: ${TEST_TOPIC}\n`);

  // 模拟用户选择 topic 后的请求
  const payload = {
    basicInfo: {
      displayName: "测试用户",
      headline: "测试 Agent",
      shortBio: "这是一个测试 Agent"
    },
    chatHistory: [
      { role: "assistant", content: "为了帮你打造更像你的 Agent，请先选择一个方向开始：" },
      { role: "user", content: TEST_TOPIC === "experience" ? "真实经历" : TEST_TOPIC === "personality" ? "性格兴趣" : "日常生活" }
    ],
    knowledgeEntries: [],
    topic: TEST_TOPIC
  };

  console.log("发送请求到 /api/life-agents/create/next-question");
  console.log("请求体:", JSON.stringify(payload, null, 2));
  console.log("\n--- 请求中 ---\n");

  try {
    const res = await fetch(`${BASE_URL}/api/life-agents/create/next-question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`响应非 JSON: ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data, null, 2)}`);
    }

    console.log("--- 响应结果 ---");
    console.log(`done: ${data.done}`);
    console.log(`nextQuestion: ${data.nextQuestion || "(无)"}`);
    if (data.questionDimension) {
      console.log(`questionDimension: ${data.questionDimension}`);
    }
    if (data.extractedTone) {
      console.log(`extractedTone: ${JSON.stringify(data.extractedTone, null, 2)}`);
    }
    if (data.suggestedTags?.length) {
      console.log(`suggestedTags: ${data.suggestedTags.join(", ")}`);
    }
    if (data.knowledgeAdd?.length) {
      console.log(`knowledgeAdd: ${data.knowledgeAdd.length} 条`);
    }
    if (data.factCandidates?.length) {
      console.log(`factCandidates: ${data.factCandidates.length} 条`);
    }

    console.log("\n✅ API 调用成功！");

    // 检查是否是 LLM 返回的动态追问
    if (data.nextQuestion && !data.nextQuestion.includes("可以举个具体的例子吗？")) {
      console.log("\n✨ 返回的是 LLM 动态追问（不是 fallback）");
    } else if (data.nextQuestion) {
      console.log("\n⚠️  返回的可能是 fallback 追问");
    } else {
      console.log("\n⚠️  没有返回追问");
    }

  } catch (err) {
    console.error("❌ 错误:", err.message);
    process.exit(1);
  }
}

testTopicFollowup();
