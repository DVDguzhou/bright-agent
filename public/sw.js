// 最小 PWA Service Worker，用于支持「安装到桌面」
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});
