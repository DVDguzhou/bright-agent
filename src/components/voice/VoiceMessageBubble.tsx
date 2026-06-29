"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

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

  const barCount = 24;
  const barHeights = Array.from({ length: barCount }, (_, i) => {
    const base = 0.35 + Math.sin((i / barCount) * Math.PI) * 0.65;
    return base;
  });

  return (
    <button
      type="button"
      onClick={togglePlay}
      className={`inline-flex h-12 w-64 max-w-[calc(100vw-5rem)] items-center gap-3 rounded-lg border px-2.5 py-1.5 text-left shadow-glow-sm transition duration-200 hover:border-signal-300 hover:shadow-glow active:scale-[0.99] sm:w-72 ${
        isFromUser
          ? "border-ink-700 bg-ink text-paper-50"
          : "border-hairline bg-paper-50 text-ink-700"
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
          isFromUser ? "bg-paper/15 text-paper-50" : "bg-ink text-paper-50"
        }`}
        aria-hidden
      >
        {audioState === "loading" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current" />
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
          <svg className="h-4 w-4 translate-x-px" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </span>
      {audioState === "loading" ? (
        <>
          <span className="min-w-0 flex-1 truncate text-sm text-ink-500">语音加载中</span>
          <span className="shrink-0 text-xs font-medium tabular-nums text-ink-400">
            {formatDuration(durationSeconds)}
          </span>
        </>
      ) : audioState === "error" ? (
        <span className="min-w-0 flex-1 text-sm text-ink-500">加载失败，点击重试</span>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-px" aria-hidden>
            {barHeights.map((h, i) => (
              <div
                key={i}
                className={`w-0.5 shrink-0 rounded-full transition-colors duration-200 ${
                  (i / barCount) * 100 < progress
                    ? isFromUser
                      ? "bg-paper-50"
                      : "bg-signal-500"
                    : isFromUser
                      ? "bg-paper-50/45"
                      : "bg-ink-300/55"
                }`}
                style={{ height: `${8 + h * 13}px` }}
              />
            ))}
          </div>
          <span className="min-w-8 shrink-0 text-right text-xs font-medium tabular-nums opacity-80">
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
      className={`inline-flex h-12 w-64 max-w-[calc(100vw-5rem)] items-center gap-3 rounded-lg border border-hairline bg-paper-50 px-2.5 py-1.5 text-left text-ink-700 shadow-glow-sm sm:w-72 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={description}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-paper-50" aria-hidden>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper-50/30 border-t-paper-50" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink-500">{label}</span>
      <span className="flex h-5 items-center gap-0.5" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="w-0.5 animate-pulse rounded-full bg-ink-300/45"
            style={{ height: `${8 + index * 3}px`, animationDelay: `${index * 120}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
