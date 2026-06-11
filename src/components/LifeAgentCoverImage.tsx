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
  DEFAULT_COVER_FINAL_FALLBACK_SRC,
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
  /** 小头像模式：不显示「正在加载中」文字，只用浅色占位 */
  compact?: boolean;
  onError?: ReactEventHandler<HTMLImageElement>;
};

/**
 * 人生 Agent 封面：原生 img；默认优先自包含 default-cover.svg，加载失败时链式回退到内联占位等。
 */
export function LifeAgentCoverImage({
  src,
  onLoad,
  onError,
  fill,
  priority,
  loading,
  sizes: _sizes,
  compact = false,
  className,
  alt = "",
  ...rest
}: LifeAgentCoverImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [resolved, setResolved] = useState(() => normalizeLifeAgentCoverImgSrc(src));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setResolved(normalizeLifeAgentCoverImgSrc(src));
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const markIfReady = () => {
      if (img.complete && img.naturalWidth > 0) {
        setLoaded(true);
      }
    };

    markIfReady();
    img.addEventListener("load", markIfReady);
    return () => img.removeEventListener("load", markIfReady);
  }, [resolved]);

  const cls = [fill ? "absolute inset-0 h-full w-full" : "", className].filter(Boolean).join(" ") || undefined;

  return (
    <div className={fill ? "relative h-full w-full" : "relative inline-block"}>
      <img
        {...rest}
        ref={imgRef}
        src={resolved}
        alt={alt}
        draggable={false}
        className={[cls, loaded ? "opacity-100" : "opacity-0"].filter(Boolean).join(" ")}
        style={{ WebkitUserDrag: "none", ...(rest.style ?? {}) } as React.CSSProperties}
        loading={priority ? "eager" : loading === "lazy" ? "lazy" : loading}
        decoding="async"
        {...(priority ? ({ fetchPriority: "high" } as ImgHTMLAttributes<HTMLImageElement>) : {})}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e: SyntheticEvent<HTMLImageElement>) => {
          onError?.(e);
          setResolved((cur) => {
            const next = nextLifeAgentCoverFallbackSrc(cur);
            if (next === DEFAULT_COVER_FINAL_FALLBACK_SRC) {
              setLoaded(true);
            }
            return next;
          });
        }}
      />
      {!loaded ? (
        compact ? (
          <div
            className={[
              fill ? "absolute inset-0" : "absolute inset-0",
              "pointer-events-none animate-pulse bg-gradient-to-br from-paper-100/90 to-paper-100/70",
            ].join(" ")}
            aria-hidden
          />
        ) : (
          <div
            className={[
              fill ? "absolute inset-0" : "absolute inset-0",
              "pointer-events-none flex items-center justify-center bg-gradient-to-br from-paper-100/85 to-paper-100/65 text-xs font-medium text-ink-400",
            ].join(" ")}
            aria-live="polite"
          >
            正在加载中
          </div>
        )
      ) : null}
    </div>
  );
}
