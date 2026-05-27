import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { AndroidApkDownloadPanel } from "@/components/AndroidApkDownloadPanel";
import {
  ANDROID_APK_INSTALL_STEPS,
  ANDROID_APP_DISPLAY_NAME,
  ANDROID_APP_VERSION,
  getAndroidApkDownloadUrl,
  getAndroidDownloadPageUrl,
} from "@/lib/android-app-download";

export const metadata: Metadata = {
  title: "下载 Android 版 · BrightAgent",
  description: "扫码或点击下载 BrightAgent Android 安装包（APK）。",
};

export default async function AndroidDownloadPage() {
  const apkUrl = getAndroidApkDownloadUrl();
  const pageUrl = getAndroidDownloadPageUrl();
  const qrDataUrl = await QRCode.toDataURL(pageUrl, {
    width: 280,
    margin: 2,
    color: { dark: "#1a1714", light: "#ffffff" },
  });

  return (
    <article className="mx-auto max-w-3xl pb-16">
      <header className="mb-8 border-b border-hairline/80 pb-8">
        <p className="text-sm font-medium text-ink-400">BrightAgent</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          下载 Android 版
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
          在 Android 手机上下载并安装 BrightAgent，无需应用商店。
        </p>
      </header>

      {/* 手机端优先：服务端直出下载按钮，不依赖 JS */}
      <section className="mb-8 rounded-2xl border border-olive-400/40 bg-paper/90 p-5 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-ink-400">Android 安装包</p>
        <p className="mt-1 text-lg font-semibold text-ink">{ANDROID_APP_DISPLAY_NAME}</p>
        <p className="mt-1 text-sm text-ink-500">版本 {ANDROID_APP_VERSION}</p>
        <a
          href={apkUrl}
          className="btn-primary mt-5 flex w-full items-center justify-center px-5 py-4 text-base font-semibold"
        >
          立即下载 APK
        </a>
        <p className="mt-4 text-sm leading-relaxed text-ink-500">
          若在微信内打开无反应，请点右上角「⋯」→「在浏览器中打开」，再点下载。
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <section className="mx-auto hidden w-full max-w-[280px] text-center lg:mx-0 lg:block">
          <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`${ANDROID_APP_DISPLAY_NAME} 下载页二维码`}
              width={280}
              height={280}
              className="mx-auto h-auto w-full"
            />
          </div>
          <p className="mt-3 text-sm font-medium text-ink">电脑/海报扫码</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">
            二维码指向本页（{pageUrl}），手机打开后点「立即下载 APK」。
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
          推广链接请用：<span className="break-all text-ink-600">{pageUrl}</span>
        </p>
        <p className="mt-2">
          不要让人用手机浏览器直接打开 <span className="break-all text-ink-600">.apk</span>{" "}
          直链，部分浏览器会显示空白页。
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
