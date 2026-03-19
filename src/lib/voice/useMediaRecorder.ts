"use client";

import { useCallback, useRef, useState } from "react";

export type RecordingStatus = "idle" | "recording" | "processing" | "error";

export function useMediaRecorder(options?: {
  mimeType?: string;
  audioBitsPerSecond?: number;
  onDataAvailable?: (blob: Blob) => void;
}) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      setBlob(null);
      setDuration(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = options?.mimeType ?? "audio/webm;codecs=opus";
      const supported = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : "audio/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType: supported,
        audioBitsPerSecond: options?.audioBitsPerSecond ?? 128000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (chunksRef.current.length > 0) {
          const resultBlob = new Blob(chunksRef.current, { type: supported });
          setBlob(resultBlob);
          options?.onDataAvailable?.(resultBlob);
        }
        setStatus("idle");
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      recorder.onerror = () => {
        setError("录音失败");
        setStatus("error");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setStatus("recording");

      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const d = Math.floor((Date.now() - startTime) / 1000);
        setDuration(d);
      }, 500);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "无法访问麦克风，请检查权限";
      setError(msg);
      setStatus("error");
    }
  }, [options?.mimeType, options?.audioBitsPerSecond, options?.onDataAvailable]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setStatus("processing");
    }
  }, []);

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setBlob(null);
    setError(null);
    setDuration(0);
    setStatus("idle");
  }, []);

  return {
    status,
    blob,
    error,
    duration,
    start,
    stop,
    reset,
  };
}
