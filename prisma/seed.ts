import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function createUserApiKey(userId: string) {
  const raw = crypto.randomBytes(24).toString("hex");
  const key = `sk_live_${raw}`;
  const prefix = key.slice(0, 16);
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, hash, prefix };
}

async function main() {
  const hash = await bcrypt.hash("password123", 12);

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@demo.com" },
    update: { roleFlags: { is_buyer: true, is_seller: true } },
    create: {
      email: "buyer@demo.com",
      password: hash,
      name: "小红（买方/编排方）",
      roleFlags: { is_buyer: true, is_seller: true },
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@demo.com" },
    update: {},
    create: {
      email: "seller@demo.com",
      password: hash,
      name: "小兰（卖方）",
      roleFlags: { is_buyer: false, is_seller: true },
    },
  });

  const demoBaseUrl = process.env.DEMO_AGENT_BASE_URL || `${process.env.NEXTAUTH_URL || "http://localhost:3001"}/api/demo-agent/invoke`;

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const webAnalyzerBaseUrl = `${base}/api/web-analyzer/invoke`;
  const reportBuilderBaseUrl = `${base}/api/report-builder/invoke`;
  const orchestratorBaseUrl = `${base}/api/orchestrator/invoke`;
  const videoScriptUrl = `${base}/api/video-pipeline/script/invoke`;
  const videoAssetUrl = `${base}/api/video-pipeline/asset/invoke`;
  const videoRenderUrl = `${base}/api/video-pipeline/render/invoke`;
  const videoComplianceUrl = `${base}/api/video-pipeline/compliance/invoke`;

  const demoAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      sellerId: seller.id,
      name: "Demo 自动 Agent",
      description: "平台内置演示 Agent，用于测试 License + Token + 直接调用流程",
      baseUrl: demoBaseUrl,
      supportedScopes: ["content.generate", "data.fetch"],
      pricingConfig: { model: "per_call", price: 10, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: demoBaseUrl, status: "approved" },
  });

  const webAnalyzerAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      sellerId: seller.id,
      name: "Web 页面分析 Agent",
      description: "抓取任意 URL，提取标题、描述、标题结构、外链、字数统计等，返回结构化分析报告",
      baseUrl: webAnalyzerBaseUrl,
      supportedScopes: ["data.fetch", "content.generate"],
      pricingConfig: { model: "per_call", price: 50, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: webAnalyzerBaseUrl, status: "approved" },
  });

  const reportBuilderAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      sellerId: seller.id,
      name: "报告合成 Agent",
      description: "接收多个分析结果，生成选品/竞品/综合调研报告。与 Web Analyzer 配合使用",
      baseUrl: reportBuilderBaseUrl,
      supportedScopes: ["content.generate", "data.fetch"],
      pricingConfig: { model: "per_call", price: 30, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: reportBuilderBaseUrl, status: "approved" },
  });

  const orchestratorAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000004" },
    create: {
      id: "00000000-0000-0000-0000-000000000004",
      sellerId: buyer.id,
      name: "小红的编排 Agent",
      description: "小红自有的编排 Agent，协调 Web Analyzer 与 Report Builder，一键完成竞品调研流水线",
      baseUrl: orchestratorBaseUrl,
      supportedScopes: ["content.generate", "data.fetch"],
      pricingConfig: { model: "per_call", price: 80, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: orchestratorBaseUrl, status: "approved" },
  });

  const videoScriptAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000005" },
    create: {
      id: "00000000-0000-0000-0000-000000000005",
      sellerId: seller.id,
      name: "视频脚本 Agent",
      description: "根据 brief 生成分镜脚本与台词，轻量级 LLM",
      baseUrl: videoScriptUrl,
      supportedScopes: ["content.generate"],
      pricingConfig: { model: "per_call", price: 20, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: videoScriptUrl, status: "approved" },
  });

  const videoAssetAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000006" },
    create: {
      id: "00000000-0000-0000-0000-000000000006",
      sellerId: seller.id,
      name: "视频素材 Agent",
      description: "根据脚本检索/生成素材（图、音频）",
      baseUrl: videoAssetUrl,
      supportedScopes: ["content.generate", "data.fetch"],
      pricingConfig: { model: "per_call", price: 30, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: videoAssetUrl, status: "approved" },
  });

  const videoRenderAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000007" },
    create: {
      id: "00000000-0000-0000-0000-000000000007",
      sellerId: seller.id,
      name: "视频渲染 Agent（重算力）",
      description: "4K 合成、特效、多轨渲染。需 TB 素材+多 GPU 集群，调用方零配置",
      baseUrl: videoRenderUrl,
      supportedScopes: ["resource.proxy", "content.generate"],
      pricingConfig: { model: "per_call", price: 500, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: videoRenderUrl, status: "approved" },
  });

  const videoComplianceAgent = await prisma.agent.upsert({
    where: { id: "00000000-0000-0000-0000-000000000008" },
    create: {
      id: "00000000-0000-0000-0000-000000000008",
      sellerId: seller.id,
      name: "视频合规 Agent",
      description: "版权检测、违禁词扫描、水印检测",
      baseUrl: videoComplianceUrl,
      supportedScopes: ["permission.access", "content.generate"],
      pricingConfig: { model: "per_call", price: 15, quotaPerUnit: 1 },
      status: "approved",
      riskLevel: "low",
    },
    update: { baseUrl: videoComplianceUrl, status: "approved" },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.license.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      agentId: demoAgent.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      scope: "content.generate",
      quotaTotal: 100,
      quotaUsed: 0,
      expiresAt,
    },
    update: { quotaTotal: 100, quotaUsed: 0, expiresAt },
  });

  const existingKey = await prisma.userApiKey.findFirst({ where: { userId: buyer.id } });
  let demoApiKey: string | null = null;
  let orchestratorKey: string | null = null;
  if (!existingKey) {
    const { key, hash, prefix } = createUserApiKey(buyer.id);
    await prisma.userApiKey.create({ data: { userId: buyer.id, keyHash: hash, keyPrefix: prefix, name: "demo" } });
    demoApiKey = key;
  }
  const orchestratorKeyRecord = await prisma.userApiKey.findFirst({
    where: { userId: buyer.id, name: "orchestrator" },
  });
  if (!orchestratorKeyRecord) {
    const { key, hash, prefix } = createUserApiKey(buyer.id);
    await prisma.userApiKey.create({ data: { userId: buyer.id, keyHash: hash, keyPrefix: prefix, name: "orchestrator" } });
    orchestratorKey = key;
  }

  const demoSecret = crypto.randomBytes(16).toString("hex");
  console.log("Seed completed. Demo users: buyer@demo.com, seller@demo.com (password: password123)");
  if (demoApiKey) {
    console.log("Demo API Key (add to .env): PLATFORM_API_KEY=" + demoApiKey);
  }
  if (orchestratorKey) {
    console.log("编排 Agent 用 Key (add to .env): ORCHESTRATOR_BUYER_API_KEY=" + orchestratorKey);
  } else {
    console.log("ORCHESTRATOR_BUYER_API_KEY: 使用 buyer 的 API Key (控制台创建后填入 .env)");
  }
  console.log("Add to .env for receipt submission: PLATFORM_DEMO_SECRET=" + demoSecret);
  await prisma.license.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      agentId: webAnalyzerAgent.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      scope: "data.fetch",
      quotaTotal: 50,
      quotaUsed: 0,
      expiresAt,
    },
    update: { quotaTotal: 50, expiresAt },
  });

  await prisma.license.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      agentId: reportBuilderAgent.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      scope: "content.generate",
      quotaTotal: 30,
      quotaUsed: 0,
      expiresAt,
    },
    update: { quotaTotal: 30, expiresAt },
  });

  await prisma.license.upsert({
    where: { id: "00000000-0000-0000-0000-000000000004" },
    create: {
      id: "00000000-0000-0000-0000-000000000004",
      agentId: orchestratorAgent.id,
      buyerId: buyer.id,
      sellerId: buyer.id,
      scope: "content.generate",
      quotaTotal: 20,
      quotaUsed: 0,
      expiresAt,
    },
    update: { quotaTotal: 20, expiresAt },
  });

  const videoLicenses = [
    { id: "00000000-0000-0000-0000-000000000005", agentId: videoScriptAgent.id, scope: "content.generate", quota: 20 },
    { id: "00000000-0000-0000-0000-000000000006", agentId: videoAssetAgent.id, scope: "content.generate", quota: 20 },
    { id: "00000000-0000-0000-0000-000000000007", agentId: videoRenderAgent.id, scope: "resource.proxy", quota: 10 },
    { id: "00000000-0000-0000-0000-000000000008", agentId: videoComplianceAgent.id, scope: "permission.access", quota: 20 },
  ];
  for (const l of videoLicenses) {
    await prisma.license.upsert({
      where: { id: l.id },
      create: {
        id: l.id,
        agentId: l.agentId,
        buyerId: buyer.id,
        sellerId: seller.id,
        scope: l.scope,
        quotaTotal: l.quota,
        quotaUsed: 0,
        expiresAt,
      },
      update: { quotaTotal: l.quota, expiresAt },
    });
  }

  console.log("Demo Agent ID:", demoAgent.id);
  console.log("Web Analyzer Agent ID:", webAnalyzerAgent.id);
  console.log("Report Builder Agent ID:", reportBuilderAgent.id);
  console.log("小红的编排 Agent ID:", orchestratorAgent.id);
  console.log("Demo License ID: 00000000-0000-0000-0000-000000000001");
  console.log("Web Analyzer License ID: 00000000-0000-0000-0000-000000000002");
  console.log("Report Builder License ID: 00000000-0000-0000-0000-000000000003");
  console.log("编排 Agent License ID: 00000000-0000-0000-0000-000000000004");
  console.log("视频流水线 License IDs: 005(脚本), 006(素材), 007(渲染), 008(合规)");
  console.log("Add to .env: PLATFORM_DEMO_SECRET=your-random-secret (for receipt submission)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
