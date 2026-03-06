"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type License = {
  id: string;
  agentId: string;
  scope: string | null;
  quotaTotal: number;
  quotaUsed: number;
  expiresAt: string;
  status: string;
  agent: { id: string; name: string; baseUrl: string };
};

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
    fetch("/api/licenses?buyer=me")
      .then((r) => r.json())
      .then((data) => {
        setLicenses(data);
        setLoading(false);
      })
      .catch(() => {
        setLicenses([]);
        setLoading(false);
      });
  }, []);

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-8">
          我的 License
        </h1>
        <div className="p-8 rounded-2xl glass-card text-center">
          <p className="text-slate-400 mb-4">请先登录</p>
          <Link href="/login" className="btn-primary inline-block">
            登录
          </Link>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          我的 License
        </h1>
        <Link href="/agents" className="text-cyan-400 hover:text-cyan-300 text-sm">
          浏览 Agents →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
      ) : licenses.length === 0 ? (
        <div className="p-12 rounded-2xl glass-card text-center">
          <p className="text-slate-500 mb-4">暂无 License</p>
          <Link href="/agents" className="btn-primary inline-block">
            去购买
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {licenses.map((lic) => (
            <motion.div
              key={lic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl glass-card"
            >
              <h3 className="font-semibold text-slate-100">{lic.agent.name}</h3>
              <p className="text-slate-500 text-sm mt-1">
                {lic.quotaUsed} / {lic.quotaTotal} 次
                {lic.scope && <> · {lic.scope}</>}
              </p>
              <p className="text-slate-600 text-xs mt-2">
                过期: {new Date(lic.expiresAt).toLocaleDateString()} · {lic.status}
              </p>
              <Link
                href={`/licenses/${lic.id}`}
                className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 text-sm"
              >
                查看详情 / 调用 →
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
