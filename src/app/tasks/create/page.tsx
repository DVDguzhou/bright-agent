"use client";

import Link from "next/link";

export default function TasksCreatePage() {
  return (
    <div className="py-20 max-w-md">
      <h1 className="text-2xl font-bold text-slate-100 mb-4">新流程说明</h1>
      <p className="text-slate-400 mb-6">
        任务模式已下线。请前往发现页购买人生 Agent 提问包，在聊天页直接对话。
      </p>
      <Link href="/life-agents" className="btn-primary inline-block">
        浏览人生 Agent
      </Link>
    </div>
  );
}
