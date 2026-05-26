import type { Metadata } from "next";
import Link from "next/link";
import {
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_SITE_URL,
} from "@/lib/privacy-policy-content";

export const metadata: Metadata = {
  title: "隐私政策 · BrightAgent",
  description: "BrightAgent 隐私政策：说明我们如何收集、使用、存储及保护您的个人信息。",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl pb-16">
      <header className="mb-10 border-b border-hairline/80 pb-8">
        <p className="text-sm font-medium text-ink-400">BrightAgent</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">隐私政策</h1>
        <p className="mt-3 text-sm text-ink-500">
          生效日期：{PRIVACY_POLICY_EFFECTIVE_DATE}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
          欢迎使用 BrightAgent。我们重视您的个人信息与隐私保护。本政策说明我们如何收集、使用、存储及保护您的信息。
        </p>
      </header>

      <div className="space-y-10">
        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-ink-600">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-12 rounded-2xl border border-hairline bg-paper/80 p-6 text-sm text-ink-500">
        <p>
          联系我们：
          <a
            href={PRIVACY_POLICY_SITE_URL}
            className="ml-1 text-oxblood-700 underline-offset-2 hover:text-oxblood-600 hover:underline"
            rel="noopener noreferrer"
          >
            {PRIVACY_POLICY_SITE_URL}
          </a>
        </p>
        <p className="mt-4">
          <Link href="/life-agents" className="text-oxblood-700 hover:text-oxblood-600">
            返回发现页
          </Link>
        </p>
      </footer>
    </article>
  );
}
