"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { VerificationBadge } from "@/components/VerificationBadge";
import { OFFICIAL_CONTACT } from "@/lib/official-contact";
import { useAuth } from "@/contexts/AuthContext";

type LifeAgentPurchased = {
  id: string;
  displayName: string;
  headline: string;
  pricePerQuestion: number;
  remainingQuestions: number;
  verificationStatus?: string;
};

export default function LicensesPage() {
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
      .catch(() => {
        setLifeAgentPacks([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-8">
          我的人生 Agent 提问包
        </h1>
        <div className="p-8 rounded-2xl glass-card text-center">
          <p className="text-slate-400 mb-4">{authLoading ? "加载中..." : "请先登录"}</p>
          {!authLoading && (
            <Link href="/login" className="btn-primary inline-block">
              登录
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          我的人生 Agent 提问包
        </h1>
        <div className="flex flex-wrap gap-4 items-center">
          <a
            href={`mailto:${OFFICIAL_CONTACT.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-sky-500/50 bg-sky-500/10 px-4 py-2 text-sm text-sky-400 hover:bg-sky-500/20 transition-colors"
          >
            联系官方
          </a>
          <Link href="/life-agents" className="text-cyan-400 hover:text-cyan-300 text-sm">
            人生 Agent →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
      ) : lifeAgentPacks.length === 0 ? (
        <div className="p-12 rounded-2xl glass-card text-center">
          <p className="text-slate-500 mb-4">暂无人生 Agent 提问包</p>
          <Link href="/life-agents" className="btn-primary inline-block">
            去购买人生 Agent
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-4">人生 Agent 提问包</h2>
            <p className="text-sm text-slate-500 mb-4">你购买的人生 Agent 咨询额度，创作者认证后可显示认证标识</p>
            <div className="grid gap-6 md:grid-cols-2">
              {lifeAgentPacks.map((la: LifeAgentPurchased) => (
                <motion.div
                  key={la.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl glass-card"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100">{la.displayName}</h3>
                    <VerificationBadge status={la.verificationStatus ?? "none"} size="sm" />
                  </div>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-1">{la.headline}</p>
                  <p className="text-slate-600 text-sm mt-2">
                    剩余 {la.remainingQuestions} 次提问
                  </p>
                  <Link
                    href={`/life-agents/${la.id}`}
                    className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    进入聊天 →
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      )}
    </motion.div>
  );
}
