"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { useMobileTouchNavEnabled } from "@/hooks/use-life-agents-feed-gestures";
import { useMobileEdgeGestures } from "@/hooks/use-mobile-edge-gestures";
import {
  getDrawerWidth,
  getMobileGestureState,
  subscribeMobileGesture,
} from "@/lib/mobile-gesture-store";

export function MobileSwipeShell({ children }: { children: ReactNode }) {
  const touchNavEnabled = useMobileTouchNavEnabled();
  useMobileEdgeGestures(touchNavEnabled);

  const gesture = useSyncExternalStore(
    subscribeMobileGesture,
    getMobileGestureState,
    () => ({ translateX: 0, transitioning: false, drawerOpen: false }),
  );

  const drawerWidth = getDrawerWidth();
  const shift = gesture.translateX;
  const shadowOpacity = Math.min(0.22, (shift / drawerWidth) * 0.22);
  const transition = gesture.transitioning
    ? "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)"
    : "none";

  return (
    <div
      className="relative min-h-[100dvh] will-change-transform"
      style={{
        transform: shift > 0 ? `translateX(${shift}px)` : undefined,
        transition,
        boxShadow: shift > 4 ? `-10px 0 28px rgba(17, 21, 19, ${shadowOpacity})` : undefined,
        zIndex: shift > 0 ? 189 : undefined,
      }}
    >
      {children}
    </div>
  );
}
