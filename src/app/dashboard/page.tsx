"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileAvatarEditor } from "@/components/ProfileAvatarEditor";
import { lifeAgentShowsPurchaseUi } from "@/lib/life-agent-commerce";
import { MindScoreBadge } from "@/components/MindScoreBadge";

type LifeAgentCreated = {
  id: string;
  displayName: string;
  headline: string;
  knowledgeCount: number;
  sessionCount: number;
  soldPacks: number;
  totalRevenue: number;
  mindScore?: number;
  mindScoreLevel?: number;
  mindScoreLevelLabel?: string;
};
type LifeAgentPurchased = {
  id: string;
  displayName: string;
  headline: string;
  pricePerQuestion: number;
  remainingQuestions: number;
};

function formatYuan(value: number) {
  if (!value) return "0.00";
  return (value / 100).toFixed(2);
}

function IconBox({
  bgClass,
  children,
}: {
  bgClass: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`flex h-11 w-11 items-center justify-center rounded-full text-ink ${bgClass}`}>
      {children}
    </span>
  );
}

export default function DashboardPage() {
  const { user, loading, refetch } = useAuth();
  const [lifeAgentsCreated, setLifeAgentsCreated] = useState<LifeAgentCreated[]>([]);
  const [lifeAgentsPurchased, setLifeAgentsPurchased] = useState<LifeAgentPurchased[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    Promise.all([
      fetch("/api/life-agents/mine", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => (Array.isArray(d) ? d : []))
        .catch(() => []),
      fetch("/api/life-agents/purchased", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => (Array.isArray(d) ? d : []))
        .catch(() => []),
    ])
      .then(([c, p]) => {
        setLifeAgentsCreated(c);
        setLifeAgentsPurchased(p);
      });
  }, [user]);

  const totals = useMemo(() => {
    const createdCount = lifeAgentsCreated.length;
    const createdSessions = lifeAgentsCreated.reduce((sum, item) => sum + item.sessionCount, 0);
    const soldPacks = lifeAgentsCreated.reduce((sum, item) => sum + item.soldPacks, 0);
    const revenue = lifeAgentsCreated.reduce((sum, item) => sum + item.totalRevenue, 0);
    const purchasedQuestions = lifeAgentsPurchased.reduce((sum, item) => sum + item.remainingQuestions, 0);
    const totalMindScore = lifeAgentsCreated.reduce((sum, item) => sum + (item.mindScore ?? 0), 0);

    return {
      createdCount,
      createdSessions,
      soldPacks,
      revenue,
      purchasedQuestions,
      purchasedProfiles: lifeAgentsPurchased.length,
      totalMindScore,
    };
  }, [lifeAgentsCreated, lifeAgentsPurchased]);

  const topStats = [
    { label: "我的创建", value: totals.createdCount, sub: "人生 Agent" },
    { label: "累计对话", value: totals.createdSessions, sub: "聊天场次" },
    ...(lifeAgentShowsPurchaseUi()
      ? [
          { label: "已购次数", value: totals.purchasedQuestions, sub: "剩余提问" },
          { label: "累计售出", value: totals.soldPacks, sub: "提问包" },
        ]
      : []),
  ];

  const quickActions = [
    {
      href: "/dashboard/life-agents",
      label: "我创建的",
      desc: `${totals.createdCount} 个`,
      bgClass: "bg-paper-300",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
        </svg>
      ),
    },
    ...(lifeAgentShowsPurchaseUi()
      ? [
          {
            href: "/life-agents",
            label: "我的购买",
            desc: `${totals.purchasedQuestions} 次`,
            bgClass: "bg-olive-400/20",
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.119-3 2.5S10.343 13 12 13s3 1.119 3 2.5S13.657 18 12 18m0-10V6m0 12v-2m7-4a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ]
      : []),
    {
      href: "/life-agents?tab=favorites",
      label: "我的收藏",
      desc: "喜欢的 Agent",
      bgClass: "bg-oxblood-100",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/api-keys",
      label: "开发能力",
      desc: "API Key",
      bgClass: "bg-oxblood-100",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a5 5 0 11-9.9 1H3m0 0l3-3m-3 3l3 3m6 6a5 5 0 109.9-1H21m0 0l-3 3m3-3l-3-3" />
        </svg>
      ),
    },
    ...(lifeAgentShowsPurchaseUi()
      ? [
          {
            href: "/licenses",
            label: "已购咨询",
            desc: "提问包与认证",
            bgClass: "bg-oxblood-100",
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  if (loading || !user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
        {loading ? (
          <p className="text-ink-400">加载中...</p>
        ) : (
          <p className="text-ink-400">
            请先 <Link href="/login" className="text-oxblood-600 hover:text-oxblood-700">登录</Link>
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className="mx-auto max-w-5xl space-y-4 max-lg:-mx-4 max-lg:bg-paper-50 max-lg:px-3 max-lg:pb-24"
    >
      <section className="overflow-hidden rounded-[28px] bg-paper shadow-sm ring-1 ring-hairline/40">
        <div className="bg-gradient-to-r from-paper-200 via-paper to-oxblood-50 px-4 pb-4 pt-3 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <ProfileAvatarEditor
                avatarUrl={user.avatarUrl}
                name={user.name}
                email={user.email}
                onUpdated={() => {
                  void refetch();
                }}
              />
              <div className="min-w-0">
                <h1 className="truncate text-[28px] font-black tracking-tight text-ink">
                  {user.name || "我的"}
                </h1>
                <p className="mt-1 truncate text-sm text-ink-400">{user.email}</p>
                <p className="mt-1 text-xs font-medium text-ink-300">
                  人生 Agent 创作者中心
                </p>
              </div>
            </div>
            <div className="h-10 w-10 shrink-0" aria-hidden />
          </div>
        </div>

        <div className="grid grid-cols-4 border-t border-hairline/50">
          {topStats.map((item) => (
            <div key={item.label} className="px-2 py-3 text-center">
              <p className="text-2xl font-black leading-none text-ink">{item.value}</p>
              <p className="mt-1 text-[11px] font-medium text-ink-600">{item.label}</p>
              <p className="mt-0.5 text-[10px] text-ink-300">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 原「我的收益」区块（含金额文案，审核期暂隐藏）
      <section className="rounded-[28px] bg-paper px-4 py-4 shadow-sm ring-1 ring-hairline/40 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tight text-ink">我的收益</h2>
            <p className="mt-1 text-sm text-ink-400">
              目前靠人生 Agent 累计赚了 {formatYuan(totals.revenue)} 元
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-paper-300 px-3 py-1 text-xs font-semibold text-oxblood-600">
            上架中 {totals.createdCount}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-[24px] bg-paper-50 p-3 text-center">
          <div className="rounded-2xl bg-paper px-2 py-3 shadow-sm ring-1 ring-hairline/30">
            <p className="text-lg font-black text-ink">{totals.purchasedProfiles}</p>
            <p className="mt-1 text-[11px] text-ink-400">已购咨询</p>
          </div>
          <div className="rounded-2xl bg-paper px-2 py-3 shadow-sm ring-1 ring-hairline/30">
            <p className="text-lg font-black text-ink">{totals.soldPacks}</p>
            <p className="mt-1 text-[11px] text-ink-400">卖出次数</p>
          </div>
          <div className="rounded-2xl bg-paper px-2 py-3 shadow-sm ring-1 ring-hairline/30">
            <p className="text-lg font-black text-ink">{totals.createdSessions}</p>
            <p className="mt-1 text-[11px] text-ink-400">服务会话</p>
          </div>
          <div className="rounded-2xl bg-paper px-2 py-3 shadow-sm ring-1 ring-hairline/30">
            <p className="text-lg font-black text-ink">{formatYuan(totals.revenue)}</p>
            <p className="mt-1 text-[11px] text-ink-400">累计收入</p>
          </div>
        </div>
      </section>
      */}

      <section className="rounded-[28px] bg-paper px-4 py-4 shadow-sm ring-1 ring-hairline/40 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tight text-ink">我的心智值</h2>
          </div>
          <span className="shrink-0 rounded-full bg-paper-300 px-3 py-1 text-xs font-semibold text-oxblood-600">
            上架中 {totals.createdCount}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-[24px] bg-paper-50 p-3 text-center">
          <div className="rounded-2xl bg-paper px-2 py-3 shadow-sm ring-1 ring-hairline/30">
            <p className="text-lg font-black text-ink">{totals.purchasedProfiles}</p>
            <p className="mt-1 text-[11px] text-ink-400">对话 Agent</p>
          </div>
          <div className="rounded-2xl bg-paper px-2 py-3 shadow-sm ring-1 ring-hairline/30">
            <p className="text-lg font-black text-ink">{totals.soldPacks}</p>
            <p className="mt-1 text-[11px] text-ink-400">被提问</p>
          </div>
          <div className="rounded-2xl bg-paper px-2 py-3 shadow-sm ring-1 ring-hairline/30">
            <p className="text-lg font-black text-ink">{totals.createdSessions}</p>
            <p className="mt-1 text-[11px] text-ink-400">累计对话</p>
          </div>
          <div className="rounded-2xl bg-paper-50 px-2 py-3 text-center shadow-sm ring-1 ring-hairline/60">
            <div className="flex justify-center">
              <MindScoreBadge value={totals.totalMindScore} size="sm" prefix="" />
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-ink-800">心智值</p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-paper px-4 py-4 shadow-sm ring-1 ring-hairline/40 sm:px-6">
        <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-5 sm:gap-2">
          {quickActions.map((item) => (
            <Link key={item.label} href={item.href} className="group block rounded-2xl px-1 py-2 active:scale-[0.99]">
              <div className="mx-auto flex w-full flex-col items-center">
                <IconBox bgClass={item.bgClass}>{item.icon}</IconBox>
                <p className="mt-2 text-[13px] font-semibold text-ink">{item.label}</p>
                <p className="mt-0.5 text-[10px] text-ink-300">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-gradient-to-r from-oxblood-200 via-oxblood-100 to-oxblood-200 px-4 py-4 shadow-sm ring-1 ring-hairline/40 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">继续打磨你的专属顾问主页</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">
              让真实经历更有影响力
            </h2>
            <p className="mt-2 text-sm text-ink/80">
              补全欢迎语、示范回答和经验条目，更容易获得用户互动。
            </p>
          </div>
          <Link
            href={lifeAgentsCreated[0] ? `/dashboard/life-agents/${lifeAgentsCreated[0].id}` : "/life-agents/create"}
            className="shrink-0 rounded-full bg-paper px-4 py-2 text-sm font-semibold text-oxblood-600 shadow-sm active:scale-[0.98]"
          >
            去看看
          </Link>
        </div>
      </section>
    </motion.div>
  );
}
