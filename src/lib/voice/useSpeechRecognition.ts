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
  onSessionEnd?: (transcript: string) => void;
  onError?: (error: string) => void;
}) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const finalTranscriptRef = useRef("");
  const emitSessionEndRef = useRef(true);

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => RecognitionInstance }).webkitSpeechRecognition)
      : null;
  const lang = options?.lang ?? "zh-CN";
  const continuous = options?.continuous ?? true;
  const interimResults = options?.interimResults ?? true;
  const onResult = options?.onResult;
  const onSessionEnd = options?.onSessionEnd;
  const onError = options?.onError;

  const isSupported = !!SpeechRecognitionAPI;

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI || !isSupported) {
      setError("当前浏览器不支持语音识别，请使用 Chrome 或 Edge");
      setStatus("error");
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI() as RecognitionInstance;
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => {
        emitSessionEndRef.current = true;
        finalTranscriptRef.current = "";
        transcriptRef.current = "";
        setStatus("listening");
        setError(null);
        setTranscript("");
      };

      recognition.onresult = (event: { resultIndex: number; results: SpeechResultList }) => {
        let finalChunk = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            finalChunk += text;
            onResult?.(text, true);
          } else {
            interimTranscript += text;
            onResult?.(text, false);
          }
        }
        finalTranscriptRef.current = `${finalTranscriptRef.current}${finalChunk}`.trim();
        transcriptRef.current = `${finalTranscriptRef.current}${interimTranscript}`.trim();
        setTranscript(transcriptRef.current);
      };

      recognition.onend = () => {
        setStatus("idle");
        if (emitSessionEndRef.current) {
          onSessionEnd?.(transcriptRef.current.trim());
        }
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
        emitSessionEndRef.current = false;
        setError(msg);
        setStatus("error");
        onError?.(msg);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "语音识别初始化失败";
      setError(msg);
      setStatus("error");
    }
  }, [
    SpeechRecognitionAPI,
    isSupported,
    lang,
    continuous,
    interimResults,
    onResult,
    onSessionEnd,
    onError,
  ]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setStatus("processing");
    }
  }, []);

  const reset = useCallback(() => {
    emitSessionEndRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    finalTranscriptRef.current = "";
    transcriptRef.current = "";
    setTranscript("");
    setError(null);
    setStatus("idle");
  }, []);

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
