/** 小程序 API 配置 — 发布前请确认域名与 AppID */
module.exports = {
  API_BASE: "https://www.brightagent.cn",
  /** 图片 CDN（与 Web 端 NEXT_PUBLIC_CDN_URL 一致；留空则从 API_BASE 加载） */
  CDN_BASE: "https://cdn.brightagent.cn",
  SESSION_COOKIE_NAME: "agent_fiverr_session",
  SESSION_STORAGE_KEY: "brightagent_session",
  /** 请求头：后端据此返回 JSON 而非 SSE */
  CLIENT_HEADER: "miniapp",
  OFFICIAL_EMAIL: "brightagent2026@163.com",
  /** 与 Web official-contact.ts 一致 */
  OFFICIAL_CONTACT: {
    email: "brightagent2026@163.com",
    description: "账号、订单、认证与商务合作",
    replyHint: "工作日 24 小时内回复",
  },
  /** 配置后联系客服直接进入该 Agent 对话页 */
  PLATFORM_SUPPORT_AGENT_ID: "",
};
