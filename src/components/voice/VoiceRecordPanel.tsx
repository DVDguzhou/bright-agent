"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getMicrophoneEnvIssue, useMediaRecorder } from "@/lib/voice";

const SAMPLE_TEXT =
  "你好，我是这个 Agent 的创建者。我会用我的真实经历和经验来回答你的问题，希望能帮到你。";

type VoiceRecordPanelProps = {
  onComplete: (blob: Blob) => void;
  onSkip?: () => void;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  /** 与人生 Agent 创建页薰衣草 UI 一致 */
  accent?: "default" | "pastel";
};

export function VoiceRecordPanel({
  onComplete,
  onSkip,
  minDurationSeconds = 10,
  maxDurationSeconds = 30,
  accent = "default",
}: VoiceRecordPanelProps) {
  const [hasRecorded, setHasRecorded] = useState(false);
  const [envIssue, setEnvIssue] = useState<string | null>(null);
  const { status, blob, error, duration, start, stop, reset } = useMediaRecorder();

  useEffect(() => {
    setEnvIssue(getMicrophoneEnvIssue());
  }, []);

  const isRecording = status === "recording";
  const isValidDuration = duration >= minDurationSeconds && duration <= maxDurationSeconds;
  const canSubmit = blob && duration >= minDurationSeconds;
  const micBlocked = Boolean(envIssue);

  useEffect(() => {
    if (duration >= maxDurationSeconds && isRecording) {
      stop();
    }
  }, [duration, maxDurationSeconds, isRecording, stop]);

  useEffect(() => {
    if (blob && status === "idle") {
      setHasRecorded(true);
    }
  }, [blob, status]);

  const handleSubmit = useCallback(() => {
    if (blob && isValidDuration) {
      onComplete(blob);
    }
  }, [blob, isValidDuration, onComplete]);

  const handleRetry = useCallback(() => {
    reset();
    setHasRecorded(false);
  }, [reset]);

  const shell =
    accent === "pastel"
      ? "rounded-[22px] border border-purple-100/80 bg-white/95 p-6 shadow-[0_10px_30px_rgba(168,139,235,0.12)]"
      : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
  const micIdle =
    accent === "pastel"
      ? "bg-gradient-to-br from-[#BA68C8] to-[#FF80AB] text-white shadow-lg shadow-fuchsia-500/25 hover:opacity-95"
      : "bg-sky-500 text-white hover:bg-sky-600";
  const successBox =
    accent === "pastel"
      ? "bg-gradient-to-r from-violet-50 to-fuchsia-50/80 border border-purple-100/60"
      : "bg-emerald-50";
  const successIcon = accent === "pastel" ? "text-purple-600" : "text-emerald-600";
  const successText = accent === "pastel" ? "text-purple-900/85" : "text-emerald-800";
  const titleClass = accent === "pastel" ? "text-lg font-semibold text-purple-950/90" : "text-lg font-semibold text-slate-900";

  return (
    <div className={shell}>
      <h3 className={titleClass}>采集你的音色</h3>
      <p className="mt-2 text-sm text-slate-600">
        请朗读下面这段话，系统会采集你的声音特征，生成 Agent 的专属音色。建议在安静环境下录制，时长 {minDurationSeconds}–{maxDurationSeconds} 秒。
      </p>

      {envIssue ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">无法在此页面使用麦克风</p>
          <p className="mt-1 leading-relaxed">{envIssue}</p>
        </div>
      ) : null}

      <div
        className={
          accent === "pastel"
            ? "mt-5 rounded-xl border border-purple-100/50 bg-violet-50/40 p-4"
            : "mt-5 rounded-xl bg-slate-50 p-4"
        }
      >
        <p className="text-[15px] leading-7 text-slate-700">{SAMPLE_TEXT}</p>
      </div>

      <div
        className={
          accent === "pastel"
            ? "mt-4 rounded-xl border border-purple-100/50 bg-white/60 px-4 py-3 text-sm text-slate-600"
            : "mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600"
        }
      >
        <p>建议使用 Chrome 或 Edge，并确保当前页面通过 HTTPS 或 localhost 打开。</p>
        <p className="mt-1">录音样本不会跟随草稿自动保存；如果刷新或离开页面，回来后需要重新录制。</p>
        <p className="mt-1">如果创建成功后仍没有生成音色，通常是服务端音色注册失败，可稍后在设置页补录。</p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        {!hasRecorded ? (
          <>
            <button
              type="button"
              onClick={isRecording ? stop : start}
              disabled={status === "processing" || micBlocked}
              className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                isRecording
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse"
                  : micIdle
              }`}
            >
              {isRecording ? (
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.83V20c0 .55.45 1 1 1s1-.45 1-1v-2.18c3.02-.48 5.42-2.83 5.91-5.83.1-.6-.39-1.14-1-1.14z" />
                </svg>
              )}
            </button>
            <p className="text-sm text-slate-500">
              {isRecording ? (
                <>
                  <span className="font-medium text-rose-600">{duration}s</span>
                  {duration < minDurationSeconds && (
                    <span> · 至少 {minDurationSeconds} 秒</span>
                  )}
                  {duration > maxDurationSeconds && (
                    <span> · 已自动停止</span>
                  )}
                </>
              ) : (
                "点击开始录制"
              )}
            </p>
            {duration > maxDurationSeconds && !blob && (
              <p className="text-xs text-amber-600">录制已超时，请重新录制</p>
            )}
          </>
        ) : (
          <>
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${successBox}`}>
              <svg className={`h-6 w-6 ${successIcon}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className={`text-sm font-medium ${successText}`}>录制完成，时长 {duration} 秒</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleRetry} className="btn-secondary">
                重新录制
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-primary disabled:opacity-50"
              >
                使用此音色
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-rose-600">{error}</p>
        )}

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-2 text-sm text-slate-500 hover:text-slate-700 underline"
          >
            暂不设置音色，稍后可在设置中补充
          </button>
        )}
      </div>
    </div>
  );
}
