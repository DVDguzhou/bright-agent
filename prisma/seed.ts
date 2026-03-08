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

  const lifeAgent = await prisma.lifeAgentProfile.upsert({
    where: { id: "10000000-0000-0000-0000-000000000001" },
    create: {
      id: "10000000-0000-0000-0000-000000000001",
      userId: seller.id,
      displayName: "阿青学长",
      headline: "陪大学生和职场新人做方向选择的过来人",
      shortBio: "经历过普通学校求职、转岗和低谷复盘，擅长把抽象焦虑拆成具体行动。",
      longBio:
        "我不是天赋型选手，走过弯路，也做过很多不成熟决定。后来我通过持续复盘，把找方向、找工作、转变节奏这几件事慢慢做顺了。这些经历让我更适合陪还在迷茫阶段的人把问题拆小，找到下一步能执行的动作。",
      audience: "适合大学生、职场 1 到 3 年的新人、转行前焦虑的人，以及暂时找不到节奏的人。",
      welcomeMessage: "你好，你可以把我当作一个走过弯路但持续复盘的人，直接告诉我你的困惑。",
      pricePerQuestion: 990,
      expertiseTags: ["大学生", "求职", "职业选择", "转行", "复盘"],
      sampleQuestions: [
        "我现在不知道该考研还是工作，怎么判断？",
        "连续面试失败后，我该先调整什么？",
        "想转行但没有底气，第一步应该做什么？",
      ],
      published: true,
    },
    update: {
      displayName: "阿青学长",
      headline: "陪大学生和职场新人做方向选择的过来人",
      pricePerQuestion: 990,
      published: true,
    },
  });

  await prisma.lifeAgentKnowledgeEntry.deleteMany({
    where: { profileId: lifeAgent.id },
  });

  await prisma.lifeAgentKnowledgeEntry.createMany({
    data: [
      {
        profileId: lifeAgent.id,
        category: "职业成长",
        title: "我怎样从迷茫走到稳定成长",
        content:
          "我以前总想一次把未来想清楚，结果越想越焦虑。真正让我走出来的方法不是突然想通，而是先做最小验证：先投递、先访谈、先试一段时间，再决定是不是继续。很多时候不是没有答案，而是行动太少。",
        tags: ["迷茫", "职业规划", "行动"],
        sortOrder: 0,
      },
      {
        profileId: lifeAgent.id,
        category: "求职",
        title: "连续面试失败之后我怎么复盘",
        content:
          "我会把失败拆成三层：表达问题、经历包装问题、岗位匹配问题。不要笼统地觉得自己不行，而是把每一次失败都变成下一次的准备清单。先改最容易改的，比如自我介绍、项目顺序和案例细节。",
        tags: ["面试", "失败", "复盘"],
        sortOrder: 1,
      },
      {
        profileId: lifeAgent.id,
        category: "转行",
        title: "转行前先证明自己，不要先赌全部",
        content:
          "转行最怕的是情绪上头，一下子把退路全切断。我的建议一直是先做低成本验证，例如作品、兼职、小项目、信息访谈。你需要先确认自己真的能做、愿意做、市场也愿意买单，再决定是否全面转身。",
        tags: ["转行", "验证", "低成本试错"],
        sortOrder: 2,
      },
    ],
  });

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
  console.log("人生 Agent ID:", lifeAgent.id);
  console.log("Add to .env: PLATFORM_DEMO_SECRET=your-random-secret (for receipt submission)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
