"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

type AgentDetail = {
  id: string;
  name: string;
  description: string | null;
  baseUrl: string;
  useTunnel?: boolean;
  supportedScopes: string[];
  pricingConfig: { model?: string; price?: number } | null;
  status: string;
  riskLevel: string | null;
  seller: { id: string; name: string | null; email: string };
};

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [agent, setAgent] = useState<AgentDetail | null>(null);

  useEffect(() => {
    fetch(`/api/agents/${id}`)
      .then((r) => r.json())
      .then(setAgent)
      .catch(() => setAgent(null));
  }, [id]);

  if (!agent)
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20">
        <div className="h-8 w-48 rounded-xl glass-card animate-pulse" />
        <div className="mt-6 h-40 rounded-2xl glass-card animate-pulse" />
      </motion.div>
    );

  const price = (agent.pricingConfig as { price?: number })?.price ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Link href="/agents" className="text-slate-500 hover:text-cyan-400 text-sm mb-6 inline-block">
        ← 返回 Agents
      </Link>
      <h1 className="text-3xl font-bold text-slate-100">{agent.name}</h1>
      <div className="flex flex-wrap gap-2 mt-4">
        {agent.supportedScopes.map((s) => (
          <span
            key={s}
            className="px-3 py-1.5 rounded-xl text-sm font-medium border border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
          >
            {s}
          </span>
        ))}
      </div>
      <p className="mt-4 text-slate-500 text-sm">
        卖方: {agent.seller.name || agent.seller.email} · 状态: <span className="capitalize">{agent.status}</span>
        {agent.useTunnel && (
          <span className="ml-2 px-2 py-0.5 rounded text-amber-400/90 bg-amber-500/10 text-xs">平台隧道</span>
        )}
      </p>
      {agent.useTunnel && (
        <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm">
          <p className="text-amber-200 font-medium mb-2">隧道 Agent · 免 ngrok</p>
          <p className="text-slate-400 text-xs mb-2">
            卖方需运行 tunnel-client 将本地 Agent 接入平台，买方通过平台隧道调用。
          </p>
          <code className="block text-xs text-slate-300 font-mono bg-black/30 p-2 rounded truncate">
            node scripts/tunnel-client.mjs (AGENT_ID={agent.id})
          </code>
        </div>
      )}
      <Link href={`/agents/${id}/purchase`} className="mt-6 inline-block">
        <motion.span
          className="btn-primary inline-flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          购买 License
          <span className="text-xs opacity-80">获得调用许可后持 Token 直接调用</span>
        </motion.span>
      </Link>
      {agent.description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 p-6 rounded-2xl glass-card"
        >
          <h3 className="font-semibold text-slate-300 mb-3">描述</h3>
          <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{agent.description}</p>
        </motion.div>
      )}
      <div className="mt-6 p-6 rounded-2xl glass-card">
        <h3 className="font-semibold text-slate-300 mb-2">API 地址</h3>
        <code className="text-cyan-400 text-sm break-all">{agent.baseUrl}</code>
        {price > 0 && (
          <p className="mt-2 text-slate-500 text-sm">定价: ${(price / 100).toFixed(2)} / 次</p>
        )}
      </div>
    </motion.div>
  );
}
