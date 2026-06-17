"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  closeMobileDrawer,
  getDrawerWidth,
  getMobileGestureState,
  openMobileDrawer,
  setMobileGestureState,
} from "@/lib/mobile-gesture-store";
import { triggerHapticTap } from "@/lib/haptic";

const EDGE_PX = 28;
const MAX_DEV_Y = 120;

function isInteractiveBlocked(el: HTMLElement | null) {
  return Boolean(
    el?.closest?.("input,textarea,select,[contenteditable='true'],[data-no-edge-swipe],[data-horizontal-scroll]"),
  );
}

function canSwipeBack(pathname: string) {
  if (pathname === "/life-agents/create" || pathname === "/life-agents/search") return false;
  if (/^\/life-agents\/[^/]+$/.test(pathname)) return true;
  if (/^\/life-agents\/[^/]+\/chat/.test(pathname)) return true;
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/c/")) return true;
  if (pathname.startsWith("/licenses")) return true;
  if (pathname.startsWith("/map")) return true;
  return false;
}

/** 发现页主 tab：左缘右滑进入「动态」(/posts)。 */
function canSwipeToPosts(pathname: string) {
  if (pathname !== "/" && pathname !== "/life-agents") return false;
  if (typeof window === "undefined") return false;
  const tab = new URLSearchParams(window.location.search).get("tab");
  return tab !== "favorites" && tab !== "purchased";
}

function canOpenDrawer(pathname: string) {
  // 发现/动态顶栏用左缘滑切 tab；菜单仅通过汉堡按钮打开
  if (pathname === "/" || pathname === "/life-agents" || pathname.startsWith("/posts")) return false;
  return false;
}

type GestureMode = "none" | "back" | "navigate-posts" | "drawer-open" | "drawer-close";

/**
 * Edge gestures: interactive swipe-back + Twitter-style drawer drag (mobile).
 */
export function useMobileEdgeGestures(enabled: boolean) {
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const startTranslateRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let x0 = 0;
    let y0 = 0;
    let mode: GestureMode = "none";

    const reset = (animated = false) => {
      const { drawerOpen } = getMobileGestureState();
      setMobileGestureState({
        translateX: drawerOpen ? getDrawerWidth() : 0,
        transitioning: animated,
      });
      if (animated) {
        window.setTimeout(() => setMobileGestureState({ transitioning: false }), 280);
      }
      mode = "none";
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      x0 = t.clientX;
      y0 = t.clientY;
      mode = "none";

      const el = e.target as HTMLElement | null;
      if (isInteractiveBlocked(el)) return;

      const path = pathnameRef.current;
      const { drawerOpen, translateX } = getMobileGestureState();
      const drawerW = getDrawerWidth();

      if (drawerOpen && translateX > 8) {
        mode = "drawer-close";
        startTranslateRef.current = translateX;
        return;
      }

      if (t.clientX <= EDGE_PX) {
        if (canSwipeBack(path)) {
          mode = "back";
        } else if (canSwipeToPosts(path) && !drawerOpen) {
          mode = "navigate-posts";
        } else if (canOpenDrawer(path) && !drawerOpen) {
          mode = "drawer-open";
        }
      }
    };

    const onMove = (e: TouchEvent) => {
      if (mode === "none" || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - x0;
      const dy = Math.abs(t.clientY - y0);
      if (dy > MAX_DEV_Y && mode !== "drawer-open" && mode !== "drawer-close") {
        mode = "none";
        reset(false);
        return;
      }

      const drawerW = getDrawerWidth();
      const width = window.innerWidth;

      if (mode === "back" || mode === "navigate-posts") {
        if (dx < 0) return;
        e.preventDefault();
        const shift = Math.min(width * 0.92, dx * 0.96);
        setMobileGestureState({ translateX: shift, transitioning: false, drawerOpen: false });
        return;
      }

      if (mode === "drawer-open") {
        if (dx < 0) return;
        e.preventDefault();
        const shift = Math.min(drawerW, dx * 0.98);
        setMobileGestureState({ translateX: shift, transitioning: false, drawerOpen: false });
        return;
      }

      if (mode === "drawer-close") {
        e.preventDefault();
        const shift = Math.max(0, Math.min(drawerW, startTranslateRef.current + dx));
        setMobileGestureState({
          translateX: shift,
          transitioning: false,
          drawerOpen: shift >= drawerW - 2,
        });
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (mode === "none") return;
      const t = e.changedTouches[0];
      if (!t) {
        mode = "none";
        return;
      }
      const dx = t.clientX - x0;
      const dy = Math.abs(t.clientY - y0);
      const drawerW = getDrawerWidth();
      const width = window.innerWidth;
      const current = getMobileGestureState().translateX;

      if (mode === "back") {
        const shouldBack = dx >= Math.min(96, width * 0.28) && dy <= MAX_DEV_Y;
        if (shouldBack) {
          triggerHapticTap();
          setMobileGestureState({ translateX: width, transitioning: true, drawerOpen: false });
          window.setTimeout(() => {
            const r = routerRef.current;
            if (typeof window !== "undefined" && window.history.length > 1) r.back();
            else r.push("/life-agents");
            setMobileGestureState({ translateX: 0, transitioning: false, drawerOpen: false });
          }, 260);
        } else {
          reset(true);
        }
        mode = "none";
        return;
      }

      if (mode === "navigate-posts") {
        const shouldOpen = dx >= Math.min(96, width * 0.28) && dy <= MAX_DEV_Y;
        if (shouldOpen) {
          triggerHapticTap();
          setMobileGestureState({ translateX: width, transitioning: true, drawerOpen: false });
          window.setTimeout(() => {
            routerRef.current.push("/posts");
            setMobileGestureState({ translateX: 0, transitioning: false, drawerOpen: false });
          }, 260);
        } else {
          reset(true);
        }
        mode = "none";
        return;
      }

      if (mode === "drawer-open") {
        if (current >= drawerW * 0.42 || dx >= drawerW * 0.42) {
          triggerHapticTap();
          openMobileDrawer(true);
        } else {
          closeMobileDrawer(true);
        }
        mode = "none";
        return;
      }

      if (mode === "drawer-close") {
        if (current <= drawerW * 0.55) {
          closeMobileDrawer(true);
        } else {
          openMobileDrawer(true);
        }
        mode = "none";
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true, capture: true });
    document.addEventListener("touchmove", onMove, { passive: false, capture: true });
    document.addEventListener("touchend", onEnd, { passive: true, capture: true });
    document.addEventListener("touchcancel", onEnd, { passive: true, capture: true });

    return () => {
      document.removeEventListener("touchstart", onStart, true);
      document.removeEventListener("touchmove", onMove, true);
      document.removeEventListener("touchend", onEnd, true);
      document.removeEventListener("touchcancel", onEnd, true);
    };
  }, [enabled]);

  useEffect(() => {
    setMobileGestureState({ translateX: 0, transitioning: false, drawerOpen: false });
  }, [pathname]);
}
