"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type User = { id: string; email: string; name: string | null };

const navLinks = [
  { href: "/life-agents", label: "人生 Agent" },
  { href: "/dashboard/messages", label: "消息" },
  { href: "/licenses", label: "我的 License" },
];

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.span
            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
          >
            Bright Agent Hub
          </motion.span>
          <span className="text-slate-500 group-hover:text-sky-600 transition-colors text-sm hidden sm:inline">
            本地经验 · 对话咨询 · Agent as Service
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.span
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="logged-in"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <Link href="/dashboard">
                  <motion.span
                    className="text-sm text-slate-600 hover:text-sky-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    个人主页
                  </motion.span>
                </Link>
                <span className="text-slate-500 text-sm hidden sm:inline truncate max-w-[120px]">
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
                className="flex items-center gap-3"
              >
                <Link href="/login">
                  <motion.span
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    登录
                  </motion.span>
                </Link>
                <Link href="/signup">
                  <motion.span
                    className="btn-primary text-sm inline-block"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    注册
                  </motion.span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}
