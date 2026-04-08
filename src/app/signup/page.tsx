"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { getDisplayAvatar } from "@/lib/avatar";

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片格式不支持"));
    img.src = fileDataUrl;
  });

  const maxSize = 256;
  const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("图片处理失败");
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export default function SignupPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const previewAvatar = getDisplayAvatar({ avatarUrl, name, email });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件作为头像");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("头像图片不能超过 8MB");
      return;
    }
    setError("");
    setAvatarUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch {
      setError("头像处理失败，请换一张图片重试");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetchWithTimeout(
        "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
            name: name.trim(),
            avatarUrl: avatarUrl || undefined,
          }),
        },
        20000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error === "EMAIL_EXISTS"
            ? "该邮箱已被注册"
            : data.error === "NAME_EXISTS"
            ? "该用户名已被使用，请换一个"
            : data.error === "INVALID_EMAIL"
            ? "不能使用此类邮箱注册，请使用真实邮箱"
            : data.error === "VALIDATION_ERROR"
            ? "请检查输入"
            : "注册失败"
        );
        return;
      }
      await refetch(); // 刷新登录状态后再跳转
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
        注册
      </h1>
      <p className="text-slate-500 mb-8">创建你的 AI Agent Marketplace 账号</p>
      <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
        >
          <div className="flex items-start gap-4">
            <img
              src={previewAvatar}
              alt="头像预览"
              className="h-20 w-20 shrink-0 rounded-3xl border border-white/70 object-cover shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">头像</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                可上传你的头像；如果不上传，系统会自动生成一个默认头像。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  {avatarUploading ? "处理中..." : avatarUrl ? "更换头像" : "上传头像"}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                  >
                    使用默认头像
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </motion.div>
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
          <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-shell"
            placeholder="2-32 位，用于展示"
            minLength={2}
            maxLength={32}
            required
          />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
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
