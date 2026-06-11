"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchManageData, formatDateTime, formatShortTime, type ManageData } from "@/app/dashboard/life-agents/_lib/manage";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  SegmentedControl,
  StatStrip,
} from "@/components/dashboard/AgentAdminUI";

type RangeKey = "7d" | "30d" | "all";

export default function LifeAgentSalesPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchManageData(id).then((result) => {
      if (cancelled) return;
      setData(result.data);
      setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const filtered = useMemo(() => {
    const list = data?.questionPacks ?? [];
    if (range === "all") return list;
    const days = range === "7d" ? 7 : 30;
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return list.filter((item) => {
      const ms = Date.parse(item.createdAt);
      return Number.isNaN(ms) ? false : ms >= threshold;
    });
  }, [data?.questionPacks, range]);

  const summary = useMemo(() => {
    const buyers = new Set(filtered.map((item) => item.buyer.email || item.buyer.name || item.id));
    const asked = filtered.reduce((sum, item) => sum + item.questionCount, 0);
    const used = filtered.reduce((sum, item) => sum + item.questionsUsed, 0);
    return { buyers: buyers.size, asked, used };
  }, [filtered]);

  if (loading) {
    return (
      <AdminPage>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (!data) {
    return (
      <AdminPage narrow>
        <EmptyState
          title={error ?? "加载失败"}
          action={<Link href={`/dashboard/life-agents/${id}`} className="btn-primary">返回工作台</Link>}
        />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        backHref={`/dashboard/life-agents/${id}`}
        title="互动记录"
        description={`${data.profile.displayName} 的用户提问与对话消耗情况。`}
        actions={
          <SegmentedControl
            value={range}
            onChange={setRange}
            options={[
              { value: "7d", label: "近 7 天" },
              { value: "30d", label: "近 30 天" },
              { value: "all", label: "全部" },
            ]}
          />
        }
      />

      <div className="mb-5">
        <StatStrip
          columns={3}
          items={[
            { label: "互动用户", value: summary.buyers, sub: "人" },
            { label: "被提问", value: summary.asked, sub: "次", tone: "signal" },
            { label: "已对话", value: summary.used, sub: "次" },
          ]}
        />
      </div>

      <Panel>
        <div className="border-b border-hairline/60 px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-ink">互动明细</h2>
          <p className="mt-1 text-sm text-ink-500">{filtered.length} 条记录</p>
        </div>
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState title="当前筛选下暂无互动记录" />
          </div>
        ) : (
          <ul className="divide-y divide-hairline/60">
            {filtered.map((item) => (
              <li key={item.id} className="px-4 py-4 text-sm sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{item.buyer.name || item.buyer.email}</p>
                    <p className="mt-1 text-ink-500">
                      提问 {item.questionCount} 次，已对话 {item.questionsUsed} 次
                    </p>
                    <p className="mt-1 text-xs text-ink-300">{formatDateTime(item.createdAt)}</p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-ink-300">{formatShortTime(item.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminPage>
  );
}
