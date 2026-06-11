"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchManageData, type ManageData } from "@/app/dashboard/life-agents/_lib/manage";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  StatStrip,
  StatusBadge,
} from "@/components/dashboard/AgentAdminUI";

type BlindSpot = {
  id: string;
  userQuestion: string;
  confidence: string;
  route: string;
  createdAt: string;
};

export default function BlindSpotsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ManageData | null>(null);
  const [spots, setSpots] = useState<BlindSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchManageData(id),
      fetch(`/api/life-agents/${id}/blind-spots`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([manage, blindData]) => {
        if (manage.data) setData(manage.data);
        if (Array.isArray(blindData?.blindSpots)) setSpots(blindData.blindSpots);
        if (manage.error) setError(manage.error);
      })
      .catch(() => setError("加载失败，请稍后重试"))
      .finally(() => setLoading(false));
  }, [id]);

  async function resolveSpot(spotId: string) {
    await fetch(`/api/life-agents/${id}/blind-spots/${spotId}/resolve`, {
      method: "POST",
      credentials: "include",
    });
    setSpots((prev) => prev.filter((s) => s.id !== spotId));
  }

  if (loading) {
    return (
      <AdminPage narrow>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (error || !data) {
    return (
      <AdminPage narrow>
        <EmptyState title={error ?? "加载失败"} action={<Link href={`/dashboard/life-agents/${id}`} className="btn-primary">返回工作台</Link>} />
      </AdminPage>
    );
  }

  return (
    <AdminPage narrow>
      <PageHeader
        title="盲区问题"
        description="用户问过、但 Agent 缺少相关经验的问题。补充后会明显提升回答质量。"
      />

      <div className="mb-5">
        <StatStrip
          columns={2}
          items={[
            { label: "待处理", value: spots.length, sub: "个", tone: spots.length > 0 ? "danger" : "olive" },
            { label: "资料 Topic", value: data.profile.topicSummaries?.length ?? data.stats.topicCount ?? 0, sub: "个" },
          ]}
        />
      </div>

      {spots.length === 0 ? (
        <EmptyState
          title="暂无盲区问题"
          description="说明当前 Agent 的经验覆盖比较完整。继续保持更新，新的盲区会自动出现在这里。"
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-hairline/60">
            {spots.map((spot) => (
              <li key={spot.id} className="px-4 py-5 sm:px-5">
                <p className="text-[15px] font-medium leading-7 text-ink">“{spot.userQuestion}”</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge tone="signal">置信度 {spot.confidence || "low"}</StatusBadge>
                  {spot.route ? <StatusBadge>{spot.route}</StatusBadge> : null}
                  <span className="text-xs text-ink-300">{new Date(spot.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/life-agents/${id}/co-edit`} className="btn-primary !min-h-10">
                    去补充经验
                  </Link>
                  <button type="button" onClick={() => void resolveSpot(spot.id)} className="btn-secondary !min-h-10">
                    标记已解决
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </AdminPage>
  );
}
