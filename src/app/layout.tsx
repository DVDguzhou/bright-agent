import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChunkLoadRecovery } from "@/components/ChunkLoadRecovery";
import { HapticRoot } from "@/components/HapticRoot";
import { MobileSwipeShell } from "@/components/MobileSwipeShell";
import { RegisterSW } from "@/components/RegisterSW";
import { PostHogProvider } from "@/components/PostHogProvider";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#f2f1ed",
};

export const metadata: Metadata = {
  title: "BrightAgent",
  description: "专注本地的经验 Agent 市场：学长分享雅思、大妈分享菜市场、酒吧达人分享探店、创业者分享行业——真实经历做成可对话 Agent，按次付费咨询。",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "BrightAgent", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full bg-[#f2f1ed]">
      <body className="min-h-full min-h-[100dvh] overflow-x-hidden bg-[#f2f1ed] font-sans text-ink antialiased">
        <PostHogProvider>
          <AuthProvider>
            <ChunkLoadRecovery />
            <HapticRoot />
            <Suspense fallback={null}>
              <Nav />
            </Suspense>
            <main className="relative z-10 mx-auto min-h-[100dvh] w-full max-w-7xl overflow-x-hidden bg-transparent px-3 py-3 pb-20 sm:px-5 sm:py-7 lg:min-h-0 lg:pb-8">
              <MobileSwipeShell>{children}</MobileSwipeShell>
            </main>
            <RegisterSW />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
