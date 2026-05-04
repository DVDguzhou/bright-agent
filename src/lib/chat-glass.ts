export type ChatBubbleRole = "assistant" | "user";

export const CHAT_PAGE_BACKGROUND_CLASSNAME = "bg-gradient-to-b from-[#F3EFFF] via-violet-50/40 to-white";
export const CHAT_SCROLL_SURFACE_CLASSNAME =
  "bg-gradient-to-b from-[#F3EFFF]/62 via-white/66 to-white/86";
export const CHAT_GLASS_PANEL_CLASSNAME =
  "border border-white/40 bg-white/58 ring-1 ring-white/20 shadow-[0_14px_36px_-18px_rgba(124,58,237,0.24)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/42";

const CHAT_BUBBLE_BASE =
  "max-w-[82%] rounded-[20px] px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm sm:max-w-[72%]";

const CHAT_ASSISTANT_BUBBLE =
  "rounded-bl-md border border-gray-200/70 bg-white text-gray-800";

const CHAT_USER_BUBBLE =
  "rounded-br-md border border-gray-300/60 bg-gray-100 font-medium text-gray-900";

export function getChatBubbleClassName(role: ChatBubbleRole) {
  return `${CHAT_BUBBLE_BASE} ${
    role === "user" ? CHAT_USER_BUBBLE : CHAT_ASSISTANT_BUBBLE
  }`;
}
