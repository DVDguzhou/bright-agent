"use client";

import { useEffect } from "react";
import { triggerHapticTap } from "@/lib/haptic";

const INTERACTIVE_SELECTOR =
  "button,a,[role='button'],.pressable,.btn-primary,.btn-secondary,.icon-button,input[type='submit'],input[type='button']";

function maybeHaptic(target: EventTarget | null) {
  const node = target as HTMLElement | null;
  if (!node) return;
  if (node.closest("[data-no-haptic]")) return;
  const el = node.closest(INTERACTIVE_SELECTOR);
  if (!el) return;
  if (el.matches("input,textarea,select") && !el.matches("input[type='submit'],input[type='button']")) return;
  triggerHapticTap();
}

/**
 * Global haptic on tap for common interactive elements.
 * capture-phase pointerdown keeps the iOS user-gesture chain intact.
 */
export function HapticRoot() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      maybeHaptic(e.target);
    };
    document.addEventListener("pointerdown", onPointerDown, { passive: true, capture: true });
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);
  return null;
}
