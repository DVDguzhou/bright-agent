"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { passwordSchema } from "@/lib/validators";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-16 text-center text-ink-300">加载中...</div>}>
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
    const pwdCheck = passwordSchema.safeParse(password);
    if (!pwdCheck.success) {
      setError(pwdCheck.error.errors[0]?.message ?? "请检查密码");
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
            : code === "PASSWORD_TOO_SHORT"
            ? "密码至少 8 位"
            : code === "PASSWORD_TOO_LONG"
            ? "密码不能超过 72 位"
            : code === "VALIDATION_ERROR"
            ? "请检查密码"
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
      <h1 className="text-3xl font-bold bg-gradient-to-r from-oxblood-600 to-oxblood-500 bg-clip-text text-transparent mb-2">
        设置新密码
      </h1>
      <p className="text-ink-400 mb-6">请输入新密码完成重置。</p>

      <form onSubmit={submit} className="space-y-5 rounded-3xl border border-hairline bg-paper p-6 shadow-sm">
        <label className="block text-sm font-medium text-ink-600">新密码（8–72 位）</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-shell"
          minLength={8}
          maxLength={72}
          required
        />
        <label className="block text-sm font-medium text-ink-600">确认新密码</label>
        <input
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="input-shell"
          minLength={8}
          maxLength={72}
          required
        />
        {error && <p className="text-oxblood-400 text-sm">{error}</p>}
        {!tokenFromUrl && <p className="text-oxblood-500 text-sm">缺少重置令牌，请从邮件中的链接打开本页。</p>}
        <button
          type="submit"
          disabled={loading || !tokenFromUrl}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "保存中..." : "保存并登录"}
        </button>
      </form>

      <p className="mt-6 text-ink-400 text-sm">
        <Link href="/login" className="text-oxblood-700 hover:text-oxblood-600 transition-colors">
          返回登录
        </Link>
      </p>
    </motion.div>
  );
}
