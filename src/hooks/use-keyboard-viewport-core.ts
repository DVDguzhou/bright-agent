import type { CSSProperties } from "react";

/** 键盘占用超过此阈值（px）才认为 visualViewport 已正确反映键盘高度 */
export const KEYBOARD_INSET_THRESHOLD = 50;

/** 输入栏与键盘顶部的间距（px），仅 overlay 模式使用 */
export const CHAT_KEYBOARD_GAP = 28;

const LAYOUT_SHRINK_RATIO = 0.08;
const HEIGHT_MATCH_TOLERANCE = 48;

export type KeyboardViewportMode = "closed" | "layoutResized" | "overlay";

export type KeyboardPlatform = "ios" | "android" | "unknown";

export type IOSBrowser = "safari" | "chrome" | "firefox" | "in-app" | "unknown";

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
  iosBrowser: IOSBrowser;
  inputFocused: boolean;
  baselineLayoutHeight: number;
};

/** iOS / iPadOS / iPhone；Android；其余 WebView（微信内置浏览器等按 UA 归类） */
export function detectKeyboardPlatform(userAgent = "", maxTouchPoints = 0): KeyboardPlatform {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return "ios";
  return "unknown";
}

/** iOS 内置浏览器细分：Safari / Chrome(CriOS) / 微信 / Firefox */
export function detectIOSBrowser(userAgent = ""): IOSBrowser {
  if (/MicroMessenger/i.test(userAgent)) return "in-app";
  if (/CriOS/i.test(userAgent)) return "chrome";
  if (/EdgiOS/i.test(userAgent)) return "chrome";
  if (/FxiOS/i.test(userAgent)) return "firefox";
  if (/iPhone|iPad|iPod/i.test(userAgent) && /Safari/i.test(userAgent)) return "safari";
  if (/Macintosh/i.test(userAgent) && /Safari/i.test(userAgent)) return "safari";
  return "unknown";
}

/**
 * overlay 模式下是否采用 visualViewport.offsetTop。
 * 仅 Safari 在 layout 未缩小时需要 offsetTop；CriOS / Android 等忽略虚假 offsetTop。
 */
export function overlayOffsetTop(input: {
  iosBrowser: IOSBrowser;
  platform: KeyboardPlatform;
  vvOffsetTop: number;
  layoutShrunkFromBaseline: boolean;
}): number {
  const { iosBrowser, platform, vvOffsetTop, layoutShrunkFromBaseline } = input;
  if (vvOffsetTop <= 0) return 0;
  if (iosBrowser === "safari") return vvOffsetTop;
  if (platform === "android") return layoutShrunkFromBaseline ? vvOffsetTop : 0;
  return layoutShrunkFromBaseline ? vvOffsetTop : 0;
}

function computeFocusShrinkFallback(input: {
  inputFocused: boolean;
  baselineLayoutHeight: number;
  layoutHeight: number;
  platform: KeyboardPlatform;
  isNativePlatform: boolean;
  vvHeight: number | null;
  insetFromVv: number;
}): boolean {
  const layoutShrunk =
    input.baselineLayoutHeight > 0 &&
    input.layoutHeight < input.baselineLayoutHeight * (1 - LAYOUT_SHRINK_RATIO);

  if (!input.inputFocused || !layoutShrunk) return false;
  if (input.platform !== "ios" || input.isNativePlatform) return true;

  const vvShrunk =
    input.vvHeight !== null &&
    input.vvHeight < input.baselineLayoutHeight * (1 - LAYOUT_SHRINK_RATIO);
  const partialInset = input.insetFromVv >= KEYBOARD_INSET_THRESHOLD / 2;

  return vvShrunk || partialInset;
}

function overlayAccessoryInset(input: {
  iosBrowser: IOSBrowser;
  layoutHeight: number;
  vvHeight: number;
  safeOffsetTop: number;
}): number {
  if (input.iosBrowser !== "chrome") return 0;
  return Math.max(0, input.layoutHeight - input.vvHeight - input.safeOffsetTop - KEYBOARD_INSET_THRESHOLD);
}

export function measureViewport(input: MeasureViewportInput): ViewportBox {
  const {
    layoutHeight,
    visualViewport: vv,
    nativeKeyboardInset,
    isNativePlatform,
    platform,
    iosBrowser,
    inputFocused,
    baselineLayoutHeight,
  } = input;

  if (!vv) {
    const focusShrinkFallback =
      inputFocused &&
      baselineLayoutHeight > 0 &&
      layoutHeight < baselineLayoutHeight * (1 - LAYOUT_SHRINK_RATIO);

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

  const focusShrinkFallback = computeFocusShrinkFallback({
    inputFocused,
    baselineLayoutHeight,
    layoutHeight,
    platform,
    isNativePlatform,
    vvHeight,
    insetFromVv,
  });

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
    iosBrowser,
    platform,
    vvOffsetTop,
    layoutShrunkFromBaseline,
  });

  const accessoryInset = overlayAccessoryInset({
    iosBrowser,
    layoutHeight,
    vvHeight,
    safeOffsetTop,
  });

  return {
    height: Math.max(0, vvHeight - CHAT_KEYBOARD_GAP - accessoryInset),
    offsetTop: safeOffsetTop,
    keyboardVisible: true,
    mode: "overlay",
  };
}

/** 移动端全屏聊天壳：overlay / iOS Web layoutResized 设 inline 高度，Native 信任 inset-0 */
export function getMobileChatShellStyle(options: {
  useFixedShell: boolean;
  viewportBox: ViewportBox | null;
  isNativePlatform?: boolean;
  platform?: KeyboardPlatform;
}): CSSProperties | undefined {
  if (!options.useFixedShell) return undefined;

  const box = options.viewportBox;
  if (!box || !box.keyboardVisible) return undefined;

  const fixedShellBase: CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: "auto",
  };

  if (box.mode === "overlay") {
    return {
      ...fixedShellBase,
      height: `${box.height}px`,
      top: `${box.offsetTop}px`,
    };
  }

  if (box.mode === "layoutResized" && options.platform === "ios" && !options.isNativePlatform) {
    return {
      ...fixedShellBase,
      height: `${box.height}px`,
      top: "0px",
    };
  }

  return undefined;
}

export function chatInputFooterPaddingClass(keyboardVisible: boolean): string {
  return keyboardVisible ? "pb-2" : "pb-[max(0.75rem,env(safe-area-inset-bottom))]";
}

/** 是否启用键盘视口监听：原生 App、窄屏、或 iPad 等触控大屏 */
export function detectKeyboardViewportEnabled(
  _userAgent = "",
  maxTouchPoints = 0,
  options?: { wideBreakpoint?: number; matchMedia?: (query: string) => MediaQueryList | null },
): boolean {
  const breakpoint = options?.wideBreakpoint ?? 1024;
  const mql = options?.matchMedia ?? ((query: string) =>
    typeof window !== "undefined" ? window.matchMedia(query) : null);

  const narrow = mql(`(max-width: ${breakpoint - 1}px)`)?.matches ?? false;
  const touchPrimary = mql("(hover: none) and (pointer: coarse)")?.matches ?? false;
  const tabletLike = maxTouchPoints > 1 && (mql("(hover: none)")?.matches ?? false);

  return narrow || touchPrimary || tabletLike;
}
