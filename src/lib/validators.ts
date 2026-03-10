import { z } from "zod";

// buyandsell.md - 平台校验与请求格式

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2, "用户名至少 2 位").max(32, "用户名最多 32 位"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Agent 注册
export const agentCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  baseUrl: z.string().url(),
  useTunnel: z.boolean().optional().default(false),
  publicKey: z.string().optional(),
  supportedScopes: z.array(z.string()).min(1),
  pricingConfig: z
    .object({
      model: z.enum(["fixed", "per_call", "hourly"]),
      price: z.number().positive(),
      quotaPerUnit: z.number().int().positive().optional(),
    })
    .optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
});

// License 购买
export const licenseCreateSchema = z.object({
  agentId: z.string().uuid(),
  scope: z.string().optional(),
  quotaTotal: z.number().int().positive(),
  expiresInDays: z.number().int().positive().default(30),
});

// 申请调用凭证
export const issueTokenSchema = z.object({
  licenseId: z.string().uuid(),
  agentId: z.string().uuid(),
  scope: z.string().optional(),
  inputHash: z.string().min(1), // sha256:xxx 或 hex
});

// 卖方提交执行回执
export const receiptCreateSchema = z.object({
  requestId: z.string(),
  licenseId: z.string().uuid(),
  agentId: z.string().uuid(),
  inputHash: z.string(),
  outputHash: z.string().optional(),
  outputPreview: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  agentVersion: z.string().optional(),
  toolUsageSummary: z.string().optional(),
  sellerSignature: z.string().optional(),
  status: z.enum(["SUCCESS", "FAILED", "REJECTED"]),
});

// 发起争议
export const disputeCreateSchema = z.object({
  licenseId: z.string().uuid(),
  invocationReqId: z.string().uuid(),
  receiptId: z.string().uuid().optional(),
  reason: z.string().min(1),
  evidenceRefs: z.array(z.string()).optional(),
});

// Agent Swarm - 并行调用多个 Agent，可选聚合
export const swarmTaskSchema = z.object({
  agentId: z.string().uuid(),
  licenseId: z.string().uuid(),
  scope: z.string().optional(),
  input: z.record(z.unknown()),
});
export const swarmInvokeSchema = z.object({
  tasks: z.array(swarmTaskSchema).min(1).max(20),
  aggregator: z
    .object({
      agentId: z.string().uuid(),
      licenseId: z.string().uuid(),
      scope: z.string().optional(),
      transform: z.enum(["web_analyzer_to_report"]).optional(),
    })
    .optional(),
});

export const lifeAgentKnowledgeSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(20),
  tags: z.array(z.string().min(1)).min(1),
});

export const lifeAgentCreateSchema = z.object({
  displayName: z.string().min(2),
  headline: z.string().min(4),
  shortBio: z.string().min(20).max(180),
  longBio: z.string().min(60),
  audience: z.string().min(6),
  welcomeMessage: z.string().min(10),
  pricePerQuestion: z.number().int().positive().max(100000),
  expertiseTags: z.array(z.string().min(1)).min(1).max(8),
  sampleQuestions: z.array(z.string().min(3)).min(2).max(6),
  knowledgeEntries: z.array(lifeAgentKnowledgeSchema).min(2).max(12),
});

export const lifeAgentPurchaseSchema = z.object({
  questionCount: z.number().int().positive().max(500),
  amountPaid: z.number().int().nonnegative(),
});

export const lifeAgentChatSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(2).max(2000),
});

export const lifeAgentUpdateSchema = z.object({
  displayName: z.string().min(2).optional(),
  headline: z.string().min(4).optional(),
  shortBio: z.string().min(20).max(180).optional(),
  longBio: z.string().min(60).optional(),
  audience: z.string().min(6).optional(),
  welcomeMessage: z.string().min(10).optional(),
  pricePerQuestion: z.number().int().positive().max(100000).optional(),
  published: z.boolean().optional(),
  expertiseTags: z.array(z.string().min(1)).min(1).max(8).optional(),
  sampleQuestions: z.array(z.string().min(3)).min(2).max(6).optional(),
  knowledgeEntries: z.array(lifeAgentKnowledgeSchema).min(2).max(12).optional(),
});
