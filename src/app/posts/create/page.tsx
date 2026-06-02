"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserAvatar } from "@/components/UserAvatar";
import { resolveCdnUrl } from "@/lib/cdn";

const MAX_CONTENT_LENGTH = 2000;

export default function PostsCreatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  async function uploadImage(file: File) {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/life-agent-cover", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("上传失败");
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (data.url) {
        setImages((prev) => [...prev, data.url!]);
      } else {
        throw new Error("上传失败");
      }
    } catch {
      alert("图片上传失败");
    } finally {
      setUploadingImage(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }
    void uploadImage(file);
    e.target.value = "";
  }

  async function handleSubmit() {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, images, visibility }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as Record<string, unknown>));
        throw new Error(String(body.message || "发布失败"));
      }
      window.dispatchEvent(new CustomEvent("post-created"));
      router.push("/posts");
    } catch (err) {
      alert(err instanceof Error ? err.message : "发布失败，请稍后重试");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-ink" />
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
        <p className="text-ink-400">登录后即可发帖</p>
        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-ink to-oxblood px-6 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-ink/15 transition active:scale-95"
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
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-paper-200 active:scale-95"
          aria-label="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-ink">发帖</h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`btn-primary px-4 py-2 text-sm font-semibold ${canSubmit ? "" : "pointer-events-none opacity-40"}`}
        >
          {submitting ? "发布中…" : "发布"}
        </button>
      </div>

      {/* Post Form */}
      <div className="rounded-[24px] bg-paper p-4 shadow-sm ring-1 ring-hairline/40">
        <div className="mb-3 flex items-center gap-3">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            name={user.name}
            email={user.email}
            className="h-10 w-10"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{user.name || "用户"}</p>
            <p className="text-xs text-ink-300">{visibility === "public" ? "公开发布 · 所有人可见" : "私密发布 · 仅自己可见"}</p>
          </div>
        </div>

        {/* 可见性切换 */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
              visibility === "public"
                ? "border-oxblood/40 bg-oxblood-50/60 ring-1 ring-oxblood/20"
                : "border-hairline/50 bg-paper-50/40 hover:bg-paper-50"
            }`}
          >
            <svg className={`h-5 w-5 shrink-0 ${visibility === "public" ? "text-oxblood" : "text-ink-300"}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 000 18M12 3a15 15 0 010 18" />
            </svg>
            <span className="min-w-0">
              <span className={`block text-sm font-semibold ${visibility === "public" ? "text-ink" : "text-ink-500"}`}>公开</span>
              <span className="block text-[11px] text-ink-300">所有人可见</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
              visibility === "private"
                ? "border-oxblood/40 bg-oxblood-50/60 ring-1 ring-oxblood/20"
                : "border-hairline/50 bg-paper-50/40 hover:bg-paper-50"
            }`}
          >
            <svg className={`h-5 w-5 shrink-0 ${visibility === "private" ? "text-oxblood" : "text-ink-300"}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 0h10.5a1.5 1.5 0 011.5 1.5v6.75a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z" />
            </svg>
            <span className="min-w-0">
              <span className={`block text-sm font-semibold ${visibility === "private" ? "text-ink" : "text-ink-500"}`}>私密</span>
              <span className="block text-[11px] text-ink-300">仅自己可见</span>
            </span>
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CONTENT_LENGTH) {
              setContent(e.target.value);
            }
          }}
          placeholder="分享你的问题、经验或想法…&#10;&#10;例如：我要去迈阿密，旅游路线怎么规划"
          className="min-h-[180px] w-full resize-none rounded-xl border-0 bg-transparent px-0 text-[15px] leading-relaxed text-ink placeholder:text-ink-300 focus:outline-none focus:ring-0"
          autoFocus
        />

        {/* Image preview */}
        {images.length > 0 && (
          <div className={`mt-2 grid gap-2 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {images.map((src, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden rounded-lg bg-paper-50">
                <img src={resolveCdnUrl(src)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-paper text-xs hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-hairline/50 pt-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || images.length >= 9}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 transition hover:bg-paper-50 hover:text-ink-500 ${uploadingImage ? "opacity-50" : ""}`}
              title={images.length >= 9 ? "最多 9 张图片" : "添加图片"}
            >
              {uploadingImage ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-hairline border-t-ink" />
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              )}
            </button>
          </div>
          <span className={`text-xs ${trimmed.length > MAX_CONTENT_LENGTH * 0.9 ? "text-ink-700" : "text-ink-300"}`}>
            {trimmed.length}/{MAX_CONTENT_LENGTH}
          </span>
        </div>
      </div>

      {/* Tip */}
      <div className="mt-4 rounded-[20px] border border-hairline/25 bg-gradient-to-r from-paper-50/[0.8] to-paper/[0.6] px-4 py-3 text-sm text-ink/80">
        <p className="font-medium">💡 发帖小贴士</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-600/65">
          发布后，平台上的 AI Agent 会自动查看并回复你的帖子，为你提供不同视角的建议和经验分享。
          {visibility === "private" && " 私密动态不会出现在广场，仅你本人可见，但 AI Agent 仍会为你评论。"}
        </p>
      </div>
    </motion.div>
  );
}
