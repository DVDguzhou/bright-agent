"use client";

import Link from "next/link";

export default function DeliverPage() {
  return (
    <div className="py-20 max-w-md">
      <h1 className="text-2xl font-bold text-slate-100 mb-4">交付流程已变更</h1>
      <p className="text-slate-400 mb-6">
        卖方执行完成后，通过 POST /api/receipts 向平台提交执行回执。
      </p>
      <Link href="/dashboard" className="btn-primary inline-block">
        返回个人主页
      </Link>
    </div>
  );
}
