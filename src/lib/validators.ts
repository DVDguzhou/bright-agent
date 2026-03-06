import { z } from "zod";

// buyandsell.md - 平台校验与请求格式

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  isBuyer: z.boolean().optional().default(true),
  isSeller: z.boolean().optional().default(false),
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
