"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { useMobileTouchNavEnabled } from "@/hooks/use-life-agents-feed-gestures";
import { useMobileEdgeGestures } from "@/hooks/use-mobile-edge-gestures";
import {
  getDrawerWidth,
  getMobileGestureState,
  setMobileGestureState,
  subscribeMobileGesture,
} from "@/lib/mobile-gesture-store";

function shellShadow(shift: number, drawerWidth: number) {
  const opacity = Math.min(0.22, (Math.abs(shift) / drawerWidth) * 0.22);
  if (shift > 4) return `-10px 0 28px rgba(17, 21, 19, ${opacity})`;
  if (shift < -4) return `10px 0 28px rgba(17, 21, 19, ${opacity})`;
  return undefined;
}

export function MobileSwipeShell({ children }: { children: ReactNode }) {
  const touchNavEnabled = useMobileTouchNavEnabled();
  useMobileEdgeGestures(touchNavEnabled);

  useEffect(() => {
    setMobileGestureState({ translateX: 0, transitioning: false, drawerOpen: false });
  }, []);

  const gesture = useSyncExternalStore(
    subscribeMobileGesture,
    getMobileGestureState,
    () => ({ translateX: 0, transitioning: false, drawerOpen: false }),
  );

  const drawerWidth = getDrawerWidth();
  const shift = gesture.translateX;
  const transition = gesture.transitioning
    ? "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)"
    : "none";

  return (
    <div
      className="relative z-40 min-h-[100dvh] bg-[#f2f1ed]"
      style={{
        transform: shift !== 0 ? `translateX(${shift}px)` : undefined,
        transition,
        // A permanent will-change: transform creates a containing block for
        // fixed descendants on WebKit. Then focusing an input scrolls this
        // ancestor and drags the full-screen chat shell upward. Only promote
        // the layer while an edge gesture is actually moving/animating.
        willChange: shift !== 0 || gesture.transitioning ? "transform" : "auto",
        boxShadow: shellShadow(shift, drawerWidth),
        zIndex: shift !== 0 ? 189 : undefined,
      }}
    >
      {children}
    </div>
  );
}
