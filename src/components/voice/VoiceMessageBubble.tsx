"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_GLASS_PANEL_CLASSNAME } from "@/lib/chat-glass";

const VOLUME_BOOST = 1.5; // 播放增益，略微提高音量

type VoiceMessageBubbleProps = {
  audioUrl: string;
  durationSeconds: number;
  isFromUser?: boolean;
  className?: string;
};

type VoiceLoadingBubbleProps = {
  className?: string;
  label?: string;
  description?: string;
};

function formatDuration(seconds: number) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  if (m > 0) return `${m}:${s.toString().padStart(2, "0")}`;
  return `${Math.max(1, s)}"`;
}

export function VoiceMessageBubble({
  audioUrl,
  durationSeconds,
  isFromUser = false,
  className = "",
}: VoiceMessageBubbleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioState, setAudioState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setAudioState("loading");
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      gain.gain.value = VOLUME_BOOST;
      source.connect(gain);
      gain.connect(ctx.destination);
      ctxRef.current = ctx;
      return () => {
        source.disconnect();
        gain.disconnect();
        ctx.close();
        ctxRef.current = null;
      };
    } catch {
      return undefined;
    }
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioState === "loading") return;
    if (audioState === "error") {
      setAudioState("loading");
      audio.load();
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    const play = async () => {
      const ctx = ctxRef.current;
      if (ctx?.state === "suspended") await ctx.resume();
      await audio.play();
    };
    void play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }, [audioState, isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const p = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;
    setProgress(p);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const barCount = Math.min(16, Math.max(4, Math.ceil(Math.max(durationSeconds, 1) / 3)));
  const barHeights = Array.from({ length: barCount }, (_, i) => {
    const base = 0.35 + Math.sin((i / barCount) * Math.PI) * 0.65;
    return base;
  });

  const minWidthPx = Math.min(168, 88 + Math.min(durationSeconds, 60) * 1.2);

  return (
    <button
      type="button"
      onClick={togglePlay}
      style={{ minWidth: minWidthPx }}
      className={`inline-flex h-9 max-w-full items-center gap-2 rounded-md px-2.5 py-1 text-left transition active:scale-[0.99] ${
        isFromUser
          ? "bg-ink text-paper-50"
          : `${CHAT_GLASS_PANEL_CLASSNAME} text-ink-700`
      } ${className}`}
      aria-label={
        audioState === "loading"
          ? "语音加载中"
          : audioState === "error"
            ? "语音加载失败，点击重试"
            : isPlaying
              ? "暂停语音"
              : "播放语音"
      }
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        playsInline
        onLoadStart={() => setAudioState("loading")}
        onLoadedData={() => setAudioState("ready")}
        onCanPlay={() => setAudioState("ready")}
        onError={() => {
          setAudioState("error");
          setIsPlaying(false);
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isFromUser ? "bg-paper/18" : "bg-paper/72"
        }`}
        aria-hidden
      >
        {audioState === "loading" ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current/25 border-t-current animate-spin" />
        ) : audioState === "error" ? (
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.65 18h16.7a1 1 0 00.86-1.5l-7.5-13a1 1 0 00-1.72 0z" />
          </svg>
        ) : isPlaying ? (
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </span>
      {audioState === "loading" ? (
        <>
          <span className="min-w-0 flex-1 truncate text-xs text-ink-500">语音加载中</span>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-ink-400/85">
            {formatDuration(durationSeconds)}
          </span>
        </>
      ) : audioState === "error" ? (
        <span className="min-w-0 flex-1 text-xs text-ink-500">加载失败，点击重试</span>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-0.5">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className={`w-0.5 shrink-0 rounded-full transition-all ${
                  isFromUser ? "bg-paper/70" : "bg-paper-500/55"
                } ${isPlaying && (i / barCount) * 100 < progress ? "opacity-100" : "opacity-40"}`}
                style={{ height: `${6 + h * 8}px` }}
              />
            ))}
          </div>
          <span className="shrink-0 text-[11px] font-medium tabular-nums opacity-80">
            {formatDuration(durationSeconds)}
          </span>
        </>
      )}
    </button>
  );
}

export function VoiceMessageLoadingBubble({
  className = "",
  label = "正在准备语音回复...",
  description = "文本已经出来了，语音还在加载中。",
}: VoiceLoadingBubbleProps) {
  return (
    <div
      className={`inline-flex h-9 max-w-full items-center gap-2 rounded-md px-2.5 py-1 text-left text-ink-700 ${CHAT_GLASS_PANEL_CLASSNAME} ${className}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper/72" aria-hidden>
        <span className="h-3.5 w-3.5 rounded-full border-2 border-hairline/40 border-t-ink animate-spin" />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-ink-500">{label}</span>
    </div>
  );
}
