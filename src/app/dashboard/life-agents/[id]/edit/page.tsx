"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "@/app/dashboard/life-agents/_lib/manage";

function Section({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
      <summary className="cursor-pointer list-none">
        <h2 className="text-lg font-semibold text-[#111]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

export default function LifeAgentEditPage() {
  const params = useParams();
  const id = params.id as string;
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
    (
      next: ManageData["profile"],
      options?: {
        clearVoiceSamplePending?: boolean;
        updateLastSavedAt?: boolean;
      },
    ) => {
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
      if (options?.updateLastSavedAt !== false) {
        setLastSavedAt(new Date().toISOString());
      }
      setData((prev) => (prev ? { ...prev, profile: next } : prev));
      setForm(nextForm);
    },
    [buildSavablePayload],
  );

  const persistProfile = useCallback(
    async (
      nextForm: FormState,
      nextVoiceSamplePending?: string | null,
      options?: {
        keepalive?: boolean;
        clearVoiceSamplePending?: boolean;
        silent?: boolean;
      },
    ) => {
      const snapshot = buildSavablePayload(nextForm, nextVoiceSamplePending);
      if (!snapshot) return false;
      if (snapshot.serialized === lastSavedPayloadRef.current || snapshot.serialized === pendingAutosavePayloadRef.current) {
        return true;
      }

      pendingAutosavePayloadRef.current = snapshot.serialized;
      if (!options?.keepalive) {
        setSaving(true);
      }

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
          if (!options?.silent && mountedRef.current) {
            setError("保存失败，请检查输入或稍后重试");
          }
          return false;
        }
        commitSavedProfile(next, {
          clearVoiceSamplePending: options?.clearVoiceSamplePending,
          updateLastSavedAt: true,
        });
        return true;
      } catch {
        pendingAutosavePayloadRef.current = null;
        if (!options?.silent && mountedRef.current) {
          setError("保存失败，请检查网络后重试");
        }
        return false;
      } finally {
        if (!options?.keepalive && mountedRef.current) {
          setSaving(false);
        }
      }
    },
    [buildSavablePayload, commitSavedProfile, id],
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

  const selectedRegions = useMemo(() => {
    if (!form) return [];
    return form.regions
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [form]);

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
      if (!res.ok) {
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
    return <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]" />;
  }

  if (!data || !form) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-[15px] text-slate-500">{loadError ?? "加载失败"}</p>
        <Link
          href={`/dashboard/life-agents/${id}`}
          className="mt-6 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-medium text-white"
        >
          返回工作台
        </Link>
      </div>
    );
  }

  const completion = computeCompletion(data.profile);

  return (
    <div className="mx-auto max-w-4xl space-y-4 max-lg:-mx-4 max-lg:bg-[#f7f8fa] max-lg:px-3 max-lg:pb-24">
      <header className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/dashboard/life-agents/${id}`} className="text-sm font-medium text-slate-500 transition hover:text-[#111]">
              ← 返回工作台
            </Link>
            <h1 className="mt-3 text-[28px] font-black tracking-tight text-[#111]">编辑资料</h1>
            <p className="mt-1 text-sm text-slate-500">
              分组维护封面、音色、定价、人设和示范内容。资料完成度 {completion}%。
            </p>
          </div>
          <button
            type="submit"
            form="life-agent-edit-form"
            disabled={saving}
            className="rounded-full bg-[#111] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存修改"}
          </button>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${completion}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {lastSavedAt ? `最近保存：${new Date(lastSavedAt).toLocaleString("zh-CN")}` : "尚未保存本次修改"}
          <span className="ml-2">离开页面时会自动保存已通过校验的修改</span>
        </p>
      </header>

      <form id="life-agent-edit-form" onSubmit={saveProfile} className="space-y-4">
        <Section title="基础形象" hint="封面、名称、简介和语音能力" defaultOpen>
          <div className="space-y-5">
            <LifeAgentCoverPicker
              coverImageUrl={form.coverImageUrl}
              onChange={(u) => setForm((prev) => (prev ? { ...prev, coverImageUrl: u } : prev))}
              disabled={saving}
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="font-medium text-slate-800">语音回复音色</p>
              <p className="mt-1 text-sm text-slate-600">
                {data.profile.hasVoiceClone ? "已可用于语音合成" : "未就绪，建议录一段样本提升陪伴感。"}
              </p>
              {data.profile.voiceCloneId ? (
                <p className="mt-2 break-all font-mono text-xs text-slate-500">voiceCloneId：{data.profile.voiceCloneId}</p>
              ) : null}
              {voiceSamplePending ? (
                <p className="mt-3 text-sm text-emerald-700">已录制新样本，可以单独上传，或和整页资料一起保存。</p>
              ) : null}
              {!voicePanelOpen ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700" onClick={() => setVoicePanelOpen(true)}>
                    录制音色样本
                  </button>
                  {voiceSamplePending ? (
                    <button type="button" className="rounded-full bg-[#111] px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={voiceSaving} onClick={() => void saveVoiceOnly()}>
                      {voiceSaving ? "上传中…" : "仅上传音色"}
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
                  <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700" onClick={() => setVoicePanelOpen(false)}>
                    取消
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Agent 名称</label>
                <input className="input-shell" value={form.displayName} onChange={(e) => setForm((prev) => (prev ? { ...prev, displayName: e.target.value } : prev))} maxLength={10} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">一句话介绍</label>
                <input className="input-shell" value={form.headline} onChange={(e) => setForm((prev) => (prev ? { ...prev, headline: e.target.value } : prev))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">简短介绍</label>
                <textarea className="input-shell min-h-24" value={form.shortBio} onChange={(e) => setForm((prev) => (prev ? { ...prev, shortBio: e.target.value } : prev))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">详细介绍</label>
                <textarea className="input-shell min-h-32" value={form.longBio} onChange={(e) => setForm((prev) => (prev ? { ...prev, longBio: e.target.value } : prev))} />
              </div>
            </div>
          </div>
        </Section>

        <Section title="售卖信息" hint="价格、欢迎语、适用范围和上架状态" defaultOpen>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">适合帮助的人群</label>
              <textarea className="input-shell min-h-24" value={form.audience} onChange={(e) => setForm((prev) => (prev ? { ...prev, audience: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">首次欢迎语</label>
              <textarea className="input-shell min-h-24" value={form.welcomeMessage} onChange={(e) => setForm((prev) => (prev ? { ...prev, welcomeMessage: e.target.value } : prev))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">每次提问价格（元）</label>
              <input type="number" min="0.01" step="0.01" className="input-shell" value={form.pricePerQuestion} onChange={(e) => setForm((prev) => (prev ? { ...prev, pricePerQuestion: e.target.value } : prev))} />
            </div>
            <div className="flex items-center gap-3 pt-7">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm((prev) => (prev ? { ...prev, published: e.target.checked } : prev))} className="rounded border-slate-300" />
                <span className="text-sm text-slate-700">已发布</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">不能/不想回答的问题</label>
              <textarea className="input-shell min-h-20" value={form.notSuitableFor} onChange={(e) => setForm((prev) => (prev ? { ...prev, notSuitableFor: e.target.value } : prev))} />
            </div>
          </div>
        </Section>

        <Section title="人设风格" hint="影响聊天时像不像你本人">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">MBTI</label>
              <select className="input-shell" value={form.mbti} onChange={(e) => setForm((prev) => (prev ? { ...prev, mbti: e.target.value } : prev))}>
                <option value="">未设置</option>
                {MBTI_OPTIONS.filter(Boolean).map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">角色原型</label>
              <select className="input-shell" value={form.personaArchetype} onChange={(e) => setForm((prev) => (prev ? { ...prev, personaArchetype: e.target.value } : prev))}>
                {PERSONA_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">语气</label>
              <select className="input-shell" value={form.toneStyle} onChange={(e) => setForm((prev) => (prev ? { ...prev, toneStyle: e.target.value } : prev))}>
                {TONE_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">回答习惯</label>
              <select className="input-shell" value={form.responseStyle} onChange={(e) => setForm((prev) => (prev ? { ...prev, responseStyle: e.target.value } : prev))}>
                {RESPONSE_STYLE_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">禁用套话</label>
              <textarea className="input-shell min-h-20" value={form.forbiddenPhrases} onChange={(e) => setForm((prev) => (prev ? { ...prev, forbiddenPhrases: e.target.value } : prev))} placeholder="每行一个" />
            </div>
          </div>
        </Section>

        <Section title="内容素材" hint="标签、示例问题和示范回答是提升转化的关键">
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">擅长标签</label>
              <div className="flex flex-wrap gap-1.5">
                {AGENT_CATEGORIES.map((cat) => {
                  const selected = form.expertiseTags.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean).includes(cat.label);
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => {
                        const tags = form.expertiseTags.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean);
                        setForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                expertiseTags: selected
                                  ? tags.filter((t) => t !== cat.label).join("、")
                                  : tags.length > 0
                                    ? `${tags.join("、")}、${cat.label}`
                                    : cat.label,
                              }
                            : prev
                        );
                      }}
                      className={`rounded-full px-2.5 py-1 text-xs transition ${selected ? "" : "hover:opacity-80"}`}
                      style={{
                        backgroundColor: cat.color + "20",
                        color: cat.color,
                        boxShadow: selected ? `inset 0 0 0 1.5px ${cat.color}` : "none",
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">示例问题</label>
              <textarea className="input-shell min-h-24" value={form.sampleQuestions} onChange={(e) => setForm((prev) => (prev ? { ...prev, sampleQuestions: e.target.value } : prev))} placeholder="每行一个" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 1</label>
              <textarea className="input-shell min-h-24" value={form.exampleReply1} onChange={(e) => setForm((prev) => (prev ? { ...prev, exampleReply1: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 2</label>
              <textarea className="input-shell min-h-24" value={form.exampleReply2} onChange={(e) => setForm((prev) => (prev ? { ...prev, exampleReply2: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">示范回答 3</label>
              <textarea className="input-shell min-h-24" value={form.exampleReply3} onChange={(e) => setForm((prev) => (prev ? { ...prev, exampleReply3: e.target.value } : prev))} />
            </div>
          </div>
        </Section>

        <Section title="地域身份" hint="让用户更快判断你是否真懂这个地方或阶段">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">地区快捷选择</label>
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
                      className={`rounded-full px-3 py-2 text-sm transition ${
                        active ? "bg-sky-600 text-white" : disabled ? "bg-slate-100 text-slate-300" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">最多 2 个，当前：{selectedRegions.length ? selectedRegions.join(" / ") : "未选择"}</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">学校</label>
              <input className="input-shell" value={form.school} onChange={(e) => setForm((prev) => (prev ? { ...prev, school: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">国家 / 地区</label>
              <input className="input-shell" value={form.country} onChange={(e) => setForm((prev) => (prev ? { ...prev, country: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">省 / 州</label>
              <input className="input-shell" value={form.province} onChange={(e) => setForm((prev) => (prev ? { ...prev, province: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">城市</label>
              <input className="input-shell" value={form.city} onChange={(e) => setForm((prev) => (prev ? { ...prev, city: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">区县 / 区域</label>
              <input className="input-shell" value={form.county} onChange={(e) => setForm((prev) => (prev ? { ...prev, county: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">学历</label>
              <input className="input-shell" value={form.education} onChange={(e) => setForm((prev) => (prev ? { ...prev, education: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">工作</label>
              <input className="input-shell" value={form.job} onChange={(e) => setForm((prev) => (prev ? { ...prev, job: e.target.value } : prev))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">收入</label>
              <input className="input-shell" value={form.income} onChange={(e) => setForm((prev) => (prev ? { ...prev, income: e.target.value } : prev))} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <p className="font-medium text-slate-700">
                {data.profile.verificationStatus === "verified" ? "已认证" : "申请官方认证"}
              </p>
              {data.profile.verificationStatus === "verified" ? (
                <p className="mt-1 text-sm text-emerald-700">该 Agent 已完成官方认证。</p>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  {OFFICIAL_CONTACT.description}：
                  <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="ml-1 text-sky-600 underline">
                    {OFFICIAL_CONTACT.email}
                  </a>
                </p>
              )}
            </div>
          </div>
        </Section>

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

        <div className="flex justify-end pb-4">
          <button type="submit" disabled={saving} className="rounded-full bg-[#111] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "保存中…" : "保存全部修改"}
          </button>
        </div>
      </form>
    </div>
  );
}
