"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionStatus = "idle" | "listening" | "processing" | "error";

type RecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: SpeechResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

interface SpeechResultItem {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechResultList {
  length: number;
  [i: number]: SpeechResultItem;
}

export function useSpeechRecognition(options?: {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => RecognitionInstance }).webkitSpeechRecognition)
      : null;

  const isSupported = !!SpeechRecognitionAPI;

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI || !isSupported) {
      setError("当前浏览器不支持语音识别，请使用 Chrome 或 Edge");
      setStatus("error");
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI() as RecognitionInstance;
      recognition.lang = options?.lang ?? "zh-CN";
      recognition.continuous = options?.continuous ?? true;
      recognition.interimResults = options?.interimResults ?? true;

      recognition.onstart = () => {
        setStatus("listening");
        setError(null);
        setTranscript("");
      };

      recognition.onresult = (event: { resultIndex: number; results: SpeechResultList }) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += text;
            options?.onResult?.(text, true);
          } else {
            interimTranscript += text;
            options?.onResult?.(text, false);
          }
        }
        setTranscript((prev) => {
          const next = prev + finalTranscript + (interimTranscript || "");
          return next.trim();
        });
      };

      recognition.onend = () => {
        setStatus("idle");
      };

      recognition.onerror = (event: { error: string }) => {
        const msg =
          event.error === "not-allowed"
            ? "请允许麦克风权限"
            : event.error === "no-speech"
              ? "未检测到语音，请重试"
              : event.error === "network"
                ? "网络错误，请检查连接"
                : `语音识别错误: ${event.error}`;
        setError(msg);
        setStatus("error");
        options?.onError?.(msg);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "语音识别初始化失败";
      setError(msg);
      setStatus("error");
    }
  }, [SpeechRecognitionAPI, isSupported, options?.lang, options?.continuous, options?.interimResults, options?.onResult, options?.onError]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setStatus("idle");
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setError(null);
    setStatus("idle");
  }, [stop]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isSupported,
    status,
    transcript,
    error,
    start,
    stop,
    reset,
  };
}
