/**
 * 卖方 Agent 最小示例
 *
 * 演示小兰如何实现一个符合平台协议的 Agent：
 * 1. 接收买方 POST 请求
 * 2. 校验 InvocationToken（GET 或 POST /api/invocation-tokens/verify）
 * 3. 执行任务（此处为简单 echo + 处理）
 * 4. 向平台提交执行回执（POST /api/receipts，需小兰 API Key）
 * 5. 返回结果给买方
 *
 * 用法:
 *   1. 在平台注册 Agent，baseUrl 指向本服务，如 http://localhost:3333/invoke
 *      （本地调试可用 ngrok 或 127.0.0.1，确保平台能访问）
 *   2. 配置环境变量:
 *      PLATFORM_URL=http://localhost:3000
 *      SELLER_API_KEY=sk_live_xxx   # 小兰的 API Key（控制台创建）
 *   3. 启动: node scripts/platform/seller-agent-example.mjs
 *   4. 买方购买 License 后，用 local-invoke-example 或 API 调用本 Agent
 */
import http from "http";
import crypto from "crypto";

const PORT = parseInt(process.env.PORT || "3333", 10);
const PLATFORM_URL = process.env.PLATFORM_URL || "http://localhost:3000";
const SELLER_API_KEY = process.env.SELLER_API_KEY;

async function verifyToken(token) {
  const res = await fetch(`${PLATFORM_URL}/api/invocation-tokens/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

async function submitReceipt(requestId, licenseId, agentId, inputHash) {
  if (!SELLER_API_KEY) {
    console.warn("SELLER_API_KEY 未配置，跳过回执提交（平台不会扣减 quota）");
    return;
  }
  const res = await fetch(`${PLATFORM_URL}/api/receipts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SELLER_API_KEY}`,
    },
    body: JSON.stringify({
      requestId,
      licenseId,
      agentId,
      inputHash,
      status: "SUCCESS",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Submit receipt failed");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST" || !req.url.startsWith("/invoke")) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found. POST /invoke to invoke." }));
    return;
  }

  try {
    const body = await parseBody(req);
    const {
      request_id,
      license_id,
      agent_id,
      scope,
      input,
      input_hash,
      invocation_token,
    } = body;

    if (!request_id || !license_id || !agent_id || !invocation_token) {
      res.writeHead(400);
      res.end(
        JSON.stringify({ error: "Missing request_id, license_id, agent_id or invocation_token" })
      );
      return;
    }

    // Step 1: 校验 token
    const verify = await verifyToken(invocation_token);
    if (!verify.valid) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "unauthorized", detail: verify.error }));
      return;
    }
    if (
      verify.requestId !== request_id ||
      verify.licenseId !== license_id ||
      verify.agentId !== agent_id
    ) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "token_invalid", message: "Token does not match request" }));
      return;
    }

    // Step 2: 校验 input_hash（可选但推荐）
    const computedHash = crypto.createHash("sha256").update(JSON.stringify(input ?? {})).digest("hex");
    const expectedHash = (input_hash || "").replace(/^sha256:/, "");
    if (expectedHash && computedHash !== expectedHash) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "input_hash_mismatch" }));
      return;
    }

    // Step 3: 执行任务（示例：echo 并加前缀）
    const result = {
      received: input,
      processed_at: new Date().toISOString(),
      message: "Hello from seller agent example!",
    };

    // Step 4: 提交回执
    await submitReceipt(request_id, license_id, agent_id, expectedHash || computedHash);

    // Step 5: 返回结果
    res.writeHead(200);
    res.end(
      JSON.stringify({
        request_id,
        status: "success",
        result,
      })
    );
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Execution failed", detail: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Seller Agent Example running at http://localhost:${PORT}/invoke`);
  console.log(`PLATFORM_URL=${PLATFORM_URL}`);
  if (!SELLER_API_KEY) {
    console.log("WARN: SELLER_API_KEY not set - receipts will not be submitted");
  }
});
