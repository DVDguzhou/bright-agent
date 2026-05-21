"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { AppTrackingTransparency } from "capacitor-plugin-app-tracking-transparency";

/**
 * iOS 14.5+ App Tracking Transparency（App Store 5.1.2）。
 * 仅在 iOS 原生壳内、且用户尚未选择时弹出系统授权框。
 */
export function AppTrackingTransparencyPrompt() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;

    void (async () => {
      try {
        const { status } = await AppTrackingTransparency.getStatus();
        if (status === "notDetermined") {
          await AppTrackingTransparency.requestPermission();
        }
      } catch {
        /* 非 iOS 或插件未就绪时忽略 */
      }
    })();
  }, []);

  return null;
}
