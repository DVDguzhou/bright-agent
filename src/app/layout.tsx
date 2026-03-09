import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "AI Agent Marketplace",
  description: "专注本地的经验 Agent 市场：学长分享雅思、大妈分享菜市场、酒吧达人分享探店、创业者分享行业——真实经历做成可对话 Agent，按次付费咨询。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <AuthProvider>
          <Nav />
          <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
