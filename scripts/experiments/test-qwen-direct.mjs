/**
 * 直接调用通义千问 DashScope API，测试 qwen3.5-plus 是否可用
 *
 * 使用：node scripts/experiments/test-qwen-direct.mjs
 * 会从项目根目录 .env 读取 OPENAI_API_KEY、OPENAI_BASE_URL
 * 可选：TEST_QUESTION="你的问题" node scripts/experiments/test-qwen-direct.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const BASE_URL = process.env.OPENAI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.TEST_QWEN_MODEL || "qwen3.5-plus";
const QUESTION = process.env.TEST_QUESTION || "用一句话介绍你自己";

async function main() {
  console.log("=== 测试通义千问 qwen3.5-plus ===\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Model: ${MODEL}`);
  console.log(`问题: ${QUESTION}\n`);

  if (!API_KEY) {
    console.error("错误: 未配置 OPENAI_API_KEY，请在 .env 中设置");
    process.exit(1);
  }

  const url = BASE_URL.replace(/\/$/, "") + "/chat/completions";
  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: "You are a helpful assistant. 请用中文简短回答。" },
      { role: "user", content: QUESTION },
    ],
    stream: false,
    temperature: 0.4,
    max_tokens: 512,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
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

    const reply = data.choices?.[0]?.message?.content?.trim() ?? "(无回复)";
    console.log("--- 模型回复 ---");
    console.log(reply);
    console.log("\n✅ qwen3.5-plus 调用成功！");
  } catch (err) {
    console.error("❌ 错误:", err.message);
    process.exit(1);
  }
}

main();
