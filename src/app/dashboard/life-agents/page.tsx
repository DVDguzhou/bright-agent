"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type ProfileItem = {
  id: string;
  displayName: string;
  headline: string;
  shortBio: string;
  pricePerQuestion: number;
  published: boolean;
  knowledgeCount: number;
  sessionCount: number;
  soldPacks: number;
  totalRevenue: number;
};

export default function LifeAgentsManagePage() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/life-agents/mine")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setProfiles(data);
        setLoading(false);
      })
      .catch(() => {
        setProfiles([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-sky-700">
          ← 返回控制台
        </Link>
        <h1 className="section-title mt-3">我的人生 Agent</h1>
        <p className="section-subtitle mt-2">
          管理你的 Agent 资料、查看销量与聊天数据
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/life-agents/create" className="btn-primary">
            新建 Agent
          </Link>
          <Link href="/life-agents" className="btn-secondary">
            浏览全部
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-white shadow-sm" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-900">还没有人生 Agent</p>
          <p className="mt-2 text-slate-600">创建第一个，开始分享你的经验并接受咨询。</p>
          <Link href="/life-agents/create" className="btn-primary mt-6 inline-flex">
            去创建
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/dashboard/life-agents/${profile.id}`} className="block h-full">
                <div className="glass-card h-full p-6 hover:border-sky-300/80">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{profile.displayName}</h3>
                      <p className="mt-1 text-sm text-slate-600">{profile.headline}</p>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-500">{profile.shortBio}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        profile.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {profile.published ? "已发布" : "未发布"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">知识条目</p>
                      <p className="mt-1 font-semibold text-slate-900">{profile.knowledgeCount}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">聊天会话</p>
                      <p className="mt-1 font-semibold text-slate-900">{profile.sessionCount}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">售出次数包</p>
                      <p className="mt-1 font-semibold text-slate-900">{profile.soldPacks}</p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-3">
                      <p className="text-slate-500">累计收入</p>
                      <p className="mt-1 font-semibold text-sky-700">
                        ¥{((profile.totalRevenue ?? 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      ¥{(profile.pricePerQuestion / 100).toFixed(2)} / 次
                    </span>
                    <span className="text-sm text-sky-600 group-hover:text-sky-700">编辑详情 →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
