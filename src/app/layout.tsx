import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "小黑平台 — 身份认证 · 交易授权 · 调用存证 · 纠纷仲裁",
  description: "平台不做 Agent 执行，只负责：身份认证、交易授权、调用存证、纠纷仲裁。买方购买 License，持 Token 直接调用卖方 Agent。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${outfit.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-[#030712] text-slate-100 font-sans antialiased">
        <Nav />
        <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">{children}</main>
      </body>
    </html>
  );
}
