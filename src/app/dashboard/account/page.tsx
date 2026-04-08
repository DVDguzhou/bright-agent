"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk(false);
    if (newPassword.length < 6) {
      setError("新密码至少 6 位");
      return;
    }
    if (newPassword !== newPassword2) {
      setError("两次输入的新密码不一致");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithTimeout(
        "/api/auth/change-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ oldPassword, newPassword }),
        },
        20000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data.error as string | undefined;
        setError(
          code === "WRONG_PASSWORD"
            ? "当前密码不正确"
            : code === "VALIDATION_ERROR"
            ? "请检查输入"
            : code === "UNAUTHORIZED"
            ? "请先登录"
            : "修改失败，请稍后重试"
        );
        return;
      }
      setOk(true);
      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "请求超时，请检查网络后重试"
          : "网络错误，请检查连接后重试";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="max-w-md mx-auto py-16 text-center text-slate-400">加载中...</div>;
  }

  const placeholder = user.email?.endsWith("@placeholder.local");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto py-10 px-4"
    >
      <h1 className="text-2xl font-bold text-slate-900 mb-1">账号与安全</h1>
      <p className="text-slate-500 text-sm mb-8">登录邮箱：{user.email}</p>

      {placeholder ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
          当前账号通过微信或手机号注册，无独立邮箱密码。如需邮箱登录，请使用「注册」绑定新邮箱账号。
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">修改密码</h2>
          <label className="block text-sm font-medium text-slate-700">当前密码</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="input-shell"
            required
          />
          <label className="block text-sm font-medium text-slate-700">新密码（至少 6 位）</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-shell"
            minLength={6}
            required
          />
          <label className="block text-sm font-medium text-slate-700">确认新密码</label>
          <input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            className="input-shell"
            minLength={6}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {ok && <p className="text-emerald-600 text-sm">密码已更新。</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "保存中..." : "保存新密码"}
          </button>
        </form>
      )}

      <p className="mt-8 text-slate-500 text-sm">
        <Link href="/dashboard" className="text-sky-700 hover:text-sky-600">
          返回工作台
        </Link>
      </p>
    </motion.div>
  );
}
