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

  const barCount = Math.min(24, Math.max(5, Math.ceil(Math.max(durationSeconds, 1) / 2)));
  const barHeights = Array.from({ length: barCount }, (_, i) => {
    const base = 0.35 + Math.sin((i / barCount) * Math.PI) * 0.65;
    return base;
  });

  const minWidthPx = Math.min(220, 140 + Math.min(durationSeconds, 60) * 2);

  return (
    <button
      type="button"
      onClick={togglePlay}
      style={{ minWidth: minWidthPx }}
      className={`inline-flex max-w-full items-center gap-3 rounded-[20px] px-3 py-2.5 text-left transition active:scale-[0.99] ${
        isFromUser
          ? "border border-white/15 bg-gradient-to-br from-[#FF8FD8]/74 via-[#D79BFF]/70 to-[#9B8CFF]/66 text-white shadow-[0_10px_24px_-12px_rgba(168,139,235,0.4)] backdrop-blur-xl"
          : `${CHAT_GLASS_PANEL_CLASSNAME} text-slate-800`
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
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isFromUser ? "bg-white/18" : "bg-white/72"
        }`}
        aria-hidden
      >
        {audioState === "loading" ? (
          <span className="h-4 w-4 rounded-full border-2 border-current/25 border-t-current animate-spin" />
        ) : audioState === "error" ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.65 18h16.7a1 1 0 00.86-1.5l-7.5-13a1 1 0 00-1.72 0z" />
          </svg>
        ) : isPlaying ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg
            className={`h-4 w-4 ${isFromUser ? "" : "scale-x-[-1]"}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </span>
      {audioState === "loading" ? (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800">语音加载中...</p>
            <p className="mt-0.5 text-xs text-slate-500">马上就能播放，先看看文字版也可以。</p>
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500/85">
            {formatDuration(durationSeconds)}
          </span>
        </>
      ) : audioState === "error" ? (
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">语音暂时加载失败</p>
          <p className="mt-0.5 text-xs text-slate-500">点一下重试，或先阅读下面的文字回复。</p>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className={`w-0.5 shrink-0 rounded-full transition-all ${
                  isFromUser ? "bg-white/70" : "bg-violet-500/55"
                } ${isPlaying && (i / barCount) * 100 < progress ? "opacity-100" : "opacity-40"}`}
                style={{ height: `${10 + h * 14}px` }}
              />
            ))}
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums opacity-80">
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
      className={`inline-flex max-w-full items-center gap-3 rounded-[20px] px-3 py-2.5 text-left text-slate-800 ${CHAT_GLASS_PANEL_CLASSNAME} ${className}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/72" aria-hidden>
        <span className="h-4 w-4 rounded-full border-2 border-violet-300/40 border-t-violet-500 animate-spin" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}
