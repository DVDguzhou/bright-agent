"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type PlatformKey = { id: string; keyPrefix: string; name: string | null; createdAt: string };

type InvokeKey = {
  id: string;
  keyPrefix: string;
  name: string | null;
  callCount: number;
  createdAt: string;
};

type AgentApiRow = {
  profileId: string;
  displayName: string;
  published: boolean;
  pricePerQuestion: number;
  apiInvokeEnabled: boolean;
  apiPriceFollowsConsultation: boolean;
  apiPricePerCallCents: number | null;
  effectiveApiPricePerCallCents: number;
  apiTotalCalls: number;
  apiSessionCount: number;
  keys: InvokeKey[];
};

function formatYuanFromFen(fen: number) {
  return (fen / 100).toFixed(2);
}

export default function ApiKeysPage() {
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<AgentApiRow[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [platformKeys, setPlatformKeys] = useState<PlatformKey[]>([]);
  const [newPlatformKey, setNewPlatformKey] = useState<{ key: string; name: string } | null>(null);
  const [platformName, setPlatformName] = useState("");
  const [platformBusy, setPlatformBusy] = useState(false);
  const [newInvokeKey, setNewInvokeKey] = useState<{ profileId: string; key: string; name: string } | null>(null);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const [pricingSavingId, setPricingSavingId] = useState<string | null>(null);
  const [openAgentId, setOpenAgentId] = useState<string | null>(null);

  const origin = useMemo(() => (typeof window !== "undefined" ? window.location.origin : ""), []);

  const loadOverview = useCallback(() => {
    setOverviewLoading(true);
    fetch("/api/life-agents/mine/api-overview", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = data?.agents;
        setAgents(Array.isArray(list) ? list : []);
      })
      .catch(() => setAgents([]))
      .finally(() => setOverviewLoading(false));
  }, []);

  const loadPlatformKeys = useCallback(() => {
    fetch("/api/user-api-keys", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPlatformKeys(Array.isArray(data) ? data : []))
      .catch(() => setPlatformKeys([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    loadOverview();
    loadPlatformKeys();
  }, [user, loadOverview, loadPlatformKeys]);

  const patchAgent = async (profileId: string, body: Record<string, unknown>) => {
    setBusyProfileId(profileId);
    try {
      const res = await fetch(`/api/life-agents/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error || "保存失败");
        return;
      }
      loadOverview();
    } finally {
      setBusyProfileId(null);
    }
  };

  const savePricing = async (a: AgentApiRow, follow: boolean, centsStr: string) => {
    const cents = Math.max(0, Math.floor(Number(centsStr) || 0));
    setPricingSavingId(a.profileId);
    try {
      const res = await fetch(`/api/life-agents/${a.profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          follow
            ? { apiPriceFollowsConsultation: true }
            : { apiPriceFollowsConsultation: false, apiPricePerCallCents: cents },
        ),
      });
      if (!res.ok) {
        alert("收费策略保存失败");
        return;
      }
      loadOverview();
    } finally {
      setPricingSavingId(null);
    }
  };

  const createInvokeKey = async (profileId: string, name: string) => {
    setBusyProfileId(profileId);
    try {
      const res = await fetch(`/api/life-agents/${profileId}/invoke-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name || "Invoke Key" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert((data as { error?: string }).error || "创建失败");
        return;
      }
      setNewInvokeKey({ profileId, key: (data as { key: string }).key, name: (data as { name: string }).name });
      loadOverview();
    } finally {
      setBusyProfileId(null);
    }
  };

  const revokeInvokeKey = async (profileId: string, keyId: string) => {
    if (!confirm("确定吊销该调用 Key？")) return;
    setBusyProfileId(profileId);
    try {
      await fetch(`/api/life-agents/${profileId}/invoke-keys/${keyId}`, {
        method: "DELETE",
        credentials: "include",
      });
      loadOverview();
    } finally {
      setBusyProfileId(null);
    }
  };

  const createPlatformKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlatformBusy(true);
    const res = await fetch("/api/user-api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: platformName || "API Key" }),
    });
    const data = await res.json();
    setPlatformBusy(false);
    if (res.ok) {
      setNewPlatformKey({ key: data.key, name: data.name });
      setPlatformName("");
      loadPlatformKeys();
    }
  };

  const revokePlatformKey = async (id: string) => {
    if (!confirm("确定吊销此平台 Key？")) return;
    await fetch(`/api/user-api-keys/${id}`, { method: "DELETE", credentials: "include" });
    loadPlatformKeys();
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">
          {authLoading ? (
            "加载中…"
          ) : (
            <>
              请先{" "}
              <Link href="/login" className="text-sky-600 hover:text-sky-700">
                登录
              </Link>
              后管理 API Key。
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-white pb-6 max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:pb-24 lg:pb-8">
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#111]">开放 API</h1>
        <Link
          href="/life-agents"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
          aria-label="去找 Agent 聊天"
          title="去找 Agent"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </header>

      <div className="px-4 pb-3 sm:px-0">
        <p className="text-[15px] leading-relaxed text-slate-500">
          为每个人生 Agent 管理调用 Key、公示单价（分/次）与调用数据。开放调用不消耗咨询者提问包，按次记账供后续结算。
        </p>
      </div>

      <div className="space-y-4 px-4 sm:px-0">
      <section className="overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.06]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/80 via-white to-amber-50/50 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">人生 Agent 调用 Key</h2>
          <p className="mt-0.5 text-xs text-slate-500">需先开启「开放 API」并上架后，第三方才可凭 Key 调用 JSON 接口。</p>
        </div>
        <div className="p-4 sm:p-6">
          {overviewLoading ? (
            <p className="py-8 text-center text-slate-500">加载中…</p>
          ) : agents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-600">
              你还没有创建人生 Agent。
              <Link href="/life-agents/create" className="ml-1 font-medium text-sky-600 hover:text-sky-700">
                去创建
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {agents.map((a) => {
                const expanded = openAgentId === a.profileId;
                const busy = busyProfileId === a.profileId;
                return (
                  <li
                    key={a.profileId}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/40 shadow-sm ring-1 ring-black/[0.03]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenAgentId(expanded ? null : a.profileId)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/80 sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-slate-900">{a.displayName}</span>
                          {!a.published && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                              未上架
                            </span>
                          )}
                          {a.apiInvokeEnabled ? (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                              已开放
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              未开放
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          累计 API 回复 {a.apiTotalCalls} 次 · 会话 {a.apiSessionCount} 个 · 公示{" "}
                          {formatYuanFromFen(a.effectiveApiPricePerCallCents)} 元/次
                          {a.apiPriceFollowsConsultation ? "（与单次咨询同价）" : "（独立定价）"}
                        </p>
                      </div>
                      <span className="shrink-0 text-slate-400">{expanded ? "▲" : "▼"}</span>
                    </button>
                    {expanded && (
                      <div className="space-y-4 border-t border-slate-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <label className="flex cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                              checked={a.apiInvokeEnabled}
                              disabled={busy}
                              onChange={(e) => patchAgent(a.profileId, { apiInvokeEnabled: e.target.checked })}
                            />
                            <span className="text-sm text-slate-800">允许通过专用 Key 调用该 Agent（开放 API）</span>
                          </label>
                        </div>

                        <AgentPricingForm
                          agent={a}
                          disabled={busy}
                          saving={pricingSavingId === a.profileId}
                          onSave={savePricing}
                        />

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                            <h3 className="text-sm font-semibold text-slate-800">数据概览</h3>
                            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <dt className="text-slate-500">API 成功回复次数</dt>
                                <dd className="font-mono text-lg font-semibold text-slate-900">{a.apiTotalCalls}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">API 会话数</dt>
                                <dd className="font-mono text-lg font-semibold text-slate-900">{a.apiSessionCount}</dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-slate-500">各 Key 调用次数</dt>
                                <dd className="mt-1 text-slate-700">
                                  {a.keys.length === 0
                                    ? "暂无 Key"
                                    : a.keys.map((k) => (
                                        <span key={k.id} className="mr-3 inline-block">
                                          {(k.name || "未命名") + ": "}
                                          <span className="font-mono">{k.callCount}</span>
                                        </span>
                                      ))}
                                </dd>
                              </div>
                            </dl>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                            <h3 className="text-sm font-semibold text-slate-800">调用示例（JSON）</h3>
                            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-900/90 p-3 text-[11px] leading-relaxed text-slate-100">
                              {`curl -s -X POST "${origin || "https://你的域名"}/api/life-agents/${a.profileId}/api/chat" \\
  -H "Authorization: Bearer lai_sk_你的密钥" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"你好","sessionId":""}'`}
                            </pre>
                            <p className="mt-2 text-[11px] text-slate-500">
                              首次不传 sessionId 会新建会话；后续传入上次返回的 sessionId 可连续对话。
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-800">调用 Key 列表</h3>
                            <InvokeKeyCreateForm
                              disabled={busy || !a.apiInvokeEnabled}
                              onCreate={(name) => createInvokeKey(a.profileId, name)}
                            />
                          </div>
                          {newInvokeKey?.profileId === a.profileId && (
                            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-sm">
                              <p className="font-medium text-emerald-900">已创建，请立即复制（仅显示一次）</p>
                              <code className="mt-2 block break-all rounded-lg bg-white px-2 py-2 font-mono text-xs text-slate-900 ring-1 ring-emerald-100">
                                {newInvokeKey.key}
                              </code>
                              <button
                                type="button"
                                onClick={() => setNewInvokeKey(null)}
                                className="mt-2 text-xs text-emerald-800 underline"
                              >
                                已保存，关闭
                              </button>
                            </div>
                          )}
                          {a.keys.length === 0 ? (
                            <p className="text-sm text-slate-500">暂无 Key。开启开放 API 后可创建。</p>
                          ) : (
                            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
                              {a.keys.map((k) => (
                                <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                                  <div className="min-w-0">
                                    <div className="font-mono text-slate-700">{k.keyPrefix}</div>
                                    <div className="text-xs text-slate-500">
                                      {k.name || "未命名"} · 调用 {k.callCount} 次 · {k.createdAt.slice(0, 10)}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => revokeInvokeKey(a.profileId, k.id)}
                                    className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                                  >
                                    吊销
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.06]">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">平台 Key（方法二）</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">sk_live_</code>{" "}
            用于调用平台 Agent invoke 等接口，与人生 Agent 专用 Key 不同。
          </p>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <form onSubmit={createPlatformKey} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="Key 名称（可选）"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-sky-500/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={platformBusy}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {platformBusy ? "创建中…" : "创建平台 Key"}
            </button>
          </form>
          {newPlatformKey && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm">
              <p className="font-medium text-emerald-900">请妥善保存（仅显示一次）</p>
              <code className="mt-2 block break-all rounded-lg bg-white p-2 font-mono text-xs ring-1 ring-emerald-100">
                {newPlatformKey.key}
              </code>
              <button type="button" onClick={() => setNewPlatformKey(null)} className="mt-2 text-xs text-emerald-800 underline">
                已保存，关闭
              </button>
            </div>
          )}
          {platformKeys.length === 0 ? (
            <p className="text-sm text-slate-500">暂无平台 Key</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {platformKeys.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                  <span className="font-mono text-slate-600">{k.keyPrefix}</span>
                  <span className="text-slate-500">{k.name || "未命名"}</span>
                  <button
                    type="button"
                    onClick={() => revokePlatformKey(k.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    吊销
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function AgentPricingForm({
  agent,
  disabled,
  saving,
  onSave,
}: {
  agent: AgentApiRow;
  disabled: boolean;
  saving: boolean;
  onSave: (a: AgentApiRow, follow: boolean, centsStr: string) => void;
}) {
  const [follow, setFollow] = useState(agent.apiPriceFollowsConsultation);
  const [cents, setCents] = useState(
    String(agent.apiPricePerCallCents ?? agent.pricePerQuestion ?? 0),
  );

  useEffect(() => {
    setFollow(agent.apiPriceFollowsConsultation);
    setCents(String(agent.apiPricePerCallCents ?? agent.pricePerQuestion ?? 0));
  }, [
    agent.profileId,
    agent.apiPriceFollowsConsultation,
    agent.apiPricePerCallCents,
    agent.pricePerQuestion,
  ]);

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 ring-1 ring-black/[0.03]">
      <h3 className="text-sm font-semibold text-slate-800">对外收费策略（公示单价，单位：分/次）</h3>
      <p className="mt-1 text-xs text-slate-500">
        当前单次咨询定价 {formatYuanFromFen(agent.pricePerQuestion)} 元（{agent.pricePerQuestion} 分）。API 可单独定价或跟随咨询价；实际扣费与分账以后台规则为准。
      </p>
      <div className="mt-3 space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={`apimode-${agent.profileId}`}
            checked={follow}
            disabled={disabled}
            onChange={() => setFollow(true)}
          />
          与单次咨询同价
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={`apimode-${agent.profileId}`}
            checked={!follow}
            disabled={disabled}
            onChange={() => setFollow(false)}
          />
          自定义 API 单价（分）
        </label>
      </div>
      {!follow && (
        <input
          type="number"
          min={0}
          value={cents}
          disabled={disabled}
          onChange={(e) => setCents(e.target.value)}
          className="mt-2 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-48"
        />
      )}
      <button
        type="button"
        disabled={disabled || saving}
        onClick={() => onSave(agent, follow, cents)}
        className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {saving ? "保存中…" : "保存收费策略"}
      </button>
    </div>
  );
}

function InvokeKeyCreateForm({ disabled, onCreate }: { disabled: boolean; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onCreate(name);
        setName("");
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Key 备注"
        disabled={disabled}
        className="w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500/30 sm:w-48"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        新建 Key
      </button>
    </form>
  );
}
