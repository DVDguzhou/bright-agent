/** Android APK 扫码/直链下载（方案 B，不走上架） */

export const ANDROID_APP_DISPLAY_NAME = "BrightAgent";
export const ANDROID_APP_VERSION = "1.0";

function normalizeSiteBase(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "https://brightagent.cn";
  return base.replace(/\/$/, "");
}

/** APK 直链（下载按钮用；勿用手机浏览器直接打开此 URL） */
export function getAndroidApkDownloadUrl(): string {
  const configured = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim();
  if (configured) return configured;
  return `${normalizeSiteBase()}/downloads/brightagent.apk`;
}

/** 扫码落地页（手机请扫此页，不要扫 .apk 直链） */
export function getAndroidDownloadPageUrl(): string {
  return `${normalizeSiteBase()}/download`;
}

export const ANDROID_APK_INSTALL_STEPS = [
  "点击下方「立即下载 APK」，等待下载完成。",
  "打开下载好的 brightagent.apk，按提示安装。",
  "若系统提示「不允许安装未知应用」，请在设置中为浏览器或文件管理器允许一次安装。",
  "安装完成后从桌面打开 BrightAgent 即可使用。",
] as const;
