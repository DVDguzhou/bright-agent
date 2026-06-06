/** 与 Web 端 life-agent-commerce.ts 保持一致 */
const LIFE_AGENT_UNLIMITED_CHAT = true;
const LIFE_AGENT_SHOW_PURCHASE_UI = false;

function lifeAgentShowsPurchaseUi() {
  return LIFE_AGENT_SHOW_PURCHASE_UI && !LIFE_AGENT_UNLIMITED_CHAT;
}

module.exports = {
  LIFE_AGENT_UNLIMITED_CHAT,
  LIFE_AGENT_SHOW_PURCHASE_UI,
  lifeAgentShowsPurchaseUi,
};
