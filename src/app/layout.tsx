import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { AuthProvider } from "@/contexts/AuthContext";
import { InstallPWA } from "@/components/InstallPWA";
import { RegisterSW } from "@/components/RegisterSW";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
};

export const metadata: Metadata = {
  title: "BrightAgent",
  description: "专注本地的经验 Agent 市场：学长分享雅思、大妈分享菜市场、酒吧达人分享探店、创业者分享行业——真实经历做成可对话 Agent，按次付费咨询。",
  manifest: "/manifest.json",
  themeColor: "#0ea5e9",
  appleWebApp: { capable: true, title: "BrightAgent" },
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
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden overscroll-x-none">
        <AuthProvider>
          <Suspense fallback={null}>
            <Nav />
          </Suspense>
          <main className="container mx-auto px-4 py-3 sm:py-8 max-w-7xl relative z-10 pb-20 lg:pb-8 overflow-x-hidden">{children}</main>
          <RegisterSW />
          <InstallPWA />
        </AuthProvider>
      </body>
    </html>
  );
}
