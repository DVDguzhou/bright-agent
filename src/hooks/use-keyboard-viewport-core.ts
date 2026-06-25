import type { CSSProperties } from "react";

/** 键盘占用超过此阈值（px）才认为 visualViewport 已正确反映键盘高度 */
export const KEYBOARD_INSET_THRESHOLD = 50;

/** 输入栏与键盘顶部的间距（px），仅 overlay 模式使用 */
export const CHAT_KEYBOARD_GAP = 28;

const LAYOUT_SHRINK_RATIO = 0.08;
const HEIGHT_MATCH_TOLERANCE = 48;

export type KeyboardViewportMode = "closed" | "layoutResized" | "overlay";

export type KeyboardPlatform = "ios" | "android" | "unknown";

export type ViewportBox = {
  height: number;
  offsetTop: number;
  keyboardVisible: boolean;
  mode: KeyboardViewportMode;
};

export type MeasureViewportInput = {
  layoutHeight: number;
  visualViewport: { height: number; offsetTop: number } | null;
  nativeKeyboardInset: number;
  isNativePlatform: boolean;
  platform: KeyboardPlatform;
  inputFocused: boolean;
  baselineLayoutHeight: number;
};

/** iOS / iPadOS / iPhone；Android；其余 WebView（微信内置浏览器等按 UA 归类） */
export function detectKeyboardPlatform(userAgent = "", maxTouchPoints = 0): KeyboardPlatform {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  // iPadOS 13+ 可能伪装成 Mac
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return "ios";
  return "unknown";
}

/**
 * overlay 模式下是否采用 visualViewport.offsetTop。
 * iOS Safari 需要 offsetTop 跟随视口上推；Android / 搜狗等 IME 在 layout 未缩小时 offsetTop 常为错误滚动值。
 */
export function overlayOffsetTop(input: {
  platform: KeyboardPlatform;
  vvOffsetTop: number;
  layoutShrunkFromBaseline: boolean;
}): number {
  const { platform, vvOffsetTop, layoutShrunkFromBaseline } = input;
  if (vvOffsetTop <= 0) return 0;
  if (platform === "ios") return vvOffsetTop;
  return layoutShrunkFromBaseline ? vvOffsetTop : 0;
}

export function measureViewport(input: MeasureViewportInput): ViewportBox {
  const {
    layoutHeight,
    visualViewport: vv,
    nativeKeyboardInset,
    isNativePlatform,
    platform,
    inputFocused,
    baselineLayoutHeight,
  } = input;

  const focusShrinkFallback =
    inputFocused &&
    baselineLayoutHeight > 0 &&
    layoutHeight < baselineLayoutHeight * (1 - LAYOUT_SHRINK_RATIO);

  if (!vv) {
    const keyboardVisible = nativeKeyboardInset > 0 || focusShrinkFallback;
    if (!keyboardVisible) {
      return { height: layoutHeight, offsetTop: 0, keyboardVisible: false, mode: "closed" };
    }
    if (isNativePlatform || nativeKeyboardInset > 0) {
      return { height: layoutHeight, offsetTop: 0, keyboardVisible: true, mode: "layoutResized" };
    }
    return {
      height: Math.max(0, layoutHeight - nativeKeyboardInset),
      offsetTop: 0,
      keyboardVisible: true,
      mode: "overlay",
    };
  }

  const vvHeight = Math.max(0, vv.height);
  const vvOffsetTop = Math.max(0, vv.offsetTop);
  const insetFromVv = Math.max(0, layoutHeight - vvHeight - vvOffsetTop);
  const overlayKeyboard = insetFromVv >= KEYBOARD_INSET_THRESHOLD;

  const layoutShrunkFromBaseline =
    baselineLayoutHeight > 0 && layoutHeight < baselineLayoutHeight * (1 - LAYOUT_SHRINK_RATIO);

  const layoutResizedGeometry =
    !overlayKeyboard &&
    (Math.abs(vvHeight - layoutHeight) <= HEIGHT_MATCH_TOLERANCE ||
      (vvHeight > 0 && vvHeight < layoutHeight * 0.92));

  const layoutResized =
    layoutResizedGeometry && (layoutShrunkFromBaseline || nativeKeyboardInset > 0);

  const keyboardVisible =
    nativeKeyboardInset > 0 || overlayKeyboard || layoutResized || focusShrinkFallback;

  if (!keyboardVisible) {
    return { height: layoutHeight, offsetTop: 0, keyboardVisible: false, mode: "closed" };
  }

  if (isNativePlatform && nativeKeyboardInset > 0) {
    return { height: layoutHeight, offsetTop: 0, keyboardVisible: true, mode: "layoutResized" };
  }

  if (layoutResized || focusShrinkFallback) {
    return { height: layoutHeight, offsetTop: 0, keyboardVisible: true, mode: "layoutResized" };
  }

  const safeOffsetTop = overlayOffsetTop({
    platform,
    vvOffsetTop,
    layoutShrunkFromBaseline,
  });

  return {
    height: Math.max(0, vvHeight - CHAT_KEYBOARD_GAP),
    offsetTop: safeOffsetTop,
    keyboardVisible: true,
    mode: "overlay",
  };
}

/** 移动端全屏聊天壳：layoutResized / closed 依赖 Tailwind fixed inset-0，overlay 才设 inline 高度 */
export function getMobileChatShellStyle(options: {
  /** 当前是否使用 max-lg fixed 全屏壳（宽屏桌面布局时不应叠加 fixed inline 样式） */
  useFixedShell: boolean;
  viewportBox: ViewportBox | null;
}): CSSProperties | undefined {
  if (!options.useFixedShell) return undefined;

  const box = options.viewportBox;
  if (!box || box.mode !== "overlay") {
    return undefined;
  }

  return {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: "auto",
    height: `${box.height}px`,
    top: `${box.offsetTop}px`,
  };
}

export function chatInputFooterPaddingClass(keyboardVisible: boolean): string {
  return keyboardVisible ? "pb-2" : "pb-[max(0.75rem,env(safe-area-inset-bottom))]";
}

/** 是否启用键盘视口监听：原生 App、窄屏、或 iPad 等触控大屏 */
export function detectKeyboardViewportEnabled(
  userAgent = "",
  maxTouchPoints = 0,
  options?: { wideBreakpoint?: number; matchMedia?: (query: string) => MediaQueryList | null },
): boolean {
  const breakpoint = options?.wideBreakpoint ?? 1024;
  const mql = options?.matchMedia ?? ((query: string) =>
    typeof window !== "undefined" ? window.matchMedia(query) : null);

  const narrow = mql(`(max-width: ${breakpoint - 1}px)`)?.matches ?? false;
  const touchPrimary = mql("(hover: none) and (pointer: coarse)")?.matches ?? false;
  const tabletLike = maxTouchPoints > 1 && mql("(hover: none)")?.matches;

  return narrow || touchPrimary || tabletLike;
}
