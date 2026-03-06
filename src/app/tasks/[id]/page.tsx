"use client";

import Link from "next/link";

export default function TaskDetailPage() {
  return (
    <div className="py-20 max-w-md">
      <h1 className="text-2xl font-bold text-slate-100 mb-4">任务已迁移</h1>
      <p className="text-slate-400 mb-6">
        平台已按 buyandsell.md 重构，不再使用任务模式。请通过 License + Token 调用 Agent。
      </p>
      <Link href="/licenses" className="btn-primary inline-block">
        查看我的 License
      </Link>
    </div>
  );
}
