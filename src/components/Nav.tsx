"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
const IconSearch = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
  const searchParams = useSearchParams();
  const { user, refetch } = useAuth();
  const [hasMessages, setHasMessages] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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

  const isLifeAgentChatPage = /^\/life-agents\/[^/]+\/chat(?:\/|$)/.test(pathname);
  const isLifeAgentDetailPage =
    /^\/life-agents\/[^/]+\/?$/.test(pathname) &&
    pathname !== "/life-agents/create" &&
    pathname !== "/life-agents/search";
  const isLifeAgentCreatePage = pathname === "/life-agents/create";
  const isLifeAgentSearchPage = pathname === "/life-agents/search";
  const hideGlobalTopNav = isLifeAgentCreatePage;
  const useBackArrowOnMobileTop = isLifeAgentDetailPage || isLifeAgentCreatePage || isLifeAgentSearchPage;
  const hideGlobalBottomNav = isLifeAgentChatPage || isLifeAgentDetailPage || isLifeAgentCreatePage;

  const searchPageQuery = isLifeAgentSearchPage ? (searchParams.get("q") ?? "").trim() : "";

  const feedTab = searchParams.get("tab");
  const isFeedDiscover = pathname === "/life-agents" && !feedTab;
  const isFeedFavorites = pathname === "/life-agents" && feedTab === "favorites";
  const isFeedPurchased = pathname === "/life-agents" && feedTab === "purchased";

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileDrawerOpen]);

  const feedTabClass = (active: boolean) =>
    `relative px-2 py-1 text-[15px] transition-colors ${
      active ? "font-semibold text-[#111]" : "font-normal text-slate-500"
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
        className={`sticky top-0 z-50 border-b border-slate-100 bg-white/95 supports-[backdrop-filter]:backdrop-blur-xl overflow-x-hidden pt-[env(safe-area-inset-top)] ${
          hideGlobalTopNav ? "hidden" : isLifeAgentChatPage ? "hidden lg:block" : ""
        }`}
      >
        <div className="container mx-auto max-w-7xl px-3 sm:px-4">
          {/* 手机：小红书式顶栏（发现流 + 搜索胶囊 + 消息）；聊天页不显示，避免与聊天页内导航重复 */}
          {!isLifeAgentChatPage && (
            <div className="flex items-center gap-1 py-2.5 lg:hidden">
              <button
                type="button"
                onClick={() => {
                  if (useBackArrowOnMobileTop) {
                    if (window.history.length > 1) router.back();
                    else router.push("/life-agents");
                    return;
                  }
                  setMobileDrawerOpen(true);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition active:bg-slate-100"
                aria-label={useBackArrowOnMobileTop ? "返回" : "打开菜单"}
                aria-expanded={mobileDrawerOpen}
              >
                {useBackArrowOnMobileTop ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              {isLifeAgentSearchPage ? (
                <div className="flex min-w-0 flex-1 items-center justify-center px-2">
                  <span className="truncate text-[16px] font-semibold text-[#111]">
                    {searchPageQuery ? "搜索结果" : "搜索"}
                  </span>
                </div>
              ) : (
                <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-4">
                  <Link href="/life-agents?tab=favorites" className={`relative ${feedTabClass(isFeedFavorites)}`} scroll={false}>
                    收藏
                    {isFeedFavorites ? (
                      <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-[#ff2442]" aria-hidden />
                    ) : null}
                  </Link>
                  <Link href="/life-agents" className={`relative ${feedTabClass(isFeedDiscover)}`} scroll={false}>
                    发现
                    {isFeedDiscover ? (
                      <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-[#ff2442]" aria-hidden />
                    ) : null}
                  </Link>
                  <Link href="/life-agents?tab=purchased" className={`relative ${feedTabClass(isFeedPurchased)}`} scroll={false}>
                    已购买
                    {isFeedPurchased ? (
                      <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-[#ff2442]" aria-hidden />
                    ) : null}
                  </Link>
                </div>
              )}
              {isLifeAgentSearchPage ? (
                <span className="h-10 w-10 shrink-0" aria-hidden />
              ) : (
                <Link
                  href="/life-agents/search"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition active:bg-slate-100"
                  title="搜索"
                  aria-label="搜索"
                >
                  <IconSearch className="h-5 w-5 stroke-[1.75]" />
                </Link>
              )}
            </div>
          )}

          {/* 电脑端顶栏 */}
          <div className="hidden min-h-[52px] items-center justify-between lg:flex sm:h-16">
          <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2" title="BrightAgent">
            <Image
              src="/bright-agent-icon.png"
              alt="BrightAgent"
              width={36}
              height={36}
              className="h-7 w-7 shrink-0 rounded-lg object-contain sm:h-9 sm:w-9"
            />
            <span className="hidden truncate whitespace-nowrap bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-base font-bold text-transparent md:inline xl:inline 2xl:text-xl">
              BrightAgent
            </span>
            <span className="hidden truncate whitespace-nowrap text-sm text-slate-500 transition-colors group-hover:text-sky-600 2xl:inline">
              本地经验 · 对话咨询 · Agent as Service
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 xl:gap-2 2xl:gap-4">
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

          <div className="flex shrink-0 items-center gap-1 xl:gap-2 2xl:gap-4">
            <AnimatePresence mode="wait">{AuthLinks({})}</AnimatePresence>
          </div>
          </div>
        </div>
      </motion.nav>

      {/* 手机+平板：底部导航栏；Agent 详情/聊天页有专用操作栏时隐藏 */}
      <AnimatePresence>
        {mobileDrawerOpen && !isLifeAgentChatPage ? (
          <>
            <motion.button
              key="nav-drawer-backdrop"
              type="button"
              aria-label="关闭菜单"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[190] bg-black/35 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <motion.aside
              key="nav-drawer-panel"
              initial={{ x: "-105%" }}
              animate={{ x: 0 }}
              exit={{ x: "-105%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed left-0 top-0 z-[191] flex h-[100dvh] w-[min(100vw,18.5rem)] flex-col border-r border-slate-200 bg-white shadow-xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <span className="text-sm font-semibold text-slate-800">菜单</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="关闭"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Link
                  href="/life-agents/create"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  创建 Agent
                </Link>
                <Link
                  href="/dashboard/life-agents"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <IconAgent className="h-5 w-5 text-slate-600" />
                  我创建的 Agent
                </Link>
                <Link
                  href="/dashboard/messages"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="relative mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <span className="relative inline-flex">
                    <IconMessages className="h-5 w-5 text-slate-600" />
                    {hasMessages && pathname !== "/dashboard/messages" ? (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden />
                    ) : null}
                  </span>
                  消息
                </Link>
                <Link
                  href="/licenses"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <IconLicense className="h-5 w-5 text-slate-600" />
                  License
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      <IconDashboard className="h-5 w-5 text-slate-600" />
                      我的
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        void logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <IconLogout className="h-5 w-5" />
                      退出登录
                    </button>
                  </>
                ) : (
                  <div className="mt-2 space-y-2 border-t border-slate-100 pt-4">
                    <Link
                      href="/login"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
                    >
                      <IconLogin className="h-4 w-4" />
                      登录
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-800"
                    >
                      注册
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {!hideGlobalBottomNav && (
        <>
          {/* 中间 FAB 与第 3 列空白对齐：Agent | 消息 | （+） | License | 我的 */}
          <Link
            href="/life-agents/create"
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] left-1/2 z-[60] flex h-12 w-12 -translate-x-1/2 lg:hidden items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-400 shadow-lg shadow-blue-500/30 ring-4 ring-white transition-transform active:scale-95"
            aria-label="创建 Agent"
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>

          <div className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-end justify-around border-t border-slate-200/90 bg-white supports-[backdrop-filter]:bg-white/95 supports-[backdrop-filter]:backdrop-blur-xl pb-[env(safe-area-inset-bottom)] pt-2">
            {(() => {
              const [lifeAgentsLink, messagesLink, licenseLink] = navLinks;
              const renderTab = (
                link: (typeof navLinks)[number],
                showBadge: boolean
              ) => {
                const Icon = link.Icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-2 py-2 transition-colors ${
                      active ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    <span className="relative inline-flex">
                      <Icon className={`h-6 w-6 shrink-0 ${active ? "stroke-[2.5]" : ""}`} />
                      {showBadge && (
                        <span className="absolute -top-0.5 right-0 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden />
                      )}
                    </span>
                    <span className="w-full truncate text-center text-[11px] font-medium">{link.label}</span>
                  </Link>
                );
              };
              return (
                <>
                  {renderTab(
                    lifeAgentsLink,
                    false
                  )}
                  {renderTab(
                    messagesLink,
                    hasMessages && pathname !== "/dashboard/messages"
                  )}
                  <div className="min-h-[52px] min-w-0 flex-1 px-2 py-2" aria-hidden />
                  {renderTab(licenseLink, false)}
                </>
              );
            })()}

            {user ? (
              <Link
                href="/dashboard"
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 flex-1 transition-colors ${
                  pathname === "/dashboard" ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <IconDashboard className={`h-6 w-6 shrink-0 ${pathname === "/dashboard" ? "stroke-[2.5]" : ""}`} />
                <span className="text-[11px] font-medium">我的</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 flex-1 transition-colors ${
                  pathname === "/login" ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <IconLogin className={`h-6 w-6 shrink-0 ${pathname === "/login" ? "stroke-[2.5]" : ""}`} />
                <span className="text-[11px] font-medium">登录</span>
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}
