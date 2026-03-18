"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getDisplayAvatar } from "@/lib/avatar";

type Agent = { id: string; name: string; status: string };
type LifeAgentCreated = { id: string; displayName: string; headline: string; knowledgeCount: number; sessionCount: number; soldPacks: number; totalRevenue: number };
type LifeAgentPurchased = { id: string; displayName: string; headline: string; pricePerQuestion: number; remainingQuestions: number };

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [lifeAgentsCreated, setLifeAgentsCreated] = useState<LifeAgentCreated[]>([]);
  const [lifeAgentsPurchased, setLifeAgentsPurchased] = useState<LifeAgentPurchased[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }
    // 并行请求，避免瀑布式等待
    Promise.all([
      fetch("/api/agents?owner=me", { credentials: "include" }).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
      fetch("/api/life-agents/mine", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
      fetch("/api/life-agents/purchased", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
    ]).then(([a, c, p]) => {
      setAgents(a);
      setLifeAgentsCreated(c);
      setLifeAgentsPurchased(p);
    }).finally(() => setDataLoading(false));
  }, [user]);

  const deleteAgent = async (id: string) => {
    if (!confirm("确定删除这个 Agent 吗？删除后无法恢复。")) return;
    setDeletingAgentId(id);
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "删除失败");
      }
      setAgents((prev) => prev.filter((agent) => agent.id !== id));
    } finally {
      setDeletingAgentId(null);
    }
  };

  const stats = [
    { label: "已创建 Agent", value: agents.length, accent: "from-sky-500 to-cyan-400" },
    { label: "人生 Agent", value: lifeAgentsCreated.length, accent: "from-violet-500 to-fuchsia-400" },
    { label: "已购咨询额度", value: lifeAgentsPurchased.reduce((sum, item) => sum + item.remainingQuestions, 0), accent: "from-amber-500 to-orange-400" },
    { label: "累计售出", value: lifeAgentsCreated.reduce((sum, item) => sum + item.soldPacks, 0), accent: "from-emerald-500 to-teal-400" },
  ];

  if (loading || !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-20 text-center"
      >
        {loading ? (
          <p className="text-slate-500">加载中...</p>
        ) : (
          <p className="text-slate-500">
            请先{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              登录
            </Link>
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <section className="glass-card overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500/10 via-white to-violet-500/10 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={getDisplayAvatar({ avatarUrl: user.avatarUrl, name: user.name, email: user.email })}
                alt={user.name || user.email}
                className="h-20 w-20 rounded-3xl border border-white/70 object-cover shadow-lg shadow-sky-100"
              />
              <div>
                <p className="text-sm font-medium text-sky-700">欢迎回来</p>
                <h1 className="mt-1 text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  {user.name || "你好，创作者"}
                </h1>
                <p className="mt-2 text-sm text-slate-500">{user.email}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  在这里管理你的 Agent、人生 Agent 与咨询记录。把你的经验整理得更完整，用户会更容易信任你、找到你。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:min-w-[360px]">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                  <div className={`inline-flex rounded-full bg-gradient-to-r ${item.accent} px-2.5 py-1 text-xs font-semibold text-white`}>
                    {item.label}
                  </div>
                  <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">快捷操作</h2>
                <p className="mt-1 text-sm text-slate-500">把最常用的入口放在一起，创建、管理和查看反馈都更顺手。</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
            <Link href="/life-agents/create">
              <motion.div
                className="block p-5 rounded-2xl glass-card group"
                whileHover={{ y: -2 }}
              >
                <span className="font-medium text-slate-800 group-hover:text-sky-700 transition-colors">
                  创建人生 Agent
                </span>
                <span className="block text-slate-500 text-sm mt-0.5">输入你的经验知识，生成可聊天的咨询页</span>
              </motion.div>
            </Link>
            <Link href="/agents/create">
              <motion.div
                className="block p-5 rounded-2xl glass-card group"
                whileHover={{ y: -2 }}
              >
                <span className="font-medium text-slate-800 group-hover:text-sky-700 transition-colors">
                  注册 Agent
                </span>
                <span className="block text-slate-500 text-sm mt-0.5">上架你的 Agent 服务</span>
              </motion.div>
            </Link>
            <Link href="/dashboard/life-agents">
              <motion.div
                className="block p-5 rounded-2xl glass-card group"
                whileHover={{ y: -2 }}
              >
                <span className="font-medium text-slate-800 group-hover:text-sky-700 transition-colors">
                  我的人生 Agent
                </span>
                <span className="block text-slate-500 text-sm mt-0.5">编辑资料、查看销量与聊天数据</span>
              </motion.div>
            </Link>
            <Link href="/dashboard/messages">
              <motion.div
                className="block p-5 rounded-2xl glass-card group"
                whileHover={{ y: -2 }}
              >
                <span className="font-medium text-slate-800 group-hover:text-sky-700 transition-colors">
                  消息
                </span>
                <span className="block text-slate-500 text-sm mt-0.5">查看并继续你和人生 Agent 的聊天记录</span>
              </motion.div>
            </Link>
            <Link href="/dashboard/feedback">
              <motion.div
                className="block p-5 rounded-2xl glass-card group"
                whileHover={{ y: -2 }}
              >
                <span className="font-medium text-slate-800 group-hover:text-sky-700 transition-colors">
                  用户反馈
                </span>
                <span className="block text-slate-500 text-sm mt-0.5">用户对你的人生 Agent 回复的评价汇总</span>
              </motion.div>
            </Link>
            <Link href="/life-agents">
              <motion.div
                className="block p-5 rounded-2xl glass-card group"
                whileHover={{ y: -2 }}
              >
                <span className="font-medium text-slate-800 group-hover:text-sky-700 transition-colors">
                  浏览人生 Agent
                </span>
                <span className="block text-slate-500 text-sm mt-0.5">查看展示页、购买提问次数并进入聊天</span>
              </motion.div>
            </Link>
            <Link href="/dashboard/api-keys">
              <motion.div
                className="block p-5 rounded-2xl glass-card group"
                whileHover={{ y: -2 }}
              >
                <span className="font-medium text-slate-800 group-hover:text-sky-700 transition-colors">
                  平台 API Key
                </span>
                <span className="block text-slate-500 text-sm mt-0.5">持 Key 调用平台 API（申请 Token、购买 License 等）</span>
              </motion.div>
            </Link>
            </div>
          </section>

          {/* <section className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">我创建的 Agent</h2>
                <p className="mt-1 text-sm text-slate-500">面向市场上架的 Agent 服务，支持查看状态和快速删除。</p>
              </div>
              <Link href="/agents" className="text-sm font-medium text-sky-600 hover:text-sky-700">
                查看市场
              </Link>
            </div>
          {dataLoading ? (
            <p className="mt-5 text-slate-500">加载中...</p>
          ) : !Array.isArray(agents) || agents.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-slate-500">
              还没有创建公开 Agent，去注册一个试试吧。
            </p>
          ) : (
            <ul className="mt-5 space-y-2">
              {agents.slice(0, 5).map((agent: Agent, i: number) => (
                <motion.li
                  key={agent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <Link href={`/agents/${agent.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-slate-700 hover:text-sky-700 transition-colors">
                      {agent.name}
                    </span>
                    <span className="text-xs text-slate-500">状态: {agent.status}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteAgent(agent.id)}
                    disabled={deletingAgentId === agent.id}
                    className="shrink-0 text-sm text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingAgentId === agent.id ? "删除中..." : "删除"}
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
          </section> */}
        </div>

        <div className="space-y-6">
          <section className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">我创建的人生 Agent</h2>
                <p className="mt-1 text-sm text-slate-500">查看你的个人经验分身、销量和后续管理入口。</p>
              </div>
            </div>
          {!Array.isArray(lifeAgentsCreated) || lifeAgentsCreated.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-slate-500">
              还没有人生 Agent，去创建一个，把你的经验变成可咨询主页。
            </p>
          ) : (
            <ul className="mt-5 space-y-2">
              {lifeAgentsCreated.slice(0, 5).map((la: LifeAgentCreated, i: number) => (
                <motion.li
                  key={la.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="py-2.5 sm:py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors group"
                >
                  <Link
                    href={`/dashboard/life-agents/${la.id}`}
                    className="min-w-0 flex justify-between items-center py-1 -my-1 touch-manipulation"
                  >
                    <span className="text-slate-700 group-hover:text-sky-700 truncate mr-2">
                      {la.displayName}
                    </span>
                    <span className="text-slate-500 text-sm shrink-0">
                      {la.soldPacks} 售出
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">我购买额度的人生 Agent</h2>
                <p className="mt-1 text-sm text-slate-500">继续咨询你已经购买过的顾问，直接进入聊天即可。</p>
              </div>
            </div>
          {!Array.isArray(lifeAgentsPurchased) || lifeAgentsPurchased.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-slate-500">
              还没有已购咨询额度，去逛逛人生 Agent 市场吧。
            </p>
          ) : (
            <ul className="mt-5 space-y-2">
              {lifeAgentsPurchased.slice(0, 5).map((la: LifeAgentPurchased, i: number) => (
                <motion.li
                  key={la.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/life-agents/${la.id}/chat`}
                    className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    <span className="text-slate-700 group-hover:text-sky-700 truncate flex-1 mr-2">
                      {la.displayName}
                    </span>
                    <span className="text-slate-500 text-sm shrink-0">
                      {la.remainingQuestions} 次剩余
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
          </section>
        </div>
      </div>
    </motion.div>
  );
}
