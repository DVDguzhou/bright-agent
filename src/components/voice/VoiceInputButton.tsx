"use client";

import React, { useCallback, useEffect } from "react";
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
  const { isSupported, status, transcript, error, start, stop, reset } =
    useSpeechRecognition({
      lang: "zh-CN",
      continuous: true,
      interimResults: true,
      onResult: onTranscript,
    });

  const isListening = status === "listening";

  const handlePressStart = useCallback(() => {
    if (disabled || !isSupported) return;
    reset();
    start();
  }, [disabled, isSupported, reset, start]);

  const handlePressEnd = useCallback(() => {
    if (isListening) {
      stop();
      if (transcript.trim()) {
        onTranscript(transcript.trim(), true);
      }
    }
    reset();
  }, [isListening, stop, transcript, onTranscript, reset]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(reset, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, reset]);

  if (!isSupported) {
    return null;
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
        title={isListening ? "松开发送" : "按住说话"}
        className={`inline-flex shrink-0 items-center justify-center rounded-full border transition-all ${
          sizeClasses[size]
        } ${
          isListening
            ? "border-rose-400 bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110"
            : "border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
        } disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {isListening ? (
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
