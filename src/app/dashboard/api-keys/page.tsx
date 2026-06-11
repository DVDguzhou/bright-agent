"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Code2, KeyRound, Plus, Power, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  PanelHeader,
  StatStrip,
  StatusBadge,
} from "@/components/dashboard/AgentAdminUI";

type PlatformKey = { id: string; keyPrefix: string; name: string | null; createdAt: string };
type InvokeKey = { id: string; keyPrefix: string; name: string | null; callCount: number; createdAt: string };

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

export default function ApiKeysPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<AgentApiRow[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [platformKeys, setPlatformKeys] = useState<PlatformKey[]>([]);
  const [newPlatformKey, setNewPlatformKey] = useState<{ key: string; name: string } | null>(null);
  const [platformName, setPlatformName] = useState("");
  const [platformBusy, setPlatformBusy] = useState(false);
  const [newInvokeKey, setNewInvokeKey] = useState<{ profileId: string; key: string; name: string } | null>(null);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
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
    if (!confirm("确定吊销这个调用 Key 吗？")) return;
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
    if (!confirm("确定吊销此平台 Key 吗？")) return;
    await fetch(`/api/user-api-keys/${id}`, { method: "DELETE", credentials: "include" });
    loadPlatformKeys();
  };

  const totals = useMemo(
    () => ({
      enabled: agents.filter((agent) => agent.apiInvokeEnabled).length,
      calls: agents.reduce((sum, agent) => sum + agent.apiTotalCalls, 0),
      sessions: agents.reduce((sum, agent) => sum + agent.apiSessionCount, 0),
    }),
    [agents],
  );

  if (authLoading || !user) {
    return (
      <AdminPage narrow>
        {authLoading ? (
          <LoadingBlock />
        ) : (
          <EmptyState
            title="请先登录"
            description="登录后可以管理开放 API 和调用 Key。"
            action={<Link href="/login" className="btn-primary">去登录</Link>}
          />
        )}
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        eyebrow="开发者接口"
        title="开放 API"
        description="为每个人生 Agent 管理调用 Key 与调用数据。第三方集成需要先开启 Agent 的开放 API。"
        actions={<button type="button" onClick={() => router.refresh()} className="btn-secondary">刷新</button>}
      />

      <div className="mb-5">
        <StatStrip
          columns={3}
          items={[
            { label: "已开放 Agent", value: totals.enabled, sub: "个", tone: "olive" },
            { label: "API 回复", value: totals.calls, sub: "次", tone: "signal" },
            { label: "API 会话", value: totals.sessions, sub: "个" },
          ]}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <PanelHeader title="人生 Agent 调用 Key" description="开启后，第三方可以用专用 Key 调用对应 Agent 的 JSON/SSE 接口。" />
          {overviewLoading ? (
            <div className="p-5">
              <LoadingBlock />
            </div>
          ) : agents.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="你还没有创建人生 Agent"
                action={<Link href="/life-agents/create" className="btn-primary">去创建</Link>}
              />
            </div>
          ) : (
            <ul className="divide-y divide-hairline/60">
              {agents.map((agent) => {
                const expanded = openAgentId === agent.profileId;
                const busy = busyProfileId === agent.profileId;
                return (
                  <li key={agent.profileId} className="px-4 py-4 sm:px-5">
                    <button
                      type="button"
                      onClick={() => setOpenAgentId(expanded ? null : agent.profileId)}
                      className="flex w-full items-start justify-between gap-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-ink">{agent.displayName}</span>
                          <StatusBadge tone={agent.published ? "olive" : "neutral"}>{agent.published ? "已上架" : "未上架"}</StatusBadge>
                          <StatusBadge tone={agent.apiInvokeEnabled ? "signal" : "neutral"}>
                            {agent.apiInvokeEnabled ? "已开放" : "未开放"}
                          </StatusBadge>
                        </span>
                        <span className="mt-1 block text-xs text-ink-400">
                          API 回复 {agent.apiTotalCalls} 次 · 会话 {agent.apiSessionCount} 个 · Key {agent.keys.length} 个
                        </span>
                      </span>
                      <span className="text-sm text-ink-300">{expanded ? "收起" : "展开"}</span>
                    </button>

                    {expanded ? (
                      <div className="mt-4 space-y-4 border-t border-hairline/60 pt-4">
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-hairline/70 bg-paper px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-hairline"
                            checked={agent.apiInvokeEnabled}
                            disabled={busy}
                            onChange={(e) => void patchAgent(agent.profileId, { apiInvokeEnabled: e.target.checked })}
                          />
                          <span className="text-sm font-medium text-ink">
                            允许通过专用 Key 调用该 Agent
                          </span>
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded border border-hairline/60 bg-paper px-3 py-3">
                            <p className="text-xs text-ink-400">API 成功回复</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{agent.apiTotalCalls}</p>
                          </div>
                          <div className="rounded border border-hairline/60 bg-paper px-3 py-3">
                            <p className="text-xs text-ink-400">API 会话</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{agent.apiSessionCount}</p>
                          </div>
                        </div>

                        <div className="rounded border border-hairline/60 bg-ink p-3 text-paper-50">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-paper-200">
                            <Code2 className="h-3.5 w-3.5" />
                            SSE 调用示例
                          </div>
                          <pre className="overflow-auto text-[11px] leading-relaxed">
{`curl -N -s -X POST "${origin || "https://你的域名"}/api/life-agents/${agent.profileId}/api/chat" \\
  -H "Authorization: Bearer lai_sk_你的密钥" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"你好","sessionId":""}'`}
                          </pre>
                        </div>

                        <div>
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ink">调用 Key 列表</h3>
                            <InvokeKeyCreateForm disabled={busy || !agent.apiInvokeEnabled} onCreate={(name) => void createInvokeKey(agent.profileId, name)} />
                          </div>
                          {newInvokeKey?.profileId === agent.profileId ? (
                            <KeyReveal
                              title="已创建，请立即保存"
                              value={newInvokeKey.key}
                              onClose={() => setNewInvokeKey(null)}
                            />
                          ) : null}
                          {agent.keys.length === 0 ? (
                            <p className="text-sm text-ink-400">暂无 Key。开启开放 API 后可创建。</p>
                          ) : (
                            <ul className="divide-y divide-hairline/60 rounded border border-hairline/60">
                              {agent.keys.map((key) => (
                                <li key={key.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                                  <div className="min-w-0">
                                    <p className="font-mono text-ink">{key.keyPrefix}</p>
                                    <p className="text-xs text-ink-400">
                                      {key.name || "未命名"} · 调用 {key.callCount} 次 · {key.createdAt.slice(0, 10)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void revokeInvokeKey(agent.profileId, key.id)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-oxblood-600 hover:text-oxblood-700 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    吊销
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="平台 Key" description="用于调用平台级接口，与某个 Agent 的专用 Key 不同。" />
            <div className="space-y-4 p-4 sm:p-5">
              <form onSubmit={createPlatformKey} className="flex flex-col gap-2">
                <input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="Key 名称，可选"
                  className="input-shell text-sm"
                />
                <button type="submit" disabled={platformBusy} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  {platformBusy ? "创建中" : "创建平台 Key"}
                </button>
              </form>
              {newPlatformKey ? (
                <KeyReveal title="请妥善保存，只显示一次" value={newPlatformKey.key} onClose={() => setNewPlatformKey(null)} />
              ) : null}
              {platformKeys.length === 0 ? (
                <p className="text-sm text-ink-400">暂无平台 Key</p>
              ) : (
                <ul className="divide-y divide-hairline/60 rounded border border-hairline/60">
                  {platformKeys.map((key) => (
                    <li key={key.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                      <span className="font-mono text-ink">{key.keyPrefix}</span>
                      <span className="text-ink-400">{key.name || "未命名"}</span>
                      <button type="button" onClick={() => void revokePlatformKey(key.id)} className="text-xs font-medium text-oxblood-600 hover:text-oxblood-700">
                        吊销
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-signal-100 text-signal-800">
                <Power className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">上线前检查</p>
                <p className="mt-1 text-sm leading-6 text-ink-500">
                  先发布 Agent，再开启开放 API，最后创建专用 Key。新建的密钥只显示一次。
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AdminPage>
  );
}

function KeyReveal({ title, value, onClose }: { title: string; value: string; onClose: () => void }) {
  return (
    <div className="rounded-lg border border-olive-400/40 bg-olive-400/10 p-3 text-sm">
      <p className="font-medium text-olive-700">{title}</p>
      <code className="mt-2 block break-all rounded border border-hairline/60 bg-paper px-2 py-2 font-mono text-xs text-ink">{value}</code>
      <button type="button" onClick={onClose} className="mt-2 text-xs font-medium text-olive-700 underline">
        已保存，关闭
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
        className="input-shell !min-h-9 w-40 text-xs sm:w-48"
      />
      <button type="submit" disabled={disabled} className="btn-secondary !min-h-9 !px-3 !py-1.5 text-xs">
        <KeyRound className="h-3.5 w-3.5" />
        新建 Key
      </button>
    </form>
  );
}
