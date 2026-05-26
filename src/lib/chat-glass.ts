export type ChatBubbleRole = "assistant" | "user";

export const CHAT_PAGE_BACKGROUND_CLASSNAME = "bg-gradient-to-b from-paper via-paper-50 to-paper";
export const CHAT_SCROLL_SURFACE_CLASSNAME =
  "bg-gradient-to-b from-paper/80 via-paper-50/70 to-paper/90";
export const CHAT_GLASS_PANEL_CLASSNAME =
  "border border-hairline/40 bg-paper/80 ring-1 ring-hairline/20 shadow-[0_8px_24px_-12px_rgba(26,23,20,0.1)] backdrop-blur-xl supports-[backdrop-filter]:bg-paper/75";

const CHAT_BUBBLE_BASE =
  "max-w-[82%] rounded-[20px] px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm sm:max-w-[72%]";

const CHAT_ASSISTANT_BUBBLE =
  "rounded-bl-md border border-hairline/70 bg-paper text-ink-700";

const CHAT_USER_BUBBLE =
  "rounded-br-md border border-hairline/70 bg-paper text-ink-700";

export function getChatBubbleClassName(role: ChatBubbleRole) {
  return `${CHAT_BUBBLE_BASE} ${
    role === "user" ? CHAT_USER_BUBBLE : CHAT_ASSISTANT_BUBBLE
  }`;
}
