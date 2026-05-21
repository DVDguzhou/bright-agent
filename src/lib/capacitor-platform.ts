/** Capacitor 原生壳平台检测（App Store 合规等） */

let cachedIosNative: boolean | null = null;

/** 是否为 iOS 原生 App（Capacitor 壳内，非 Safari 浏览器） */
export function isIosNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedIosNative !== null) return cachedIosNative;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require("@capacitor/core") as typeof import("@capacitor/core");
    cachedIosNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    cachedIosNative = false;
  }
  return cachedIosNative;
}

/** iOS App Store 审核：App 内不得使用微信/演示余额购买数字内容，须走 IAP 或移出 App 内购买入口 */
export function iosBlocksInAppDigitalPurchase(): boolean {
  return isIosNativeApp();
}
