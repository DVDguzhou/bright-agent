"use client";

import {
  useEffect,
  useState,
  type ImgHTMLAttributes,
  type ReactEventHandler,
  type SyntheticEvent,
} from "react";
import { DEFAULT_COVER_INLINE_SRC, normalizeLifeAgentCoverImgSrc } from "@/lib/life-agent-covers";

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
 * 人生 Agent 封面：原生 img；默认封面走 data URL，不依赖 public 静态路径；其它 URL 失败时回退内联默认图。
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
  const [resolved, setResolved] = useState(() => normalizeLifeAgentCoverImgSrc(src));
  useEffect(() => {
    setResolved(normalizeLifeAgentCoverImgSrc(src));
  }, [src]);

  const cls = [fill ? "absolute inset-0 h-full w-full" : "", className].filter(Boolean).join(" ") || undefined;

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
        if (resolved !== DEFAULT_COVER_INLINE_SRC) {
          setResolved(DEFAULT_COVER_INLINE_SRC);
        }
      }}
    />
  );
}
