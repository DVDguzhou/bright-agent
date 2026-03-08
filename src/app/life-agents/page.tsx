"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type LifeAgentListItem = {
  id: string;
  displayName: string;
  headline: string;
  shortBio: string;
  audience: string;
  welcomeMessage: string;
  pricePerQuestion: number;
  expertiseTags: string[];
  sampleQuestions: string[];
  knowledgeCount: number;
  soldQuestionPacks: number;
  sessionCount: number;
  creator: {
    name: string | null;
    email: string;
  };
};

export default function LifeAgentsPage() {
  const [profiles, setProfiles] = useState<LifeAgentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/life-agents")
      .then((res) => res.json())
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
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            人生经验展示面 + GPT 式聊天 + 按次咨询
          </p>
          <h1 className="section-title">找到真正有经历的人生 Agent</h1>
          <p className="section-subtitle mt-4">
            创作者把自己的经验整理成知识库，用户先看背景和擅长领域，再决定是否购买提问次数进入聊天。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/life-agents/create" className="btn-primary">
              创建我的 Agent
            </Link>
            <Link href="/signup" className="btn-secondary">
              注册后开始使用
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">推荐 Agent</h2>
            <p className="mt-1 text-sm text-slate-500">适合大学生、职场新人、转行人群和普通用户。</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            {loading ? "加载中..." : `${profiles.length} 位创作者`}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-medium text-slate-900">还没有人生 Agent</p>
            <p className="mt-2 text-slate-500">你可以成为第一个分享经验并提供咨询的人。</p>
            <Link href="/life-agents/create" className="btn-primary mt-6 inline-flex">
              去创建
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/life-agents/${profile.id}`} className="block h-full">
                  <div className="glass-card h-full p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-lg font-semibold text-blue-700">
                            {profile.displayName.slice(0, 1)}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">{profile.displayName}</h3>
                            <p className="text-sm text-slate-500">{profile.headline}</p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{profile.shortBio}</p>
                      </div>
                      <div className="rounded-2xl bg-sky-50 px-4 py-3 text-right">
                        <p className="text-xs text-slate-500">每次提问</p>
                        <p className="text-lg font-semibold text-sky-700">
                          ¥{(profile.pricePerQuestion / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {profile.expertiseTags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">知识条目</p>
                        <p className="mt-1 font-semibold text-slate-900">{profile.knowledgeCount}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">已购次数包</p>
                        <p className="mt-1 font-semibold text-slate-900">{profile.soldQuestionPacks}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">聊天会话</p>
                        <p className="mt-1 font-semibold text-slate-900">{profile.sessionCount}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                      <p className="text-sm font-medium text-slate-900">适合询问</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{profile.audience}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
