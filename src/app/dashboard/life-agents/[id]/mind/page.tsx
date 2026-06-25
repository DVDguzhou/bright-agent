"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Brain } from "lucide-react";
import { fetchManageData, type ManageData } from "@/app/dashboard/life-agents/_lib/manage";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  PanelHeader,
} from "@/components/dashboard/AgentAdminUI";

type MindSettings = {
  allowGeneralKnowledge: boolean;
  citationsEnabled: boolean;
  knowledgeFallbackMessage?: string;
};

export default function MindSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [manage, setManage] = useState<ManageData | null>(null);
  const [settings, setSettings] = useState<MindSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchManageData(id),
      fetch(`/api/life-agents/${id}/mind-settings`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([manageRes, mindRes]) => {
        if (manageRes.data) setManage(manageRes.data);
        if (manageRes.error) setError(manageRes.error);
        setSettings({
          allowGeneralKnowledge: mindRes.allowGeneralKnowledge !== false,
          citationsEnabled: mindRes.citationsEnabled !== false,
          knowledgeFallbackMessage: mindRes.knowledgeFallbackMessage ?? "",
        });
      })
      .catch(() => setError("加载失败，请稍后重试"))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/life-agents/${id}/mind-settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        alert("保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminPage narrow>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (error || !manage || !settings) {
    return (
      <AdminPage narrow>
        <EmptyState
          title={error ?? "加载失败"}
          action={
            <Link href={`/dashboard/life-agents/${id}`} className="btn-primary">
              返回工作台
            </Link>
          }
        />
      </AdminPage>
    );
  }

  return (
    <AdminPage narrow>
      <PageHeader
        title="Mind 设置"
        description="控制 Agent 何时使用通识知识、如何兜底，以及是否在回答中展示引用上标。"
      />

      <Panel>
        <PanelHeader title="知识范围" description="决定知识库无命中时的回答策略。" />
        <div className="space-y-4 p-4 sm:p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={settings.allowGeneralKnowledge}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, allowGeneralKnowledge: e.target.checked } : s))
              }
            />
            <span>
              <span className="block text-sm font-medium text-ink">允许使用通识知识</span>
              <span className="mt-0.5 block text-xs text-ink-400">
                开启时，知识库没有相关内容也会用模型通识回答（不会显示个人经历引用）。
              </span>
            </span>
          </label>

          {!settings.allowGeneralKnowledge && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">兜底回答</label>
              <textarea
                className="input-shell min-h-24 text-sm"
                value={settings.knowledgeFallbackMessage}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, knowledgeFallbackMessage: e.target.value } : s))
                }
                placeholder="例如：这个问题我暂时没有找到相关的个人经历可以分享，你可以直接联系我。"
              />
              <p className="mt-1 text-xs text-ink-400">知识库无命中且非闲聊时，Agent 会发送这段话术。</p>
            </div>
          )}
        </div>
      </Panel>

      <Panel className="mt-5">
        <PanelHeader title="引用展示" description="引用上标帮助买家验证回答是否来自你的真实经历。" />
        <div className="p-4 sm:p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={settings.citationsEnabled}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, citationsEnabled: e.target.checked } : s))
              }
            />
            <span>
              <span className="block text-sm font-medium text-ink">在回答中显示引用上标</span>
              <span className="mt-0.5 block text-xs text-ink-400">
                关闭后仍可在后台记录引用来源，但买家看不到上标数字。
              </span>
            </span>
          </label>
        </div>
      </Panel>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" disabled={saving} onClick={() => void save()}>
          {saving ? "保存中…" : "保存设置"}
        </button>
        {saved && <span className="text-sm text-olive-600">已保存</span>}
        <Link href={`/dashboard/life-agents/${id}/knowledge`} className="text-sm text-signal-700 hover:underline">
          管理知识库 →
        </Link>
      </div>

      <p className="mt-6 text-xs text-ink-400">
        <Brain className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        个人经历越多、引用越完整，买家越容易信任 Agent 的回答。
      </p>
    </AdminPage>
  );
}
