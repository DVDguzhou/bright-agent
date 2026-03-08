"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isBuyer, setIsBuyer] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name: name || undefined,
        isBuyer,
        isSeller,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(
        data.error === "EMAIL_EXISTS"
          ? "该邮箱已被注册"
          : data.error === "VALIDATION_ERROR"
          ? "请检查输入"
          : "注册失败"
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto py-16"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent mb-2">
        注册
      </h1>
      <p className="text-slate-500 mb-8">创建你的 AI Agent Marketplace 账号</p>
      <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-shell"
            placeholder="you@example.com"
            required
          />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <label className="block text-sm font-medium text-slate-700 mb-2">密码（至少6位）</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-shell"
            minLength={6}
            required
          />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <label className="block text-sm font-medium text-slate-700 mb-2">用户名（可选）</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-shell"
            placeholder="显示名称"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex gap-6"
        >
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isBuyer}
              onChange={(e) => setIsBuyer(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500/40"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-900">买方</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isSeller}
              onChange={(e) => setIsSeller(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500/40"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-900">卖方</span>
          </label>
        </motion.div>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
            {error}
          </motion.p>
        )}
        <motion.button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.99 }}
        >
          {loading ? "注册中..." : "注册"}
        </motion.button>
      </form>
      <p className="mt-6 text-slate-500 text-sm">
        已有账号？{" "}
        <Link href="/login" className="text-sky-700 hover:text-sky-600 transition-colors">
          登录
        </Link>
      </p>
    </motion.div>
  );
}
