"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const scopeOptions = ["content.generate", "data.fetch", "resource.proxy", "permission.access"];

export default function CreateAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:3333/invoke");
  const [useTunnel, setUseTunnel] = useState(false);
  const [scopes, setScopes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleScope = (s: string) => {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (scopes.length === 0) {
      setError("至少选择一种 scope");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
        baseUrl: baseUrl.trim(),
        useTunnel,
        supportedScopes: scopes,
        pricingConfig: { model: "per_call", price: 10 },
        riskLevel: "low",
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "创建失败");
      return;
    }
    router.push(`/agents/${data.id}`);
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl"
    >
      <Link href="/agents" className="text-slate-500 hover:text-sky-700 text-sm mb-6 inline-block">
        ← 返回 Agents
      </Link>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent mb-2">
        注册 Agent
      </h1>
      <p className="text-slate-500 mb-8">填写 Agent API 地址与能力范围，平台审核后上架</p>
      <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">名称 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-shell"
            placeholder="Agent 名称"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-shell min-h-[100px] resize-none"
            placeholder="详细描述你的 Agent 能力..."
          />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={useTunnel}
              onChange={(e) => setUseTunnel(e.target.checked)}
              className="rounded border-slate-300 bg-white"
            />
            使用平台隧道（免 ngrok，本地 Agent 通过轮询接入）
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">API 地址 (baseUrl) *</label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="input-shell"
            placeholder={useTunnel ? "http://localhost:3333/invoke" : "https://your-agent.com/invoke"}
            required
          />
          <p className="text-slate-500 text-xs mt-1">
            {useTunnel
              ? "本地 Agent 地址，tunnel-client 将转发请求到此。无需公网可达。"
              : "买方将直接 POST 到此端点，需公网可达（或 ngrok）"}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">支持的 Scope *（至少一种）</label>
          <div className="flex flex-wrap gap-2">
            {scopeOptions.map((s) => (
              <motion.button
                key={s}
                type="button"
                onClick={() => toggleScope(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  scopes.includes(s)
                    ? "border-sky-300 text-sky-700 bg-sky-50"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <motion.button
          type="submit"
          disabled={loading}
          className="btn-primary px-8 py-3 disabled:opacity-50"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? "创建中..." : "注册 Agent"}
        </motion.button>
      </form>
    </motion.div>
  );
}
