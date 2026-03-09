"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

type Agent = { id: string; name: string; status: string };
type LifeAgentCreated = { id: string; displayName: string; headline: string; knowledgeCount: number; sessionCount: number; soldPacks: number; totalRevenue: number };
type LifeAgentPurchased = { id: string; displayName: string; headline: string; pricePerQuestion: number; remainingQuestions: number };

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [lifeAgentsCreated, setLifeAgentsCreated] = useState<LifeAgentCreated[]>([]);
  const [lifeAgentsPurchased, setLifeAgentsPurchased] = useState<LifeAgentPurchased[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
        个人主页
      </h1>
      <p className="text-slate-500 mb-8">管理你的 Agents 与人生 Agent</p>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-slate-300 mb-4">快捷操作</h2>
          <div className="space-y-3">
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
                <span className="block text-slate-500 text-sm mt-0.5">用户对 AI 回复的反馈汇总</span>
              </motion.div>
            </Link>
            <Link href="/dashboard/chat-history">
              <motion.div
                className="block p-5 rounded-2xl glass-card group"
                whileHover={{ y: -2 }}
              >
                <span className="font-medium text-slate-800 group-hover:text-sky-700 transition-colors">
                  我的聊天记录
                </span>
                <span className="block text-slate-500 text-sm mt-0.5">查看并继续你和人生 Agent 的历史会话</span>
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
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 mb-4">我创建的人生 Agent</h2>
          {!Array.isArray(lifeAgentsCreated) || lifeAgentsCreated.length === 0 ? (
            <p className="text-slate-500">暂无，去创建一个吧</p>
          ) : (
            <ul className="space-y-2">
              {lifeAgentsCreated.slice(0, 5).map((la: LifeAgentCreated, i: number) => (
                <motion.li
                  key={la.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/dashboard/life-agents/${la.id}`}
                    className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    <span className="text-slate-700 group-hover:text-sky-700 truncate flex-1 mr-2">
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
          <p className="mt-1">
            <Link href="/dashboard/life-agents" className="text-sm text-sky-600 hover:text-sky-700">
              管理全部 →
            </Link>
          </p>

          <h2 className="font-semibold text-slate-800 mb-4 mt-6">我购买额度的人生 Agent</h2>
          {!Array.isArray(lifeAgentsPurchased) || lifeAgentsPurchased.length === 0 ? (
            <p className="text-slate-500">暂无，去购买后开始咨询</p>
          ) : (
            <ul className="space-y-2">
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
          <p className="mt-1">
            <Link href="/life-agents" className="text-sm text-sky-600 hover:text-sky-700">
              浏览更多 →
            </Link>
          </p>

        </div>
      </div>
    </motion.div>
  );
}
