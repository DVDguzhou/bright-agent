"use client";

import { useEffect, useRef, useState } from "react";

const PULL_MIN_DY = 56;
const PTR_MAX_SCROLL = 24;
const PULL_RESIST = 0.5;
const PULL_CAP = 100;

type TouchSession = {
  id: number;
  x0: number;
  y0: number;
  intent: "unknown" | "pan-x" | "scroll-y" | "pull";
};

type PointerSession = {
  pointerId: number;
  x0: number;
  y0: number;
  intent: "unknown" | "vertical" | "pull";
  ptrArmed: boolean;
};

const scrollTopNow = () => {
  const el = document.scrollingElement ?? document.documentElement;
  return window.scrollY ?? window.pageYOffset ?? el.scrollTop ?? 0;
};

/**
 * 人生 Agent 发现页顶部下拉刷新。
 * - 触摸设备：Touch + touchmove passive:false，在 pull 态 preventDefault，避免 iOS Safari 抢走手势导致闪一下就没了。
 * - 纯鼠标：Pointer Events（不 preventDefault）。
 */
export function useLifeAgentsFeedGestures(opts: {
  enabled: boolean;
  onPullRefresh: () => void | Promise<void>;
}) {
  const { enabled, onPullRefresh } = opts;

  const [pullOffset, setPullOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchSessionRef = useRef<TouchSession | null>(null);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const refreshingRef = useRef(false);
  const onPullRefreshRef = useRef(onPullRefresh);
  onPullRefreshRef.current = onPullRefresh;

  const runRefresh = async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await Promise.resolve(onPullRefreshRef.current());
    } finally {
      setRefreshing(false);
      refreshingRef.current = false;
    }
  };

  useEffect(() => {
    if (!enabled) {
      setPullOffset(0);
      return;
    }

    const touchCoarse =
      typeof navigator !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    const touchMoveOpts: AddEventListenerOptions = { passive: false, capture: true };

    const detachTouchMove = () => {
      document.removeEventListener("touchmove", onTouchMove as EventListener, touchMoveOpts);
    };

    const finishTouch = async (clientY: number) => {
      const s = touchSessionRef.current;
      touchSessionRef.current = null;
      detachTouchMove();

      if (!s) return;
      if (s.intent === "pull") {
        const dy = clientY - s.y0;
        setPullOffset(0);
        if (dy >= PULL_MIN_DY) await runRefresh();
      } else {
        setPullOffset(0);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const s = touchSessionRef.current;
      if (!s || e.touches.length !== 1) return;
      const t = e.touches[0];
      if (t.identifier !== s.id) return;

      const dx = t.clientX - s.x0;
      const dy = t.clientY - s.y0;

      if (s.intent === "unknown") {
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.15) {
          s.intent = "pan-x";
          return;
        }
        const st = scrollTopNow();
        const atTop = st <= PTR_MAX_SCROLL;
        if (atTop && dy > 8 && dy > Math.abs(dx) * 0.9) {
          s.intent = "pull";
        } else if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.2) {
          s.intent = "scroll-y";
        }
      }

      if (s.intent === "pull") {
        e.preventDefault();
        const pull = Math.min(PULL_CAP, Math.max(0, dy * PULL_RESIST));
        setPullOffset(pull);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!touchCoarse || e.touches.length !== 1) return;
      detachTouchMove();
      touchSessionRef.current = null;
      if (scrollTopNow() > PTR_MAX_SCROLL) return;
      const t = e.touches[0];
      touchSessionRef.current = {
        id: t.identifier,
        x0: t.clientX,
        y0: t.clientY,
        intent: "unknown",
      };
      document.addEventListener("touchmove", onTouchMove as EventListener, touchMoveOpts);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const s = touchSessionRef.current;
      if (!s) return;
      const t = Array.from(e.changedTouches).find((c) => c.identifier === s.id);
      if (!t) return;
      void finishTouch(t.clientY);
    };

    const onTouchCancel = (e: TouchEvent) => {
      const s = touchSessionRef.current;
      if (!s) return;
      const t = Array.from(e.changedTouches).find((c) => c.identifier === s.id);
      if (!t) {
        touchSessionRef.current = null;
        detachTouchMove();
        setPullOffset(0);
        return;
      }
      void finishTouch(t.clientY);
    };

    /* ---------- 鼠标 / 无触摸：Pointer ---------- */
    const onPointerDown = (e: PointerEvent) => {
      if (touchCoarse && (e.pointerType === "touch" || e.pointerType === "pen")) return;
      if (!e.isPrimary) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointerSessionRef.current = {
        pointerId: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        intent: "unknown",
        ptrArmed: scrollTopNow() <= PTR_MAX_SCROLL,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (touchCoarse && (e.pointerType === "touch" || e.pointerType === "pen")) return;
      const a = pointerSessionRef.current;
      if (!a || e.pointerId !== a.pointerId) return;
      const dx = e.clientX - a.x0;
      const dy = e.clientY - a.y0;

      if (a.intent === "unknown") {
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.15) {
          a.intent = "vertical";
          return;
        }
        const st = scrollTopNow();
        const atTop = st <= PTR_MAX_SCROLL;
        if (a.ptrArmed && atTop && dy > 8 && dy > Math.abs(dx) * 0.9) {
          a.intent = "pull";
        } else if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.2) {
          a.intent = "vertical";
        }
      }

      if (a.intent === "pull") {
        const pull = Math.min(PULL_CAP, Math.max(0, dy * PULL_RESIST));
        setPullOffset(pull);
      }
    };

    const finishPointer = async (clientY: number) => {
      const a = pointerSessionRef.current;
      pointerSessionRef.current = null;
      if (!a) return;
      if (a.intent === "pull") {
        const dy = clientY - a.y0;
        setPullOffset(0);
        if (dy >= PULL_MIN_DY) await runRefresh();
      } else {
        setPullOffset(0);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (touchCoarse && (e.pointerType === "touch" || e.pointerType === "pen")) return;
      const a = pointerSessionRef.current;
      if (!a || e.pointerId !== a.pointerId) return;
      void finishPointer(e.clientY);
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (touchCoarse && (e.pointerType === "touch" || e.pointerType === "pen")) return;
      const a = pointerSessionRef.current;
      if (!a || e.pointerId !== a.pointerId) return;
      if (a.intent === "pull") {
        void finishPointer(e.clientY);
        return;
      }
      pointerSessionRef.current = null;
      setPullOffset(0);
    };

    if (touchCoarse) {
      document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
      document.addEventListener("touchend", onTouchEnd, { capture: true });
      document.addEventListener("touchcancel", onTouchCancel, { capture: true });
    }

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointercancel", onPointerCancel, { passive: true });

    return () => {
      touchSessionRef.current = null;
      pointerSessionRef.current = null;
      document.removeEventListener("touchmove", onTouchMove as EventListener, touchMoveOpts);
      if (touchCoarse) {
        document.removeEventListener("touchstart", onTouchStart, { capture: true } as EventListenerOptions);
        document.removeEventListener("touchend", onTouchEnd, { capture: true } as EventListenerOptions);
        document.removeEventListener("touchcancel", onTouchCancel, { capture: true } as EventListenerOptions);
      }
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
