"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchManageData, type ManageData } from "@/app/dashboard/life-agents/_lib/manage";

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
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-400">加载中…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-red-500">{error ?? "加载失败"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link href={`/dashboard/life-agents/${id}`} className="text-sm text-sky-600 hover:underline">
          ← 返回管理台
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#111]">盲区问题</h1>
        <p className="mt-1 text-sm text-slate-500">
          以下问题用户问了但你的 Agent 缺少相关经验，补充后可以显著提升回答质量。
        </p>
      </div>

      {spots.length === 0 ? (
        <div className="rounded-2xl bg-emerald-50 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-emerald-800">暂无盲区问题</p>
          <p className="mt-1 text-sm text-emerald-600">说明你的 Agent 经验覆盖比较全面，继续保持！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {spots.map((spot) => (
            <div key={spot.id} className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/[0.06]">
              <p className="text-[15px] font-medium text-[#111] leading-relaxed">"{spot.userQuestion}"</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  置信度低
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(spot.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/dashboard/life-agents/${id}/co-edit`}
                  className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors"
                >
                  去补充经验
                </Link>
                <button
                  onClick={() => resolveSpot(spot.id)}
                  className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  已解决
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
