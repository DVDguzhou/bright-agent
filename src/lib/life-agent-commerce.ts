/** 人生 Agent 提问包 / 付费开关（App Store 审核期可关闭购买 UI 并开放无限对话） */

/** 为 true 时：不展示购买 UI，对话不扣次数 */
export const LIFE_AGENT_UNLIMITED_CHAT = true;

/** 为 false 时：隐藏所有购买相关 UI（价格、购买按钮、支付弹层） */
export const LIFE_AGENT_SHOW_PURCHASE_UI = false;

export function lifeAgentShowsPurchaseUi(): boolean {
  return LIFE_AGENT_SHOW_PURCHASE_UI && !LIFE_AGENT_UNLIMITED_CHAT;
}
