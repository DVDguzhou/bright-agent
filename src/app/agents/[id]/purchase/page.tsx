"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

type Agent = { id: string; name: string; baseUrl: string };

export default function PurchaseLicensePage() {
  const params = useParams();
  const id = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [quota, setQuota] = useState(10);
  const [scope, setScope] = useState("content.generate");
  const [loading, setLoading] = useState(false);
  const [license, setLicense] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/agents/${id}`, { credentials: "include" })
      .then((r) => r.json().then((d) => (r.ok && d?.id ? d : null)))
      .then(setAgent)
      .catch(() => setAgent(null));
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, [id]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("请先登录");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId: id,
          scope: scope || undefined,
          quotaTotal: quota,
          expiresInDays: 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "购买失败");
        return;
      }
      setLicense(data);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  if (!agent) {
    return (
      <div className="py-20">
        <div className="h-8 w-48 rounded-xl glass-card animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link href="/agents" className="text-slate-500 hover:text-sky-700 text-sm mb-6 inline-block">
          ← 返回
        </Link>
        <div className="p-8 rounded-2xl glass-card text-center">
          <p className="text-slate-600 mb-4">请先登录后再购买 License</p>
          <Link href="/login" className="btn-primary inline-block">
            登录
          </Link>
        </div>
      </motion.div>
    );
  }

  if (license) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="p-8 rounded-2xl glass-card text-center max-w-md mx-auto">
          <p className="text-emerald-600 text-lg font-semibold mb-2">购买成功</p>
          <p className="text-slate-600 text-sm mb-4">License ID: {license.id}</p>
          <Link href="/licenses" className="btn-primary inline-block">
            查看我的 License
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Link href={`/agents/${id}`} className="text-slate-500 hover:text-sky-700 text-sm mb-6 inline-block">
        ← 返回 {agent.name}
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">购买 License · {agent.name}</h1>
      <form onSubmit={handlePurchase} className="max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-slate-700 text-sm mb-2">调用次数 (quota)</label>
          <input
            type="number"
            min={1}
            value={quota}
            onChange={(e) => setQuota(parseInt(e.target.value, 10) || 1)}
            className="input-shell"
          />
        </div>
        <div>
          <label className="block text-slate-700 text-sm mb-2">Scope（可选）</label>
          <input
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="content.generate"
            className="input-shell"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
          {loading ? "处理中..." : "购买"}
        </button>
      </form>
    </motion.div>
  );
}
