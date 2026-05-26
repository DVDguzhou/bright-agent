"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { CHAT_GLASS_PANEL_CLASSNAME } from "@/lib/chat-glass";
import {
  getMicrophoneEnvIssue,
  MIN_VOICE_BLOB_BYTES,
  pickRecorderMimeType,
  useMediaRecorder,
  voiceFilenameForBlob,
} from "@/lib/voice";

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

function MicIcon({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.83V20c0 .55.45 1 1 1s1-.45 1-1v-2.18c3.02-.48 5.42-2.83 5.91-5.83.1-.6-.39-1.14-1-1.14z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18a5 5 0 005-5V8a5 5 0 10-10 0v5a5 5 0 005 5zm0 0v3m-3 0h6"
      />
    </svg>
  );
}

export function VoiceInputButton({
  onTranscript,
  disabled = false,
  className = "",
  size = "md",
}: VoiceInputButtonProps) {
  const mimeTypeRef = useRef(pickRecorderMimeType());
  const transcribingRef = useRef(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const micIssue = typeof window !== "undefined" ? getMicrophoneEnvIssue() : null;
  const isSupported = typeof window !== "undefined" && !micIssue && typeof MediaRecorder !== "undefined";

  const { status, error: recError, start, stop, reset } = useMediaRecorder({
    mimeType: mimeTypeRef.current,
    onDataAvailable: async (blob) => {
      if (transcribingRef.current) return;
      transcribingRef.current = true;
      setIsTranscribing(true);
      setError(null);
      try {
        if (blob.size < MIN_VOICE_BLOB_BYTES) {
          setError("说话时间太短，请长按至少一秒");
          return;
        }
        const fd = new FormData();
        fd.append("audio", blob, voiceFilenameForBlob(blob));
        fd.append("language", "zh");
        const res = await fetch("/api/transcribe", { method: "POST", body: fd, credentials: "include" });
        const data = (await res.json()) as { text?: string; error?: string };
        if (res.status === 401) {
          setError("请先登录后再使用语音");
          return;
        }
        if (!res.ok) {
          setError(
            data.error === "recording too short"
              ? "说话时间太短，请长按至少一秒"
              : data.error === "speech-to-text not configured"
                ? "语音转写未配置，请联系管理员"
                : data.error === "transcription failed"
                  ? "语音识别服务异常，请稍后重试"
                  : "语音识别失败，请重试",
          );
          return;
        }
        const text = (data.text ?? "").trim();
        if (!text) {
          setError("没有识别到内容，请再说一次");
          return;
        }
        onTranscript(text, true);
      } catch {
        setError("语音识别失败，请检查网络后重试");
      } finally {
        transcribingRef.current = false;
        setIsTranscribing(false);
        reset();
      }
    },
  });

  const isPressActive = status === "recording" || isTranscribing;
  const isPreparing = status === "processing" || isTranscribing;

  const handlePressStart = useCallback(() => {
    if (disabled || !isSupported) return;
    setError(null);
    reset();
    void start();
  }, [disabled, isSupported, reset, start]);

  const handlePressEnd = useCallback(() => {
    if (status === "recording") {
      stop();
    }
  }, [status, stop]);

  useEffect(() => {
    if (recError) {
      setError(recError);
    }
  }, [recError]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3500);
    return () => clearTimeout(timer);
  }, [error]);

  if (!isSupported) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs text-ink-400 ${CHAT_GLASS_PANEL_CLASSNAME}`}>
        <span className="h-2 w-2 rounded-full bg-paper-300" aria-hidden />
        {micIssue ?? "当前设备暂不支持语音"}
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        disabled={disabled || isPreparing}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={(e) => {
          e.preventDefault();
          handlePressStart();
        }}
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
            ? "border-oxblood-400 bg-oxblood-500 text-paper shadow-lg shadow-oxblood-500/30 scale-110"
            : "border-paper/38 bg-paper/55 text-ink-500 shadow-[0_10px_26px_-14px_rgba(26,23,20,0.12)] ring-1 ring-paper/18 backdrop-blur-xl hover:bg-paper/66 hover:border-paper/50"
        } disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {isPreparing ? (
          <MicIcon className="h-5 w-5 animate-pulse opacity-70" />
        ) : isPressActive ? (
          <MicIcon className="h-5 w-5 animate-pulse" filled />
        ) : (
          <MicIcon className="h-5 w-5" />
        )}
      </button>
      {error && (
        <div className="absolute -top-8 left-1/2 z-30 max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-oxblood-600 px-3 py-1.5 text-xs text-paper shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
