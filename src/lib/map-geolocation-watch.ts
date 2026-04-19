import { Capacitor } from "@capacitor/core";

export type MapGeoCoords = { lat: number; lng: number };

export type MapGeoWatchHandle = {
  stop: () => Promise<void>;
};

/** 浏览器 Geolocation API 的错误文案（含 Capacitor WebView 与桌面浏览器） */
export function formatWebGeolocationError(err: GeolocationPositionError): string {
  const secure =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (!secure) {
    return "手机端请用 https 打开本站（地址栏有锁标志）；http 链接多数浏览器会直接禁止定位。";
  }
  const native = Capacitor.isNativePlatform();
  switch (err.code) {
    case 1:
      return native
        ? "定位权限被拒绝：请到「设置 → BrightAgent → 位置」选择「使用 App 期间」或「始终」。"
        : "定位权限被拒绝：iPhone 请到「设置 → 隐私与安全性 → 定位服务」打开总开关并允许 Safari/Chrome；安卓请到「设置 → 应用 → 浏览器 → 权限」允许位置；也可在浏览器地址栏左侧的锁/信息图标里重新允许。";
    case 2:
      return "暂时拿不到位置（信号弱或被关闭）。可到户外或打开系统定位后再试。";
    case 3:
      return "定位超时。可检查 GPS 是否开启，或稍后再试。";
    default:
      return err.message || "无法获取位置，请检查定位权限与网络。";
  }
}

/**
 * 使用标准 `navigator.geolocation`（Capacitor 壳内加载 https 站点时 WKWebView 同样支持，无需 @capacitor/geolocation 原生插件）。
 */
export async function startMapGeolocationWatch(handlers: {
  onSuccess: (c: MapGeoCoords) => void;
  onError: (message: string) => void;
}): Promise<MapGeoWatchHandle> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("当前环境不支持定位");
  }

  const wid = navigator.geolocation.watchPosition(
    (pos) => {
      handlers.onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    },
    (geoErr) => {
      handlers.onError(formatWebGeolocationError(geoErr));
    },
    { enableHighAccuracy: true, maximumAge: 20000, timeout: 25000 }
  );

  return {
    stop: async () => {
      navigator.geolocation.clearWatch(wid);
    },
  };
}
