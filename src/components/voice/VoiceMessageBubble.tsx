"use client";

import React, { useCallback, useRef, useState } from "react";

type VoiceMessageBubbleProps = {
  audioUrl: string;
  durationSeconds: number;
  isFromUser?: boolean;
  className?: string;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}:${s.toString().padStart(2, "0")}`;
  return `${s}"`;
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

    audio.play();
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

  const barCount = Math.min(20, Math.max(4, Math.ceil(durationSeconds / 2)));
  const barHeights = Array.from({ length: barCount }, (_, i) => {
    const base = 0.3 + Math.sin((i / barCount) * Math.PI) * 0.7;
    return base;
  });

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 ${
        isFromUser ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-800"
      } ${className}`}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
      />
      <button
        type="button"
        onClick={togglePlay}
        className="flex shrink-0 items-center justify-center rounded-full p-1 transition hover:opacity-80"
        aria-label={isPlaying ? "暂停" : "播放"}
      >
        {isPlaying ? (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex items-center gap-1.5">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all ${
              isFromUser ? "bg-white/70" : "bg-slate-400"
            } ${isPlaying && (i / barCount) * 100 < progress ? "opacity-100" : "opacity-50"}`}
            style={{ height: `${12 + h * 16}px` }}
          />
        ))}
      </div>
      <span className="text-xs font-medium opacity-90">
        {formatDuration(durationSeconds)}
      </span>
    </div>
  );
}
