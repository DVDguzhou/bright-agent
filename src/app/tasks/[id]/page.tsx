"use client";

import Link from "next/link";

export default function TaskDetailPage() {
  return (
    <div className="py-20 max-w-md">
      <h1 className="text-2xl font-bold text-slate-100 mb-4">任务已迁移</h1>
      <p className="text-slate-400 mb-6">
        任务模式已下线。请使用人生 Agent：购买提问包后在聊天页连续对话。
      </p>
      <Link href="/life-agents" className="btn-primary inline-block">
        浏览人生 Agent
      </Link>
    </div>
  );
}
