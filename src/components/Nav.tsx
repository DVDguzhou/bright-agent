"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/life-agents", label: "人生 Agent" },
  { href: "/dashboard/messages", label: "消息" },
  { href: "/licenses", label: "我的 License" },
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

  const AuthLinks = () =>
    user ? (
      <motion.div
        key="logged-in"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="flex items-center gap-2 sm:gap-3"
      >
        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
          <motion.span
            className="text-sm text-slate-600 hover:text-sky-700 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            个人主页
          </motion.span>
        </Link>
        <span className="text-slate-500 text-sm hidden md:inline truncate max-w-[120px]">
          {user.email}
        </span>
        <motion.button
          onClick={logout}
          className="text-sm text-slate-500 hover:text-rose-500 transition-colors"
          whileHover={{ scale: 1.02 }}
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
        className="flex items-center gap-2 sm:gap-3"
      >
        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
          <motion.span
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            登录
          </motion.span>
        </Link>
        <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
          <motion.span
            className="btn-primary text-sm inline-block px-3 py-2"
            whileHover={{ scale: 1.02 }}
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
        <Link href="/" className="flex items-center gap-2 group shrink-0 min-w-0">
          <motion.span
            className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent truncate"
            whileHover={{ scale: 1.02 }}
          >
            Bright Agent Hub
          </motion.span>
          <span className="text-slate-500 group-hover:text-sky-600 transition-colors text-sm hidden md:inline truncate">
            本地经验 · 对话咨询 · Agent as Service
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.span
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === link.href
                    ? "text-sky-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-2 right-2 bottom-1 h-0.5 bg-sky-500/60 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </motion.span>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <AnimatePresence mode="wait">{AuthLinks()}</AnimatePresence>
        </div>

        {/* Mobile: hamburger + auth */}
        <div className="flex md:hidden items-center gap-2">
          <AnimatePresence mode="wait">{AuthLinks()}</AnimatePresence>
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
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href ? "text-sky-700 bg-sky-50" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
