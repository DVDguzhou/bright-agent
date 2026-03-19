"use client";

import React, { useCallback, useRef, useState } from "react";

type VoiceMessageBubbleProps = {
  audioUrl: string;
  durationSeconds: number;
  isFromUser?: boolean;
  className?: string;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    void audio.play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }, [isPlaying]);

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
      className={`inline-flex max-w-full items-center gap-3 rounded-md px-3 py-2.5 text-left shadow-sm transition active:scale-[0.99] ${
        isFromUser
          ? "bg-[#95EC69] text-slate-800"
          : "border border-slate-200/80 bg-[#EDEDED] text-slate-800"
      } ${className}`}
      aria-label={isPlaying ? "暂停语音" : "播放语音"}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isFromUser ? "bg-black/10" : "bg-white"
        }`}
        aria-hidden
      >
        {isPlaying ? (
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
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={`w-0.5 shrink-0 rounded-full transition-all ${
              isFromUser ? "bg-slate-700/50" : "bg-slate-500/60"
            } ${isPlaying && (i / barCount) * 100 < progress ? "opacity-100" : "opacity-40"}`}
            style={{ height: `${10 + h * 14}px` }}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums opacity-80">
        {formatDuration(durationSeconds)}
      </span>
    </button>
  );
}
