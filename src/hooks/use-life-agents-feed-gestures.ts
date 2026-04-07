"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SWIPE_TAB_MIN_DX = 56;
const SWIPE_TAB_MAX_DEVY = 100;
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
  startedOnInteractive: boolean;
};

function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el?.closest) return false;
  return !!el.closest("a,button,input,textarea,select,[role='button'],label");
}

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
        startedOnInteractive: isInteractiveTarget(e.target),
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      const a = activeRef.current;
      if (!a || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - a.x0;
      const dy = t.clientY - a.y0;

      if (a.intent === "unknown") {
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx) * 1.25) {
          a.intent = "vertical";
          return;
        }
        if (
          !a.startedOnInteractive &&
          Math.abs(dx) > 14 &&
          Math.abs(dx) > Math.abs(dy) * 1.25
        ) {
          a.intent = "horizontal";
          return;
        }
        if (a.ptrArmed && scrollTop() <= PTR_MAX_SCROLL && dy > 16 && dy > Math.abs(dx) * 0.85) {
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

      if (a.intent === "horizontal" && !a.startedOnInteractive) {
        const dx = t.clientX - a.x0;
        const devY = Math.abs(t.clientY - a.y0);
        if (devY > SWIPE_TAB_MAX_DEVY) return;
        const cur = tabIndexRef.current;
        if (dx <= -SWIPE_TAB_MIN_DX) navigateTab(cur + 1);
        else if (dx >= SWIPE_TAB_MIN_DX) navigateTab(cur - 1);
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
    document.addEventListener("touchend", onTouchEnd, { passive: true });
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
