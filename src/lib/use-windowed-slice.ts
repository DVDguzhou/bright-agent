"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WindowedSliceOptions = {
  /** 为 false 时始终返回全量 items，不监听滚动（管理页等） */
  enabled?: boolean;
  /** 首屏挂载条数（类似信息流首刷） */
  initial?: number;
  /** 每次触底再挂载条数 */
  page?: number;
  /** 列表根底部预取距离（px），略大则更接近「提前半屏加载」 */
  rootMargin?: string;
  /**
   * 任意变化时重置可见窗口（如切换 tab、搜索词）。
   * 不传时仅用 length 变化触发重置，适合多数列表。
   */
  resetKey?: string | number;
};

const DEFAULT_INITIAL = 12;
const DEFAULT_PAGE = 12;
const DEFAULT_ROOT_MARGIN = "360px 0px";

/**
 * 小红书类 App 常见策略：首屏只挂载少量卡片，滚动接近底部再批量追加，
 * 避免一次把上百个复杂卡片（图+动效）全部挂进 DOM。
 */
export function useWindowedSlice<T>(items: T[], options?: WindowedSliceOptions) {
  const enabled = options?.enabled ?? true;
  const initial = options?.initial ?? DEFAULT_INITIAL;
  const page = options?.page ?? DEFAULT_PAGE;
  const rootMargin = options?.rootMargin ?? DEFAULT_ROOT_MARGIN;
  const resetKey = options?.resetKey;

  const len = items.length;
  const [visibleCount, setVisibleCount] = useState(() => Math.min(initial, len));

  useEffect(() => {
    if (!enabled) {
      setVisibleCount(len);
      return;
    }
    setVisibleCount(Math.min(initial, len));
  }, [enabled, initial, len, resetKey]);

  useEffect(() => {
    if (!enabled) return;
    setVisibleCount((c) => Math.min(c, len));
  }, [enabled, len]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (visibleCount >= len) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        setVisibleCount((c) => Math.min(c + page, len));
      },
      { root: null, rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, visibleCount, len, page, rootMargin]);

  const slice = enabled ? items.slice(0, visibleCount) : items;
  const hasMore = enabled && visibleCount < len;

  const loadMore = useCallback(() => {
    if (!enabled) return;
    setVisibleCount((c) => Math.min(c + page, len));
  }, [enabled, len, page]);

  return { slice, visibleCount, hasMore, sentinelRef, loadMore };
}
