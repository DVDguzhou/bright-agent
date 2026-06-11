"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LifeAgentDiscoverCardGrid } from "@/components/LifeAgentDiscoverCardGrid";
import type { LifeAgentListItem } from "@/lib/life-agent-feed-search";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  SearchInput,
  StatStrip,
} from "@/components/dashboard/AgentAdminUI";

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
  mindScore?: number;
  mindScoreLevel?: number;
  mindScoreLevelLabel?: string;
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
    mindScore: p.mindScore,
    mindScoreLevel: p.mindScoreLevel,
    mindScoreLevelLabel: p.mindScoreLevelLabel,
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
      .then((data) => setProfiles(Array.isArray(data) ? data : []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, [user]);

  const listItems = useMemo(() => profiles.map((p) => mineToListItem(p)), [profiles]);
  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return listItems;
    return listItems.filter((item) =>
      [item.displayName, item.headline, item.shortBio].some((v) => v.toLowerCase().includes(keyword)),
    );
  }, [listItems, query]);

  const totals = useMemo(
    () => ({
      published: profiles.filter((item) => item.published).length,
      sessions: profiles.reduce((sum, item) => sum + (item.sessionCount ?? 0), 0),
      knowledge: profiles.reduce((sum, item) => sum + (item.knowledgeCount ?? 0), 0),
    }),
    [profiles],
  );

  if (authLoading) {
    return (
      <AdminPage>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (!user) {
    return (
      <AdminPage narrow>
        <EmptyState
          title="请先登录"
          description="登录后可以管理你创建的人生 Agent。"
          action={<Link href="/login" className="btn-primary">去登录</Link>}
        />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        eyebrow="创作者后台"
        title="我的人生 Agent"
        description="维护你公开展示的人生经历、话题素材和互动记录。这里的视觉会尽量贴近发现页，让后台也像同一座经验档案馆。"
        actions={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder="搜索名称、标题或简介" label="搜索我的 Agent" />
            <Link href="/life-agents/create" className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden />
              新建 Agent
            </Link>
          </>
        }
      />

      <div className="mb-5">
        <StatStrip
          columns={3}
          items={[
            { label: "全部 Agent", value: profiles.length, sub: "个" },
            { label: "已发布", value: totals.published, sub: "个", tone: "olive" },
            { label: "累计对话", value: totals.sessions, sub: "场", tone: "signal" },
          ]}
        />
      </div>

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
        <EmptyState
          title="还没有人生 Agent"
          description="创建第一个 Agent，把你的真实经历整理成可以被咨询、被调用、被持续打磨的档案。"
          action={<Link href="/life-agents/create" className="btn-primary">创建第一个 Agent</Link>}
        />
      ) : (
        <LifeAgentDiscoverCardGrid
          profiles={filteredItems}
          loading={false}
          emptyTitle="没有匹配的 Agent"
          emptySubtitle="换个关键词试试，或者清空搜索查看全部。"
          profileHref={(id) => `/dashboard/life-agents/${id}`}
          windowed={false}
          windowResetKey={query}
        />
      )}
    </AdminPage>
  );
}
