"use client";

import {
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactEventHandler,
  type SyntheticEvent,
} from "react";
import {
  DEFAULT_COVER_PNG_URL,
  DEFAULT_COVER_SVG_URL,
  nextLifeAgentCoverFallbackSrc,
  normalizeLifeAgentCoverImgSrc,
} from "@/lib/life-agent-covers";

export type LifeAgentCoverImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src: string;
  /** 与 next/image 一致：在 position:relative 容器内铺满 */
  fill?: boolean;
  priority?: boolean;
  /** 仅为与 next/image API 对齐，原生 img 不使用 */
  sizes?: string;
  onError?: ReactEventHandler<HTMLImageElement>;
};

const PRIMARY_RETRY_DELAYS_MS = [250, 1000] as const;

function canRetryPrimarySrc(src: string): boolean {
  if (!src || src.startsWith("data:image/")) return false;
  return src !== DEFAULT_COVER_PNG_URL && src !== DEFAULT_COVER_SVG_URL;
}

function withRetryBust(src: string, attempt: number): string {
  if (attempt <= 0) return src;
  try {
    const parsed = src.startsWith("http://") || src.startsWith("https://")
      ? new URL(src)
      : new URL(src, "https://placeholder.local");
    parsed.searchParams.set("__retry", String(attempt));
    return parsed.origin === "https://placeholder.local"
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : parsed.toString();
  } catch {
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}__retry=${attempt}`;
  }
}

/**
 * 人生 Agent 封面：原生 img；默认可用 public 下 default-cover.png / default-cover.svg，
 * 加载失败时按 PNG → SVG → 极小内联占位 链式回退。
 */
export function LifeAgentCoverImage({
  src,
  onError,
  fill,
  priority,
  loading,
  sizes: _sizes,
  className,
  alt = "",
  ...rest
}: LifeAgentCoverImageProps) {
  const normalizedPrimarySrc = normalizeLifeAgentCoverImgSrc(src);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [primaryRetryAttempt, setPrimaryRetryAttempt] = useState(0);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setPrimaryRetryAttempt(0);
    setFallbackSrc(null);
  }, [normalizedPrimarySrc]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  const cls = [fill ? "absolute inset-0 h-full w-full" : "", className].filter(Boolean).join(" ") || undefined;
  const resolved = fallbackSrc ?? withRetryBust(normalizedPrimarySrc, primaryRetryAttempt);

  return (
    <img
      {...rest}
      src={resolved}
      alt={alt}
      className={cls}
      loading={priority ? "eager" : loading === "lazy" ? "lazy" : loading}
      decoding="async"
      {...(priority ? ({ fetchPriority: "high" } as ImgHTMLAttributes<HTMLImageElement>) : {})}
      onError={(e: SyntheticEvent<HTMLImageElement>) => {
        onError?.(e);
        if (!fallbackSrc && canRetryPrimarySrc(normalizedPrimarySrc) && primaryRetryAttempt < PRIMARY_RETRY_DELAYS_MS.length) {
          const nextAttempt = primaryRetryAttempt + 1;
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            setPrimaryRetryAttempt(nextAttempt);
          }, PRIMARY_RETRY_DELAYS_MS[primaryRetryAttempt]);
          return;
        }
        const nextFallback = nextLifeAgentCoverFallbackSrc(fallbackSrc ?? normalizedPrimarySrc);
        if (fallbackSrc === nextFallback) return;
        setFallbackSrc(nextFallback);
      }}
    />
  );
}
