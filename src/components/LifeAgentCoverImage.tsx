"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { DEFAULT_COVER_URL, lifeAgentCoverShouldBypassOptimizer } from "@/lib/life-agent-covers";

export type LifeAgentCoverImageProps = Omit<ImageProps, "src" | "onError" | "unoptimized"> & {
  src: string;
  onError?: ImageProps["onError"];
};

/** 人生 Agent 封面：加载失败（如预设 .png 未部署）时回退到统一默认图 */
export function LifeAgentCoverImage({ src, onError, ...rest }: LifeAgentCoverImageProps) {
  const [resolved, setResolved] = useState(src);
  useEffect(() => {
    setResolved(src);
  }, [src]);

  return (
    <Image
      {...rest}
      src={resolved}
      unoptimized={lifeAgentCoverShouldBypassOptimizer(resolved)}
      onError={(e) => {
        onError?.(e);
        if (resolved !== DEFAULT_COVER_URL) {
          setResolved(DEFAULT_COVER_URL);
        }
      }}
    />
  );
}
