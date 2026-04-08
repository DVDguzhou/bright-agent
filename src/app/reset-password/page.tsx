"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-16 text-center text-slate-400">加载中...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch } = useAuth();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    if (password !== password2) {
      setError("两次输入的密码不一致");
      return;
    }
    const token = tokenFromUrl;
    if (!token) {
      setError("链接无效或已过期，请重新申请找回密码");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(
        "/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token, password }),
        },
        20000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data.error as string | undefined;
        setError(
          code === "INVALID_TOKEN" || code === "TOKEN_EXPIRED"
            ? "链接无效或已过期，请重新申请找回密码"
            : code === "VALIDATION_ERROR"
            ? "密码至少 6 位"
            : "重置失败，请稍后重试"
        );
        return;
      }
      await refetch();
      router.push("/dashboard");
      router.refresh();
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
        设置新密码
      </h1>
      <p className="text-slate-500 mb-6">请输入新密码完成重置。</p>

      <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">新密码（至少 6 位）</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-shell"
          minLength={6}
          required
        />
        <label className="block text-sm font-medium text-slate-700">确认新密码</label>
        <input
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="input-shell"
          minLength={6}
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {!tokenFromUrl && <p className="text-amber-600 text-sm">缺少重置令牌，请从邮件中的链接打开本页。</p>}
        <button
          type="submit"
          disabled={loading || !tokenFromUrl}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "保存中..." : "保存并登录"}
        </button>
      </form>

      <p className="mt-6 text-slate-500 text-sm">
        <Link href="/login" className="text-sky-700 hover:text-sky-600 transition-colors">
          返回登录
        </Link>
      </p>
    </motion.div>
  );
}
