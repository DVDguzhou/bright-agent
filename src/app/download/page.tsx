import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { AndroidApkDownloadPanel } from "@/components/AndroidApkDownloadPanel";
import {
  ANDROID_APK_INSTALL_STEPS,
  ANDROID_APP_DISPLAY_NAME,
  ANDROID_APP_VERSION,
  getAndroidApkDownloadUrl,
} from "@/lib/android-app-download";

export const metadata: Metadata = {
  title: "下载 Android 版 · BrightAgent",
  description: "扫码或点击下载 BrightAgent Android 安装包（APK）。",
};

export default async function AndroidDownloadPage() {
  const apkUrl = getAndroidApkDownloadUrl();
  const qrDataUrl = await QRCode.toDataURL(apkUrl, {
    width: 280,
    margin: 2,
    color: { dark: "#1a1714", light: "#ffffff" },
  });

  return (
    <article className="mx-auto max-w-3xl pb-16">
      <header className="mb-10 border-b border-hairline/80 pb-8">
        <p className="text-sm font-medium text-ink-400">BrightAgent</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          下载 Android 版
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
          扫描下方二维码，或直接下载 APK 安装到 Android 手机。无需应用商店，适合内测与线下推广。
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <section className="mx-auto w-full max-w-[280px] text-center lg:mx-0">
          <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`${ANDROID_APP_DISPLAY_NAME} Android 下载二维码`}
              width={280}
              height={280}
              className="mx-auto h-auto w-full"
            />
          </div>
          <p className="mt-3 text-sm font-medium text-ink">扫码下载 APK</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">
            二维码内容为安装包直链，可打印用于海报或展台。
          </p>
        </section>

        <section className="space-y-8">
          <AndroidApkDownloadPanel
            apkUrl={apkUrl}
            appName={ANDROID_APP_DISPLAY_NAME}
            version={ANDROID_APP_VERSION}
          />

          <section>
            <h2 className="text-lg font-semibold text-ink">安装步骤</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-600">
              {ANDROID_APK_INSTALL_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </section>
      </div>

      <footer className="mt-12 rounded-2xl border border-hairline bg-paper/80 p-6 text-sm text-ink-500">
        <p>
          推广用二维码请指向 APK 直链：<span className="break-all text-ink-600">{apkUrl}</span>
        </p>
        <p className="mt-4">
          <Link href="/life-agents" className="text-oxblood-700 hover:text-oxblood-600">
            返回发现页
          </Link>
        </p>
      </footer>
    </article>
  );
}
