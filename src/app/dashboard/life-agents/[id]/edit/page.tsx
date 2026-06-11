"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Save, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AGENT_CATEGORIES } from "@/lib/life-agent-category";
import { OFFICIAL_CONTACT } from "@/lib/official-contact";
import { VoiceRecordPanel } from "@/components/voice";
import { LifeAgentCoverPicker } from "@/components/LifeAgentCoverPicker";
import {
  buildProfilePayload,
  computeCompletion,
  createFormState,
  fetchManageData,
  MBTI_OPTIONS,
  PERSONA_OPTIONS,
  REGION_OPTIONS,
  RESPONSE_STYLE_OPTIONS,
  TONE_OPTIONS,
  type FormState,
  type ManageData,
  splitLooseList,
} from "@/app/dashboard/life-agents/_lib/manage";
import {
  AdminPage,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  PanelHeader,
  StatusBadge,
} from "@/components/dashboard/AgentAdminUI";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel>
      <PanelHeader title={title} description={description} />
      <div className="p-4 sm:p-5">{children}</div>
    </Panel>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-ink-600">{label}</span>
      {children}
    </label>
  );
}

export default function LifeAgentEditPage() {
  const params = useParams();
  const id = params.id as string;
  const { refetch: refetchUser } = useAuth();
  const [data, setData] = useState<ManageData | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [voiceSamplePending, setVoiceSamplePending] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const formRef = useRef<FormState | null>(null);
  const voiceSamplePendingRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  const voiceSavingRef = useRef(false);
  const lastSavedPayloadRef = useRef<string | null>(null);
  const pendingAutosavePayloadRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    voiceSamplePendingRef.current = voiceSamplePending;
  }, [voiceSamplePending]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    voiceSavingRef.current = voiceSaving;
  }, [voiceSaving]);

  const buildSavablePayload = useCallback((nextForm: FormState, nextVoiceSamplePending?: string | null) => {
    const built = buildProfilePayload(nextForm, nextVoiceSamplePending);
    if ("error" in built) return null;
    return {
      payload: built.payload,
      serialized: JSON.stringify(built.payload),
    };
  }, []);

  const commitSavedProfile = useCallback(
    (next: ManageData["profile"], options?: { clearVoiceSamplePending?: boolean; updateLastSavedAt?: boolean }) => {
      const nextForm = createFormState(next);
      const snapshot = buildSavablePayload(nextForm, null);
      if (snapshot) {
        lastSavedPayloadRef.current = snapshot.serialized;
        pendingAutosavePayloadRef.current = null;
      }
      if (!mountedRef.current) return;
      if (options?.clearVoiceSamplePending) {
        setVoiceSamplePending(null);
        setVoicePanelOpen(false);
      }
      if (options?.updateLastSavedAt !== false) setLastSavedAt(new Date().toISOString());
      setData((prev) => (prev ? { ...prev, profile: next } : prev));
      setForm(nextForm);
    },
    [buildSavablePayload],
  );

  const persistProfile = useCallback(
    async (
      nextForm: FormState,
      nextVoiceSamplePending?: string | null,
      options?: { keepalive?: boolean; clearVoiceSamplePending?: boolean; silent?: boolean },
    ) => {
      const snapshot = buildSavablePayload(nextForm, nextVoiceSamplePending);
      if (!snapshot) return false;
      if (snapshot.serialized === lastSavedPayloadRef.current || snapshot.serialized === pendingAutosavePayloadRef.current) {
        return true;
      }
      pendingAutosavePayloadRef.current = snapshot.serialized;
      if (!options?.keepalive) setSaving(true);
      try {
        const res = await fetch(`/api/life-agents/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(snapshot.payload),
          keepalive: options?.keepalive,
        });
        const next = await res.json().catch(() => null);
        if (!res.ok || !next) {
          pendingAutosavePayloadRef.current = null;
          if (!options?.silent && mountedRef.current) setError("保存失败，请检查输入或稍后重试");
          return false;
        }
        commitSavedProfile(next, {
          clearVoiceSamplePending: options?.clearVoiceSamplePending,
          updateLastSavedAt: true,
        });
        void refetchUser();
        return true;
      } catch {
        pendingAutosavePayloadRef.current = null;
        if (!options?.silent && mountedRef.current) setError("保存失败，请检查网络后重试");
        return false;
      } finally {
        if (!options?.keepalive && mountedRef.current) setSaving(false);
      }
    },
    [buildSavablePayload, commitSavedProfile, id, refetchUser],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchManageData(id).then((result) => {
      if (cancelled) return;
      setData(result.data);
      const nextForm = result.data ? createFormState(result.data.profile) : null;
      setForm(nextForm);
      setLoadError(result.error);
      setLoading(false);
      if (nextForm) {
        const snapshot = buildSavablePayload(nextForm, null);
        lastSavedPayloadRef.current = snapshot?.serialized ?? null;
        pendingAutosavePayloadRef.current = null;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [buildSavablePayload, id]);

  const selectedRegions = useMemo(() => (form ? splitLooseList(form.regions) : []), [form]);

  const toggleRegion = (region: string) => {
    if (!form) return;
    const next = selectedRegions.includes(region)
      ? selectedRegions.filter((item) => item !== region)
      : selectedRegions.length < 2
        ? [...selectedRegions, region]
        : selectedRegions;
    setForm((prev) => (prev ? { ...prev, regions: next.join(", ") } : prev));
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    const built = buildProfilePayload(form, voiceSamplePending);
    if ("error" in built) {
      setError(built.error ?? "保存失败");
      return;
    }
    await persistProfile(form, voiceSamplePending, { clearVoiceSamplePending: true });
  };

  const saveVoiceOnly = async () => {
    if (!voiceSamplePending) {
      setError("请先录制一段样本");
      return;
    }
    setError(null);
    setVoiceSaving(true);
    try {
      const res = await fetch(`/api/life-agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ voiceSampleBase64: voiceSamplePending }),
      });
      const next = await res.json().catch(() => null);
      if (!res.ok || !next) {
        setError("音色上传失败，请稍后重试");
        return;
      }
      commitSavedProfile(next, { clearVoiceSamplePending: true, updateLastSavedAt: true });
    } finally {
      setVoiceSaving(false);
    }
  };

  useEffect(() => {
    const autosave = () => {
      const nextForm = formRef.current;
      if (!nextForm || savingRef.current || voiceSavingRef.current) return;
      void persistProfile(nextForm, voiceSamplePendingRef.current, {
        keepalive: true,
        clearVoiceSamplePending: true,
        silent: true,
      });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") autosave();
    };
    window.addEventListener("pagehide", autosave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", autosave);
      autosave();
    };
  }, [persistProfile]);

  if (loading) {
    return (
      <AdminPage>
        <LoadingBlock />
      </AdminPage>
    );
  }

  if (!data || !form) {
    return (
      <AdminPage narrow>
        <EmptyState
          title={loadError ?? "加载失败"}
          description="没有拿到这个 Agent 的资料。"
          action={<Link href={`/dashboard/life-agents/${id}`} className="btn-primary">返回工作台</Link>}
        />
      </AdminPage>
    );
  }

  const completion = computeCompletion(data.profile);

  return (
    <AdminPage>
      <PageHeader
        backHref={`/dashboard/life-agents/${id}`}
        title="编辑资料"
        description={`分组维护封面、音色、人设、示例内容和地域身份。当前资料完成度 ${completion}%。`}
        actions={
          <button type="submit" form="life-agent-edit-form" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? "保存中" : "保存修改"}
          </button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={form.published ? "olive" : "neutral"}>{form.published ? "已发布" : "未发布"}</StatusBadge>
            <StatusBadge tone="signal">完成度 {completion}%</StatusBadge>
            {lastSavedAt ? <StatusBadge>最近保存 {new Date(lastSavedAt).toLocaleTimeString("zh-CN")}</StatusBadge> : null}
          </div>
        }
      />

      <form id="life-agent-edit-form" onSubmit={saveProfile} className="space-y-5">
        <FormSection title="基础形象" description="发现页里第一眼看到的封面、名称、简介和音色。">
          <div className="space-y-5">
            <LifeAgentCoverPicker
              coverImageUrl={form.coverImageUrl}
              onChange={(u) => setForm((prev) => (prev ? { ...prev, coverImageUrl: u } : prev))}
              onAvatarSynced={() => void refetchUser()}
              disabled={saving}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Agent 名称">
                <input className="input-shell" value={form.displayName} onChange={(e) => setForm((prev) => (prev ? { ...prev, displayName: e.target.value } : prev))} maxLength={10} required />
              </Field>
              <Field label="一句话介绍">
                <input className="input-shell" value={form.headline} onChange={(e) => setForm((prev) => (prev ? { ...prev, headline: e.target.value } : prev))} />
              </Field>
              <Field label="简短介绍" className="md:col-span-2">
                <textarea className="input-shell min-h-24" value={form.shortBio} onChange={(e) => setForm((prev) => (prev ? { ...prev, shortBio: e.target.value } : prev))} />
              </Field>
              <Field label="详细介绍" className="md:col-span-2">
                <textarea className="input-shell min-h-32" value={form.longBio} onChange={(e) => setForm((prev) => (prev ? { ...prev, longBio: e.target.value } : prev))} />
              </Field>
            </div>
            <div className="rounded-lg border border-hairline/70 bg-paper p-4">
              <p className="font-medium text-ink">语音回复音色</p>
              <p className="mt-1 text-sm text-ink-500">
                {data.profile.hasVoiceClone ? "已可用于语音合成。" : "还未训练，建议录一段样本提升陪伴感。"}
              </p>
              {data.profile.voiceCloneId ? <p className="mt-2 break-all font-mono text-xs text-ink-400">voiceCloneId: {data.profile.voiceCloneId}</p> : null}
              {voiceSamplePending ? <p className="mt-3 text-sm text-olive-600">已录制新样本，可以单独上传或随整页资料一起保存。</p> : null}
              {!voicePanelOpen ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary" onClick={() => setVoicePanelOpen(true)}>录制音色样本</button>
                  {voiceSamplePending ? (
                    <button type="button" className="btn-primary" disabled={voiceSaving} onClick={() => void saveVoiceOnly()}>
                      <Upload className="h-4 w-4" />
                      {voiceSaving ? "上传中" : "仅上传音色"}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <VoiceRecordPanel
                    onComplete={(blob) => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = (reader.result as string).split(",")[1];
                        setVoiceSamplePending(base64 ?? null);
                        setVoicePanelOpen(false);
                      };
                      reader.readAsDataURL(blob);
                    }}
                  />
                  <button type="button" className="btn-secondary" onClick={() => setVoicePanelOpen(false)}>取消</button>
                </div>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="发布内容" description="用户打开详情页和首次聊天时会看到这些内容。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="适合帮助的人群">
              <textarea className="input-shell min-h-24" value={form.audience} onChange={(e) => setForm((prev) => (prev ? { ...prev, audience: e.target.value } : prev))} />
            </Field>
            <Field label="首次欢迎语">
              <textarea className="input-shell min-h-24" value={form.welcomeMessage} onChange={(e) => setForm((prev) => (prev ? { ...prev, welcomeMessage: e.target.value } : prev))} required />
            </Field>
            <label className="flex min-h-12 items-center gap-3 rounded-lg border border-hairline/70 bg-paper px-4">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm((prev) => (prev ? { ...prev, published: e.target.checked } : prev))} className="h-4 w-4 rounded border-hairline" />
              <span className="text-sm font-medium text-ink">发布到发现页</span>
            </label>
            <Field label="不能或不想回答的问题" className="md:col-span-2">
              <textarea className="input-shell min-h-20" value={form.notSuitableFor} onChange={(e) => setForm((prev) => (prev ? { ...prev, notSuitableFor: e.target.value } : prev))} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="人设风格" description="控制 Agent 的语气、回答习惯和边界感。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="MBTI">
              <select className="input-shell" value={form.mbti} onChange={(e) => setForm((prev) => (prev ? { ...prev, mbti: e.target.value } : prev))}>
                {MBTI_OPTIONS.map((item) => <option key={item || "empty"} value={item}>{item || "未设置"}</option>)}
              </select>
            </Field>
            <Field label="角色原型">
              <select className="input-shell" value={form.personaArchetype} onChange={(e) => setForm((prev) => (prev ? { ...prev, personaArchetype: e.target.value } : prev))}>
                {PERSONA_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="语气">
              <select className="input-shell" value={form.toneStyle} onChange={(e) => setForm((prev) => (prev ? { ...prev, toneStyle: e.target.value } : prev))}>
                {TONE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="回答习惯">
              <select className="input-shell" value={form.responseStyle} onChange={(e) => setForm((prev) => (prev ? { ...prev, responseStyle: e.target.value } : prev))}>
                {RESPONSE_STYLE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="禁用套话" className="md:col-span-2">
              <textarea className="input-shell min-h-20" value={form.forbiddenPhrases} onChange={(e) => setForm((prev) => (prev ? { ...prev, forbiddenPhrases: e.target.value } : prev))} placeholder="每行一个" />
            </Field>
          </div>
        </FormSection>

        <FormSection title="内容素材" description="标签、示例问题和示范回答会影响发现页转化，也影响 Agent 的回答风格。">
          <div className="space-y-4">
            <div>
              <span className="mb-2 block text-sm font-medium text-ink-600">擅长标签</span>
              <div className="flex flex-wrap gap-1.5">
                {AGENT_CATEGORIES.map((cat) => {
                  const tags = splitLooseList(form.expertiseTags);
                  const selected = tags.includes(cat.label);
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => {
                        setForm((prev) => {
                          if (!prev) return prev;
                          const current = splitLooseList(prev.expertiseTags);
                          return {
                            ...prev,
                            expertiseTags: selected
                              ? current.filter((t) => t !== cat.label).join(", ")
                              : [...current, cat.label].join(", "),
                          };
                        });
                      }}
                      className="rounded px-2.5 py-1 text-xs font-medium transition"
                      style={{
                        backgroundColor: selected ? cat.color : `${cat.color}20`,
                        color: selected ? "#fff" : cat.color,
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="示例问题">
              <textarea className="input-shell min-h-24" value={form.sampleQuestions} onChange={(e) => setForm((prev) => (prev ? { ...prev, sampleQuestions: e.target.value } : prev))} placeholder="每行一个" />
            </Field>
            {[1, 2, 3].map((n) => {
              const key = `exampleReply${n}` as "exampleReply1" | "exampleReply2" | "exampleReply3";
              return (
                <Field key={key} label={`示范回答 ${n}`}>
                  <textarea className="input-shell min-h-24" value={form[key]} onChange={(e) => setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))} />
                </Field>
              );
            })}
          </div>
        </FormSection>

        <FormSection title="地域身份" description="让用户判断你是否真的了解某个地方、学校或阶段。">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-ink-600">地区快捷选择</span>
              <div className="flex flex-wrap gap-2">
                {REGION_OPTIONS.map((region) => {
                  const active = selectedRegions.includes(region);
                  const disabled = !active && selectedRegions.length >= 2;
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      disabled={disabled}
                      className={`min-h-9 rounded px-3 text-sm font-medium transition ${
                        active ? "bg-ink text-paper-50" : disabled ? "bg-paper-200 text-ink-200" : "bg-paper-200 text-ink-600 hover:bg-paper-300"
                      }`}
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-400">最多 2 个，当前：{selectedRegions.length ? selectedRegions.join(" / ") : "未选择"}</p>
            </div>
            {[
              ["学校", "school"],
              ["国家 / 地区", "country"],
              ["省 / 州", "province"],
              ["城市", "city"],
              ["区县 / 区域", "county"],
              ["学历", "education"],
              ["工作", "job"],
              ["收入", "income"],
            ].map(([label, key]) => (
              <Field key={key} label={label}>
                <input className="input-shell" value={form[key as keyof FormState] as string} onChange={(e) => setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))} />
              </Field>
            ))}
            <div className="rounded-lg border border-hairline/70 bg-paper p-4 md:col-span-2">
              <p className="font-medium text-ink">{data.profile.verificationStatus === "verified" ? "已认证" : "申请官方认证"}</p>
              {data.profile.verificationStatus === "verified" ? (
                <p className="mt-1 text-sm text-olive-600">该 Agent 已完成官方认证。</p>
              ) : (
                <p className="mt-2 text-sm text-ink-500">
                  {OFFICIAL_CONTACT.description}：
                  <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="ml-1 font-medium text-signal-700 underline">
                    {OFFICIAL_CONTACT.email}
                  </a>
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {error ? <p className="rounded-lg border border-oxblood-200 bg-oxblood-50 px-4 py-3 text-sm text-oxblood-700">{error}</p> : null}

        <div className="sticky bottom-4 z-10 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary shadow-glow">
            <Save className="h-4 w-4" />
            {saving ? "保存中" : "保存全部修改"}
          </button>
        </div>
      </form>
    </AdminPage>
  );
}
