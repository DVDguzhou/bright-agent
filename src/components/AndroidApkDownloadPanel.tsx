"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

type Props = {
  apkUrl: string;
};

export function AndroidApkDownloadPanel({ apkUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apkUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("复制此链接", apkUrl);
    }
  }, [apkUrl]);

  return (
    <div className="space-y-6">
      <div className="app-panel p-5 sm:p-6">
        <p className="text-sm font-medium text-ink-400">安装包直链</p>
        <p className="mt-2 break-all text-xs text-ink-500">{apkUrl}</p>
        <button
          type="button"
          onClick={copyLink}
          className="btn-secondary mt-4"
        >
          {copied ? "已复制链接" : "复制下载链接"}
        </button>
      </div>

      <div className="app-panel bg-paper-200/60 p-4 text-sm leading-relaxed text-ink-600">
        <p className="font-medium">说明</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>本安装包仅适用于 Android；iPhone 请点上方「打开 App Store」或搜索「brightagent」。</li>
          <li>首次安装可能需要在系统设置中允许「安装未知应用」。</li>
        </ul>
      </div>

      <p className="text-sm text-ink-500">
        安装即表示您同意{" "}
        <Link href="/privacy" className="text-oxblood-700 hover:text-oxblood-600 hover:underline">
          隐私政策
        </Link>
        。
      </p>
    </div>
  );
}
