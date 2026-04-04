"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OFFICIAL_CONTACT, PLATFORM_SUPPORT_LIFE_AGENT_ID } from "@/lib/official-contact";

export default function SupportChatPage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(!!PLATFORM_SUPPORT_LIFE_AGENT_ID);

  useEffect(() => {
    if (!PLATFORM_SUPPORT_LIFE_AGENT_ID) {
      setRedirecting(false);
      return;
    }
    router.replace(`/life-agents/${PLATFORM_SUPPORT_LIFE_AGENT_ID}/chat`);
  }, [router]);

  if (redirecting) {
    return (
      <div className="flex min-h-[50vh] max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] items-center justify-center px-4 max-lg:-mx-4 max-lg:bg-white">
        <p className="text-sm text-slate-500">正在打开客服对话…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col bg-white max-lg:-mx-4 max-lg:min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] max-lg:pb-24 lg:min-h-[60vh]">
      <header className="flex items-center gap-3 px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0">
        <Link
          href="/map"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#111] transition active:bg-slate-200"
          aria-label="返回地图"
          title="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="flex-1 text-[26px] font-bold leading-tight tracking-tight text-[#111]">联系客服</h1>
      </header>

      <div className="flex flex-1 flex-col px-4 pb-8 sm:px-0">
        <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
          <p className="text-[15px] font-medium text-[#111]">平台暂未接入在线客服 Agent</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            请发邮件至官方邮箱，说明你的账号、订单或认证问题，我们会尽快回复。若已在后台配置{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
              NEXT_PUBLIC_PLATFORM_SUPPORT_AGENT_ID
            </code>
            ，保存并重新构建后，此处将直接进入与客服 Agent 的对话页。
          </p>
          <a
            href={`mailto:${OFFICIAL_CONTACT.email}?subject=${encodeURIComponent("BrightAgent 用户咨询")}`}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#111] px-6 py-3 text-sm font-semibold text-white active:opacity-90 sm:w-auto"
          >
            发送邮件至 {OFFICIAL_CONTACT.email}
          </a>
        </div>
      </div>
    </div>
  );
}
