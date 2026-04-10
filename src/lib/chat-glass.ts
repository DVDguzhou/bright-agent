export type ChatBubbleRole = "assistant" | "user";

export const CHAT_PAGE_BACKGROUND_CLASSNAME = "bg-gradient-to-b from-[#F3EFFF] via-violet-50/40 to-white";
export const CHAT_SCROLL_SURFACE_CLASSNAME =
  "bg-gradient-to-b from-[#F3EFFF]/62 via-white/66 to-white/86";
export const CHAT_GLASS_PANEL_CLASSNAME =
  "border border-white/40 bg-white/58 ring-1 ring-white/20 shadow-[0_14px_36px_-18px_rgba(124,58,237,0.24)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/42";

const CHAT_BUBBLE_BASE =
  "max-w-[82%] rounded-[24px] px-3.5 py-2.5 text-[15px] leading-relaxed shadow-[0_12px_32px_-16px_rgba(76,29,149,0.45)] ring-1 sm:max-w-[72%]";

const CHAT_ASSISTANT_BUBBLE =
  "rounded-bl-md border border-white/55 bg-white/48 text-slate-800 ring-white/30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/38";

const CHAT_USER_BUBBLE =
  "rounded-br-md border border-fuchsia-200/42 bg-gradient-to-br from-[#FFD9F0]/96 via-[#E8D9FF]/94 to-[#D9E0FF]/92 font-medium text-slate-900 ring-white/24 backdrop-blur-xl supports-[backdrop-filter]:from-[#FFD9F0]/90 supports-[backdrop-filter]:via-[#E8D9FF]/88 supports-[backdrop-filter]:to-[#D9E0FF]/86";

export function getChatBubbleClassName(role: ChatBubbleRole) {
  return `${CHAT_BUBBLE_BASE} ${
    role === "user" ? CHAT_USER_BUBBLE : CHAT_ASSISTANT_BUBBLE
  }`;
}
