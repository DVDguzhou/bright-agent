"use client";

import { useEffect, useRef, useState } from "react";

const PULL_MIN_DY = 72;
const PTR_MAX_SCROLL = 10;
const PULL_RESIST = 0.5;
const PULL_CAP = 100;

type Active = {
  x0: number;
  y0: number;
  intent: "unknown" | "vertical" | "pull";
  ptrArmed: boolean;
};

/** 仅下拉刷新；横向切 Tab 由页面内 scroll-snap 分页处理 */
export function useLifeAgentsFeedGestures(opts: {
  /** 仅触摸 + 窄屏时启用 */
  enabled: boolean;
  onPullRefresh: () => void | Promise<void>;
}) {
  const { enabled, onPullRefresh } = opts;

  const [pullOffset, setPullOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const activeRef = useRef<Active | null>(null);
  const refreshingRef = useRef(false);
  const onPullRefreshRef = useRef(onPullRefresh);
  onPullRefreshRef.current = onPullRefresh;

  useEffect(() => {
    if (!enabled) {
      setPullOffset(0);
      return;
    }

    const scrollTop = () => window.scrollY || document.documentElement.scrollTop;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      activeRef.current = {
        x0: t.clientX,
        y0: t.clientY,
        intent: "unknown",
        ptrArmed: scrollTop() <= PTR_MAX_SCROLL,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      const a = activeRef.current;
      if (!a || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - a.x0;
      const dy = t.clientY - a.y0;

      if (a.intent === "unknown") {
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.15) {
          a.intent = "vertical";
          return;
        }
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.2) {
          a.intent = "vertical";
          return;
        }
        if (a.ptrArmed && scrollTop() <= PTR_MAX_SCROLL && dy > 18 && dy > Math.abs(dx) * 0.92) {
          a.intent = "pull";
        }
      }

      if (a.intent === "pull") {
        if (scrollTop() > PTR_MAX_SCROLL) {
          setPullOffset(0);
          return;
        }
        const pull = Math.min(PULL_CAP, Math.max(0, dy * PULL_RESIST));
        setPullOffset(pull);
      }
    };

    const finishPull = async (e: TouchEvent) => {
      const a = activeRef.current;
      activeRef.current = null;
      if (!a) return;

      const t = e.changedTouches[0];
      if (!t) {
        setPullOffset(0);
        return;
      }

      if (a.intent === "pull") {
        const dy = t.clientY - a.y0;
        setPullOffset(0);
        if (dy >= PULL_MIN_DY && !refreshingRef.current) {
          refreshingRef.current = true;
          setRefreshing(true);
          try {
            await Promise.resolve(onPullRefreshRef.current());
          } finally {
            setRefreshing(false);
            refreshingRef.current = false;
          }
        }
      } else {
        setPullOffset(0);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      void finishPull(e);
    };

    const onTouchCancel = () => {
      activeRef.current = null;
      setPullOffset(0);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [enabled]);

  return { pullOffset, refreshing };
}

export function useMobileTouchNavEnabled(): boolean {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const read = () =>
      setOk(mq.matches && ("ontouchstart" in window || navigator.maxTouchPoints > 0));
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  return ok;
}
