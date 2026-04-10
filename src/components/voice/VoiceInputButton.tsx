"use client";

import React, { useCallback, useEffect } from "react";
import { CHAT_GLASS_PANEL_CLASSNAME } from "@/lib/chat-glass";
import { useSpeechRecognition } from "@/lib/voice";

type VoiceInputButtonProps = {
  onTranscript: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-10 w-10 sm:h-11 sm:w-11",
  lg: "h-12 w-12",
};

export function VoiceInputButton({
  onTranscript,
  disabled = false,
  className = "",
  size = "md",
}: VoiceInputButtonProps) {
  const { isSupported, status, error, start, stop, reset } =
    useSpeechRecognition({
      lang: "zh-CN",
      continuous: true,
      interimResults: true,
      onSessionEnd: (finalTranscript) => {
        const text = finalTranscript.trim();
        if (text) {
          onTranscript(text, true);
        }
        reset();
      },
    });

  const isPressActive = status === "listening" || status === "processing";
  const isPreparing = status === "processing";

  const handlePressStart = useCallback(() => {
    if (disabled || !isSupported) return;
    reset();
    start();
  }, [disabled, isSupported, reset, start]);

  const handlePressEnd = useCallback(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(reset, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, reset]);

  if (!isSupported) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs text-slate-500 ${CHAT_GLASS_PANEL_CLASSNAME}`}>
        <span className="h-2 w-2 rounded-full bg-slate-300" aria-hidden />
        当前设备暂不支持语音
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        disabled={disabled}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={(e) => {
          e.preventDefault();
          handlePressEnd();
        }}
        onTouchCancel={handlePressEnd}
        title={isPressActive ? "松开发送" : "按住说话"}
        aria-label={isPressActive ? "松开发送语音" : "按住说话"}
        aria-pressed={isPressActive}
        className={`inline-flex shrink-0 items-center justify-center rounded-full border transition-all ${
          sizeClasses[size]
        } ${
          isPressActive
            ? "border-rose-400 bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110"
            : "border-white/38 bg-white/55 text-slate-600 shadow-[0_10px_26px_-14px_rgba(124,58,237,0.25)] ring-1 ring-white/18 backdrop-blur-xl hover:bg-white/66 hover:border-white/50"
        } disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {isPreparing ? (
          <span className="h-5 w-5 rounded-full border-2 border-current/25 border-t-current animate-spin" />
        ) : isPressActive ? (
          <svg
            className="h-5 w-5 animate-pulse"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.83V20c0 .55.45 1 1 1s1-.45 1-1v-2.18c3.02-.48 5.42-2.83 5.91-5.83.1-.6-.39-1.14-1-1.14z" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
      </button>
      {error && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
