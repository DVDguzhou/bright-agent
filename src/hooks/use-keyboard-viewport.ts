"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Capacitor } from "@capacitor/core";
import {
  chatInputFooterPaddingClass,
  detectIOSBrowser,
  detectKeyboardPlatform,
  detectKeyboardViewportEnabled,
  getMobileChatShellStyle,
  measureViewport,
  type ViewportBox,
} from "@/hooks/use-keyboard-viewport-core";

export type { IOSBrowser, KeyboardPlatform, KeyboardViewportMode, ViewportBox } from "@/hooks/use-keyboard-viewport-core";
export {
  CHAT_KEYBOARD_GAP,
  chatInputFooterPaddingClass,
  detectIOSBrowser,
  detectKeyboardPlatform,
  detectKeyboardViewportEnabled,
  getMobileChatShellStyle,
  measureViewport,
  overlayOffsetTop,
} from "@/hooks/use-keyboard-viewport-core";

export type UseKeyboardViewportOptions = {
  inputFocused?: boolean;
  /** 页面是否处于 max-lg fixed 全屏壳；宽屏 lg 布局时不应用 overlay fixed 样式 */
  useFixedShell?: boolean;
};

/** 是否桌面宽屏（默认 lg ≥1024px），用于布局断点 */
export function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(min-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const apply = () => setIsDesktop(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [breakpoint]);

  return isDesktop;
}

/** 是否启用键盘视口逻辑：含 iPhone / iPad / Android App / 触控平板 / 窄屏浏览器 */
export function useKeyboardViewportEnabled(breakpoint = 1024) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apply = () => {
      if (Capacitor.isNativePlatform()) {
        setEnabled(true);
        return;
      }
      setEnabled(
        detectKeyboardViewportEnabled(navigator.userAgent, navigator.maxTouchPoints, {
          wideBreakpoint: breakpoint,
        }),
      );
    };

    apply();

    const queries = [
      window.matchMedia(`(max-width: ${breakpoint - 1}px)`),
      window.matchMedia("(hover: none) and (pointer: coarse)"),
      window.matchMedia("(hover: none)"),
    ];
    queries.forEach((mql) => mql.addEventListener("change", apply));
    window.addEventListener("orientationchange", apply);

    return () => {
      queries.forEach((mql) => mql.removeEventListener("change", apply));
      window.removeEventListener("orientationchange", apply);
    };
  }, [breakpoint]);

  return enabled;
}

/**
 * 移动端聊天页键盘适配：visualViewport + Capacitor Keyboard 双通道。
 * 按 iOS / Android / Native 分流，兼容不同 IME（搜狗、系统键盘、微信内置浏览器等）。
 */
export function useKeyboardViewport(mobileEnabled: boolean, options?: UseKeyboardViewportOptions) {
  const [viewportBox, setViewportBox] = useState<ViewportBox | null>(null);
  const nativeInsetRef = useRef(0);
  const baselineLayoutHeightRef = useRef(0);
  const inputFocused = options?.inputFocused ?? false;
  const useFixedShell = options?.useFixedShell ?? true;

  const update = useCallback(() => {
    if (typeof window === "undefined") return;

    const layoutHeight = window.innerHeight;
    if (baselineLayoutHeightRef.current <= 0) {
      baselineLayoutHeightRef.current = layoutHeight;
    }

    const vv = window.visualViewport;
    const platform = detectKeyboardPlatform(navigator.userAgent, navigator.maxTouchPoints);
    const box = measureViewport({
      layoutHeight,
      visualViewport: vv ? { height: vv.height, offsetTop: vv.offsetTop } : null,
      nativeKeyboardInset: nativeInsetRef.current,
      isNativePlatform: Capacitor.isNativePlatform(),
      platform,
      iosBrowser: detectIOSBrowser(navigator.userAgent),
      inputFocused,
      baselineLayoutHeight: baselineLayoutHeightRef.current,
    });

    if (box.mode === "closed") {
      baselineLayoutHeightRef.current = layoutHeight;
    }

    setViewportBox(box);
  }, [inputFocused]);

  useEffect(() => {
    if (!mobileEnabled || typeof window === "undefined") return;

    update();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    let cancelled = false;
    const removeKeyboardListeners: Array<() => void> = [];

    if (Capacitor.isNativePlatform()) {
      void import("@capacitor/keyboard")
        .then(({ Keyboard }) => {
          if (cancelled) return;

          const platform = Capacitor.getPlatform();
          const attachShow = (info: { keyboardHeight: number }) => {
            nativeInsetRef.current = Math.max(0, info.keyboardHeight);
            update();
          };
          const attachHide = () => {
            nativeInsetRef.current = 0;
            update();
          };

          if (platform === "ios") {
            void Keyboard.addListener("keyboardWillShow", attachShow).then((handle) => {
              removeKeyboardListeners.push(() => void handle.remove());
            });
            void Keyboard.addListener("keyboardDidShow", attachShow).then((handle) => {
              removeKeyboardListeners.push(() => void handle.remove());
            });
            void Keyboard.addListener("keyboardWillHide", attachHide).then((handle) => {
              removeKeyboardListeners.push(() => void handle.remove());
            });
            void Keyboard.addListener("keyboardDidHide", attachHide).then((handle) => {
              removeKeyboardListeners.push(() => void handle.remove());
            });
          } else {
            void Keyboard.addListener("keyboardDidShow", attachShow).then((handle) => {
              removeKeyboardListeners.push(() => void handle.remove());
            });
            void Keyboard.addListener("keyboardDidHide", attachHide).then((handle) => {
              removeKeyboardListeners.push(() => void handle.remove());
            });
          }
        })
        .catch(() => {
          // 浏览器构建或未安装插件时忽略
        });
    }

    return () => {
      cancelled = true;
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      removeKeyboardListeners.forEach((remove) => remove());
    };
  }, [mobileEnabled, update]);

  const shellStyle = getMobileChatShellStyle({
    useFixedShell,
    viewportBox,
    isNativePlatform: Capacitor.isNativePlatform(),
    platform: typeof navigator !== "undefined"
      ? detectKeyboardPlatform(navigator.userAgent, navigator.maxTouchPoints)
      : undefined,
  });

  /** @deprecated 使用 shellStyle */
  const containerStyle: CSSProperties | undefined = shellStyle;

  return {
    viewportBox,
    shellStyle,
    containerStyle,
    keyboardVisible: viewportBox?.keyboardVisible ?? false,
    mode: viewportBox?.mode ?? "closed",
  };
}
