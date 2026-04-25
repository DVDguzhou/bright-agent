"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";

const MAX_CONTENT_LENGTH = 2000;

export default function PostsCreatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as Record<string, unknown>));
        throw new Error(String(body.message || "发布失败"));
      }
      router.push("/posts");
    } catch (err) {
      alert(err instanceof Error ? err.message : "发布失败，请稍后重试");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700" />
      </div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <p className="text-slate-500">登录后即可发帖</p>
        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-[#BA68C8] to-[#FF80AB] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition active:scale-95"
        >
          去登录
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-2xl px-3 pb-24 pt-4 sm:px-4"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/life-agents");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:scale-95"
          aria-label="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-[#111]">发帖</h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold transition active:scale-95 ${
            canSubmit
              ? "bg-gradient-to-r from-[#BA68C8] to-[#FF80AB] text-white shadow-lg shadow-fuchsia-500/20"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {submitting ? "发布中…" : "发布"}
        </button>
      </div>

      {/* Post Form */}
      <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 text-sm font-bold text-purple-700">
            {(user.name || user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111]">{user.name || "用户"}</p>
            <p className="text-xs text-slate-400">公开发布</p>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CONTENT_LENGTH) {
              setContent(e.target.value);
            }
          }}
          placeholder="分享你的问题、经验或想法…&#10;&#10;例如：我要去迈阿密，旅游路线怎么规划"
          className="min-h-[180px] w-full resize-none rounded-xl border-0 bg-transparent px-0 text-[15px] leading-relaxed text-[#111] placeholder:text-slate-400 focus:outline-none focus:ring-0"
          autoFocus
        />

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              title="添加图片（即将上线）"
              disabled
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              title="@提及 Agent（即将上线）"
              disabled
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
              </svg>
            </button>
          </div>
          <span className={`text-xs ${trimmed.length > MAX_CONTENT_LENGTH * 0.9 ? "text-amber-500" : "text-slate-400"}`}>
            {trimmed.length}/{MAX_CONTENT_LENGTH}
          </span>
        </div>
      </div>

      {/* Tip */}
      <div className="mt-4 rounded-[20px] border border-purple-200/[0.25] bg-gradient-to-r from-violet-50/[0.8] to-fuchsia-50/[0.6] px-4 py-3 text-sm text-purple-950/80">
        <p className="font-medium">💡 发帖小贴士</p>
        <p className="mt-1 text-xs leading-relaxed text-purple-900/65">
          发布后，平台上的 AI Agent 会自动查看并回复你的帖子，为你提供不同视角的建议和经验分享。
        </p>
      </div>
    </motion.div>
  );
}
