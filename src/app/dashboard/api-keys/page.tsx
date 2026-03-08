"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type ApiKey = { id: string; keyPrefix: string; name: string | null; createdAt: string };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetch("/api/user-api-keys", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setKeys(Array.isArray(data) ? data : []))
      .catch(() => setKeys([]));
  };

  useEffect(load, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/user-api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: name || "API Key" }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setNewKey({ key: data.key, name: data.name });
      setName("");
      load();
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("确定吊销此 Key？")) return;
    await fetch(`/api/user-api-keys/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
      <Link href="/dashboard" className="text-slate-500 hover:text-cyan-400 text-sm mb-6 inline-block">
        ← 返回控制台
      </Link>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
        平台 API Key
      </h1>
      <p className="text-slate-500 mb-8">
        用于方法二：持 Key 调用平台 API 直接 invoke Agent，等效登录态
      </p>
      <div className="p-6 rounded-2xl glass-card mb-8">
        <h3 className="font-semibold text-slate-300 mb-4">创建 Key</h3>
        <form onSubmit={create} className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Key 名称（可选）"
            className="input-glow flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10"
          />
          <button type="submit" disabled={loading} className="btn-primary px-6 py-2 disabled:opacity-50">
            {loading ? "创建中" : "创建"}
          </button>
        </form>
      </div>
      {newKey && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-8"
        >
          <p className="text-emerald-400 font-medium mb-2">✓ 已创建，请妥善保存（仅显示一次）</p>
          <code className="block p-3 rounded-lg bg-black/30 text-sm break-all font-mono">
            {newKey.key}
          </code>
          <button
            onClick={() => setNewKey(null)}
            className="mt-4 text-slate-400 hover:text-white text-sm"
          >
            已保存，关闭
          </button>
        </motion.div>
      )}
      <div className="p-6 rounded-2xl glass-card">
        <h3 className="font-semibold text-slate-300 mb-4">已有 Key</h3>
        {keys.length === 0 ? (
          <p className="text-slate-500">暂无</p>
        ) : (
          <ul className="space-y-3">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/5"
              >
                <span className="font-mono text-slate-400">{k.keyPrefix}</span>
                <span className="text-slate-500 text-sm">{k.name || "未命名"}</span>
                <button
                  onClick={() => revoke(k.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  吊销
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-6 text-slate-500 text-sm">
        完整文档见 <code className="text-cyan-400">docs/API_DOCS.md</code>
      </p>
      <div className="mt-4 p-6 rounded-2xl glass-card text-sm text-slate-400">
        <h3 className="font-semibold text-slate-300 mb-2">调用示例</h3>
        <pre className="overflow-x-auto text-xs">
{`curl -X POST "https://your-domain/api/agents/{agent_id}/invoke" \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"任务标题","budget":5000}'`}
        </pre>
      </div>
    </motion.div>
  );
}
