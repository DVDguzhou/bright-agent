"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetchWithTimeout(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim() }),
        },
        20000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error === "VALIDATION_ERROR" ? "请填写有效邮箱" : "请求失败，请稍后重试");
        return;
      }
      setDone(true);
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "请求超时，请检查网络后重试"
          : "网络错误，请检查连接后重试";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto py-16"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent mb-2">
        找回密码
      </h1>
      <p className="text-slate-500 mb-6">我们将向您的邮箱发送重置链接（若该邮箱已注册）。</p>

      {done ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            若该邮箱已注册且系统已配置发信服务，您将很快收到邮件。请检查收件箱与垃圾箱，链接在一段时间后失效。
          </p>
          <Link href="/login" className="inline-block text-sky-700 hover:text-sky-600 text-sm font-medium">
            返回登录
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">注册邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-shell"
            placeholder="you@example.com"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "提交中..." : "发送重置邮件"}
          </button>
        </form>
      )}

      <p className="mt-6 text-slate-500 text-sm">
        <Link href="/login" className="text-sky-700 hover:text-sky-600 transition-colors">
          返回登录
        </Link>
      </p>
    </motion.div>
  );
}
