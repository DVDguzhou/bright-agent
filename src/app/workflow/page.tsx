"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const WEB_ANALYZER = {
  agentId: "00000000-0000-0000-0000-000000000002",
  licenseId: "00000000-0000-0000-0000-000000000002",
};
const REPORT_BUILDER = {
  agentId: "00000000-0000-0000-0000-000000000003",
  licenseId: "00000000-0000-0000-0000-000000000003",
};
const ORCHESTRATOR = {
  agentId: "00000000-0000-0000-0000-000000000004",
  licenseId: "00000000-0000-0000-0000-000000000004",
};

type SessionUser = { id: string } | null;

type IssuedToken = {
  request_id: string;
  invocation_token: string;
  agent_base_url: string;
};

type InvokeResponse = {
  result?: {
    report_md?: string;
    analysis?: {
      title?: string;
      description?: string;
      headings?: string[];
      links?: string[];
      wordCount?: number;
    };
  };
};

type AnalysisItem = {
  url: string;
  title?: string;
  description?: string;
  headings?: string[];
  links?: string[];
  wordCount?: number;
};

function sha256Hex(str: string) {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(str))
    .then((b) => Array.from(new Uint8Array(b))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join(""));
}

async function issueToken(licenseId: string, agentId: string, scope: string, inputHash: string): Promise<IssuedToken> {
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
): Promise<InvokeResponse> {
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

export default function WorkflowPage() {
  const [user, setUser] = useState<SessionUser>(null);
  const [urls, setUrls] = useState("https://example.com\nhttps://github.com");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const [useOrchestrator, setUseOrchestrator] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser);
  }, []);

  const runWorkflow = async () => {
    setLoading(true);
    setError("");
    setReport("");
    const urlList = urls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));
    if (urlList.length === 0) {
      setError("请输入至少一个有效 URL");
      setLoading(false);
      return;
    }

    try {
      if (useOrchestrator) {
        setStep("调用小红的编排 Agent...");
        const input = { urls: urlList, topic: "竞品" };
        const inputHash = await sha256Hex(JSON.stringify(input));
        const tokenResp = await issueToken(
          ORCHESTRATOR.licenseId,
          ORCHESTRATOR.agentId,
          "content.generate",
          inputHash
        );
        const finalResult = await invokeAgent(
          tokenResp.agent_base_url,
          tokenResp.request_id,
          ORCHESTRATOR.licenseId,
          ORCHESTRATOR.agentId,
          "content.generate",
          input,
          inputHash,
          tokenResp.invocation_token
        );
        setReport(finalResult.result?.report_md || "");
      } else {
        const analyses: AnalysisItem[] = [];
        for (let i = 0; i < urlList.length; i++) {
          setStep(`分析 ${i + 1}/${urlList.length}: ${urlList[i]}`);
          const input = { url: urlList[i] };
          const inputHash = await sha256Hex(JSON.stringify(input));
          const tokenResp = await issueToken(
            WEB_ANALYZER.licenseId,
            WEB_ANALYZER.agentId,
            "data.fetch",
            inputHash
          );
          const result = await invokeAgent(
            tokenResp.agent_base_url,
            tokenResp.request_id,
            WEB_ANALYZER.licenseId,
            WEB_ANALYZER.agentId,
            "data.fetch",
            input,
            inputHash,
            tokenResp.invocation_token
          );
          analyses.push({
            url: urlList[i],
            title: result.result?.analysis?.title,
            description: result.result?.analysis?.description,
            headings: result.result?.analysis?.headings,
            links: result.result?.analysis?.links,
            wordCount: result.result?.analysis?.wordCount,
          });
        }

        setStep("合成报告中...");
        const input = { analyses, topic: "竞品" };
        const inputHash = await sha256Hex(JSON.stringify(input));
        const tokenResp = await issueToken(
          REPORT_BUILDER.licenseId,
          REPORT_BUILDER.agentId,
          "content.generate",
          inputHash
        );
        const finalResult = await invokeAgent(
          tokenResp.agent_base_url,
          tokenResp.request_id,
          REPORT_BUILDER.licenseId,
          REPORT_BUILDER.agentId,
          "content.generate",
          input,
          inputHash,
          tokenResp.invocation_token
        );
        setReport(finalResult.result?.report_md || "");
      }
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
        <h1 className="text-2xl font-bold text-slate-100 mb-4">竞品调研工作流</h1>
        <p className="text-slate-500 mb-4">请先登录（需持有 Web Analyzer 与 Report Builder 的 License）</p>
        <Link href="/login" className="btn-primary inline-block">登录</Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
        竞品调研工作流
      </h1>
      <p className="text-slate-500 mb-6">
        Web Analyzer × N → Report Builder：分析多个 URL，自动生成综合报告
      </p>

      <div className="p-6 rounded-2xl glass-card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={useOrchestrator}
              onChange={(e) => setUseOrchestrator(e.target.checked)}
              className="rounded border-white/20 bg-white/5"
            />
            使用小红的编排 Agent（一键完成 Web Analyzer + Report Builder）
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-400 mb-2">URL 列表（每行一个或逗号分隔）</label>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 min-h-[120px] font-mono text-sm"
          placeholder="https://example.com&#10;https://github.com"
        />
        <button
          onClick={runWorkflow}
          disabled={loading}
          className="mt-4 btn-primary px-6 py-2 disabled:opacity-50"
        >
          {loading ? step || "运行中..." : "开始调研"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
          {error}
        </div>
      )}

      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl glass-card"
        >
          <h3 className="font-semibold text-slate-300 mb-4">综合报告</h3>
          <pre className="whitespace-pre-wrap text-slate-300 text-sm font-sans">{report}</pre>
        </motion.div>
      )}
    </motion.div>
  );
}
