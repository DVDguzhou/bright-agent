"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LifeAgentDiscoverCardGrid } from "@/components/LifeAgentDiscoverCardGrid";
import type { LifeAgentListItem } from "@/lib/life-agent-feed-search";

type ProfileItem = {
  id: string;
  displayName: string;
  headline: string;
  shortBio: string;
  pricePerQuestion: number;
  regions?: string[];
  country?: string;
  province?: string;
  city?: string;
  county?: string;
  published: boolean;
  knowledgeCount: number;
  sessionCount: number;
  soldPacks: number;
  totalRevenue: number;
} & Partial<
  Pick<
    LifeAgentListItem,
    "coverUrl" | "coverImageUrl" | "coverPresetKey" | "verificationStatus" | "ratings" | "expertiseTags"
  >
>;

function mineToListItem(p: ProfileItem): LifeAgentListItem {
  return {
    id: p.id,
    displayName: p.displayName,
    headline: p.headline,
    shortBio: p.shortBio,
    audience: "",
    welcomeMessage: "",
    pricePerQuestion: p.pricePerQuestion,
    expertiseTags: Array.isArray(p.expertiseTags) ? p.expertiseTags : [],
    sampleQuestions: [],
    regions: p.regions,
    country: p.country,
    province: p.province,
    city: p.city,
    county: p.county,
    verificationStatus: p.verificationStatus,
    knowledgeCount: p.knowledgeCount,
    soldQuestionPacks: p.soldPacks,
    sessionCount: p.sessionCount,
    ratings: p.ratings,
    creator: { name: p.displayName },
    coverUrl: p.coverUrl,
    coverImageUrl: p.coverImageUrl,
    coverPresetKey: p.coverPresetKey,
    published: p.published,
  };
}

export default function LifeAgentsManagePage() {
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setProfiles([]);
      return;
    }

    fetch("/api/life-agents/mine", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setProfiles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setProfiles([]);
        setLoading(false);
      });
  }, [user]);

  const listItems = useMemo(() => profiles.map(mineToListItem), [profiles]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return listItems;
    return listItems.filter((item) =>
      [item.displayName, item.headline, item.shortBio].some((v) => v.toLowerCase().includes(keyword)),
    );
  }, [listItems, query]);

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">加载中…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">
          请先 <Link href="/login" className="font-medium text-sky-600 hover:text-sky-700">登录</Link>{" "}
          后管理你的人生 Agent。
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-1 space-y-4 pb-4 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:bg-white max-lg:px-1 max-lg:pb-24 sm:mx-0 sm:space-y-5">
      <header className="flex items-center justify-between gap-3 px-4 pb-1 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-4">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111]">我的人生 Agent</h1>
        {!loading && profiles.length === 0 ? (
          <Link
            href="/life-agents/create"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
            aria-label="新建 Agent"
            title="新建 Agent"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        ) : null}
      </header>

      <div className="px-4 pb-1 sm:px-4">
        <label className="sr-only">搜索我的 Agent</label>
        <input
          className="w-full rounded-full border-0 bg-slate-100 px-4 py-2.5 text-[15px] text-[#111] outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-slate-50 focus:ring-slate-200"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索名称、标题或简介"
        />
      </div>

      <section className="px-1 sm:px-0">
        {loading ? (
          <LifeAgentDiscoverCardGrid
            profiles={[]}
            loading
            emptyTitle=""
            emptySubtitle=""
            profileHref={(id) => `/dashboard/life-agents/${id}`}
            windowed={false}
          />
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-900">还没有人生 Agent</p>
            <p className="mt-2 text-sm text-slate-500">创建第一个，开始分享你的经验并接受咨询。</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/life-agents/create"
                className="inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-semibold text-white active:opacity-90"
              >
                去创建
              </Link>
              <Link
                href="/life-agents"
                className="inline-flex rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 active:bg-slate-50"
              >
                逛发现页
              </Link>
            </div>
          </div>
        ) : (
          <LifeAgentDiscoverCardGrid
            profiles={filteredItems}
            loading={false}
            emptyTitle="没有匹配的 Agent"
            emptySubtitle="换个关键词试试，或清空搜索框查看全部。"
            profileHref={(id) => `/dashboard/life-agents/${id}`}
            windowed={false}
            windowResetKey={query}
          />
        )}
      </section>
    </div>
  );
}
