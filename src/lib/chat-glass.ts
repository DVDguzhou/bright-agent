export type ChatBubbleRole = "assistant" | "user";

const CHAT_BUBBLE_BASE =
  "max-w-[82%] rounded-[24px] px-3.5 py-2.5 text-[15px] leading-relaxed shadow-[0_12px_32px_-16px_rgba(76,29,149,0.45)] ring-1 sm:max-w-[72%]";

const CHAT_ASSISTANT_BUBBLE =
  "rounded-bl-md border border-white/55 bg-white/48 text-slate-800 ring-white/30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/38";

const CHAT_USER_BUBBLE =
  "rounded-br-md border border-white/18 bg-gradient-to-br from-[#FF8FD8]/78 via-[#D79BFF]/72 to-[#9B8CFF]/70 text-white ring-white/15 backdrop-blur-xl supports-[backdrop-filter]:from-[#FF8FD8]/72 supports-[backdrop-filter]:via-[#D79BFF]/66 supports-[backdrop-filter]:to-[#9B8CFF]/64";

export function getChatBubbleClassName(role: ChatBubbleRole) {
  return `${CHAT_BUBBLE_BASE} ${
    role === "user" ? CHAT_USER_BUBBLE : CHAT_ASSISTANT_BUBBLE
  }`;
}
