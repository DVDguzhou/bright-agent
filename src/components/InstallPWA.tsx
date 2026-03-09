"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // 检测 iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md">
      <div className="glass-card px-4 py-3 flex items-center gap-3 shadow-lg">
        {isIOS ? (
          <p className="text-sm text-slate-700">
            点击 Safari 底部分享按钮 <span className="font-medium">「添加到主屏幕」</span> 安装应用
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-700 flex-1">将应用安装到桌面，像软件一样使用</p>
            <button
              onClick={handleInstall}
              className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
            >
              安装
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-slate-400 hover:text-slate-600 text-sm"
            >
              暂不
            </button>
          </>
        )}
      </div>
    </div>
  );
}
