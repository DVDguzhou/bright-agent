"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { getDisplayAvatar } from "@/lib/avatar";
import { signupSchema } from "@/lib/validators";

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

function signupErrorMessage(code: string | undefined) {
  switch (code) {
    case "EMAIL_EXISTS":
      return "该邮箱已被注册";
    case "NAME_EXISTS":
      return "该用户名已被使用，请换一个";
    case "INVALID_EMAIL":
      return "不能使用此类邮箱注册，请使用真实邮箱";
    case "INVALID_CODE":
      return "验证码错误或已过期，请重新获取";
    case "PASSWORD_TOO_SHORT":
      return "密码至少 8 位";
    case "PASSWORD_TOO_LONG":
      return "密码不能超过 72 位";
    case "TERMS_REQUIRED":
      return "请阅读并同意隐私政策";
    case "RATE_LIMITED":
      return "操作过于频繁，请稍后再试";
    case "EMAIL_SEND_FAILED":
      return "邮件发送失败，请稍后重试";
    case "VALIDATION_ERROR":
      return "请检查输入";
    default:
      return "注册失败";
  }
}

export default function SignupPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const previewAvatar = getDisplayAvatar({ avatarUrl, name, email });

  const startCountdown = () => {
    setCodeCountdown(60);
    const timer = setInterval(() => {
      setCodeCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const sendVerificationCode = async () => {
    const em = email.trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("请输入有效邮箱");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetchWithTimeout(
        "/api/auth/signup/send-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: em }),
        },
        20000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(signupErrorMessage(data.error as string | undefined));
        return;
      }
      setCodeSent(true);
      startCountdown();
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

    const parsed = signupSchema.safeParse({
      email: email.trim(),
      password,
      name: name.trim(),
      verificationCode: verificationCode.trim(),
      acceptTerms: acceptTerms ? true : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "请检查输入");
      return;
    }
    if (!codeSent) {
      setError("请先获取邮箱验证码");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithTimeout(
        "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: parsed.data.email,
            password: parsed.data.password,
            name: parsed.data.name,
            verificationCode: parsed.data.verificationCode,
            acceptTerms: true,
            avatarUrl: avatarUrl || undefined,
          }),
        },
        20000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(signupErrorMessage(data.error as string | undefined));
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
        注册
      </h1>
      <p className="text-ink-400 mb-8">验证邮箱后即可创建账号</p>
      <form onSubmit={submit} className="space-y-5 rounded-3xl border border-hairline bg-paper p-6 shadow-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-hairline bg-paper-50/70 p-5"
        >
          <div className="flex items-start gap-4">
            <img
              src={previewAvatar}
              alt="头像预览"
              className="h-20 w-20 shrink-0 rounded-3xl border border-paper/70 object-cover shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-700">头像</p>
              <p className="mt-1 text-xs leading-5 text-ink-400">
                可上传你的头像；如果不上传，将使用默认头像。
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
                    className="rounded-xl border border-hairline bg-paper px-4 py-2 text-sm font-medium text-ink-500 transition-colors hover:border-hairline hover:text-ink"
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
          <label className="block text-sm font-medium text-ink-600 mb-2">邮箱</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (codeSent) {
                  setCodeSent(false);
                  setVerificationCode("");
                }
              }}
              className="input-shell min-w-0 flex-1"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <button
              type="button"
              onClick={sendVerificationCode}
              disabled={loading || codeCountdown > 0}
              className="btn-secondary shrink-0 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {codeCountdown > 0 ? `${codeCountdown}s` : codeSent ? "重新发送" : "发送验证码"}
            </button>
          </div>
          {codeSent ? (
            <p className="mt-2 text-xs text-ink-400">验证码已发送至邮箱，10 分钟内有效</p>
          ) : null}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
          <label className="block text-sm font-medium text-ink-600 mb-2">邮箱验证码</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="input-shell tracking-[0.3em]"
            placeholder="6 位数字"
            maxLength={6}
            required
          />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <label className="block text-sm font-medium text-ink-600 mb-2">用户名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-shell"
            placeholder="2-32 位，用于展示"
            minLength={2}
            maxLength={32}
            autoComplete="username"
            required
          />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <label className="block text-sm font-medium text-ink-600 mb-2">密码（8–72 位）</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-shell"
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            required
          />
          <p className="mt-1.5 text-xs text-ink-400">建议使用不易猜测的 passphrase，无需强制大小写或符号</p>
        </motion.div>

        <label className="flex items-start gap-2 text-sm text-ink-500">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-hairline"
            required
          />
          <span>
            我已阅读并同意{" "}
            <Link href="/privacy" className="text-oxblood-700 hover:text-oxblood-600 underline-offset-2 hover:underline">
              《隐私政策》
            </Link>
          </span>
        </label>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-oxblood-400 text-sm">
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
      <p className="mt-4 text-ink-400 text-sm">
        已有账号？{" "}
        <Link href="/login" className="text-oxblood-700 hover:text-oxblood-600 transition-colors">
          登录
        </Link>
      </p>
    </motion.div>
  );
}
