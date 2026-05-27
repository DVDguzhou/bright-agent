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

/** APK 直链，二维码应编码此 URL */
export function getAndroidApkDownloadUrl(): string {
  const configured = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim();
  if (configured) return configured;
  return `${normalizeSiteBase()}/downloads/brightagent.apk`;
}

/** 带安装说明的落地页 */
export function getAndroidDownloadPageUrl(): string {
  return `${normalizeSiteBase()}/download`;
}

export const ANDROID_APK_INSTALL_STEPS = [
  "使用手机相机或微信扫一扫，扫描下方二维码（或直接点「下载 APK」）。",
  "下载完成后打开 brightagent.apk，按提示安装。",
  "若系统提示「不允许安装未知应用」，请在设置中为浏览器或文件管理器允许一次安装。",
  "安装完成后从桌面打开 BrightAgent 即可使用。",
] as const;
