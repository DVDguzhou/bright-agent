"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const PIPELINE = [
  { name: "Script", agentId: "00000000-0000-0000-0000-000000000005", licenseId: "00000000-0000-0000-0000-000000000005", scope: "content.generate" },
  { name: "Asset", agentId: "00000000-0000-0000-0000-000000000006", licenseId: "00000000-0000-0000-0000-000000000006", scope: "content.generate" },
  { name: "Render", agentId: "00000000-0000-0000-0000-000000000007", licenseId: "00000000-0000-0000-0000-000000000007", scope: "resource.proxy" },
  { name: "Compliance", agentId: "00000000-0000-0000-0000-000000000008", licenseId: "00000000-0000-0000-0000-000000000008", scope: "permission.access" },
];

function sha256Hex(str: string) {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(str))
    .then((b) => Array.from(new Uint8Array(b))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join(""));
}

async function issueToken(licenseId: string, agentId: string, scope: string, inputHash: string) {
  const res = await fetch("/api/invocations/issue-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ licenseId, agentId, scope, inputHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "申请 Token 失败");
  return data;
}

async function invokeAgent(
  baseUrl: string,
  requestId: string,
  licenseId: string,
  agentId: string,
  scope: string,
  input: unknown,
  inputHash: string,
  invocationToken: string
) {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id: requestId,
      license_id: licenseId,
      agent_id: agentId,
      scope,
      input,
      input_hash: inputHash,
      invocation_token: invocationToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "调用失败");
  return data;
}

type PipelineResult = {
  script?: unknown;
  assets?: unknown[];
  video?: { video_url?: string; render_time_ms?: number };
  compliance?: { passed?: boolean; report?: string };
};

export default function VideoPipelineDemoPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [brief, setBrief] = useState("产品宣传片 30 秒");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<PipelineResult | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser);
  }, []);

  const runPipeline = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    let input: unknown = { brief };
    const pipelineResult: PipelineResult = {};

    try {
      for (let i = 0; i < PIPELINE.length; i++) {
        const s = PIPELINE[i];
        setStep(`[${i + 1}/4] ${s.name} Agent...`);
        const inputHash = await sha256Hex(JSON.stringify(input));
        const tokenResp = await issueToken(s.licenseId, s.agentId, s.scope, inputHash);
        const res = await invokeAgent(
          tokenResp.agent_base_url,
          tokenResp.request_id,
          s.licenseId,
          s.agentId,
          s.scope,
          input,
          inputHash,
          tokenResp.invocation_token
        );
        if (s.name === "Script") {
          pipelineResult.script = res.result?.script;
          input = { script: res.result?.script };
        } else if (s.name === "Asset") {
          pipelineResult.assets = res.result?.assets;
          input = { script: pipelineResult.script, assets: res.result?.assets };
        } else if (s.name === "Render") {
          pipelineResult.video = res.result;
          input = { video_url: res.result?.video_url };
        } else {
          pipelineResult.compliance = res.result;
        }
      }
      setResult(pipelineResult);
      setStep("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">视频流水线 Demo</h1>
        <p className="text-slate-500 mb-4">请先登录（需持有视频流水线各 Agent 的 License，种子数据已预置）</p>
        <Link href="/login" className="btn-primary inline-block">
          登录
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
        视频流水线 Demo
      </h1>
      <p className="text-slate-500 mb-6">
        Script → Asset → Render（模拟 3s 重算力）→ Compliance。详见 docs/SCENARIO_VIDEO_PIPELINE.md
      </p>

      <div className="p-6 rounded-2xl glass-card mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">创作 Brief</label>
        <input
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
          placeholder="产品宣传片 30 秒"
        />
        <button
          onClick={runPipeline}
          disabled={loading}
          className="mt-4 btn-primary px-6 py-2 disabled:opacity-50"
        >
          {loading ? step || "运行中..." : "开始流水线"}
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
          {typeof result.script !== "undefined" && (
            <div className="p-6 rounded-2xl glass-card">
              <h3 className="font-semibold text-slate-300 mb-2">Script</h3>
              <pre className="whitespace-pre-wrap text-slate-400 text-sm font-mono">
                {JSON.stringify(result.script, null, 2)}
              </pre>
            </div>
          )}
          {result.assets && (
            <div className="p-6 rounded-2xl glass-card">
              <h3 className="font-semibold text-slate-300 mb-2">Assets</h3>
              <p className="text-slate-400 text-sm">{result.assets.length} 个素材</p>
              <pre className="whitespace-pre-wrap text-slate-400 text-xs font-mono mt-2">
                {JSON.stringify(result.assets, null, 2)}
              </pre>
            </div>
          )}
          {result.video && (
            <div className="p-6 rounded-2xl glass-card border border-violet-500/20">
              <h3 className="font-semibold text-violet-400 mb-2">Render（重算力）</h3>
              <p className="text-slate-300">Video URL: {result.video.video_url}</p>
              <p className="text-slate-500 text-sm mt-1">
                模拟渲染耗时: {result.video.render_time_ms}ms
              </p>
            </div>
          )}
          {result.compliance && (
            <div className="p-6 rounded-2xl glass-card">
              <h3 className="font-semibold text-slate-300 mb-2">Compliance</h3>
              <p className="text-emerald-400 mb-2">
                {result.compliance.passed ? "✅ 通过" : "❌ 未通过"}
              </p>
              {result.compliance.report && (
                <pre className="whitespace-pre-wrap text-slate-400 text-sm">{result.compliance.report}</pre>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
