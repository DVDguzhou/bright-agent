"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SWIPE_TAB_MIN_DX = 48;
const SWIPE_TAB_MAX_DEVY = 130;
const PULL_MIN_DY = 72;
const PTR_MAX_SCROLL = 10;
const PULL_RESIST = 0.5;
const PULL_CAP = 100;

function hrefFromTabIndex(i: number): string {
  if (i === 0) return "/life-agents?tab=favorites";
  if (i === 2) return "/life-agents?tab=purchased";
  return "/life-agents";
}

type Active = {
  x0: number;
  y0: number;
  intent: "unknown" | "horizontal" | "vertical" | "pull";
  ptrArmed: boolean;
};

export function useLifeAgentsFeedGestures(opts: {
  feedTab: string | null;
  /** 仅触摸 + 窄屏时启用 */
  enabled: boolean;
  onPullRefresh: () => void | Promise<void>;
}) {
  const router = useRouter();
  const { feedTab, enabled, onPullRefresh } = opts;

  const tabIndex =
    feedTab === "favorites" ? 0 : feedTab === "purchased" ? 2 : 1;
  const tabIndexRef = useRef(tabIndex);
  tabIndexRef.current = tabIndex;

  const [pullOffset, setPullOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const activeRef = useRef<Active | null>(null);
  const refreshingRef = useRef(false);
  const onPullRefreshRef = useRef(onPullRefresh);
  onPullRefreshRef.current = onPullRefresh;

  const navigateTab = useCallback((nextIdx: number) => {
    const cur = tabIndexRef.current;
    if (nextIdx < 0 || nextIdx > 2 || nextIdx === cur) return;
    router.push(hrefFromTabIndex(nextIdx), { scroll: false });
  }, [router]);

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
        // 先认横向：列表/卡片上滑动时也能切 Tab（略宽于纵向判定）
        if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.08) {
          a.intent = "horizontal";
          return;
        }
        if (Math.abs(dy) > 26 && Math.abs(dy) > Math.abs(dx) * 1.4) {
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

    const finishPullOrSwipe = async (e: TouchEvent) => {
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
        return;
      }

      if (a.intent === "horizontal") {
        const dx = t.clientX - a.x0;
        const devY = Math.abs(t.clientY - a.y0);
        if (devY > SWIPE_TAB_MAX_DEVY) return;
        const cur = tabIndexRef.current;
        let navigated = false;
        if (dx <= -SWIPE_TAB_MIN_DX && cur < 2) {
          navigateTab(cur + 1);
          navigated = true;
        } else if (dx >= SWIPE_TAB_MIN_DX && cur > 0) {
          navigateTab(cur - 1);
          navigated = true;
        }
        if (navigated) e.preventDefault();
        return;
      }

      // 快速横滑可能未进入 move 判定，结束时按位移补判
      if (a.intent === "unknown") {
        const dx = t.clientX - a.x0;
        const devY = Math.abs(t.clientY - a.y0);
        if (devY <= 95 && Math.abs(dx) >= 52) {
          const cur = tabIndexRef.current;
          let navigated = false;
          if (dx <= -52 && cur < 2) {
            navigateTab(cur + 1);
            navigated = true;
          } else if (dx >= 52 && cur > 0) {
            navigateTab(cur - 1);
            navigated = true;
          }
          if (navigated) e.preventDefault();
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      void finishPullOrSwipe(e);
    };

    const onTouchCancel = () => {
      activeRef.current = null;
      setPullOffset(0);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    // passive: false 以便横滑切 Tab 后 preventDefault，减少误点进卡片链接
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [enabled, navigateTab]);

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
