"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type DetailData = {
  id: string;
  displayName: string;
  headline: string;
  shortBio: string;
  longBio: string;
  education?: string;
  income?: string;
  job?: string;
  school?: string;
  audience: string;
  welcomeMessage: string;
  pricePerQuestion: number;
  expertiseTags: string[];
  sampleQuestions: string[];
  knowledgeEntries: Array<{
    id: string;
    category: string;
    title: string;
    content: string;
    tags: string[];
  }>;
  creator: {
    name: string | null;
    email: string;
  };
  stats: {
    sessionCount: number;
    soldQuestionPacks: number;
    knowledgeCount: number;
  };
  viewerState: {
    isLoggedIn: boolean;
    isOwner: boolean;
    remainingQuestions: number;
  };
};

const packOptions = [5, 15, 30];

export default function LifeAgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<DetailData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedPack, setSelectedPack] = useState(5);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/life-agents/${id}`, { credentials: "include" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data?.displayName) setProfile(data);
        else setProfile(null);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoaded(true));
  }, [id]);

  const totalPrice = useMemo(() => {
    if (!profile) return 0;
    return (profile.pricePerQuestion * selectedPack) / 100;
  }, [profile, selectedPack]);

  const purchase = async () => {
    if (!profile) return;
    setPurchasing(true);
    setMessage("");
    const res = await fetch(`/api/life-agents/${profile.id}/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        questionCount: selectedPack,
        amountPaid: profile.pricePerQuestion * selectedPack,
      }),
    });
    const data = await res.json();
    setPurchasing(false);

    if (!res.ok) {
      setMessage(data.error === "UNAUTHORIZED" ? "请先登录后再购买。" : "购买失败，请稍后重试。");
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            viewerState: { ...prev.viewerState, remainingQuestions: data.remainingQuestions },
          }
        : prev
    );
    setMessage(`购买成功，当前剩余 ${data.remainingQuestions} 次提问。`);
  };

  if (!loaded) {
    return <div className="h-64 animate-pulse rounded-3xl bg-white shadow-sm" />;
  }
  if (!profile) {
    return (
      <div className="space-y-4">
        <Link href="/life-agents" className="text-sm text-slate-500 hover:text-sky-700">
          ← 返回人生 Agent 列表
        </Link>
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-900">未找到该 Agent</p>
          <p className="mt-2 text-slate-500">链接可能已失效，请从列表重新进入。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/life-agents" className="text-sm text-slate-500 hover:text-sky-700">
        ← 返回人生 Agent 列表
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="glass-card p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-2xl font-semibold text-blue-700">
                {(profile.displayName ?? "?").slice(0, 1)}
              </div>
              <h1 className="section-title">{profile.displayName}</h1>
              <p className="mt-2 text-lg text-slate-600">{profile.headline}</p>
              {(profile.education || profile.school || profile.job || profile.income) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  {profile.school && <span>🏫 {profile.school}</span>}
                  {profile.education && <span>📜 {profile.education}</span>}
                  {profile.job && <span>💼 {profile.job}</span>}
                  {profile.income && <span>💰 {profile.income}</span>}
                </div>
              )}
              <p className="mt-5 text-base leading-7 text-slate-700">{profile.longBio}</p>
            </div>

            <div className="rounded-3xl bg-sky-50 p-5 text-right">
              <p className="text-sm text-slate-500">每次提问</p>
              <p className="mt-1 text-3xl font-semibold text-sky-700">
                ¥{(profile.pricePerQuestion / 100).toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-slate-500">已售次数包 {profile.stats.soldQuestionPacks}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(profile.expertiseTags ?? []).map((tag: string) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">知识条目</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{profile.stats.knowledgeCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">聊天会话</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{profile.stats.sessionCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">我的剩余提问</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{profile.viewerState.remainingQuestions}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">进入聊天前，你会看到</h2>
            <p className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">
              {profile.welcomeMessage}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/life-agents/${profile.id}/chat`} className="btn-primary">
                进入聊天页
              </Link>
              {!profile.viewerState.isLoggedIn && (
                <Link href="/login" className="btn-secondary">
                  登录后咨询
                </Link>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">购买提问次数</h2>
            <p className="mt-2 text-sm text-slate-500">按次收费，先买次数再聊天，流程更简单。</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {packOptions.map((pack) => (
                <button
                  key={pack}
                  type="button"
                  onClick={() => setSelectedPack(pack)}
                  className={`rounded-2xl border px-4 py-4 text-center transition ${
                    selectedPack === pack
                      ? "border-sky-400 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <p className="text-lg font-semibold">{pack} 次</p>
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">需支付</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">¥{totalPrice.toFixed(2)}</p>
            </div>
            <button onClick={purchase} disabled={purchasing} className="btn-primary mt-5 w-full justify-center disabled:opacity-60">
              {purchasing ? "购买中..." : `购买 ${selectedPack} 次提问`}
            </button>
            {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-slate-900">适合咨询的人群</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">{profile.audience}</p>

          <h3 className="mt-8 text-lg font-semibold text-slate-900">你可以问这些问题</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {(profile.sampleQuestions ?? []).map((question: string) => (
              <span key={question} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {question}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-slate-900">创作者信息</h2>
          <p className="mt-3 text-sm text-slate-700">
            发布者：{profile.creator.name || "未设置昵称"} · {profile.creator.email}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{profile.shortBio}</p>
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold text-slate-900">知识内容预览</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(profile.knowledgeEntries ?? []).map((entry) => (
            <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-700">
                  {entry.category}
                </span>
                <div className="flex flex-wrap justify-end gap-2">
                  {(entry.tags ?? []).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-xs text-slate-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{entry.title}</h3>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{entry.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
