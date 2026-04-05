import { Capacitor } from "@capacitor/core";

export type MapGeoCoords = { lat: number; lng: number };

export type MapGeoWatchHandle = {
  stop: () => Promise<void>;
};

/** 浏览器 Geolocation API 的错误文案（手机端路径） */
export function formatWebGeolocationError(err: GeolocationPositionError): string {
  const secure =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (!secure) {
    return "手机端请用 https 打开本站（地址栏有锁标志）；http 链接多数浏览器会直接禁止定位。";
  }
  switch (err.code) {
    case 1:
      return "定位权限被拒绝：iPhone 请到「设置 → 隐私与安全性 → 定位服务」打开总开关并允许 Safari/Chrome；安卓请到「设置 → 应用 → 浏览器 → 权限」允许位置；也可在浏览器地址栏左侧的锁/信息图标里重新允许。";
    case 2:
      return "暂时拿不到位置（信号弱或被关闭）。可到户外或打开系统定位后再试。";
    case 3:
      return "定位超时。可检查 GPS 是否开启，或稍后再试。";
    default:
      return err.message || "无法获取位置，请检查定位权限与网络。";
  }
}

function formatCapacitorCallbackError(err: unknown): string {
  if (err == null) return "定位失败，请到系统设置中为 App 打开「位置」权限。";
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "定位失败，请到系统设置 → BrightAgent → 位置 中允许使用。";
}

/**
 * 在 **Capacitor 原生壳** 内用 `@capacitor/geolocation`；在网页内用 `navigator.geolocation`。
 */
export async function startMapGeolocationWatch(handlers: {
  onSuccess: (c: MapGeoCoords) => void;
  onError: (message: string) => void;
}): Promise<MapGeoWatchHandle> {
  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import("@capacitor/geolocation");
    let perm;
    try {
      perm = await Geolocation.requestPermissions();
    } catch {
      handlers.onError("无法请求定位权限，请到系统设置中为 BrightAgent 打开位置。");
      return { stop: async () => {} };
    }
    if (perm.location === "denied") {
      handlers.onError("定位权限被拒绝：请到系统设置 → BrightAgent → 位置，选择「使用 App 期间」或「始终」。");
      return { stop: async () => {} };
    }

    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 20000 },
      (position, err) => {
        if (err) {
          handlers.onError(formatCapacitorCallbackError(err));
          void Geolocation.clearWatch({ id });
          return;
        }
        if (position) {
          handlers.onSuccess({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        }
      }
    );

    return {
      stop: async () => {
        try {
          await Geolocation.clearWatch({ id });
        } catch {
          /* ignore */
        }
      },
    };
  }

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
