"use client";

import { useEffect, useState } from "react";
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
const IconDashboard = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12l8-8 8 8M6 10v9h12v-9" />
  </svg>
);
const IconLogin = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
  </svg>
);
const IconLogout = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7M11 20H5a2 2 0 01-2-2V6a2 2 0 012-2h6" />
  </svg>
);
const IconSignup = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
// 我的 License
const IconLicense = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const navLinks = [
  { href: "/life-agents", label: "Agent", Icon: IconAgent },
  { href: "/dashboard/messages", label: "消息", Icon: IconMessages },
  { href: "/licenses", label: "License", Icon: IconLicense },
];

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, refetch } = useAuth();
  const [hasMessages, setHasMessages] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasMessages(false);
      return;
    }
    fetch("/api/life-agents/chat-sessions", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setHasMessages(Array.isArray(d) && d.length > 0))
      .catch(() => setHasMessages(false));
  }, [user]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    refetch();
    router.push("/");
    router.refresh();
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
        className={`flex ${vertical ? "flex-col gap-0.5" : "items-center gap-1 lg:gap-2 xl:gap-3 shrink-0"}`}
      >
        <Link
          href="/dashboard"
          className={vertical ? linkClass(pathname === "/dashboard") : "inline-flex items-center gap-2 rounded-lg px-2 py-2 text-slate-600 transition-colors hover:text-sky-700"}
          title="个人主页"
        >
          {!vertical && <IconDashboard className="h-5 w-5 shrink-0" />}
          <motion.span
            className={`text-sm transition-colors ${vertical ? "text-slate-600 hover:text-sky-700" : "hidden xl:inline text-slate-600"}`}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
          >
            个人主页
          </motion.span>
        </Link>
        {!vertical && (
          <span className="text-slate-500 text-sm hidden 2xl:inline truncate max-w-[120px]">
            {user.email}
          </span>
        )}
        {vertical && <span className="text-slate-500 text-xs px-3 py-1 truncate">{user.email}</span>}
        <motion.button
          onClick={logout}
          className={vertical ? `text-sm font-medium py-3 px-3 rounded-lg text-left text-rose-500 hover:bg-slate-50` : "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 text-sm text-slate-500 transition-colors hover:text-rose-500"}
          whileHover={{ scale: vertical ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="退出"
        >
          {!vertical && <IconLogout className="h-5 w-5 shrink-0" />}
          <span className={vertical ? "" : "hidden xl:inline"}>退出</span>
        </motion.button>
      </motion.div>
    ) : (
      <motion.div
        key="logged-out"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className={`flex ${vertical ? "flex-col gap-0.5" : "items-center gap-1 lg:gap-2 xl:gap-3 shrink-0"}`}
      >
        <Link
          href="/login"
          className={vertical ? linkClass(pathname === "/login") : "inline-flex items-center gap-2 rounded-lg px-2 py-2 text-slate-600 transition-colors hover:text-slate-900"}
          title="登录"
        >
          {!vertical && <IconLogin className="h-5 w-5 shrink-0" />}
          <motion.span
            className={`text-sm transition-colors ${vertical ? "text-slate-600 hover:text-slate-900" : "hidden xl:inline text-slate-600"}`}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
          >
            登录
          </motion.span>
        </Link>
        <Link
          href="/signup"
          className={vertical ? `py-3 px-3 rounded-lg btn-primary text-sm font-medium text-center` : "btn-primary inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm"}
          title="注册"
        >
          {!vertical && <IconSignup className="h-4 w-4 shrink-0" />}
          <motion.span
            className={vertical ? undefined : "inline-block"}
            whileHover={{ scale: vertical ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={vertical ? "" : "hidden xl:inline"}>注册</span>
          </motion.span>
        </Link>
      </motion.div>
    );

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-slate-200/80 bg-white supports-[backdrop-filter]:bg-white/85 supports-[backdrop-filter]:backdrop-blur-xl overflow-x-hidden pt-[env(safe-area-inset-top)]"
      >
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl flex items-center justify-between min-h-[44px] sm:h-16">
          <Link href="/" className="flex items-center gap-2 group shrink-0 min-w-0" title="BrightAgent">
            <Image
              src="/bright-agent-icon.png"
              alt="BrightAgent"
              width={36}
              height={36}
              className="shrink-0 rounded-lg object-contain w-7 h-7 sm:w-9 sm:h-9"
            />
            <span className="hidden md:inline xl:inline text-base 2xl:text-xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent truncate whitespace-nowrap">
              BrightAgent
            </span>
            <span className="hidden 2xl:inline text-slate-500 group-hover:text-sky-600 transition-colors text-sm truncate whitespace-nowrap">
              本地经验 · 对话咨询 · Agent as Service
            </span>
          </Link>

          {/* 手机/平板：顶部保留账户入口，避免找不到登录状态和退出 */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600"
              >
                退出
              </button>
            ) : null}
          </div>

          {/* Desktop nav: 仅电脑端(lg+) 显示，手机平板用底部导航 */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 2xl:gap-4 shrink-0">
            {navLinks.map((link) => {
              const Icon = link.Icon;
              const showBadge = link.href === "/dashboard/messages" && hasMessages && pathname !== "/dashboard/messages";
              return (
                <Link key={link.href} href={link.href} title={link.label}>
                  <motion.span
                    className={`relative flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      pathname === link.href
                        ? "text-sky-700"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative inline-flex">
                      <Icon className="w-5 h-5 shrink-0" />
                      {showBadge && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden />
                      )}
                    </span>
                    <span className="hidden xl:inline">{link.label}</span>
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

          <div className="hidden lg:flex items-center gap-1 xl:gap-2 2xl:gap-4 shrink-0">
            <AnimatePresence mode="wait">{AuthLinks({})}</AnimatePresence>
          </div>
        </div>
      </motion.nav>

      {/* 手机+平板：底部导航栏；电脑端不显示 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-around border-t border-slate-200/90 bg-white supports-[backdrop-filter]:bg-white/95 supports-[backdrop-filter]:backdrop-blur-xl pb-[env(safe-area-inset-bottom)] pt-2">
        {navLinks.map((link) => {
          const Icon = link.Icon;
          const active = pathname === link.href;
          const showBadge = link.href === "/dashboard/messages" && hasMessages && pathname !== "/dashboard/messages";
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-2 min-w-0 flex-1 transition-colors ${
                active ? "text-sky-600" : "text-slate-500"
              }`}
            >
              <span className="relative inline-flex">
                <Icon className={`h-6 w-6 shrink-0 ${active ? "stroke-[2.5]" : ""}`} />
                {showBadge && (
                  <span className="absolute -top-0.5 right-0 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden />
                )}
              </span>
              <span className="text-[11px] font-medium truncate w-full text-center">{link.label}</span>
            </Link>
          );
        })}
        {user ? (
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-0.5 px-4 py-2 min-w-0 flex-1 transition-colors ${
              pathname === "/dashboard" ? "text-sky-600" : "text-slate-500"
            }`}
          >
            <IconDashboard className={`h-6 w-6 shrink-0 ${pathname === "/dashboard" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[11px] font-medium">我的</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className={`flex flex-col items-center gap-0.5 px-4 py-2 min-w-0 flex-1 transition-colors ${
              pathname === "/login" ? "text-sky-600" : "text-slate-500"
            }`}
          >
            <IconLogin className={`h-6 w-6 shrink-0 ${pathname === "/login" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[11px] font-medium">登录</span>
          </Link>
        )}
      </div>
    </>
  );
}
