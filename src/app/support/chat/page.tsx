"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  OFFICIAL_CONTACT,
  PLATFORM_SUPPORT_LIFE_AGENT_ID,
  officialMailtoUrl,
} from "@/lib/official-contact";

/** 与全局纸面背景 `--paper` 保持一致，避免顶部和内容区色差。 */
const SUPPORT_PAGE_BG = "#f4efe6";

const SUPPORT_TOPICS = [
  { title: "账号与登录", desc: "注册、验证码、密码、微信/手机号绑定" },
  { title: "购买与提问包", desc: "支付、剩余次数、已购 Agent 无法使用" },
  { title: "认证与 Agent", desc: "人生 Agent 认证、资料修改、音色与对话" },
] as const;

const pageShellClass =
  "relative left-1/2 flex min-h-[calc(100dvh-env(safe-area-inset-bottom)-4.25rem)] w-screen max-w-none -translate-x-1/2 flex-col pb-24 lg:min-h-[calc(100dvh-6rem)] lg:pb-8";
const contentClass = "mx-auto w-full max-w-2xl";
const cardClass = "rounded-2xl bg-[#f4efe6] shadow-sm ring-1 ring-black/[0.08]";

export default function SupportChatPage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(!!PLATFORM_SUPPORT_LIFE_AGENT_ID);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!PLATFORM_SUPPORT_LIFE_AGENT_ID) {
      setRedirecting(false);
      return;
    }
    router.replace(`/life-agents/${PLATFORM_SUPPORT_LIFE_AGENT_ID}/chat`);
  }, [router]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(OFFICIAL_CONTACT.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (redirecting) {
    return (
      <div
        className={`${pageShellClass} flex items-center justify-center px-4`}
        style={{ backgroundColor: SUPPORT_PAGE_BG }}
      >
        <p className="text-sm text-slate-500">正在打开客服对话…</p>
      </div>
    );
  }

  return (
    <div className={pageShellClass} style={{ backgroundColor: SUPPORT_PAGE_BG }}>
      <header className={`${contentClass} flex items-center gap-3 px-4 pb-4 pt-[max(0.25rem,env(safe-area-inset-top))]`}>
        <Link
          href="/map"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4efe6] text-[#111] shadow-sm ring-1 ring-black/[0.08] transition active:bg-[#eee7db]"
          aria-label="返回地图"
          title="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="flex-1 text-[26px] font-bold leading-tight tracking-tight text-[#111]">联系客服</h1>
      </header>

      <div className={`${contentClass} flex flex-1 flex-col gap-4 px-4`}>
        <section className={`${cardClass} px-5 py-5`}>
          <p className="text-[15px] font-semibold text-[#111]">邮件联系 BrightAgent</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {OFFICIAL_CONTACT.description}。请发邮件说明你的账号、订单或认证问题，我们会尽快回复。
            {OFFICIAL_CONTACT.replyHint ? (
              <span className="mt-1 block text-slate-500">{OFFICIAL_CONTACT.replyHint}</span>
            ) : null}
          </p>
          <p className="mt-4 break-all text-base font-semibold tracking-tight text-[#111]">
            {OFFICIAL_CONTACT.email}
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <a
              href={officialMailtoUrl()}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#111] px-6 py-3.5 text-sm font-semibold text-white active:opacity-90"
            >
              发送邮件至 {OFFICIAL_CONTACT.email}
            </a>
            <button
              type="button"
              onClick={() => void copyEmail()}
              className="inline-flex w-full items-center justify-center rounded-full border border-black/[0.08] bg-[#f4efe6] px-6 py-3 text-sm font-semibold text-[#111] active:bg-[#eee7db]"
            >
              {copied ? "已复制邮箱" : "复制邮箱地址"}
            </button>
          </div>
        </section>

        <section className={`${cardClass} px-4 py-4`}>
          <h2 className="text-sm font-semibold text-[#111]">写信时请尽量包含</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
            <li>· 注册邮箱或手机号</li>
            <li>· 问题类型与出现时间</li>
            <li>· 相关 Agent 名称或订单信息（如有）</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-slate-500">常见问题类型</h2>
          {SUPPORT_TOPICS.map((item) => (
            <div
              key={item.title}
              className="rounded-xl bg-[#f4efe6] px-4 py-3 ring-1 ring-black/[0.06]"
            >
              <p className="text-[15px] font-medium text-[#111]">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </section>

        <p className="px-1 pb-2 text-center text-xs text-slate-400">
          <Link href="/privacy" className="text-sky-700 hover:text-sky-600">
            隐私政策
          </Link>
        </p>
      </div>
    </div>
  );
}
