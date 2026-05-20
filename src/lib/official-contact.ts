/**
 * 平台官方联系方式（认证、客服、商务）
 * 生产发信 SMTP 账号需与 OFFICIAL_CONTACT.email 一致。
 */
export const OFFICIAL_CONTACT = {
  email: "brightagent2026@163.com",
  description: "账号、订单、认证与商务合作",
  replyHint: "工作日 24 小时内回复",
};

/**
 * 配置后，「联系客服」会进入 `/life-agents/{id}/chat` 与平台客服 Agent 对话。
 * 未配置时 `/support/chat` 展示邮件联系说明。
 */
export const PLATFORM_SUPPORT_LIFE_AGENT_ID = (
  process.env.NEXT_PUBLIC_PLATFORM_SUPPORT_AGENT_ID ?? ""
).trim();

export function officialMailtoUrl(subject = "BrightAgent 用户咨询") {
  return `mailto:${OFFICIAL_CONTACT.email}?subject=${encodeURIComponent(subject)}`;
}
