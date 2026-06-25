import { describe, expect, it } from "vitest";
import {
  CHAT_KEYBOARD_GAP,
  detectIOSBrowser,
  detectKeyboardPlatform,
  detectKeyboardViewportEnabled,
  getMobileChatShellStyle,
  measureViewport,
  overlayOffsetTop,
} from "./use-keyboard-viewport-core";

const baseInput = {
  nativeKeyboardInset: 0,
  isNativePlatform: false,
  inputFocused: false,
  baselineLayoutHeight: 800,
  iosBrowser: "safari" as const,
};

describe("detectIOSBrowser", () => {
  it("detects Safari on iPhone", () => {
    expect(
      detectIOSBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("safari");
  });

  it("detects Chrome on iPhone (CriOS)", () => {
    expect(
      detectIOSBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("chrome");
  });

  it("detects WeChat in-app browser", () => {
    expect(detectIOSBrowser("Mozilla/5.0 MicroMessenger/8.0.0")).toBe("in-app");
  });
});

describe("detectKeyboardPlatform", () => {
  it("detects Android (含搜狗等 IME 宿主)", () => {
    expect(detectKeyboardPlatform("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36")).toBe("android");
  });

  it("detects iPhone / iPad / iPadOS", () => {
    expect(detectKeyboardPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe("ios");
    expect(detectKeyboardPlatform("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("ios");
    expect(detectKeyboardPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe("ios");
  });
});

describe("detectKeyboardViewportEnabled", () => {
  it("enables on narrow viewport", () => {
    expect(
      detectKeyboardViewportEnabled("", 0, {
        matchMedia: (q) => ({ matches: q.includes("max-width") } as MediaQueryList),
      }),
    ).toBe(true);
  });

  it("enables on iPad landscape coarse pointer", () => {
    expect(
      detectKeyboardViewportEnabled("", 5, {
        matchMedia: (q) =>
          ({
            matches: q.includes("pointer: coarse") || q.includes("hover: none"),
          }) as MediaQueryList,
      }),
    ).toBe(true);
  });
});

describe("overlayOffsetTop", () => {
  it("keeps offsetTop on Safari overlay pan", () => {
    expect(
      overlayOffsetTop({
        iosBrowser: "safari",
        platform: "ios",
        vvOffsetTop: 80,
        layoutShrunkFromBaseline: false,
      }),
    ).toBe(80);
  });

  it("drops spurious offsetTop on CriOS when layout did not shrink", () => {
    expect(
      overlayOffsetTop({
        iosBrowser: "chrome",
        platform: "ios",
        vvOffsetTop: 200,
        layoutShrunkFromBaseline: false,
      }),
    ).toBe(0);
  });

  it("drops spurious offsetTop on Android when layout did not shrink", () => {
    expect(
      overlayOffsetTop({
        iosBrowser: "unknown",
        platform: "android",
        vvOffsetTop: 200,
        layoutShrunkFromBaseline: false,
      }),
    ).toBe(0);
  });
});

describe("measureViewport", () => {
  it("returns closed when keyboard is not visible", () => {
    const result = measureViewport({
      ...baseInput,
      layoutHeight: 800,
      visualViewport: { height: 800, offsetTop: 0 },
      platform: "ios",
    });

    expect(result).toEqual({
      height: 800,
      offsetTop: 0,
      keyboardVisible: false,
      mode: "closed",
    });
  });

  it("uses layoutResized when interactiveWidget shrinks layout (Android resizes-content)", () => {
    const result = measureViewport({
      ...baseInput,
      layoutHeight: 400,
      visualViewport: { height: 398, offsetTop: 0 },
      platform: "android",
      iosBrowser: "unknown",
    });

    expect(result.mode).toBe("layoutResized");
    expect(result.offsetTop).toBe(0);
    expect(result.height).toBe(400);
    expect(result.keyboardVisible).toBe(true);
  });

  it("uses overlay with offsetTop on iOS Safari", () => {
    const result = measureViewport({
      ...baseInput,
      layoutHeight: 800,
      visualViewport: { height: 450, offsetTop: 80 },
      platform: "ios",
      iosBrowser: "safari",
    });

    expect(result.mode).toBe("overlay");
    expect(result.offsetTop).toBe(80);
    expect(result.height).toBe(450 - CHAT_KEYBOARD_GAP);
  });

  it("uses overlay without spurious offsetTop on CriOS", () => {
    const result = measureViewport({
      ...baseInput,
      layoutHeight: 800,
      visualViewport: { height: 450, offsetTop: 200 },
      platform: "ios",
      iosBrowser: "chrome",
    });

    expect(result.mode).toBe("overlay");
    expect(result.offsetTop).toBe(0);
    expect(result.height).toBe(450 - CHAT_KEYBOARD_GAP - (800 - 450 - 50));
  });

  it("subtracts accessory inset on CriOS overlay", () => {
    const result = measureViewport({
      ...baseInput,
      layoutHeight: 800,
      visualViewport: { height: 450, offsetTop: 0 },
      platform: "ios",
      iosBrowser: "chrome",
    });

    const accessoryInset = 800 - 450 - 0 - 50;
    expect(result.mode).toBe("overlay");
    expect(result.offsetTop).toBe(0);
    expect(result.height).toBe(450 - CHAT_KEYBOARD_GAP - accessoryInset);
  });

  it("uses overlay without spurious offsetTop on Android 搜狗类 IME", () => {
    const result = measureViewport({
      ...baseInput,
      layoutHeight: 800,
      visualViewport: { height: 450, offsetTop: 200 },
      platform: "android",
      iosBrowser: "unknown",
    });

    expect(result.mode).toBe("overlay");
    expect(result.offsetTop).toBe(0);
    expect(result.height).toBe(450 - CHAT_KEYBOARD_GAP);
  });

  it("forces layoutResized on Capacitor native inset (iOS / Android App)", () => {
    const result = measureViewport({
      ...baseInput,
      layoutHeight: 500,
      visualViewport: { height: 300, offsetTop: 120 },
      nativeKeyboardInset: 300,
      isNativePlatform: true,
      platform: "android",
      iosBrowser: "unknown",
    });

    expect(result.mode).toBe("layoutResized");
    expect(result.offsetTop).toBe(0);
    expect(result.height).toBe(500);
  });

  it("falls back to layoutResized when inputFocused and vv shrinks with layout (iPad 浮动键盘)", () => {
    const result = measureViewport({
      ...baseInput,
      layoutHeight: 700,
      visualViewport: { height: 650, offsetTop: 0 },
      inputFocused: true,
      platform: "ios",
      iosBrowser: "safari",
    });

    expect(result.mode).toBe("layoutResized");
    expect(result.keyboardVisible).toBe(true);
    expect(result.offsetTop).toBe(0);
  });

  it("does not use focusShrink when iOS vv did not shrink and inset is small", () => {
    const result = measureViewport({
      ...baseInput,
      layoutHeight: 700,
      visualViewport: { height: 790, offsetTop: 0 },
      inputFocused: true,
      platform: "ios",
      iosBrowser: "safari",
    });

    expect(result.keyboardVisible).toBe(false);
    expect(result.mode).toBe("closed");
  });
});

describe("getMobileChatShellStyle", () => {
  it("returns undefined when not using fixed shell (iPad 横屏 lg 布局)", () => {
    expect(
      getMobileChatShellStyle({
        useFixedShell: false,
        viewportBox: {
          height: 422,
          offsetTop: 80,
          keyboardVisible: true,
          mode: "overlay",
        },
      }),
    ).toBeUndefined();
  });

  it("returns explicit height for iOS Web layoutResized (Safari resizes-content)", () => {
    expect(
      getMobileChatShellStyle({
        useFixedShell: true,
        platform: "ios",
        isNativePlatform: false,
        viewportBox: {
          height: 400,
          offsetTop: 0,
          keyboardVisible: true,
          mode: "layoutResized",
        },
      }),
    ).toEqual({
      position: "fixed",
      left: 0,
      right: 0,
      bottom: "auto",
      height: "400px",
      top: "0px",
    });
  });

  it("returns undefined for layoutResized on Capacitor Native", () => {
    expect(
      getMobileChatShellStyle({
        useFixedShell: true,
        platform: "ios",
        isNativePlatform: true,
        viewportBox: {
          height: 400,
          offsetTop: 0,
          keyboardVisible: true,
          mode: "layoutResized",
        },
      }),
    ).toBeUndefined();
  });

  it("returns fixed slice style for overlay mode on narrow shell", () => {
    expect(
      getMobileChatShellStyle({
        useFixedShell: true,
        viewportBox: {
          height: 422,
          offsetTop: 80,
          keyboardVisible: true,
          mode: "overlay",
        },
      }),
    ).toEqual({
      position: "fixed",
      left: 0,
      right: 0,
      bottom: "auto",
      height: "422px",
      top: "80px",
    });
  });
});
