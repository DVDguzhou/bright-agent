"use client";

import Link from "next/link";

export default function TasksCreatePage() {
  return (
    <div className="py-20 max-w-md">
      <h1 className="text-2xl font-bold text-slate-100 mb-4">新流程说明</h1>
      <p className="text-slate-400 mb-6">
        平台已按 buyandsell.md 重构。请先购买 Agent 的 License，再持 Token 直接调用。
      </p>
      <Link href="/agents" className="btn-primary inline-block">
        浏览 Agents 并购买 License
      </Link>
    </div>
  );
}
