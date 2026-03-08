/**
 * TikTok 选品情报 Agent（试验版）
 *
 * 按 docs/VERTICAL_CASE_RESEARCH.md 规格实现，用于验证信任层。
 * 能力：按品类、区域、条数返回 TikTok 风格爆品/趋势数据（试验阶段使用模拟数据）
 *
 * 用法：
 *   PLATFORM_URL=http://localhost:3000 SELLER_API_KEY=sk_live_xxx node server.mjs
 *
 * 本地调试需 ngrok 暴露，或使用平台隧道。
 */
import http from "http";
import crypto from "crypto";

const PORT = parseInt(process.env.PORT || "3334", 10);
const PLATFORM_URL = process.env.PLATFORM_URL || "http://localhost:3000";
const SELLER_API_KEY = process.env.SELLER_API_KEY;
const AGENT_VERSION = "tiktok-crawler/0.1.0";

// 模拟产品模板（试验阶段）
const PRODUCT_TEMPLATES = {
  beauty: [
    "Lip Gloss Set 6 Colors",
    "Hydrating Face Serum",
    "Mascara Volume Boost",
    "Blush Palette 4 Shades",
    "Silicone Face Roller",
    "Vitamin C Brightening Cream",
    "Eyelash Curler",
    "Setting Spray Matte",
    "Cleansing Balm",
    "Highlighter Stick",
  ],
  fashion: [
    "Oversized Blazer",
    "High-Waist Leggings",
    "Chain Strap Bag",
    "Platform Sneakers",
    "Wide Leg Trousers",
    "Crop Top Set",
    "Bucket Hat",
    "Layered Necklace",
    "Ankle Boots",
    "Belt Bag",
  ],
  electronics: [
    "Wireless Earbuds",
    "Phone Holder Ring",
    "LED Ring Light",
    "Portable Charger",
    "Bluetooth Speaker",
    "Selfie Stick",
    "USB-C Hub",
    "Screen Protector Kit",
    "Cable Organizer",
    "Desk Lamp",
  ],
  home: [
    "Aromatherapy Diffuser",
    "Storage Baskets Set",
    "LED Strip Lights",
    "Desk Organizer",
    "Throw Pillow Covers",
    "Plant Pot Set",
    "Kitchen Scale",
    "Coffee Maker",
    "Vacuum Sealer",
    "Smart Plug",
  ],
};

function generateMockProducts(input) {
  const category = input?.category || "beauty";
  const region = input?.region || "US";
  const recordsTarget = Math.min(100, Math.max(1, input?.records_target || 30));
  const priceMin = input?.price_range?.min ?? 8;
  const priceMax = input?.price_range?.max ?? 50;

  const templates = PRODUCT_TEMPLATES[category] || PRODUCT_TEMPLATES.beauty;
  const products = [];

  for (let i = 0; i < recordsTarget; i++) {
    const template = templates[i % templates.length];
    const price = (priceMin + Math.random() * (priceMax - priceMin)).toFixed(2);
    const trendScore = (0.5 + Math.random() * 0.5).toFixed(2);
    products.push({
      product_id: `p_${category}_${i + 1}`,
      title: template,
      price_usd: parseFloat(price),
      trend_score: parseFloat(trendScore),
      category,
      region,
      source_url: `https://example.com/product/${i + 1}`,
    });
  }

  return products;
}

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

    // Step 2: 校验 input_hash
    const computedHash = crypto.createHash("sha256").update(JSON.stringify(input ?? {})).digest("hex");
    const expectedHash = (input_hash || "").replace(/^sha256:/, "");
    if (expectedHash && computedHash !== expectedHash) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "input_hash_mismatch" }));
      return;
    }

    // Step 3: 执行任务 - 生成模拟选品数据
    const startedAt = new Date();
    const products = generateMockProducts(input || {});
    const executedAt = new Date();
    const result = {
      products,
      report_md: `# TikTok 选品情报报告

## 执行摘要
- **执行时间**: ${executedAt.toISOString()}
- **返回条数**: ${products.length}
- **品类**: ${input?.category || "beauty"}
- **区域**: ${input?.region || "US"}
- **数据来源**: 试验阶段模拟数据（用于验证信任层流程）

## 产品概览
| 序号 | 标题 | 价格(USD) | 趋势分 |
|------|------|-----------|--------|
${products.slice(0, 10).map((p, i) => `| ${i + 1} | ${p.title} | ${p.price_usd} | ${p.trend_score} |`).join("\n")}
${products.length > 10 ? `\n... 共 ${products.length} 条` : ""}
`,
      executed_at: executedAt.toISOString(),
      record_count: products.length,
    };

    const resultStr = JSON.stringify(result);
    const outputHash = crypto.createHash("sha256").update(resultStr).digest("hex");

    // Step 4: 提交回执
    await submitReceipt(request_id, license_id, agent_id, expectedHash || computedHash);

    // Step 5: 返回结果
    res.writeHead(200);
    res.end(
      JSON.stringify({
        request_id,
        status: "success",
        result,
        output_hash: outputHash,
        agent_version: AGENT_VERSION,
      })
    );
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Execution failed", detail: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`TikTok 选品 Agent 运行于 http://localhost:${PORT}/invoke`);
  console.log(`PLATFORM_URL=${PLATFORM_URL}`);
  if (!SELLER_API_KEY) {
    console.log("WARN: SELLER_API_KEY 未配置 - 回执将不会提交，平台不会扣减 quota");
  }
});
