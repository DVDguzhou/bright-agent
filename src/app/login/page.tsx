"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { LOGIN_SHOW_PHONE, LOGIN_SHOW_WECHAT } from "@/lib/login-features";

type Tab = "email" | "wechat" | "phone";
type EmailLoginMode = "code" | "password";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-16 text-center text-ink-300">加载中...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch } = useAuth();
  const tabs = useMemo(() => {
    const list: { key: Tab; label: string }[] = [{ key: "email", label: "邮箱" }];
    if (LOGIN_SHOW_WECHAT) list.push({ key: "wechat", label: "微信" });
    if (LOGIN_SHOW_PHONE) list.push({ key: "phone", label: "手机号" });
    return list;
  }, []);
  const [tab, setTab] = useState<Tab>("email");
  const [emailLoginMode, setEmailLoginMode] = useState<EmailLoginMode>("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");
  const showTabBar = tabs.length > 1;

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetchWithTimeout(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        },
        20000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data.error as string | undefined;
        const msg =
          errCode === "INVALID_CREDENTIALS"
            ? "邮箱或密码错误"
            : errCode === "USE_OTHER_LOGIN"
            ? LOGIN_SHOW_WECHAT || LOGIN_SHOW_PHONE
              ? "该账号请使用微信或手机号登录"
              : "该账号请使用注册时的登录方式，或联系客服"
            : errCode === "VALIDATION_ERROR"
            ? "请填写有效的邮箱和密码"
            : "登录失败";
        setError(msg);
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

  const handleWeChatLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/wechat/redirect", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error === "WECHAT_NOT_CONFIGURED" ? "微信登录未配置" : "获取授权链接失败");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("获取授权链接失败");
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter(60);
    const timer = setInterval(() => {
      setter((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const sendEmailCode = async () => {
    const em = email.trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("请输入有效邮箱");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: em }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error === "EMAIL_SEND_FAILED"
            ? "邮件发送失败，请稍后重试或检查发信配置"
            : data.error === "EMAIL_NOT_REGISTERED"
            ? "该邮箱尚未注册，请先注册"
            : data.error === "VALIDATION_ERROR"
            ? "请输入有效邮箱"
            : "发送失败"
        );
        return;
      }
      setEmailOtpSent(true);
      startCountdown(setEmailOtpCountdown);
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  const submitEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    if (!em) {
      setError("请输入邮箱");
      return;
    }
    if (!emailOtp.trim()) {
      setError("请输入验证码");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetchWithTimeout(
        "/api/auth/email/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: em, code: emailOtp.trim() }),
        },
        20000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error === "INVALID_CODE"
            ? "验证码错误或已过期"
            : data.error === "VALIDATION_ERROR"
            ? "请检查输入"
            : "验证失败"
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

  const sendCode = async () => {
    const p = phone.replace(/\s/g, "").replace(/^\+86/, "");
    if (!/^1[3-9]\d{9}$/.test(p)) {
      setError("请输入正确的手机号");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: p }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error === "SMS_SEND_FAILED" ? "发送验证码失败" : data.error === "INVALID_PHONE" ? "手机号格式错误" : "发送失败"
        );
        return;
      }
      setCodeSent(true);
      startCountdown(setCountdown);
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = phone.replace(/\s/g, "").replace(/^\+86/, "");
    if (!/^1[3-9]\d{9}$/.test(p)) {
      setError("请输入正确的手机号");
      return;
    }
    if (!code.trim()) {
      setError("请输入验证码");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: p, code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error === "INVALID_CODE" ? "验证码错误或已过期" : data.error === "INVALID_PHONE" ? "手机号格式错误" : "验证失败"
        );
        return;
      }
      await refetch();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md py-12 sm:py-16"
    >
      <h1 className="mb-2 text-3xl font-semibold text-ink [text-wrap:balance]">
        登录
      </h1>
      <p className="text-ink-400 mb-6">欢迎回来</p>

      {showTabBar && (
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.key ? "bg-ink text-paper" : "bg-white/70 text-ink-500 hover:bg-paper-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {(urlError || error) && (
        <p className="mb-4 text-oxblood-400 text-sm">
          {urlError === "invalid_code" && "授权失败，请重试"}
          {LOGIN_SHOW_WECHAT && urlError === "wechat_not_configured" && "微信登录未配置"}
          {LOGIN_SHOW_WECHAT && urlError === "invalid_state" && "登录状态已失效，请重新点击微信登录"}
          {urlError === "missing_code" && "未收到授权码，请重试"}
          {LOGIN_SHOW_WECHAT && urlError === "network_error" && "连接微信失败，请检查网络后重试"}
          {LOGIN_SHOW_WECHAT && urlError === "invalid_response" && "微信返回异常，请稍后重试"}
          {urlError === "create_failed" && "创建账号失败，请稍后重试"}
          {urlError &&
            ![
              "invalid_code",
              "wechat_not_configured",
              "invalid_state",
              "missing_code",
              "network_error",
              "invalid_response",
              "create_failed",
            ].includes(urlError) &&
            "登录出现问题，请重试"}
          {!urlError && error}
        </p>
      )}

      {tab === "email" && emailLoginMode === "code" && (
        <form onSubmit={submitEmailOtp} className="app-panel space-y-5 p-6">
          <p className="text-sm text-ink-500">
            {LOGIN_SHOW_PHONE ? "验证码将发送至邮箱，与手机号登录相同流程。" : "验证码将发送至你的注册邮箱。"}
          </p>
          <label className="block text-sm font-medium text-ink-600">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-shell"
            placeholder="you@example.com"
            required
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value)}
              className="input-shell flex-1"
              placeholder="邮箱验证码"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <button
              type="button"
              onClick={sendEmailCode}
              disabled={loading || emailOtpCountdown > 0}
              className="btn-secondary whitespace-nowrap px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailOtpCountdown > 0 ? `${emailOtpCountdown}s` : emailOtpSent ? "重新发送" : "获取验证码"}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "验证中..." : "登录"}
          </button>
          <p className="text-center text-sm text-ink-400">
            <button
              type="button"
              className="text-oxblood-700 hover:text-oxblood-600"
              onClick={() => {
                setEmailLoginMode("password");
                setError("");
              }}
            >
              使用密码登录
            </button>
          </p>
        </form>
      )}

      {tab === "email" && emailLoginMode === "password" && (
        <form onSubmit={submitEmail} className="app-panel space-y-5 p-6">
          <label className="block text-sm font-medium text-ink-600">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-shell"
            placeholder="you@example.com"
            required
          />
          <label className="block text-sm font-medium text-ink-600">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-shell"
            placeholder="••••••••"
            required
          />
          <div className="flex justify-end text-sm">
            <Link href="/forgot-password" className="text-oxblood-700 hover:text-oxblood-600 transition-colors">
              忘记密码？
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "登录中..." : "登录"}
          </button>
          <p className="text-center text-sm text-ink-400">
            <button
              type="button"
              className="text-oxblood-700 hover:text-oxblood-600"
              onClick={() => {
                setEmailLoginMode("code");
                setError("");
              }}
            >
              使用邮箱验证码登录
            </button>
          </p>
        </form>
      )}

      {LOGIN_SHOW_WECHAT && tab === "wechat" && (
        <div className="app-panel p-6">
          <p className="text-ink-500 text-sm mb-6">点击下方按钮跳转至微信授权页面</p>
          <button
            type="button"
            onClick={handleWeChatLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#07c160] text-paper font-medium hover:bg-[#06ad56] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578-.857-1.98.857-5.245C11.31 3.666 10.318 2.188 8.691 2.188zm.405 2.376c.584 0 1.06.475 1.06 1.06.001.584-.475 1.06-1.06 1.06-.584 0-1.06-.475-1.06-1.06 0-.585.476-1.06 1.06-1.06zm4.065 0c.584 0 1.06.475 1.06 1.06.001.584-.475 1.06-1.06 1.06-.584 0-1.06-.475-1.06-1.06 0-.585.476-1.06 1.06-1.06zm4.318 2.898c-.072-1.08-.543-2.1-1.352-2.907-1.02-1.02-2.43-1.582-3.91-1.582-2.42 0-4.392 1.97-4.392 4.392 0 .96.31 1.89.89 2.69l.12.163-.051 1.02.923-.49a1.5 1.5 0 0 1 .8-.24c.66 0 1.29.21 1.81.59.82-.55 1.42-1.33 1.73-2.2.39-.02.77-.08 1.14-.13.18-.02.36-.05.54-.08.02-.16.01-.32-.01-.48z" />
            </svg>
            {loading ? "跳转中..." : "微信扫码登录"}
          </button>
        </div>
      )}

      {LOGIN_SHOW_PHONE && tab === "phone" && (
        <form onSubmit={submitPhone} className="app-panel space-y-5 p-6">
          <label className="block text-sm font-medium text-ink-600">手机号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-shell"
            placeholder="13800138000"
            maxLength={11}
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-shell flex-1"
              placeholder="验证码"
              maxLength={6}
            />
            <button
              type="button"
              onClick={sendCode}
              disabled={loading || countdown > 0}
              className="btn-secondary whitespace-nowrap px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {countdown > 0 ? `${countdown}s` : codeSent ? "重新发送" : "获取验证码"}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "验证中..." : "登录"}
          </button>
        </form>
      )}

      <p className="mt-6 text-ink-400 text-sm">
        没有账号？{" "}
        <Link href="/signup" className="text-oxblood-700 hover:text-oxblood-600 transition-colors">
          注册
        </Link>
      </p>
      <p className="mt-4 text-center text-ink-400 text-xs">
        <Link href="/privacy" className="text-oxblood-700 hover:text-oxblood-600 underline-offset-2 hover:underline">
          隐私政策
        </Link>
      </p>
    </motion.div>
  );
}
