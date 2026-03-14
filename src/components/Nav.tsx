"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// 人生 Agent: 智能体/对话
const IconAgent = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
// 消息
const IconMessages = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
// 我的 License
const IconLicense = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const navLinks = [
  { href: "/life-agents", label: "人生 Agent", Icon: IconAgent },
  { href: "/dashboard/messages", label: "消息", Icon: IconMessages },
  { href: "/licenses", label: "我的 License", Icon: IconLicense },
];

export function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, refetch } = useAuth();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    refetch();
    router.push("/");
    router.refresh();
    setMobileMenuOpen(false);
  };

  const linkClass = (isActive: boolean) =>
    `py-3 px-3 rounded-lg text-sm font-medium transition-colors block w-full text-left ${
      isActive ? "text-sky-700 bg-sky-50" : "text-slate-600 hover:bg-slate-50"
    }`;

  const AuthLinks = ({ vertical = false }: { vertical?: boolean }) =>
    user ? (
      <motion.div
        key="logged-in"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className={`flex ${vertical ? "flex-col gap-0.5" : "items-center gap-2 sm:gap-3"}`}
      >
        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className={vertical ? linkClass(pathname === "/dashboard") : undefined}>
          <motion.span
            className="text-sm text-slate-600 hover:text-sky-700 transition-colors"
            whileHover={{ scale: vertical ? 1 : 1.02 }}
          >
            个人主页
          </motion.span>
        </Link>
        {!vertical && (
          <span className="text-slate-500 text-sm hidden md:inline truncate max-w-[120px]">
            {user.email}
          </span>
        )}
        {vertical && <span className="text-slate-500 text-xs px-3 py-1 truncate">{user.email}</span>}
        <motion.button
          onClick={logout}
          className={vertical ? `text-sm font-medium py-3 px-3 rounded-lg text-left text-rose-500 hover:bg-slate-50` : "text-sm text-slate-500 hover:text-rose-500 transition-colors"}
          whileHover={{ scale: vertical ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          退出
        </motion.button>
      </motion.div>
    ) : (
      <motion.div
        key="logged-out"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className={`flex ${vertical ? "flex-col gap-0.5" : "items-center gap-2 sm:gap-3"}`}
      >
        <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={vertical ? linkClass(pathname === "/login") : undefined}>
          <motion.span
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            whileHover={{ scale: vertical ? 1 : 1.02 }}
          >
            登录
          </motion.span>
        </Link>
        <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className={vertical ? `py-3 px-3 rounded-lg btn-primary text-sm font-medium text-center` : undefined}>
          <motion.span
            className={vertical ? undefined : "btn-primary text-sm inline-block px-3 py-2"}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            注册
          </motion.span>
        </Link>
      </motion.div>
    );

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl overflow-x-hidden"
    >
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl flex items-center justify-between min-h-[56px] sm:h-16">
        <Link href="/" className="flex items-center gap-2 group shrink-0 min-w-0" title="Bright Agent Hub">
          <Image
            src="/bright-agent-icon.png"
            alt="Bright Agent Hub"
            width={36}
            height={36}
            className="shrink-0 rounded-lg object-contain"
          />
          <span className="hidden lg:inline text-base xl:text-xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent truncate">
            Bright Agent Hub
          </span>
          <span className="hidden xl:inline text-slate-500 group-hover:text-sky-600 transition-colors text-sm truncate">
            本地经验 · 对话咨询 · Agent as Service
          </span>
        </Link>

        {/* Desktop nav: md 仅图标防拥挤，lg+ 图标+文字 */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4 shrink-0">
          {navLinks.map((link) => {
            const Icon = link.Icon;
            return (
              <Link key={link.href} href={link.href} title={link.label}>
                <motion.span
                  className={`relative flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    pathname === link.href
                      ? "text-sky-700"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="hidden lg:inline">{link.label}</span>
                  {pathname === link.href && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-2 right-2 bottom-1 h-0.5 bg-sky-500/60 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </motion.span>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <AnimatePresence mode="wait">{AuthLinks()}</AnimatePresence>
        </div>

        {/* Mobile: hamburger only (auth links in dropdown) */}
        <div className="flex md:hidden items-center gap-1">
          <motion.button
            aria-label="菜单"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </motion.button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-slate-100 bg-white/95"
          >
            <div className="px-4 py-3 flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href ? "text-sky-700 bg-sky-50" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-slate-200" />
              <div className="flex flex-col gap-0.5">
                <AnimatePresence mode="wait">{AuthLinks({ vertical: true })}</AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
