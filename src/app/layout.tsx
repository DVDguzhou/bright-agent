import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "AI Agent Marketplace",
  description: "可创建人生经验 Agent、展示个人知识、提供聊天咨询与按次付费服务的轻量平台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${outfit.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <Nav />
        <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">{children}</main>
      </body>
    </html>
  );
}
