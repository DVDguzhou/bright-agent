"use client";

import { useEffect, useRef, useState } from "react";

const PULL_MIN_DY = 56;
const PTR_MAX_SCROLL = 24;
const PULL_RESIST = 0.5;
const PULL_CAP = 100;

type Active = {
  pointerId: number;
  x0: number;
  y0: number;
  intent: "unknown" | "vertical" | "pull";
  ptrArmed: boolean;
};

/**
 * 页面顶部下拉刷新（Pointer Events：触摸 / 鼠标 / 笔统一）。
 * 横向切 Tab 由页面内 scroll-snap 处理，手势里优先识别横向滑动。
 */
export function useLifeAgentsFeedGestures(opts: {
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

    const scrollTop = () => {
      const el = document.scrollingElement ?? document.documentElement;
      return window.scrollY ?? window.pageYOffset ?? el.scrollTop ?? 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      activeRef.current = {
        pointerId: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        intent: "unknown",
        ptrArmed: scrollTop() <= PTR_MAX_SCROLL,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const a = activeRef.current;
      if (!a || e.pointerId !== a.pointerId) return;
      const dx = e.clientX - a.x0;
      const dy = e.clientY - a.y0;

      if (a.intent === "unknown") {
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.15) {
          a.intent = "vertical";
          return;
        }
        const st = scrollTop();
        const atTop = st <= PTR_MAX_SCROLL;
        if (a.ptrArmed && atTop && dy > 8 && dy > Math.abs(dx) * 0.9) {
          a.intent = "pull";
        } else if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.2) {
          a.intent = "vertical";
        }
      }

      // 已进入 pull 后不要再根据 scrollTop 清空：iOS 弹性滚动会让 scrollTop 瞬间 > 阈值，指示条会抖一下就消失
      if (a.intent === "pull") {
        const pull = Math.min(PULL_CAP, Math.max(0, dy * PULL_RESIST));
        setPullOffset(pull);
      }
    };

    const finishPull = async (clientY: number) => {
      const a = activeRef.current;
      activeRef.current = null;
      if (!a) return;

      if (a.intent === "pull") {
        const dy = clientY - a.y0;
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

    const onPointerUp = (e: PointerEvent) => {
      const a = activeRef.current;
      if (!a || e.pointerId !== a.pointerId) return;
      void finishPull(e.clientY);
    };

    const onPointerCancel = (e: PointerEvent) => {
      const a = activeRef.current;
      if (!a || e.pointerId !== a.pointerId) return;
      // Safari 常在下拉时先发 cancel 再 up；若在 pull 态则仍按松手距离判断是否刷新
      if (a.intent === "pull") {
        void finishPull(e.clientY);
        return;
      }
      activeRef.current = null;
      setPullOffset(0);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointercancel", onPointerCancel, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
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
