"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { VerificationBadge } from "@/components/VerificationBadge";
import { useAuth } from "@/contexts/AuthContext";
import { lifeAgentCoverShouldBypassOptimizer, resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";

type LifeAgentPurchased = {
  id: string;
  displayName: string;
  headline: string;
  pricePerQuestion: number;
  remainingQuestions: number;
  verificationStatus?: string;
};

function tabClass(active: boolean) {
  return `relative inline-block px-3 py-1.5 text-[15px] transition-colors ${
    active ? "font-semibold text-[#111]" : "font-normal text-slate-500"
  }`;
}

function PurchasedGrid({ items }: { items: LifeAgentPurchased[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((row, index) => {
        const coverUrl = resolveLifeAgentCoverUrl(undefined, undefined);
        return (
          <motion.article
            key={row.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index < 8 ? index * 0.04 : 0 }}
            className="min-h-0"
          >
            <Link href={`/life-agents/${row.id}/chat`} className="group flex h-full min-h-0">
              <div className="flex h-full min-h-[280px] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition duration-200 group-hover:shadow-md group-hover:ring-emerald-200/70 sm:min-h-[300px]">
                <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-slate-100">
                  <Image
                    src={coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                    priority={index < 8}
                    unoptimized={lifeAgentCoverShouldBypassOptimizer(coverUrl)}
                  />
                  {(row.verificationStatus === "verified" || row.verificationStatus === "pending") && (
                    <div className="absolute right-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
                      <VerificationBadge status={row.verificationStatus ?? "none"} size="sm" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    剩余 {row.remainingQuestions} 次
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent p-2.5 pt-12">
                    <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-white drop-shadow-md">
                      {row.headline}
                    </span>
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2 sm:p-3">
                  <h3 className="line-clamp-2 min-h-[2.75rem] text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">
                    {row.displayName}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400">点击进入对话</p>
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                    <span>按次咨询</span>
                    <span className="font-bold text-emerald-600">
                      ¥{(row.pricePerQuestion / 100).toFixed(0)}
                      <span className="text-[10px] font-medium text-slate-400">/问</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.article>
        );
      })}
    </div>
  );
}

function LicensesPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: "verified" | "unverified" = tabParam === "unverified" ? "unverified" : "verified";

  const { user, loading: authLoading } = useAuth();
  const [lifeAgentPacks, setLifeAgentPacks] = useState<LifeAgentPurchased[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/life-agents/purchased", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((purchasedData) => {
        setLifeAgentPacks(Array.isArray(purchasedData) ? purchasedData : []);
      })
      .catch(() => setLifeAgentPacks([]))
      .finally(() => setLoading(false));
  }, [user]);

  const { verified, unverified } = useMemo(() => {
    const v: LifeAgentPurchased[] = [];
    const u: LifeAgentPurchased[] = [];
    for (const row of lifeAgentPacks) {
      if (row.verificationStatus === "verified") v.push(row);
      else u.push(row);
    }
    return { verified: v, unverified: u };
  }, [lifeAgentPacks]);

  const list = tab === "verified" ? verified : unverified;

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">加载中…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center max-lg:-mx-4">
        <p className="text-[15px] text-slate-500">登录后查看你已购买的 Agent 与认证状态</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-semibold text-white active:opacity-90"
        >
          登录
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-1 space-y-4 pb-4 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:bg-white max-lg:pb-24 sm:mx-0 sm:space-y-5">
      <header className="flex items-center justify-between gap-2 px-4 pb-1 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-4">
        <h1 className="min-w-0 flex-1 text-[26px] font-bold leading-tight tracking-tight text-[#111]">Licenses</h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/map"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
            aria-label="地图"
            title="地图"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </Link>
          <Link
            href="/life-agents"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
            aria-label="去发现"
            title="发现"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
          <Link
            href="/support/chat"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
            aria-label="联系客服"
            title="联系客服"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-1 border-b border-slate-100 px-2 pb-0 sm:px-4">
        <Link href="/licenses?tab=verified" scroll={false} className={tabClass(tab === "verified")}>
          已认证
          {tab === "verified" ? (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#ff2442]" aria-hidden />
          ) : null}
        </Link>
        <Link href="/licenses?tab=unverified" scroll={false} className={tabClass(tab === "unverified")}>
          未认证
          {tab === "unverified" ? (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#ff2442]" aria-hidden />
          ) : null}
        </Link>
        <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600 sm:text-xs">
          {loading ? "加载中…" : `${list.length} 个`}
        </span>
      </div>

      <section className="px-1 sm:px-0">
        {tab === "verified" ? (
          <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950 sm:mx-1">
            <p className="font-medium">已通过平台认证的创作者</p>
            <p className="mt-1 text-xs text-emerald-900/90">认证标识来自创作者资料审核，可在卡片右上角查看。</p>
          </div>
        ) : (
          <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 sm:mx-1">
            <p className="font-medium">尚未获得认证或未过审</p>
            <p className="mt-1 text-xs text-amber-900/90">含「审核中」与未申请，不影响你已购买的提问次数。</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60"
              >
                <div className="aspect-[4/5] w-full shrink-0 animate-pulse bg-gradient-to-br from-slate-100 to-slate-200/90" />
                <div className="flex flex-1 flex-col gap-2 p-2.5">
                  <div className="min-h-[2.75rem] animate-pulse rounded-md bg-slate-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : lifeAgentPacks.length === 0 ? (
          <div className="mx-1 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-900">暂无已购额度</p>
            <p className="mt-2 text-sm text-slate-500">购买提问包后，对应 Agent 会出现在地图上。</p>
            <Link
              href="/life-agents"
              className="mt-5 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-semibold text-white active:opacity-90"
            >
              去发现页逛逛
            </Link>
          </div>
        ) : list.length === 0 ? (
          <div className="mx-1 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-900">
              {tab === "verified" ? "暂无已认证的已购 Agent" : "暂无未认证的已购 Agent"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {tab === "verified"
                ? "你购买的 Agent 目前都未显示为已认证，可切换到「未认证」查看。"
                : "你购买的 Agent 均已认证，可切换到「已认证」查看。"}
            </p>
            <Link
              href={tab === "verified" ? "/licenses?tab=unverified" : "/licenses?tab=verified"}
              scroll={false}
              className="mt-5 inline-block text-sm font-semibold text-sky-600 hover:underline"
            >
              {tab === "verified" ? "去看未认证" : "去看已认证"}
            </Link>
          </div>
        ) : (
          <PurchasedGrid items={list} />
        )}
      </section>
    </div>
  );
}

export default function LicensesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-4">
          <p className="text-sm text-slate-500">加载中…</p>
        </div>
      }
    >
      <LicensesPageContent />
    </Suspense>
  );
}
