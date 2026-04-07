"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const EDGE_PX = 28;
const MIN_DX = 72;
const MAX_DEV_Y = 120;

/**
 * 自屏幕左缘向右滑返回上一页（移动优先）。
 */
export function useEdgeSwipeBack(enabled: boolean) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!enabled) return;

    let x0 = 0;
    let y0 = 0;
    let armed = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      x0 = t.clientX;
      y0 = t.clientY;
      armed = t.clientX <= EDGE_PX;
      if (!armed) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("input,textarea,select,[data-no-edge-swipe]")) {
        armed = false;
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!armed) return;
      armed = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - x0;
      const dy = Math.abs(t.clientY - y0);
      if (dx >= MIN_DX && dy <= MAX_DEV_Y) {
        const r = routerRef.current;
        if (typeof window !== "undefined" && window.history.length > 1) r.back();
        else r.push("/life-agents");
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true, capture: true });
    document.addEventListener("touchend", onEnd, { passive: true, capture: true });
    return () => {
      document.removeEventListener("touchstart", onStart, true);
      document.removeEventListener("touchend", onEnd, true);
    };
  }, [enabled]);
}
