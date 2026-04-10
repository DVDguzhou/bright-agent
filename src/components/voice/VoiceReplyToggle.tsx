"use client";

import React from "react";
import { CHAT_GLASS_PANEL_CLASSNAME } from "@/lib/chat-glass";

type VoiceReplyToggleProps = {
  useVoiceReply: boolean;
  onChange: (useVoice: boolean) => void;
  hasVoiceClone?: boolean;
  disabled?: boolean;
  className?: string;
};

export function VoiceReplyToggle({
  useVoiceReply,
  onChange,
  hasVoiceClone = true,
  disabled = false,
  className = "",
}: VoiceReplyToggleProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-2 py-1.5 ${CHAT_GLASS_PANEL_CLASSNAME} ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
          !useVoiceReply
            ? "bg-white/72 text-purple-800 shadow-sm ring-1 ring-white/25"
            : "text-slate-600 hover:bg-white/45"
        } disabled:opacity-50`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        文字
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabled || !hasVoiceClone}
        title={!hasVoiceClone ? "该 Agent 未设置语音" : undefined}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
          useVoiceReply
            ? "bg-white/72 text-purple-800 shadow-sm ring-1 ring-white/25"
            : "text-slate-600 hover:bg-white/45"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.83V20c0 .55.45 1 1 1s1-.45 1-1v-2.18c3.02-.48 5.42-2.83 5.91-5.83.1-.6-.39-1.14-1-1.14z" />
        </svg>
        语音
      </button>
    </div>
  );
}
