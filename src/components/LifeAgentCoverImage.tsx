"use client";

import {
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactEventHandler,
  type SyntheticEvent,
} from "react";
import { nextLifeAgentCoverFallbackSrc, normalizeLifeAgentCoverImgSrc } from "@/lib/life-agent-covers";

export type LifeAgentCoverImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src: string;
  /** 与 next/image 一致：在 position:relative 容器内铺满 */
  fill?: boolean;
  priority?: boolean;
  /** 仅为与 next/image API 对齐，原生 img 不使用 */
  sizes?: string;
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
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [resolved]);

  const cls = [fill ? "absolute inset-0 h-full w-full" : "", className].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <img
        {...rest}
        ref={imgRef}
        src={resolved}
        alt={alt}
        className={[cls, loaded ? "opacity-100" : "opacity-0"].filter(Boolean).join(" ")}
        loading={priority ? "eager" : loading === "lazy" ? "lazy" : loading}
        decoding="async"
        {...(priority ? ({ fetchPriority: "high" } as ImgHTMLAttributes<HTMLImageElement>) : {})}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e: SyntheticEvent<HTMLImageElement>) => {
          setLoaded(false);
          onError?.(e);
          setResolved((cur) => nextLifeAgentCoverFallbackSrc(cur));
        }}
      />
      {!loaded ? (
        <div
          className={[
            fill ? "absolute inset-0" : "absolute inset-0",
            "pointer-events-none flex items-center justify-center bg-gradient-to-br from-violet-100/85 to-fuchsia-100/65 text-xs font-medium text-slate-500",
          ].join(" ")}
          aria-live="polite"
        >
          正在加载中
        </div>
      ) : null}
    </>
  );
}
