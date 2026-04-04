"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  buildPatchPayloadFromProfile,
  fetchManageData,
  summarizeProfileChanges,
  type ManageData,
  type ManageProfile,
} from "@/app/dashboard/life-agents/_lib/manage";

type ChatRow = { role: "user" | "assistant"; content: string };
type LastChange = {
  before: ManageProfile;
  after: ManageProfile;
  summary: string[];
  message: string;
  appliedAt: string;
};

function storageKey(id: string) {
  return `life-agent-co-edit:${id}`;
}

export default function LifeAgentCoEditPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatRow[]>([]);
  const [modifyInput, setModifyInput] = useState("");
  const [modifyLoading, setModifyLoading] = useState(false);
  const [lastChange, setLastChange] = useState<LastChange | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchManageData(id).then((result) => {
      if (cancelled) return;
      setData(result.data);
      setLoadError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(id));
      if (!raw) return;
      const parsed = JSON.parse(raw) as { chatHistory?: ChatRow[]; lastChange?: LastChange | null };
      if (Array.isArray(parsed.chatHistory)) setChatHistory(parsed.chatHistory);
      if (parsed.lastChange) setLastChange(parsed.lastChange);
    } catch {
      // ignore broken local state
    }
  }, [id]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(id), JSON.stringify({ chatHistory, lastChange }));
    } catch {
      // ignore quota error
    }
  }, [chatHistory, id, lastChange]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, lastChange]);

  const impactedFields = useMemo(() => lastChange?.summary ?? [], [lastChange]);

  const runModify = async (msg: string) => {
    if (!data) return;
    const previousProfile = data.profile;
    setModifyLoading(true);
    setBanner(null);
    setChatHistory((prev) => [...prev, { role: "user", content: msg }]);
    try {
      const res = await fetch(`/api/life-agents/${id}/modify-via-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg,
          chatHistory: chatHistory.map((item) => ({ role: item.role, content: item.content })),
        }),
      });
      const next = await res.json().catch(() => null);
      if (!res.ok || !next?.profile) {
        setChatHistory((prev) => [...prev, { role: "assistant", content: next?.detail || "修改失败，请重试" }]);
        return;
      }
      const summary = summarizeProfileChanges(previousProfile, next.profile);
      setChatHistory((prev) => [...prev, { role: "assistant", content: next.assistantMessage || "我已经按你的要求完成修改。" }]);
      setLastChange({
        before: previousProfile,
        after: next.profile,
        summary,
        message: msg,
        appliedAt: new Date().toISOString(),
      });
      setData((prev) => (prev ? { ...prev, profile: next.profile } : prev));
    } catch {
      setChatHistory((prev) => [...prev, { role: "assistant", content: "请求失败，请检查网络后重试" }]);
    } finally {
      setModifyLoading(false);
    }
  };

  const undoLastChange = async () => {
    if (!lastChange) return;
    setModifyLoading(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/life-agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPatchPayloadFromProfile(lastChange.before)),
      });
      const next = await res.json().catch(() => null);
      if (!res.ok) {
        setBanner("撤回失败，请稍后再试");
        return;
      }
      setData((prev) => (prev ? { ...prev, profile: next } : prev));
      setChatHistory((prev) => [...prev, { role: "assistant", content: "已撤回上次修改，资料恢复到修改前状态。" }]);
      setLastChange(null);
      setBanner("已撤回上次修改");
    } finally {
      setModifyLoading(false);
    }
  };

  if (loading) {
    return <div className="mx-auto h-64 max-w-4xl animate-pulse rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]" />;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-[15px] text-slate-500">{loadError ?? "加载失败"}</p>
        <Link href={`/dashboard/life-agents/${id}`} className="mt-6 inline-flex rounded-full bg-[#111] px-6 py-2.5 text-sm font-medium text-white">
          返回工作台
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 max-lg:-mx-4 max-lg:bg-[#f7f8fa] max-lg:px-3 max-lg:pb-24">
      <header className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <Link href={`/dashboard/life-agents/${id}`} className="text-sm font-medium text-slate-500 transition hover:text-[#111]">
          ← 返回工作台
        </Link>
        <h1 className="mt-3 text-[28px] font-black tracking-tight text-[#111]">对话调教</h1>
        <p className="mt-1 text-sm text-slate-500">像聊天一样改资料，系统会总结本次影响的字段，并支持撤回上次修改。</p>
      </header>

      {lastChange ? (
        <section className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#111]">本次会影响这些资料字段</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {impactedFields.map((item) => (
                  <span key={item} className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">最近一次修改于 {new Date(lastChange.appliedAt).toLocaleString("zh-CN")} 自动应用。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setLastChange(null);
                  setBanner("这次修改已保留");
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                保留这次修改
              </button>
              <button
                type="button"
                onClick={() => void undoLastChange()}
                disabled={modifyLoading}
                className="rounded-full bg-[#111] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                撤回上次修改
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-6">
        <h2 className="text-lg font-semibold text-[#111]">当前 Agent 状态</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">名称 / 介绍</p>
            <p className="mt-2 text-sm text-[#111]">{data.profile.displayName}</p>
            <p className="mt-1 text-sm text-slate-500">{data.profile.headline}</p>
          </div>
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">擅长标签</p>
            <p className="mt-2 text-sm text-[#111]">{(data.profile.expertiseTags ?? []).join("、") || "未设置"}</p>
          </div>
          <div className="rounded-2xl bg-[#fafbfc] p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs font-medium text-slate-500">知识条目</p>
            <p className="mt-2 text-sm text-[#111]">{data.profile.knowledgeEntries.length} 条</p>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/90 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-3xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">训练助手</p>
            <p className="mt-1 text-xs text-slate-500">支持改文案、标签、欢迎语、风格和知识内容，历史会保存在当前设备。</p>
          </div>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
            已处理 {chatHistory.filter((item) => item.role === "user").length} 次修改
          </span>
        </div>

        {banner ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{banner}</p> : null}

        <div className="mt-5 max-h-[52vh] space-y-4 overflow-y-auto pr-1">
          {chatHistory.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              例如：「把欢迎语改得更像朋友聊天」「加两条关于找工作焦虑的示范回答」「补一条留学租房踩坑经验」。
            </div>
          ) : null}
          {chatHistory.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm ${
                  item.role === "user"
                    ? "bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-sky-200/70"
                    : "border border-white/90 bg-white text-slate-700"
                }`}
              >
                <p className="whitespace-pre-wrap">{item.content}</p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form
          className="mt-5 rounded-[28px] border border-slate-100 bg-slate-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const msg = modifyInput.trim();
            if (!msg || modifyLoading) return;
            setModifyInput("");
            void runModify(msg);
          }}
        >
          <textarea
            className="min-h-[96px] w-full resize-none rounded-2xl border-0 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            value={modifyInput}
            onChange={(e) => setModifyInput(e.target.value)}
            placeholder={modifyLoading ? "AI 正在处理这次修改…" : "例如：把擅长标签改成考研、转行、找工作"}
            disabled={modifyLoading}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">每次修改后都会记录影响字段，并支持撤回上次改动。</p>
            <button type="submit" disabled={modifyLoading} className="rounded-full bg-[#111] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              {modifyLoading ? "处理中…" : "发送"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
