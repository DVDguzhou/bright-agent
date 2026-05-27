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
      <div className="rounded-2xl border border-hairline bg-paper/80 p-5 sm:p-6">
        <p className="text-sm font-medium text-ink-400">安装包直链</p>
        <p className="mt-2 break-all text-xs text-ink-500">{apkUrl}</p>
        <button
          type="button"
          onClick={copyLink}
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-hairline bg-paper px-5 py-3 text-sm font-medium text-ink-600 transition hover:border-olive-400/70 hover:text-ink"
        >
          {copied ? "已复制链接" : "复制下载链接"}
        </button>
      </div>

      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-sm leading-relaxed text-amber-950">
        <p className="font-medium">说明</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>本安装包仅适用于 Android；iPhone 请直接用浏览器访问网站并「添加到主屏幕」。</li>
          <li>首次安装可能需要在系统设置中允许「安装未知应用」。</li>
          <li>包名：com.agent.marketplace</li>
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
