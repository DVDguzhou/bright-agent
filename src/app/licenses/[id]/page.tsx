"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function LicenseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [license, setLicense] = useState<License | null>(null);

  useEffect(() => {
    fetch("/api/licenses", { credentials: "include" })
      .then((r) => r.json())
      .then((list: License[] | { error?: string }) => {
        const arr = Array.isArray(list) ? list : [];
        return arr.find((l: License) => l.id === id) ?? null;
      })
      .then(setLicense)
      .catch(() => setLicense(null));
  }, [id]);

  if (!license) {
    return (
      <div className="py-20">
        <div className="h-8 w-48 rounded-xl glass-card animate-pulse" />
        <p className="mt-4 text-slate-500">License 不存在或无权访问</p>
        <Link href="/licenses" className="mt-4 inline-block text-cyan-400 hover:text-cyan-300">
          ← 返回
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Link href="/licenses" className="text-slate-500 hover:text-cyan-400 text-sm mb-6 inline-block">
        ← 我的 License
      </Link>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">
        {license.agent.name}
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        {license.quotaUsed} / {license.quotaTotal} 次 · 过期: {new Date(license.expiresAt).toLocaleDateString()} · {license.status}
      </p>
      <div className="p-6 rounded-2xl glass-card space-y-4">
        <h3 className="font-semibold text-slate-300">如何调用</h3>
        <p className="text-slate-400 text-sm">
          使用平台 API 申请 InvocationToken，然后直接 POST 到 Agent 的 baseUrl。详见{" "}
          <code className="text-cyan-400">scripts/local-invoke-example.mjs</code>
        </p>
        <pre className="p-4 rounded-xl bg-black/30 text-xs text-slate-400 overflow-x-auto">
{`# 设置环境变量
$env:PLATFORM_URL="http://localhost:3001"
$env:PLATFORM_API_KEY="你的API Key"
$env:LICENSE_ID="${license.id}"
$env:AGENT_ID="${license.agentId}"

# 运行脚本
node scripts/local-invoke-example.mjs`}
        </pre>
      </div>
    </motion.div>
  );
}
