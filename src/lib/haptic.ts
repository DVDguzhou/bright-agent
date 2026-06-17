let lastHapticAt = 0;

/** Short tap vibration for mobile button feedback (no-op when unsupported). */
export function triggerHapticTap(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastHapticAt < 48) return;
  lastHapticAt = now;
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(12);
    }
  } catch {
    /* ignore */
  }
}
