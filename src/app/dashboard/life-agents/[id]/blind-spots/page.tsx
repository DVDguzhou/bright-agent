"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchManageData, type ManageData } from "@/app/dashboard/life-agents/_lib/manage";
import { SEVERITY_BADGE } from "@/lib/severity-style";

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
    ]).then(([manage, blindData]) => {
      if (manage.data) setData(manage.data);
      if (blindData?.blindSpots) setSpots(blindData.blindSpots);
      if (manage.error) setError(manage.error);
      setLoading(false);
    });
  }, [id]);

  async function resolveSpot(spotId: string) {
    await fetch(`/api/life-agents/${id}/blind-spots/${spotId}/resolve`, {
      method: "POST",
      credentials: "include",
    });
    setSpots((prev) => prev.filter((s) => s.id !== spotId));
  }

  if (loading) {
    return <div className="mx-auto h-56 max-w-3xl animate-pulse bg-paper-100/60" />;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-oxblood-500">{error ?? "加载失败"}</p>
        <Link
          href={`/dashboard/life-agents/${id}`}
          className="mt-6 inline-flex rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper"
        >
          返回工作台
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl divide-y divide-hairline/30 max-lg:-mx-4 max-lg:px-4 max-lg:pb-24">
      <section className="pb-4 pt-3">
        <Link href={`/dashboard/life-agents/${id}`} className="text-sm font-medium text-ink-400 transition hover:text-ink">
          ← 返回工作台
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-ink">盲区问题</h1>
        <p className="mt-1 text-sm text-ink-400">
          以下问题用户问了但你的 Agent 缺少相关经验，补充后可以显著提升回答质量。
        </p>
      </section>

      <section className="py-4">
        {spots.length === 0 ? (
          <div className="bg-olive-400/10 py-12 text-center">
            <p className="text-lg font-semibold text-olive-600">暂无盲区问题</p>
            <p className="mt-1 text-sm text-olive-600">说明你的 Agent 经验覆盖比较全面，继续保持！</p>
          </div>
        ) : (
          <ul className="divide-y divide-hairline/30">
            {spots.map((spot) => (
              <li key={spot.id} className="py-6 first:pt-0">
                <p className="text-[15px] font-medium leading-relaxed text-ink">&ldquo;{spot.userQuestion}&rdquo;</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_BADGE.medium}`}>
                    置信度低
                  </span>
                  <span className="text-xs text-ink-300">
                    {new Date(spot.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/dashboard/life-agents/${id}/co-edit`}
                    className="rounded border border-hairline px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-ink hover:text-ink"
                  >
                    去补充经验
                  </Link>
                  <button
                    type="button"
                    onClick={() => resolveSpot(spot.id)}
                    className="rounded px-3 py-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-ink"
                  >
                    已解决
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
