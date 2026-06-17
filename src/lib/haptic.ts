let lastHapticAt = 0;

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** 真机触摸环境；桌面浏览器模拟器通常不满足 */
function isTouchMobile(): boolean {
  if (typeof window === "undefined") return false;
  if (isIOSDevice()) return true;
  if (/Android/i.test(navigator.userAgent)) return true;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none) and (pointer: fine)").matches
  );
}

function vibrateAndroid(pattern: number | number[]): boolean {
  try {
    if (typeof navigator.vibrate === "function") {
      return navigator.vibrate(pattern);
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Safari 17.4+：隐藏 switch 控件触发 Taptic Engine（须在同一次用户手势内 label.click） */
function vibrateIOS(): boolean {
  try {
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.display = "none";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    label.appendChild(input);

    document.head.appendChild(label);
    label.click();
    document.head.removeChild(label);
    return true;
  } catch {
    return false;
  }
}

function runHaptic(pattern: number | number[]): void {
  if (typeof window === "undefined") return;
  if (!isTouchMobile()) return;

  const now = Date.now();
  if (now - lastHapticAt < 36) return;
  lastHapticAt = now;

  if (vibrateAndroid(pattern)) return;
  vibrateIOS();
}

/** 轻触反馈（按钮、Tab） */
export function triggerHapticTap(): void {
  runHaptic(50);
}

/** 稍强反馈（滑动切页、开关菜单） */
export function triggerHapticImpact(): void {
  if (typeof window !== "undefined" && typeof navigator.vibrate === "function" && isTouchMobile()) {
    runHaptic([50, 70, 50]);
    return;
  }
  triggerHapticTap();
}
