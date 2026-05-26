"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { passwordSchema } from "@/lib/validators";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk(false);
    const pwdCheck = passwordSchema.safeParse(newPassword);
    if (!pwdCheck.success) {
      setError(pwdCheck.error.errors[0]?.message ?? "请检查新密码");
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
            : code === "PASSWORD_TOO_SHORT"
            ? "新密码至少 8 位"
            : code === "PASSWORD_TOO_LONG"
            ? "新密码不能超过 72 位"
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

  const deleteAccount = async () => {
    setDeleteError("");
    if (deleteConfirm.trim() !== "DELETE") {
      setDeleteError('请在下方输入大写 DELETE 以确认注销');
      return;
    }
    setDeleting(true);
    try {
      const body: { confirm: string; password?: string } = { confirm: "DELETE" };
      if (!placeholder && deletePassword) {
        body.password = deletePassword;
      }
      const res = await fetchWithTimeout(
        "/api/auth/account",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        },
        30000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data.error as string | undefined;
        setDeleteError(
          code === "WRONG_PASSWORD"
            ? "密码不正确"
            : code === "PASSWORD_REQUIRED"
            ? "请输入当前密码以确认注销"
            : code === "CONFIRM_REQUIRED"
            ? '请输入 DELETE 确认'
            : "注销失败，请稍后重试"
        );
        return;
      }
      router.replace("/login?deleted=1");
    } catch {
      setDeleteError("网络错误，请稍后重试");
    } finally {
      setDeleting(false);
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
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-paper p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">修改密码</h2>
          <label className="block text-sm font-medium text-slate-700">当前密码</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="input-shell"
            required
          />
          <label className="block text-sm font-medium text-slate-700">新密码（8–72 位）</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-shell"
            minLength={8}
            maxLength={72}
            required
          />
          <label className="block text-sm font-medium text-slate-700">确认新密码</label>
          <input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            className="input-shell"
            minLength={8}
            maxLength={72}
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

      <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-900">注销账号</h2>
        <p className="mt-2 text-sm text-red-800/90 leading-relaxed">
          永久删除账号及关联的个人资料、对话记录、已购提问包等数据，且无法恢复。若你创建了人生 Agent，也会一并删除。
        </p>
        {!placeholder && (
          <>
            <label className="mt-4 block text-sm font-medium text-red-900">当前密码</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="input-shell mt-1"
              autoComplete="current-password"
            />
          </>
        )}
        <label className="mt-4 block text-sm font-medium text-red-900">
          输入 <span className="font-mono">DELETE</span> 确认注销
        </label>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          className="input-shell mt-1 font-mono"
          placeholder="DELETE"
          autoComplete="off"
        />
        {deleteError && <p className="mt-2 text-red-600 text-sm">{deleteError}</p>}
        <button
          type="button"
          onClick={deleteAccount}
          disabled={deleting}
          className="mt-4 w-full rounded-xl border border-red-300 bg-paper py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "注销中…" : "永久注销账号"}
        </button>
      </div>

      <div className="mt-8 space-y-2 text-sm text-slate-500">
        <p>
          <Link href="/privacy" className="text-sky-700 hover:text-sky-600">
            隐私政策
          </Link>
        </p>
        <p>
          <Link href="/dashboard" className="text-sky-700 hover:text-sky-600">
            返回工作台
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
