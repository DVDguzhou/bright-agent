"use client";

import { useEffect } from "react";
import { triggerHapticTap } from "@/lib/haptic";

const INTERACTIVE_SELECTOR =
  "button,a,[role='button'],.pressable,.btn-primary,.btn-secondary,.icon-button,input[type='submit'],input[type='button']";

/**
 * Global light haptic on touch for common interactive elements.
 */
export function HapticRoot() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-no-haptic]")) return;
      const el = target.closest(INTERACTIVE_SELECTOR);
      if (!el) return;
      if (el.matches("input,textarea,select") && !el.matches("input[type='submit'],input[type='button']")) return;
      triggerHapticTap();
    };
    document.addEventListener("pointerdown", onPointerDown, { passive: true, capture: true });
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);
  return null;
}
