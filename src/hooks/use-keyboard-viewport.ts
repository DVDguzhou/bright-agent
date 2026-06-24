"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Capacitor } from "@capacitor/core";

export type ViewportBox = {
  height: number;
  offsetTop: number;
  keyboardVisible: boolean;
};

/** 键盘占用超过此阈值（px）才认为 visualViewport 已正确反映键盘高度 */
const KEYBOARD_INSET_THRESHOLD = 50;

/** 输入栏与键盘顶部的间距（px），与小程序 chat 页 KEYBOARD_GAP 对齐 */
export const CHAT_KEYBOARD_GAP = 28;

function applyKeyboardGap(height: number, keyboardVisible: boolean): number {
  if (!keyboardVisible) return height;
  return Math.max(0, height - CHAT_KEYBOARD_GAP);
}

function measureViewport(nativeKeyboardInset: number): ViewportBox {
  if (typeof window === "undefined") {
    return { height: 0, offsetTop: 0, keyboardVisible: false };
  }

  const layoutHeight = window.innerHeight;
  const vv = window.visualViewport;

  if (!vv) {
    const keyboardVisible = nativeKeyboardInset > 0;
    const height = keyboardVisible
      ? applyKeyboardGap(Math.max(0, layoutHeight - nativeKeyboardInset), true)
      : layoutHeight;
    return { height, offsetTop: 0, keyboardVisible };
  }

  const vvHeight = Math.max(0, vv.height);
  const vvOffsetTop = Math.max(0, vv.offsetTop);
  const insetFromVv = Math.max(0, layoutHeight - vvHeight - vvOffsetTop);
  const keyboardVisible = nativeKeyboardInset > 0 || insetFromVv >= KEYBOARD_INSET_THRESHOLD;

  if (insetFromVv >= KEYBOARD_INSET_THRESHOLD) {
    return {
      height: applyKeyboardGap(vvHeight, true),
      offsetTop: vvOffsetTop,
      keyboardVisible: true,
    };
  }

  if (nativeKeyboardInset > 0) {
    return {
      height: applyKeyboardGap(Math.max(0, layoutHeight - nativeKeyboardInset), true),
      offsetTop: 0,
      keyboardVisible: true,
    };
  }

  return { height: vvHeight, offsetTop: vvOffsetTop, keyboardVisible: false };
}

/** 聊天输入栏底边距：键盘弹起时保留少量内边距；未弹起时用 safe-area */
export function chatInputFooterPaddingClass(keyboardVisible: boolean): string {
  return keyboardVisible ? "pb-2" : "pb-[max(0.75rem,env(safe-area-inset-bottom))]";
}

/** 是否桌面宽屏（默认 lg ≥1024px），用于关闭移动端键盘视口逻辑 */
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

/**
 * 移动端聊天页键盘适配：visualViewport + Capacitor Keyboard 双通道。
 * 部分 iOS/Android WebView 键盘弹起时不触发 visualViewport，需原生 keyboardHeight 兜底。
 */
export function useKeyboardViewport(mobileEnabled: boolean) {
  const [viewportBox, setViewportBox] = useState<ViewportBox | null>(null);
  const nativeInsetRef = useRef(0);

  const update = useCallback(() => {
    setViewportBox(measureViewport(nativeInsetRef.current));
  }, []);

  useEffect(() => {
    if (!mobileEnabled || typeof window === "undefined") return;

    update();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    let cancelled = false;
    const removeKeyboardListeners: Array<() => void> = [];

    if (Capacitor.isNativePlatform()) {
      void import("@capacitor/keyboard")
        .then(({ Keyboard }) => {
          if (cancelled) return;

          const platform = Capacitor.getPlatform();
          const attachShow = (info: { keyboardHeight: number }) => {
            nativeInsetRef.current = info.keyboardHeight;
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
            void Keyboard.addListener("keyboardWillHide", attachHide).then((handle) => {
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
      removeKeyboardListeners.forEach((remove) => remove());
    };
  }, [mobileEnabled, update]);

  const containerStyle: CSSProperties | undefined = mobileEnabled
    ? viewportBox
      ? { height: `${viewportBox.height}px`, top: `${viewportBox.offsetTop}px` }
      : { height: "100dvh" }
    : undefined;

  return { viewportBox, containerStyle, keyboardVisible: viewportBox?.keyboardVisible ?? false };
}
