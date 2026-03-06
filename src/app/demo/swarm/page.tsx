"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const WEB_ANALYZER = { agentId: "00000000-0000-0000-0000-000000000002", licenseId: "00000000-0000-0000-0000-000000000002" };
const REPORT_BUILDER = { agentId: "00000000-0000-0000-0000-000000000003", licenseId: "00000000-0000-0000-0000-000000000003" };

export default function SwarmDemoPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [urls, setUrls] = useState("https://example.com\nhttps://github.com\nhttps://nodejs.org");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ count?: number; aggregated?: { report_md?: string }; results?: unknown[] } | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser);
  }, []);

  const runSwarm = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setElapsed(null);

    const urlList = urls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));

    if (urlList.length === 0) {
      setError("请输入至少一个有效 URL");
      setLoading(false);
      return;
    }

    const start = Date.now();
    try {
      const body = {
        tasks: urlList.map((url) => ({
          agentId: WEB_ANALYZER.agentId,
          licenseId: WEB_ANALYZER.licenseId,
          scope: "data.fetch",
          input: { url },
        })),
        aggregator: {
          agentId: REPORT_BUILDER.agentId,
          licenseId: REPORT_BUILDER.licenseId,
          scope: "content.generate",
          transform: "web_analyzer_to_report",
        },
      };

      const res = await fetch("/api/invocations/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setElapsed(Date.now() - start);

      if (!res.ok) throw new Error(data.error || "Swarm 失败");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Agent Swarm Demo</h1>
        <p className="text-slate-500 mb-4">请先登录（需持有 Web Analyzer 与 Report Builder 的 License）</p>
        <Link href="/login" className="btn-primary inline-block">
          登录
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
        Agent Swarm
      </h1>
      <p className="text-slate-500 mb-6">
        并行调用多个 Agent（fan-out），再聚合（fan-in）。比串行快很多。
      </p>

      <div className="p-6 rounded-2xl glass-card mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">URL 列表（每行一个，并行分析）</label>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 min-h-[120px] font-mono text-sm"
          placeholder="https://example.com&#10;https://github.com"
        />
        <button
          onClick={runSwarm}
          disabled={loading}
          className="mt-4 btn-primary px-6 py-2 disabled:opacity-50"
        >
          {loading ? "Swarm 执行中..." : "开始 Swarm"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">{error}</div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {elapsed != null && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 font-medium">并行完成</span> · 耗时 {elapsed} ms · {result.count} 个任务
            </div>
          )}
          {result.aggregated?.report_md && (
            <div className="p-6 rounded-2xl glass-card">
              <h3 className="font-semibold text-slate-300 mb-4">聚合报告（Report Builder）</h3>
              <pre className="whitespace-pre-wrap text-slate-400 text-sm font-sans">
                {result.aggregated.report_md}
              </pre>
            </div>
          )}
          {result.results && !result.aggregated?.report_md && (
            <div className="p-6 rounded-2xl glass-card">
              <h3 className="font-semibold text-slate-300 mb-2">并行结果</h3>
              <pre className="whitespace-pre-wrap text-slate-400 text-xs font-mono overflow-x-auto">
                {JSON.stringify(result.results, null, 2)}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
