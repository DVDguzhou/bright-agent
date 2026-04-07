"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileTouchNavEnabled } from "@/hooks/use-life-agents-feed-gestures";

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
/** 底栏「地图」→ Agent 地理分布页；已购凭证见 /licenses */
const IconMap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const navLinks = [
  { href: "/life-agents", label: "发现", Icon: IconAgent },
  { href: "/dashboard/messages", label: "消息", Icon: IconMessages },
  { href: "/map", label: "地图", Icon: IconMap },
];

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, refetch } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }
    fetch("/api/life-agents/feedback/all", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const count =
          (Array.isArray((d as { recent?: unknown[] })?.recent) ? (d as { recent?: unknown[] }).recent!.length : 0) +
          (Array.isArray((d as { ratings?: { recent?: unknown[] } })?.ratings?.recent)
            ? (d as { ratings?: { recent?: unknown[] } }).ratings!.recent!.length
            : 0);
        setNotificationCount(count);
      })
      .catch(() => setNotificationCount(0));
  }, [user]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    refetch();
    router.push("/");
    router.refresh();
  };

  const linkClass = (isActive: boolean) =>
    `py-3 px-3 rounded-lg text-sm font-medium transition-colors block w-full text-left ${
      isActive ? "text-purple-800 bg-purple-50" : "text-slate-600 hover:bg-purple-50/50"
    }`;

  const isLifeAgentChatPage = /^\/life-agents\/[^/]+\/chat(?:\/|$)/.test(pathname);
  const isLifeAgentDetailPage =
    /^\/life-agents\/[^/]+\/?$/.test(pathname) &&
    pathname !== "/life-agents/create" &&
    pathname !== "/life-agents/search";
  const isLifeAgentCreatePage = pathname === "/life-agents/create";
  const isLifeAgentSearchPage = pathname === "/life-agents/search";
  const isDashboardMessagesPage = pathname === "/dashboard/messages";
  const isDashboardNotificationsPage = pathname === "/dashboard/notifications";
  const isDashboardApiKeysPage = pathname === "/dashboard/api-keys";
  const isDashboardLifeAgentsListPage = pathname === "/dashboard/life-agents";
  const isDashboardLifeAgentFeedbackPage = /^\/dashboard\/life-agents\/[^/]+\/feedback\/?$/.test(pathname);
  const isDashboardLifeAgentCoEditPage = /^\/dashboard\/life-agents\/[^/]+\/co-edit\/?$/.test(pathname);
  const isLicensesPage = pathname === "/licenses";
  const isMapPage = pathname === "/map";
  const isSupportChatPage = pathname === "/support/chat";
  const hideGlobalTopNav =
    isLifeAgentCreatePage ||
    isLifeAgentSearchPage ||
    isDashboardMessagesPage ||
    isDashboardNotificationsPage ||
    isDashboardApiKeysPage ||
    isDashboardLifeAgentsListPage ||
    isDashboardLifeAgentCoEditPage ||
    isDashboardLifeAgentFeedbackPage ||
    isLicensesPage ||
    isMapPage ||
    isSupportChatPage;
  const useBackArrowOnMobileTop = isLifeAgentDetailPage || isLifeAgentCreatePage;
  const hideGlobalBottomNav =
    isLifeAgentChatPage || isLifeAgentDetailPage || isLifeAgentCreatePage || isDashboardLifeAgentCoEditPage;
  const isDiscoverEntryPage = pathname === "/" || pathname === "/life-agents";

  const feedTab = searchParams.get("tab");
  const isFeedDiscover = isDiscoverEntryPage && !feedTab;
  const isFeedFavorites = isDiscoverEntryPage && feedTab === "favorites";
  const isFeedPurchased = isDiscoverEntryPage && feedTab === "purchased";
  const isDashboardHomePage = pathname === "/dashboard";

  const touchFeedPager = useMobileTouchNavEnabled() && isDiscoverEntryPage;
  const feedTabFavRef = useRef<HTMLAnchorElement | null>(null);
  const feedTabDiscRef = useRef<HTMLAnchorElement | null>(null);
  const feedTabPurRef = useRef<HTMLAnchorElement | null>(null);
  const [feedTabUnderlineX, setFeedTabUnderlineX] = useState<number | null>(null);

  const updateFeedUnderlineFromProgress = useCallback((progress: number) => {
    const fav = feedTabFavRef.current;
    const disc = feedTabDiscRef.current;
    const pur = feedTabPurRef.current;
    if (!fav || !disc || !pur) return;
    const a = fav.offsetLeft + fav.offsetWidth / 2;
    const b = disc.offsetLeft + disc.offsetWidth / 2;
    const c = pur.offsetLeft + pur.offsetWidth / 2;
    let x: number;
    if (progress <= 1) x = a + (b - a) * progress;
    else x = b + (c - b) * (progress - 1);
    setFeedTabUnderlineX(x);
  }, []);

  useEffect(() => {
    if (!touchFeedPager) {
      setFeedTabUnderlineX(null);
      return;
    }
    const onPager = (e: Event) => {
      const p = (e as CustomEvent<{ progress?: number }>).detail?.progress;
      if (typeof p !== "number") return;
      updateFeedUnderlineFromProgress(p);
    };
    window.addEventListener("la-feed-pager", onPager);
    return () => window.removeEventListener("la-feed-pager", onPager);
  }, [touchFeedPager, updateFeedUnderlineFromProgress]);

  useLayoutEffect(() => {
    if (!touchFeedPager) return;
    const idx = feedTab === "favorites" ? 0 : feedTab === "purchased" ? 2 : 1;
    updateFeedUnderlineFromProgress(idx);
  }, [touchFeedPager, feedTab, updateFeedUnderlineFromProgress]);

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
          className={vertical ? linkClass(pathname === "/dashboard") : "inline-flex items-center gap-2 rounded-lg px-2 py-2 text-slate-600 transition-colors hover:text-purple-800"}
          title="个人主页"
        >
          {!vertical && <IconDashboard className="h-5 w-5 shrink-0" />}
          <motion.span
            className={`text-sm transition-colors ${vertical ? "text-slate-600 hover:text-purple-800" : "hidden xl:inline text-slate-600"}`}
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
        className={`sticky top-0 z-50 border-b border-purple-200/[0.2] bg-white/[0.92] supports-[backdrop-filter]:backdrop-blur-xl overflow-x-hidden shadow-[0_4px_24px_-8px_rgba(124,58,237,0.07)] pt-[env(safe-area-inset-top)] ${
          hideGlobalTopNav ? "hidden" : isLifeAgentChatPage ? "hidden lg:block" : ""
        }`}
      >
        <div className="container mx-auto max-w-7xl px-3 sm:px-4">
          {/* 手机：小红书式顶栏；聊天页与搜索页由页面内自建顶栏，避免重复 */}
          {!isLifeAgentChatPage && !isLifeAgentSearchPage && (
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
              <div className="relative flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-4">
                {touchFeedPager && feedTabUnderlineX !== null ? (
                  <span
                    className="pointer-events-none absolute bottom-0 h-[2px] w-8 rounded-full bg-gradient-to-r from-[#FF80AB] to-[#BA68C8] transition-[left] duration-75 ease-out sm:w-9"
                    style={{ left: feedTabUnderlineX, transform: "translateX(-50%)" }}
                    aria-hidden
                  />
                ) : null}
                <Link
                  ref={feedTabFavRef}
                  href="/life-agents?tab=favorites"
                  className={`relative ${feedTabClass(isFeedFavorites)}`}
                  scroll={false}
                >
                  收藏
                  {!touchFeedPager && isFeedFavorites ? (
                    <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-gradient-to-r from-[#FF80AB] to-[#BA68C8]" aria-hidden />
                  ) : null}
                </Link>
                <Link ref={feedTabDiscRef} href="/life-agents" className={`relative ${feedTabClass(isFeedDiscover)}`} scroll={false}>
                  发现
                  {!touchFeedPager && isFeedDiscover ? (
                    <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-gradient-to-r from-[#FF80AB] to-[#BA68C8]" aria-hidden />
                  ) : null}
                </Link>
                <Link
                  ref={feedTabPurRef}
                  href="/life-agents?tab=purchased"
                  className={`relative ${feedTabClass(isFeedPurchased)}`}
                  scroll={false}
                >
                  已购买
                  {!touchFeedPager && isFeedPurchased ? (
                    <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-gradient-to-r from-[#FF80AB] to-[#BA68C8]" aria-hidden />
                  ) : null}
                </Link>
              </div>
              <Link
                href={isDashboardHomePage ? "/dashboard/notifications" : "/life-agents/search"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition active:bg-slate-100"
                title={isDashboardHomePage ? "提醒" : "搜索"}
                aria-label={isDashboardHomePage ? "提醒" : "搜索"}
              >
                {isDashboardHomePage ? (
                  <span className="relative inline-flex">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {notificationCount > 0 ? (
                      <span className="absolute -right-2 -top-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <IconSearch className="h-5 w-5 stroke-[1.75]" />
                )}
              </Link>
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
            <span className="hidden truncate whitespace-nowrap bg-gradient-to-r from-[#BA68C8] via-[#FF80AB] to-[#7c3aed] bg-clip-text text-base font-bold text-transparent md:inline xl:inline 2xl:text-xl">
              BrightAgent
            </span>
            <span className="hidden truncate whitespace-nowrap text-sm text-slate-500 transition-colors group-hover:text-purple-700 2xl:inline">
              本地经验 · 对话咨询 · Agent as Service
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 xl:gap-2 2xl:gap-4">
            {navLinks.map((link) => {
              const Icon = link.Icon;
              const active = link.href === "/life-agents" ? isDiscoverEntryPage : pathname === link.href;
              return (
                <Link key={link.href} href={link.href} title={link.label}>
                  <motion.span
                    className={`relative flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? "text-purple-800"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative inline-flex">
                      <Icon className="w-5 h-5 shrink-0" />
                    </span>
                    <span className="hidden xl:inline">{link.label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute left-2 right-2 bottom-1 h-0.5 rounded-full bg-gradient-to-r from-[#FF80AB]/80 to-[#BA68C8]/90"
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
              className="fixed left-0 top-0 z-[191] flex h-[100dvh] w-[min(100vw,18.5rem)] flex-col border-r border-purple-100/80 bg-white shadow-[4px_0_32px_-8px_rgba(168,139,235,0.15)] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-purple-100/70 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <span className="text-sm font-semibold text-slate-800">菜单</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-purple-50"
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
                  className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-purple-50/80"
                >
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  创建人生 Agent
                </Link>
                <Link
                  href="/dashboard/life-agents"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-purple-50/80"
                >
                  <IconAgent className="h-5 w-5 text-slate-600" />
                  我创建的
                </Link>
                <Link
                  href="/dashboard/messages"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-purple-50/80"
                >
                  <IconMessages className="h-5 w-5 text-slate-600" />
                  消息
                </Link>
                <Link
                  href="/map"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-purple-50/80"
                >
                  <IconMap className="h-5 w-5 text-slate-600" />
                  地图
                </Link>
                <Link
                  href="/licenses"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-purple-50/80"
                >
                  <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  已购咨询
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-purple-50/80"
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
                  <div className="mt-2 space-y-2 border-t border-purple-100/70 pt-4">
                    <Link
                      href="/login"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm"
                    >
                      <IconLogin className="h-4 w-4" />
                      登录
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
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
          {/* 中间 FAB 与第 3 列空白对齐：发现 | 消息 | （+） | 地图 | 我的 */}
          <Link
            href="/life-agents/create"
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] left-1/2 z-[60] flex h-12 w-12 -translate-x-1/2 lg:hidden items-center justify-center rounded-full bg-gradient-to-br from-[#BA68C8] via-[#FF80AB] to-[#FFF176] shadow-lg shadow-fuchsia-500/25 ring-4 ring-white transition-transform active:scale-95"
            aria-label="创建人生 Agent"
          >
            <svg className="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>

          <div className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-end justify-around border-t border-purple-200/[0.2] bg-white/[0.94] supports-[backdrop-filter]:backdrop-blur-xl pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_28px_-8px_rgba(124,58,237,0.075)]">
            {(() => {
              const [lifeAgentsLink, messagesLink, licenseLink] = navLinks;
              const renderTab = (
                link: (typeof navLinks)[number]
              ) => {
                const Icon = link.Icon;
                const active = link.href === "/life-agents" ? isDiscoverEntryPage : pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-2 py-2 transition-colors ${
                      active ? "text-purple-700" : "text-slate-400"
                    }`}
                  >
                    <span className="relative inline-flex">
                      <Icon className={`h-6 w-6 shrink-0 ${active ? "stroke-[2.5]" : ""}`} />
                    </span>
                    <span className="w-full truncate text-center text-[11px] font-medium">{link.label}</span>
                  </Link>
                );
              };
              return (
                <>
                  {renderTab(lifeAgentsLink)}
                  {renderTab(messagesLink)}
                  <div className="min-h-[52px] min-w-0 flex-1 px-2 py-2" aria-hidden />
                  {renderTab(licenseLink)}
                </>
              );
            })()}

            {user ? (
              <Link
                href="/dashboard"
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 flex-1 transition-colors ${
                  pathname === "/dashboard" ? "text-purple-700" : "text-slate-400"
                }`}
              >
                <IconDashboard className={`h-6 w-6 shrink-0 ${pathname === "/dashboard" ? "stroke-[2.5]" : ""}`} />
                <span className="text-[11px] font-medium">我的</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 flex-1 transition-colors ${
                  pathname === "/login" ? "text-purple-700" : "text-slate-400"
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
