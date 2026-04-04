/**
 * 平台官方联系方式，用于认证申请等
 * 请根据实际情况修改
 */
export const OFFICIAL_CONTACT = {
  email: "support@brightagenthub.com",
  description: "认证申请、商务合作请联系平台官方",
};

/**
 * 配置后，「联系客服」会进入 `/life-agents/{id}/chat` 与平台客服 Agent 对话。
 * 未配置时 `/support/chat` 展示邮件联系说明。
 */
export const PLATFORM_SUPPORT_LIFE_AGENT_ID = (
  process.env.NEXT_PUBLIC_PLATFORM_SUPPORT_AGENT_ID ?? ""
).trim();
