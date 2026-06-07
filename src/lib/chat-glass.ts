export type ChatBubbleRole = "assistant" | "user";

// 编辑风聊天表面：纸面分层 + 发丝线，不用玻璃 / 渐变 / 常驻阴影。
// 常量名沿用历史命名（被 co-edit 页复用），仅视觉回归编辑风。
export const CHAT_PAGE_BACKGROUND_CLASSNAME = "bg-paper";
export const CHAT_SCROLL_SURFACE_CLASSNAME = "bg-paper";
export const CHAT_GLASS_PANEL_CLASSNAME =
  "border border-hairline bg-paper-50";

const CHAT_BUBBLE_BASE =
  "max-w-[82%] rounded px-3.5 py-2.5 text-[15px] leading-relaxed sm:max-w-[72%]";

// Agent：纸面 + 发丝线，留在浅色一侧
const CHAT_ASSISTANT_BUBBLE =
  "border border-hairline bg-paper-50 text-ink";

// 用户：实心墨黑——对话里唯一允许的实底，清晰拉开左右人格
const CHAT_USER_BUBBLE = "bg-ink text-paper-50";

export function getChatBubbleClassName(role: ChatBubbleRole) {
  return `${CHAT_BUBBLE_BASE} ${
    role === "user" ? CHAT_USER_BUBBLE : CHAT_ASSISTANT_BUBBLE
  }`;
}
